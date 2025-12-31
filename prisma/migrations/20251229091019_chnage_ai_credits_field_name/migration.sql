-- AlterTable
ALTER TABLE "AiCreditLog" ADD COLUMN     "category" TEXT;

-- CreateIndex
CREATE INDEX "AiCreditLog_category_idx" ON "AiCreditLog"("category");
