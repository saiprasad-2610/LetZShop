-- CreateEnum
CREATE TYPE "MerchantDocumentType" AS ENUM ('PAN', 'BUSINESS_REGISTRATION', 'OWNER_ID', 'UDYAM', 'GST_CERTIFICATE', 'OTHER');

-- CreateEnum
CREATE TYPE "MerchantDocumentStatus" AS ENUM ('PENDING_REVIEW', 'VERIFIED', 'REJECTED', 'REUPLOAD_REQUIRED');

-- AlterTable
ALTER TABLE "tenants" ADD COLUMN "business_type" TEXT,
ADD COLUMN "gst_registered" BOOLEAN DEFAULT false,
ADD COLUMN "gstin" TEXT,
ADD COLUMN "pan_number" TEXT,
ADD COLUMN "udyam_number" TEXT,
ADD COLUMN "business_verification_status" TEXT NOT NULL DEFAULT 'INCOMPLETE';

-- CreateTable
CREATE TABLE "merchant_documents" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "type" "MerchantDocumentType" NOT NULL,
    "document_number_masked" TEXT,
    "storage_key" TEXT NOT NULL,
    "original_filename" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_size_bytes" INTEGER NOT NULL,
    "status" "MerchantDocumentStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "is_current" BOOLEAN NOT NULL DEFAULT true,
    "rejection_reason" TEXT,
    "admin_note" TEXT,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "merchant_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "merchant_documents_tenant_id_type_idx" ON "merchant_documents"("tenant_id", "type");

-- CreateIndex
CREATE INDEX "merchant_documents_tenant_id_status_idx" ON "merchant_documents"("tenant_id", "status");

-- AddForeignKey
ALTER TABLE "merchant_documents" ADD CONSTRAINT "merchant_documents_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
