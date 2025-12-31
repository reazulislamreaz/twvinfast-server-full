// src/billing/billing.module.ts
import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';

import { BillingService } from './services/billing.service';
import { BillingWebhookService } from './services/billing-webhook.service';

import { StripeModule } from 'src/stripe/stripe.module';
import { PrismaModule } from 'prisma/prisma.module';
import { EmailModule } from 'src/mail/mail.module';

@Module({
  imports: [StripeModule, PrismaModule, EmailModule], 
  controllers: [BillingController],
  providers: [BillingService, BillingWebhookService],
  exports: [BillingService],
})
export class BillingModule {}
