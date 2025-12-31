/*
  Warnings:

  - You are about to drop the column `two_factor_enabled` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "two_factor_enabled",
ADD COLUMN     "twoFAEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "twoFASecret" TEXT;

-- CreateTable
CREATE TABLE "SecuritySetting" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "force2FAForAll" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SecuritySetting_pkey" PRIMARY KEY ("id")
);
