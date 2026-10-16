-- AlterTable
ALTER TABLE "stores" ALTER COLUMN "enabled_storefront_locales" SET DEFAULT ARRAY['en-IN', 'mr-IN', 'hi-IN']::TEXT[];
