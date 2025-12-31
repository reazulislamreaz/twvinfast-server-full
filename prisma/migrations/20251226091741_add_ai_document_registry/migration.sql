/*
  Warnings:

  - You are about to drop the `AiTrainingDocument` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AiTrainingDocument" DROP CONSTRAINT "AiTrainingDocument_business_id_fkey";

-- DropForeignKey
ALTER TABLE "AiTrainingDocument" DROP CONSTRAINT "AiTrainingDocument_uploaded_by_fkey";

-- DropTable
DROP TABLE "AiTrainingDocument";

-- CreateTable
CREATE TABLE "AiDocumentRegistry" (
    "id" SERIAL NOT NULL,
    "business_id" INTEGER NOT NULL,
    "company_name" TEXT NOT NULL,
    "document_category" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiDocumentRegistry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiDocumentRegistry_business_id_idx" ON "AiDocumentRegistry"("business_id");

-- AddForeignKey
ALTER TABLE "AiDocumentRegistry" ADD CONSTRAINT "AiDocumentRegistry_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
