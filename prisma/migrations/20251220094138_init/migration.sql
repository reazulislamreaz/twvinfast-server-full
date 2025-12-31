/*
  Warnings:

  - A unique constraint covering the columns `[stripe_invoice_id]` on the table `PaymentHistory` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "PaymentHistory_stripe_invoice_id_key" ON "PaymentHistory"("stripe_invoice_id");
