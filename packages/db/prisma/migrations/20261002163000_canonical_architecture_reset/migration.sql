-- CreateEnum
CREATE TYPE "CredentialType" AS ENUM ('PIN', 'PASSKEY', 'BIOMETRIC');

-- CreateEnum
CREATE TYPE "OtpPurpose" AS ENUM ('REGISTRATION', 'LOGIN', 'RECOVERY');

-- CreateEnum
CREATE TYPE "FulfillmentStatus" AS ENUM ('UNFULFILLED', 'PROCESSING', 'READY_TO_SHIP', 'SHIPPED', 'DELIVERED', 'RETURN_REQUESTED', 'RETURNED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ThemeKey" AS ENUM ('ATELIER', 'PULSE', 'HARVEST', 'FOUNDRY', 'HABITAT', 'LOCAL');

-- CreateEnum
CREATE TYPE "SectionType" AS ENUM ('HERO', 'CATEGORIES', 'FEATURED_COLLECTION', 'NEW_ARRIVALS', 'BESTSELLERS', 'STORY', 'TESTIMONIALS', 'PHYSICAL_STORE', 'CUSTOM_BANNER', 'CONTACT');

-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'CONFIRMED';

-- AlterEnum
ALTER TYPE "ProductStatus" ADD VALUE 'ACTIVE';

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "media_asset_id" TEXT;

-- AlterTable
ALTER TABLE "order_status_history"
    ALTER COLUMN "from_status" TYPE TEXT USING from_status::text,
    ALTER COLUMN "to_status" TYPE TEXT USING to_status::text;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "fulfillment_status" "FulfillmentStatus" NOT NULL DEFAULT 'UNFULFILLED';

-- AlterTable
ALTER TABLE "product_media" ADD COLUMN     "media_asset_id" TEXT;

-- AlterTable
ALTER TABLE "product_variants" ADD COLUMN     "height_cm" DOUBLE PRECISION,
ADD COLUMN     "length_cm" DOUBLE PRECISION,
ADD COLUMN     "weight_grams" INTEGER,
ADD COLUMN     "width_cm" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "device_id" TEXT;

-- AlterTable
ALTER TABLE "shipments" ADD COLUMN     "fulfillment_status" "FulfillmentStatus" NOT NULL DEFAULT 'UNFULFILLED';

-- AlterTable
ALTER TABLE "store_branding" ADD COLUMN     "favicon_media_id" TEXT,
ADD COLUMN     "hero_media_id" TEXT,
ADD COLUMN     "logo_media_id" TEXT;

-- AlterTable
ALTER TABLE "store_sections" ADD COLUMN     "configuration" JSONB,
ADD COLUMN     "enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "position" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "type" "SectionType" NOT NULL DEFAULT 'HERO',
ALTER COLUMN "section_type" SET DEFAULT 'hero';

-- CreateTable
CREATE TABLE "seller_credentials" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "credential_type" "CredentialType" NOT NULL DEFAULT 'PIN',
    "pin_hash" TEXT,
    "public_key" TEXT,
    "failed_pin_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seller_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_challenges" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "phone" TEXT NOT NULL,
    "purpose" "OtpPurpose" NOT NULL DEFAULT 'REGISTRATION',
    "code_hash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 5,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devices" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "device_fingerprint" TEXT NOT NULL,
    "device_name" TEXT,
    "user_agent" TEXT,
    "last_ip" TEXT,
    "is_trusted" BOOLEAN NOT NULL DEFAULT false,
    "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "theme_definitions" (
    "id" TEXT NOT NULL,
    "key" "ThemeKey" NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "category_fit" TEXT NOT NULL,
    "default_config" JSONB NOT NULL,
    "capabilities" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "theme_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_theme_configurations" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "theme_definition_id" TEXT NOT NULL,
    "theme_version" TEXT NOT NULL DEFAULT '1.0.0',
    "configuration" JSONB NOT NULL,
    "published_configuration" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_theme_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_assets" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "store_id" TEXT,
    "storage_key" TEXT NOT NULL,
    "public_url" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "alt_text" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_addresses" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address_line1" TEXT NOT NULL,
    "address_line2" TEXT,
    "landmark" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'India',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "seller_credentials_user_id_credential_type_key" ON "seller_credentials"("user_id", "credential_type");

-- CreateIndex
CREATE INDEX "otp_challenges_phone_purpose_is_verified_expires_at_idx" ON "otp_challenges"("phone", "purpose", "is_verified", "expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "devices_user_id_device_fingerprint_key" ON "devices"("user_id", "device_fingerprint");

-- CreateIndex
CREATE UNIQUE INDEX "theme_definitions_key_key" ON "theme_definitions"("key");

-- CreateIndex
CREATE UNIQUE INDEX "store_theme_configurations_store_id_key" ON "store_theme_configurations"("store_id");

-- CreateIndex
CREATE UNIQUE INDEX "media_assets_storage_key_key" ON "media_assets"("storage_key");

-- CreateIndex
CREATE INDEX "media_assets_tenant_id_created_at_idx" ON "media_assets"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "media_assets_store_id_idx" ON "media_assets"("store_id");

-- CreateIndex
CREATE UNIQUE INDEX "order_addresses_order_id_key" ON "order_addresses"("order_id");

-- CreateIndex
CREATE INDEX "categories_store_id_idx" ON "categories"("store_id");

-- CreateIndex
CREATE INDEX "customer_addresses_customer_id_idx" ON "customer_addresses"("customer_id");

-- CreateIndex
CREATE INDEX "customers_store_id_phone_idx" ON "customers"("store_id", "phone");

-- CreateIndex
CREATE INDEX "inventory_variant_id_idx" ON "inventory"("variant_id");

-- CreateIndex
CREATE INDEX "orders_store_id_status_idx" ON "orders"("store_id", "status");

-- CreateIndex
CREATE INDEX "orders_store_id_created_at_idx" ON "orders"("store_id", "created_at");

-- CreateIndex
CREATE INDEX "product_option_values_option_id_idx" ON "product_option_values"("option_id");

-- CreateIndex
CREATE INDEX "product_options_product_id_idx" ON "product_options"("product_id");

-- CreateIndex
CREATE INDEX "product_variants_product_id_idx" ON "product_variants"("product_id");

-- CreateIndex
CREATE INDEX "products_store_id_status_idx" ON "products"("store_id", "status");

-- CreateIndex
CREATE INDEX "store_sections_store_id_position_idx" ON "store_sections"("store_id", "position");

-- AddForeignKey
ALTER TABLE "seller_credentials" ADD CONSTRAINT "seller_credentials_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "otp_challenges" ADD CONSTRAINT "otp_challenges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_theme_configurations" ADD CONSTRAINT "store_theme_configurations_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_theme_configurations" ADD CONSTRAINT "store_theme_configurations_theme_definition_id_fkey" FOREIGN KEY ("theme_definition_id") REFERENCES "theme_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_media" ADD CONSTRAINT "product_media_media_asset_id_fkey" FOREIGN KEY ("media_asset_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_addresses" ADD CONSTRAINT "order_addresses_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

