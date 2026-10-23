ALTER TABLE "users" ADD COLUMN "email_verified_at" TIMESTAMP(3);
ALTER TABLE "otp_challenges" ADD COLUMN "email" TEXT, ADD COLUMN "delivered_at" TIMESTAMP(3), ADD COLUMN "consumed_at" TIMESTAMP(3);
CREATE INDEX "otp_challenges_email_purpose_created_at_idx" ON "otp_challenges"("email", "purpose", "created_at");
CREATE INDEX "otp_challenges_phone_purpose_created_at_idx" ON "otp_challenges"("phone", "purpose", "created_at");
CREATE INDEX "otp_challenges_created_at_idx" ON "otp_challenges"("created_at");
-- Invalidate transient challenges from the old fixed-code implementation; no account data changes.
UPDATE "otp_challenges" SET "expires_at" = LEAST("expires_at", CURRENT_TIMESTAMP), "is_verified" = true, "consumed_at" = CURRENT_TIMESTAMP;
UPDATE "otp_requests" SET "expires_at" = LEAST("expires_at", CURRENT_TIMESTAMP), "is_verified" = true;
