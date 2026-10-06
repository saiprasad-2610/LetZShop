-- AlterEnum
ALTER TYPE "ThemeKey" ADD VALUE 'FEAST';

-- CreateEnum
CREATE TYPE "FulfillmentMode" AS ENUM ('DELIVERY', 'PICKUP', 'DELIVERY_AND_PICKUP');

-- AlterTable
ALTER TABLE "stores" ADD COLUMN "support_phone" TEXT,
ADD COLUMN "support_email" TEXT,
ADD COLUMN "whatsapp_number" TEXT,
ADD COLUMN "business_address" TEXT,
ADD COLUMN "maps_url" TEXT,
ADD COLUMN "social_links" JSONB,
ADD COLUMN "fulfillment_mode" "FulfillmentMode" NOT NULL DEFAULT 'DELIVERY';

-- AlterTable
ALTER TABLE "theme_definitions" ADD COLUMN "description" TEXT;

-- AlterTable
ALTER TABLE "media_assets" ADD COLUMN "storage_provider" TEXT NOT NULL DEFAULT 'LOCAL',
ADD COLUMN "checksum" TEXT,
ADD COLUMN "focal_point_x" DOUBLE PRECISION DEFAULT 0.5,
ADD COLUMN "focal_point_y" DOUBLE PRECISION DEFAULT 0.5,
ADD COLUMN "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "orders" ADD COLUMN "fulfillment_mode" "FulfillmentMode" NOT NULL DEFAULT 'DELIVERY';

-- CreateTable
CREATE TABLE "store_business_hours" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "open_time" TEXT NOT NULL,
    "close_time" TEXT NOT NULL,
    "is_closed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_business_hours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_attributes" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'TEXT',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_attributes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_documents" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "media_asset_id" TEXT,
    "title" TEXT NOT NULL,
    "doc_type" TEXT NOT NULL DEFAULT 'DATASHEET',
    "file_url" TEXT NOT NULL,
    "file_size_mb" DOUBLE PRECISION,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "store_business_hours_store_id_day_of_week_key" ON "store_business_hours"("store_id", "day_of_week");
CREATE INDEX "store_business_hours_store_id_idx" ON "store_business_hours"("store_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_attributes_product_id_name_key" ON "product_attributes"("product_id", "name");
CREATE INDEX "product_attributes_product_id_sort_order_idx" ON "product_attributes"("product_id", "sort_order");

-- CreateIndex
CREATE INDEX "product_documents_product_id_sort_order_idx" ON "product_documents"("product_id", "sort_order");
CREATE INDEX "product_documents_store_id_idx" ON "product_documents"("store_id");

-- AddForeignKey
ALTER TABLE "store_business_hours" ADD CONSTRAINT "store_business_hours_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_attributes" ADD CONSTRAINT "product_attributes_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_documents" ADD CONSTRAINT "product_documents_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_documents" ADD CONSTRAINT "product_documents_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_documents" ADD CONSTRAINT "product_documents_media_asset_id_fkey" FOREIGN KEY ("media_asset_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
