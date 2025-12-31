-- CreateEnum
CREATE TYPE "EmailFolder" AS ENUM ('INBOX', 'SENT', 'DRAFT', 'TRASH', 'SPAM');

-- CreateEnum
CREATE TYPE "EmailDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateEnum
CREATE TYPE "ThreadStatus" AS ENUM ('NEW', 'OPENED', 'REPLIED', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "OpportunityStage" AS ENUM ('LEAD', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "AIActionType" AS ENUM ('SUMMARY', 'REPLY_DRAFT', 'SENTIMENT', 'CLASSIFICATION', 'FOLLOWUP_SUGGESTION');

-- CreateEnum
CREATE TYPE "IntegrationType" AS ENUM ('GOOGLE', 'OUTLOOK', 'SMTP', 'OTHER');

-- CreateEnum
CREATE TYPE "TrainingType" AS ENUM ('TEXT', 'FILE', 'FAQ');

-- CreateEnum
CREATE TYPE "HallucinationSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "HallucinationStatus" AS ENUM ('OPEN', 'FIXED', 'DISMISSED');

-- CreateTable
CREATE TABLE "Role" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "refreshToken" TEXT,
    "business_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login_at" TIMESTAMP(3),
    "password_hash" TEXT NOT NULL,
    "role_id" INTEGER NOT NULL,
    "two_factor_enabled" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "status" TEXT DEFAULT 'ACTIVE',
    "email_signature" TEXT,
    "phone" TEXT,
    "timezone" TEXT DEFAULT 'UTC',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mailbox" (
    "id" SERIAL NOT NULL,
    "business_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "provider" TEXT NOT NULL,
    "email_address" TEXT NOT NULL,
    "imap_host" TEXT,
    "smtp_host" TEXT,
    "smtp_port" INTEGER,
    "is_ssl" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "imap_password" TEXT,
    "smtp_password" TEXT,
    "imap_port" INTEGER,

    CONSTRAINT "Mailbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailThread" (
    "id" SERIAL NOT NULL,
    "business_id" INTEGER NOT NULL,
    "mailbox_id" INTEGER NOT NULL,
    "customer_id" INTEGER,
    "subject" TEXT NOT NULL,
    "last_message_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "last_message_id" TEXT,
    "references" TEXT,
    "status" "ThreadStatus" NOT NULL DEFAULT 'NEW',
    "deleted_at" TIMESTAMP(3),
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "is_starred" BOOLEAN NOT NULL DEFAULT false,
    "opportunity_stage" "OpportunityStage",

    CONSTRAINT "EmailThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Email" (
    "id" SERIAL NOT NULL,
    "business_id" INTEGER NOT NULL,
    "thread_id" INTEGER,
    "mailbox_id" INTEGER NOT NULL,
    "user_id" INTEGER,
    "in_reply_to" TEXT,
    "from_address" TEXT,
    "to_addresses" JSONB,
    "cc_addresses" JSONB,
    "bcc_addresses" JSONB,
    "subject" TEXT NOT NULL,
    "body_html" TEXT,
    "body_text" TEXT,
    "folder" "EmailFolder",
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "imap_uid" INTEGER,
    "direction" "EmailDirection",
    "message_id" TEXT,
    "references" TEXT,
    "received_at" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Email_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailAttachment" (
    "id" SERIAL NOT NULL,
    "email_id" INTEGER NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_size" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThreadLabel" (
    "id" SERIAL NOT NULL,
    "mailbox_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ThreadLabel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailThreadLabel" (
    "thread_id" INTEGER NOT NULL,
    "label_id" INTEGER NOT NULL,

    CONSTRAINT "EmailThreadLabel_pkey" PRIMARY KEY ("thread_id","label_id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" SERIAL NOT NULL,
    "business_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "status" TEXT,
    "lead_score" INTEGER,
    "value_estimate" DOUBLE PRECISION,
    "last_contact_at" TIMESTAMP(3),
    "company" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "preferred_language" TEXT,
    "source" TEXT,
    "tags" JSONB,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Opportunity" (
    "id" SERIAL NOT NULL,
    "business_id" INTEGER NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "stage" "OpportunityStage" NOT NULL,
    "value_amount" DOUBLE PRECISION,
    "status" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Opportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIEmailInsight" (
    "id" SERIAL NOT NULL,
    "email_id" INTEGER NOT NULL,
    "summary" TEXT,
    "suggested_actions" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIEmailInsight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIAction" (
    "id" SERIAL NOT NULL,
    "email_id" INTEGER NOT NULL,
    "user_id" INTEGER,
    "action_type" "AIActionType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiGeneratedReply" (
    "id" SERIAL NOT NULL,
    "email_id" INTEGER NOT NULL,
    "user_id" INTEGER,
    "business_id" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "tone" TEXT,
    "model" TEXT,
    "confidence" DOUBLE PRECISION,
    "status" TEXT DEFAULT 'SUGGESTED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiGeneratedReply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiTrainingData" (
    "id" SERIAL NOT NULL,
    "business_id" INTEGER NOT NULL,
    "type" "TrainingType" NOT NULL,
    "content" TEXT,
    "file_url" TEXT,
    "tags" JSONB,
    "approved_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiTrainingData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiHallucinationReport" (
    "id" SERIAL NOT NULL,
    "email_id" INTEGER NOT NULL,
    "reply_id" INTEGER,
    "user_id" INTEGER NOT NULL,
    "business_id" INTEGER NOT NULL,
    "issue_type" TEXT NOT NULL,
    "comment" TEXT,
    "severity" "HallucinationSeverity" NOT NULL DEFAULT 'MEDIUM',
    "status" "HallucinationStatus" NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fixed_at" TIMESTAMP(3),

    CONSTRAINT "AiHallucinationReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiModelSettings" (
    "id" SERIAL NOT NULL,
    "model_name" TEXT NOT NULL,
    "temperature" DOUBLE PRECISION DEFAULT 0.7,
    "max_tokens" INTEGER DEFAULT 2048,
    "system_prompt" TEXT,
    "safety_rules" JSONB,
    "fallback_model" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiModelSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Integration" (
    "id" SERIAL NOT NULL,
    "business_id" INTEGER NOT NULL,
    "type" "IntegrationType" NOT NULL,
    "config_json" JSONB,
    "last_sync_at" TIMESTAMP(3),
    "auto_sync_enabled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Integration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Business" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "status" TEXT DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "email" TEXT,
    "stripe_customer_id" TEXT,

    CONSTRAINT "Business_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "email_limit" INTEGER,
    "ai_credits" INTEGER,
    "features" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "stripe_price_id" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "description" TEXT,
    "interval" TEXT NOT NULL DEFAULT 'month',
    "stripe_product_id" TEXT,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" SERIAL NOT NULL,
    "business_id" INTEGER NOT NULL,
    "plan_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "renewal_date" TIMESTAMP(3),
    "stripe_customer_id" TEXT,
    "stripe_subscription_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentHistory" (
    "id" SERIAL NOT NULL,
    "business_id" INTEGER NOT NULL,
    "plan_id" INTEGER NOT NULL,
    "subscription_id" INTEGER,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "payment_method" TEXT NOT NULL,
    "invoice_url" TEXT,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stripe_invoice_id" TEXT,
    "stripe_payment_intent_id" TEXT,

    CONSTRAINT "PaymentHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "EmailThread_mailbox_id_is_archived_is_deleted_idx" ON "EmailThread"("mailbox_id", "is_archived", "is_deleted");

-- CreateIndex
CREATE INDEX "Email_thread_id_idx" ON "Email"("thread_id");

-- CreateIndex
CREATE UNIQUE INDEX "Email_mailbox_id_imap_uid_key" ON "Email"("mailbox_id", "imap_uid");

-- CreateIndex
CREATE INDEX "EmailAttachment_email_id_idx" ON "EmailAttachment"("email_id");

-- CreateIndex
CREATE UNIQUE INDEX "ThreadLabel_mailbox_id_name_key" ON "ThreadLabel"("mailbox_id", "name");

-- CreateIndex
CREATE INDEX "Customer_business_id_idx" ON "Customer"("business_id");

-- CreateIndex
CREATE INDEX "Customer_email_idx" ON "Customer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_business_id_email_key" ON "Customer"("business_id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "AIEmailInsight_email_id_key" ON "AIEmailInsight"("email_id");

-- CreateIndex
CREATE INDEX "Subscription_business_id_idx" ON "Subscription"("business_id");

-- CreateIndex
CREATE INDEX "Subscription_plan_id_idx" ON "Subscription"("plan_id");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_business_id_plan_id_key" ON "Subscription"("business_id", "plan_id");

-- CreateIndex
CREATE INDEX "PaymentHistory_business_id_idx" ON "PaymentHistory"("business_id");

-- CreateIndex
CREATE INDEX "PaymentHistory_plan_id_idx" ON "PaymentHistory"("plan_id");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mailbox" ADD CONSTRAINT "Mailbox_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mailbox" ADD CONSTRAINT "Mailbox_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailThread" ADD CONSTRAINT "EmailThread_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailThread" ADD CONSTRAINT "EmailThread_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailThread" ADD CONSTRAINT "EmailThread_mailbox_id_fkey" FOREIGN KEY ("mailbox_id") REFERENCES "Mailbox"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Email" ADD CONSTRAINT "Email_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Email" ADD CONSTRAINT "Email_mailbox_id_fkey" FOREIGN KEY ("mailbox_id") REFERENCES "Mailbox"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Email" ADD CONSTRAINT "Email_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "EmailThread"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Email" ADD CONSTRAINT "Email_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailAttachment" ADD CONSTRAINT "EmailAttachment_email_id_fkey" FOREIGN KEY ("email_id") REFERENCES "Email"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThreadLabel" ADD CONSTRAINT "ThreadLabel_mailbox_id_fkey" FOREIGN KEY ("mailbox_id") REFERENCES "Mailbox"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailThreadLabel" ADD CONSTRAINT "EmailThreadLabel_label_id_fkey" FOREIGN KEY ("label_id") REFERENCES "ThreadLabel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailThreadLabel" ADD CONSTRAINT "EmailThreadLabel_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "EmailThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIEmailInsight" ADD CONSTRAINT "AIEmailInsight_email_id_fkey" FOREIGN KEY ("email_id") REFERENCES "Email"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIAction" ADD CONSTRAINT "AIAction_email_id_fkey" FOREIGN KEY ("email_id") REFERENCES "Email"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIAction" ADD CONSTRAINT "AIAction_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiGeneratedReply" ADD CONSTRAINT "AiGeneratedReply_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiGeneratedReply" ADD CONSTRAINT "AiGeneratedReply_email_id_fkey" FOREIGN KEY ("email_id") REFERENCES "Email"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiGeneratedReply" ADD CONSTRAINT "AiGeneratedReply_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiTrainingData" ADD CONSTRAINT "AiTrainingData_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiHallucinationReport" ADD CONSTRAINT "AiHallucinationReport_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiHallucinationReport" ADD CONSTRAINT "AiHallucinationReport_email_id_fkey" FOREIGN KEY ("email_id") REFERENCES "Email"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiHallucinationReport" ADD CONSTRAINT "AiHallucinationReport_reply_id_fkey" FOREIGN KEY ("reply_id") REFERENCES "AiGeneratedReply"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiHallucinationReport" ADD CONSTRAINT "AiHallucinationReport_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Integration" ADD CONSTRAINT "Integration_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentHistory" ADD CONSTRAINT "PaymentHistory_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentHistory" ADD CONSTRAINT "PaymentHistory_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentHistory" ADD CONSTRAINT "PaymentHistory_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;
