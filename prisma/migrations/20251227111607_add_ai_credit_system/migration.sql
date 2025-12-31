/*
  Warnings:

  - Made the column `organization_name` on table `AiDocumentRegistry` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "AiDocumentRegistry" ALTER COLUMN "organization_name" SET NOT NULL;

-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "ai_credits_total" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "ai_credits_used" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "AiCreditLog" (
    "id" SERIAL NOT NULL,
    "business_id" INTEGER NOT NULL,
    "user_id" INTEGER,
    "route" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "tokens" INTEGER NOT NULL,
    "action" "AIActionType",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiCreditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiCreditLog_business_id_idx" ON "AiCreditLog"("business_id");

-- CreateIndex
CREATE INDEX "AiCreditLog_user_id_idx" ON "AiCreditLog"("user_id");

-- AddForeignKey
ALTER TABLE "AiCreditLog" ADD CONSTRAINT "AiCreditLog_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiCreditLog" ADD CONSTRAINT "AiCreditLog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
