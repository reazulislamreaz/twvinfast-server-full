/*
  Warnings:

  - You are about to drop the column `ai_credits` on the `Plan` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Plan" DROP COLUMN "ai_credits",
ADD COLUMN     "user_limit" INTEGER;
