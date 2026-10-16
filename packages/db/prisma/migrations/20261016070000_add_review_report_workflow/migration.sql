-- Keep review visibility independent from the moderation request lifecycle.
CREATE TYPE "ReviewReportStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED');
CREATE TABLE "review_reports" (
  "id" TEXT NOT NULL,
  "review_id" TEXT NOT NULL,
  "reported_by_id" TEXT,
  "reason" TEXT NOT NULL,
  "merchant_note" TEXT,
  "status" "ReviewReportStatus" NOT NULL DEFAULT 'PENDING',
  "admin_note" TEXT,
  "resolved_by_id" TEXT,
  "resolved_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "review_reports_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "review_reports_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "product_reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "review_reports_review_id_created_at_idx" ON "review_reports"("review_id", "created_at");
CREATE INDEX "review_reports_status_created_at_idx" ON "review_reports"("status", "created_at");
CREATE UNIQUE INDEX "review_reports_one_open_per_review" ON "review_reports"("review_id") WHERE "status" IN ('PENDING', 'UNDER_REVIEW');

-- Existing merchant requests retain their reason and timestamp, and stay visible.
INSERT INTO "review_reports" ("id", "review_id", "reason", "created_at", "updated_at")
SELECT gen_random_uuid()::text, "id", COALESCE(NULLIF("moderation_reason", ''), 'Legacy merchant moderation request'), "updated_at", "updated_at"
FROM "product_reviews" WHERE "status" = 'SENT_FOR_REVIEW';
UPDATE "product_reviews" SET "status" = 'ACTIVE' WHERE "status" = 'SENT_FOR_REVIEW';
