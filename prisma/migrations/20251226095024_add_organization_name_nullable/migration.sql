/*
  Warnings:

  - You are about to drop the column `company_name` on the `AiDocumentRegistry` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "AiDocumentRegistry" DROP COLUMN "company_name",
ADD COLUMN     "organization_name" TEXT;
