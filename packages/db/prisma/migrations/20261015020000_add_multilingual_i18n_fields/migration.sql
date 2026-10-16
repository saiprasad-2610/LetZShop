-- AlterTable
ALTER TABLE "users" ADD COLUMN "preferred_locale" TEXT NOT NULL DEFAULT 'en-IN';

-- AlterTable
ALTER TABLE "stores" ADD COLUMN "storefront_default_locale" TEXT NOT NULL DEFAULT 'en-IN',
ADD COLUMN "enabled_storefront_locales" TEXT[] DEFAULT ARRAY['en-IN', 'mr-IN', 'hi-IN', 'gu-IN', 'kn-IN', 'ta-IN', 'te-IN', 'bn-IN', 'ml-IN', 'pa-IN']::TEXT[];

-- CreateTable
CREATE TABLE "product_translations" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "seo_title" TEXT,
    "seo_description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_translations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_translations_product_id_idx" ON "product_translations"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_translations_product_id_locale_key" ON "product_translations"("product_id", "locale");

-- AddForeignKey
ALTER TABLE "product_translations" ADD CONSTRAINT "product_translations_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
