-- AlterTable: Add subdomain and custom_domain to stores
ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "subdomain" TEXT;
ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "custom_domain" TEXT;

-- CreateIndex: Unique constraints and search index
CREATE UNIQUE INDEX IF NOT EXISTS "stores_subdomain_key" ON "stores"("subdomain");
CREATE UNIQUE INDEX IF NOT EXISTS "stores_custom_domain_key" ON "stores"("custom_domain");
CREATE INDEX IF NOT EXISTS "stores_subdomain_is_publicly_accessible_idx" ON "stores"("subdomain", "is_publicly_accessible");

-- CreateTable: store_qr_codes
CREATE TABLE IF NOT EXISTS "store_qr_codes" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "public_token" TEXT NOT NULL,
    "qr_code_storage_key" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "store_qr_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: store_qr_codes unique constraints and indexes
CREATE UNIQUE INDEX IF NOT EXISTS "store_qr_codes_store_id_key" ON "store_qr_codes"("store_id");
CREATE UNIQUE INDEX IF NOT EXISTS "store_qr_codes_public_token_key" ON "store_qr_codes"("public_token");
CREATE INDEX IF NOT EXISTS "store_qr_codes_public_token_idx" ON "store_qr_codes"("public_token");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'store_qr_codes_store_id_fkey'
    ) THEN
        ALTER TABLE "store_qr_codes" ADD CONSTRAINT "store_qr_codes_store_id_fkey"
            FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
