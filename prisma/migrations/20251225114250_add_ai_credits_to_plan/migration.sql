-- AlterTable
ALTER TABLE "Plan" ADD COLUMN     "ai_credits" INTEGER;

-- CreateTable
CREATE TABLE "AiTrainingDocument" (
    "id" SERIAL NOT NULL,
    "business_id" INTEGER NOT NULL,
    "uploaded_by" INTEGER NOT NULL,
    "original_name" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "file_size" INTEGER,
    "category" TEXT,
    "tags" JSONB,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "AiTrainingDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiTrainingDocument_business_id_idx" ON "AiTrainingDocument"("business_id");

-- CreateIndex
CREATE INDEX "AiTrainingDocument_uploaded_by_idx" ON "AiTrainingDocument"("uploaded_by");

-- AddForeignKey
ALTER TABLE "AiTrainingDocument" ADD CONSTRAINT "AiTrainingDocument_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiTrainingDocument" ADD CONSTRAINT "AiTrainingDocument_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
