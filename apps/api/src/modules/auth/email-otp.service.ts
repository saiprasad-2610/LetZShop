import {
  BadRequestException,
  HttpException,
  Injectable,
  Inject,
  ServiceUnavailableException,
} from "@nestjs/common";
import { PrismaClient, OtpPurpose } from "@prisma/client";
import { ConfigService } from "@nestjs/config";
import {
  randomInt,
  randomUUID,
  createHmac,
  timingSafeEqual,
} from "node:crypto";
import { normalizePhone, isValidIndianPhone } from "@simply/validation";
import { MailService } from "../notifications/mail.service";
import { OtpProvider } from "./interfaces/otp-provider.interface";

export function normalizeOtpEmail(raw: string) {
  const email = (raw || "").trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new BadRequestException("Invalid email address.");
  return email;
}
export const maskOtpEmail = (email: string) =>
  `${email[0]}***@${email.split("@")[1]}`;

@Injectable()
export class EmailOtpService {
  readonly expirySeconds = 600;
  readonly maxAttempts = 5;
  constructor(
    private readonly prisma: PrismaClient,
    private readonly config: ConfigService,
    private readonly mail: MailService,
    @Inject("OTP_PROVIDER") private readonly sms: OtpProvider,
  ) {}

  private digest(id: string, code: string) {
    return createHmac(
      "sha256",
      this.config.getOrThrow<string>("JWT_ACCESS_SECRET"),
    )
      .update(`${id}:${code}`)
      .digest("hex");
  }

  async request(
    rawPhone: string,
    purpose: OtpPurpose,
    rawEmail?: string,
    authenticatedUserId?: string,
  ) {
    const phone = normalizePhone(rawPhone);
    if (!isValidIndianPhone(phone))
      throw new BadRequestException(
        "Please provide a valid Indian 10-digit mobile number.",
      );
    const user = await this.prisma.user.findUnique({
      where: { phone },
      include: { credentials: true },
    });
    const registration = purpose === OtpPurpose.REGISTRATION;
    const emailVerification = purpose === OtpPurpose.EMAIL_VERIFICATION;
    if (
      emailVerification &&
      (!user ||
        user.id !== authenticatedUserId ||
        user.email ||
        !user.isActive ||
        user.deletedAt)
    )
      throw new BadRequestException(
        "Email verification is unavailable for this account.",
      );
    const email =
      registration || emailVerification
        ? normalizeOtpEmail(rawEmail || "")
        : user?.email
          ? normalizeOtpEmail(user.email)
          : null;
    let suppressDelivery = false;
    if (registration || emailVerification) {
      const emailOwner = await this.prisma.user.findFirst({
        where: { email: { equals: email!, mode: "insensitive" } },
        select: { id: true },
      });
      if (
        (registration &&
          user?.credentials.some((c) => c.credentialType === "PIN")) ||
        (emailOwner && emailOwner.id !== user?.id) ||
        (user?.email && normalizeOtpEmail(user.email) !== email)
      ) {
        // Match the accepted response without sending unsolicited codes to an existing account.
        suppressDelivery = true;
      }
    } else if (!user || !user.isActive || user.deletedAt) {
      throw new BadRequestException(
        "Unable to send verification code. Please check your details or contact support.",
      );
    }
    const id = randomUUID();
    const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      // Database locks make limits effective across workers, including simultaneous sends.
      for (const destination of [
        `phone:${phone}`,
        ...(email ? [`email:${email}`] : []),
      ].sort()) {
        await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${destination}, 0))::text`;
      }
      const destinations = [{ phone }, ...(email ? [{ email }] : [])];
      for (const destination of destinations) {
        const count = await tx.otpChallenge.count({
          where: {
            ...destination,
            createdAt: { gte: new Date(now.getTime() - 15 * 60_000) },
          },
        });
        if (count >= 5)
          throw new HttpException(
            "Too many verification requests. Please try again later.",
            429,
          );
        const recent = await tx.otpChallenge.findFirst({
          where: {
            ...destination,
            createdAt: { gte: new Date(now.getTime() - 60_000) },
          },
        });
        if (recent)
          throw new HttpException(
            "Please wait before requesting another code (60 seconds).",
            429,
          );
      }
      await tx.otpChallenge.updateMany({
        where: { phone, purpose, consumedAt: null },
        data: { consumedAt: now },
      });
      // Bounded indexed cleanup: retain 24 hours for abuse accounting; no process-memory limiter.
      const stale = await tx.otpChallenge.findMany({
        where: {
          createdAt: { lt: new Date(now.getTime() - 24 * 60 * 60_000) },
        },
        select: { id: true },
        take: 1000,
      });
      if (stale.length)
        await tx.otpChallenge.deleteMany({
          where: { id: { in: stale.map((x) => x.id) } },
        });
      await tx.otpChallenge.create({
        data: {
          id,
          phone,
          email,
          purpose,
          codeHash: this.digest(id, code),
          maxAttempts: this.maxAttempts,
          expiresAt: new Date(now.getTime() + this.expirySeconds * 1000),
        },
      });
    });
    if (suppressDelivery) {
      await this.prisma.otpChallenge.update({
        where: { id },
        data: { consumedAt: new Date() },
      });
      throw new BadRequestException('Registration is unavailable for these details. Please sign in or use account recovery.');
    }
    let sent = false;
    try {
      sent = email
        ? await this.mail.sendVerificationOtp(email, code, 10)
        : Boolean((await this.sms.sendOtp(phone, code)).success);
    } catch {}
    if (!sent) {
      await this.prisma.otpChallenge.update({
        where: { id },
        data: { consumedAt: new Date() },
      });
      throw new ServiceUnavailableException(
        "Unable to send verification code. Please try again later.",
      );
    }
    await this.prisma.otpChallenge.update({
      where: { id },
      data: { deliveredAt: new Date() },
    });
    return this.sentResponse(id, email);
  }

  private sentResponse(id: string, email: string | null) {
    return {
      challengeId: id,
      expiresInSeconds: this.expirySeconds,
      resendAfterSeconds: 60,
      maskedEmail: email ? maskOtpEmail(email) : undefined,
      message: email
        ? `Verification code sent to ${maskOtpEmail(email)}`
        : "Verification code sent to your registered mobile number.",
    };
  }

  async verify(
    rawPhone: string,
    code: string,
    purpose: OtpPurpose,
    rawEmail?: string,
  ) {
    const phone = normalizePhone(rawPhone);
    const email = [
      OtpPurpose.REGISTRATION,
      OtpPurpose.EMAIL_VERIFICATION,
    ].includes(purpose as any)
      ? normalizeOtpEmail(rawEmail || "")
      : undefined;
    if (!/^\d{6}$/.test(code)) throw new BadRequestException("Incorrect OTP.");
    // Return errors after committing attempt increments rather than rolling them back.
    const result = await this.prisma.$transaction(async (tx) => {
      const challenge = await tx.otpChallenge.findFirst({
        where: { phone, purpose, ...(email ? { email } : {}) },
        orderBy: { createdAt: "desc" },
      });
      if (!challenge)
        return { error: "OTP expired. Please request a new code." };
      await tx.$queryRaw`SELECT id FROM otp_challenges WHERE id = ${challenge.id} FOR UPDATE`;
      const current = await tx.otpChallenge.findUniqueOrThrow({
        where: { id: challenge.id },
      });
      if (current.expiresAt <= new Date())
        return { error: "OTP expired. Please request a new code." };
      if (current.attempts >= current.maxAttempts)
        return { error: "Too many attempts. Please request a new code." };
      if (!current.deliveredAt) {
        // Do not turn suppressed duplicate-account sends into a verification-side enumeration oracle.
        await tx.otpChallenge.update({
          where: { id: current.id },
          data: { attempts: { increment: 1 } },
        });
        return { error: "Incorrect OTP. Please try again." };
      }
      if (current.isVerified || current.consumedAt)
        return {
          error: "OTP expired or already used. Please request a new code.",
        };
      const candidate = Buffer.from(this.digest(current.id, code), "hex");
      const expected = Buffer.from(current.codeHash, "hex");
      if (
        candidate.length !== expected.length ||
        !timingSafeEqual(candidate, expected)
      ) {
        await tx.otpChallenge.update({
          where: { id: current.id },
          data: { attempts: { increment: 1 } },
        });
        return { error: "Incorrect OTP. Please try again." };
      }
      return {
        challenge: await tx.otpChallenge.update({
          where: { id: current.id },
          data: { isVerified: true, verifiedAt: new Date() },
        }),
      };
    });
    if (result.error) throw new BadRequestException(result.error);
    return result.challenge!;
  }
}
