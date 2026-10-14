-- AlterTable
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payment_method" TEXT DEFAULT 'COD';
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "cod_collection_method" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "cod_collected_at" TIMESTAMP(3);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "cod_collected_by" TEXT;
