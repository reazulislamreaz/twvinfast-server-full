/*
  Warnings:

  - You are about to drop the column `timezone` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "timezone",
ADD COLUMN     "location" TEXT DEFAULT 'Canada';
