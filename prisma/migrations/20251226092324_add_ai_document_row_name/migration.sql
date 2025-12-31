/*
  Warnings:

  - You are about to drop the column `document_category` on the `AiDocumentRegistry` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[company_name]` on the table `AiDocumentRegistry` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `file_name` to the `AiDocumentRegistry` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AiDocumentRegistry" DROP COLUMN "document_category",
ADD COLUMN     "file_name" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "AiDocumentRegistry_company_name_key" ON "AiDocumentRegistry"("company_name");
