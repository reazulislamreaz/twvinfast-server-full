/*
  Warnings:

  - Made the column `stripe_invoice_id` on table `PaymentHistory` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "PaymentHistory" ALTER COLUMN "stripe_invoice_id" SET NOT NULL;
