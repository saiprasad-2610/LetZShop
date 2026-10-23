import {
  normalizeOtpEmail,
  maskOtpEmail,
} from "../../src/modules/auth/email-otp.service";
import { MailService } from "../../src/modules/notifications/mail.service";
import { DevOtpProvider } from "../../src/modules/auth/providers/dev-otp.provider";
import { TwilioOtpProvider } from "../../src/modules/auth/providers/twilio-otp.provider";

describe("email OTP delivery boundaries", () => {
  it("normalizes identity and masks only the displayed destination", () => {
    expect(normalizeOtpEmail("  OWNER@EXAMPLE.COM ")).toBe("owner@example.com");
    expect(maskOtpEmail("owner@example.com")).toBe("o***@example.com");
  });
  it.each([
    "",
    "no-at",
    "a@",
    "@b.com",
    "a b@example.com",
    "a@b",
    "x".repeat(255) + "@a.com",
  ])("rejects malformed email %s", (value) => {
    expect(() => normalizeOtpEmail(value)).toThrow("Invalid email");
  });
  it("fails closed without SMTP rather than simulating a sent verification", async () => {
    const mail = Object.create(MailService.prototype);
    mail.transporter = null;
    expect(
      await mail.sendVerificationOtp("test@example.test", "654321", 10),
    ).toBe(false);
  });
  it("sends the code only through SMTP and never includes it or SMTP errors in logs", async () => {
    const mail = Object.create(MailService.prototype);
    const sendMail = jest.fn().mockResolvedValue({ accepted: ["recipient@example.test"], rejected: [], messageId: "test-id", response: "250 accepted" });
    const logger = { log: jest.fn(), warn: jest.fn(), error: jest.fn() };
    Object.assign(mail, {
      transporter: { sendMail, verify: jest.fn().mockResolvedValue(true) },
      fromAddress: "test@example.test",
      logger,
    });
    expect(
      await mail.sendVerificationOtp("recipient@example.test", "654321", 10),
    ).toBe(true);
    expect(sendMail.mock.calls[0][0]).toMatchObject({
      subject: "Your LetzShop verification code",
      text: expect.stringContaining("654321"),
    });
    sendMail.mockResolvedValueOnce({ accepted: [], rejected: ["recipient@example.test"], response: "550 rejected" });
    expect(await mail.sendVerificationOtp("recipient@example.test", "654321", 10)).toBe(false);
    sendMail.mockResolvedValueOnce({ accepted: ["other@example.test"], rejected: [] });
    expect(await mail.sendVerificationOtp("recipient@example.test", "654321", 10)).toBe(false);
    sendMail.mockRejectedValue(new Error("SMTP password=secret code=654321"));
    expect(
      await mail.sendVerificationOtp("recipient@example.test", "654321", 10),
    ).toBe(false);
    expect(
      JSON.stringify([
        logger.log.mock.calls,
        logger.warn.mock.calls,
        logger.error.mock.calls,
      ]),
    ).not.toMatch(/654321|password|secret/);
  });
  it("never treats unconfigured SMS as a successful delivery", async () => {
    const provider = new TwilioOtpProvider({ get: () => undefined } as any);
    expect((await provider.sendOtp("+919876543210", "654321")).success).toBe(
      false,
    );
  });
  it('does not send when SMTP connection/authentication verification fails', async () => {
    const mail = Object.create(MailService.prototype);
    const sendMail = jest.fn();
    Object.assign(mail, { transporter: { verify: jest.fn().mockRejectedValue(new Error('private provider detail')), sendMail }, logger: { error: jest.fn() } });
    expect(await mail.sendVerificationOtp('recipient@example.test', '654321', 10)).toBe(false);
    expect(sendMail).not.toHaveBeenCalled();
    expect(mail.verificationReady).toBeNull();
    expect(JSON.stringify(mail.logger.error.mock.calls)).not.toContain('private provider detail');
  });
  it('admin diagnostics cannot report simulation or recipient rejection as success', async () => {
    const mail = Object.create(MailService.prototype);
    Object.assign(mail, { transporter: null, logger: { log: jest.fn(), error: jest.fn() } });
    expect((await mail.testSmtpConnection('recipient@example.test')).success).toBe(false);
    Object.assign(mail, { transporter: { verify: jest.fn().mockResolvedValue(true), sendMail: jest.fn().mockResolvedValue({ accepted: [], rejected: ['recipient@example.test'] }) } });
    expect((await mail.testSmtpConnection('recipient@example.test')).success).toBe(false);
  });
  it("test provider is unusable outside NODE_ENV=test", async () => {
    const before = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = "production";
      await expect(
        new DevOtpProvider().sendOtp("phone", "654321"),
      ).rejects.toThrow("restricted");
    } finally {
      process.env.NODE_ENV = before;
    }
  });
});
