-- AlterTable
ALTER TABLE "product_media" ADD COLUMN "option_value_id" TEXT;

-- CreateIndex
CREATE INDEX "product_media_option_value_id_idx" ON "product_media"("option_value_id");

-- AddForeignKey
ALTER TABLE "product_media" ADD CONSTRAINT "product_media_option_value_id_fkey" FOREIGN KEY ("option_value_id") REFERENCES "product_option_values"("id") ON DELETE SET NULL ON UPDATE CASCADE;
