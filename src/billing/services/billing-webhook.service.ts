// src/billing/services/billing-webhook.service.ts
import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { PrismaService } from 'prisma/prisma.service';
import { StripeService } from 'src/stripe/stripe.service';
import { MailService } from 'src/mail/services/mail.service';
import { Subscription } from '@prisma/client';

@Injectable()
export class BillingWebhookService {
  private logger = new Logger(BillingWebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService,
    private readonly mailService: MailService, // ✅ ADD THIS
  ) {}

  async handleEvent(event: Stripe.Event) {
    this.logger.log(`➡️ ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed':
        return this.checkoutCompleted(event);

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        return this.subscriptionUpsert(event);

      case 'customer.subscription.deleted':
        return this.subscriptionDeleted(event);

      case 'invoice.payment_succeeded':
        return this.invoicePaid(event);

      case 'invoice.payment_failed':
        return this.invoiceFailed(event);
    }
  }

  // ---------------------------------------------
  private extractMeta(meta: any) {
    return {
      businessId: Number(meta?.businessId),
      planId: Number(meta?.planId),
    };
  }

  private getDates(sub: any) {
    return {
      start: sub.current_period_start
        ? new Date(sub.current_period_start * 1000)
        : null,
      end: sub.current_period_end
        ? new Date(sub.current_period_end * 1000)
        : sub.trial_end
          ? new Date(sub.trial_end * 1000)
          : null,
    };
  }

  // ---------------------------------------------
  private async checkoutCompleted(event: any) {
    const s = event.data.object;
    const { businessId, planId } = this.extractMeta(s.metadata);

    const stripeSub = await this.stripeService.retrieveSubscription(
      s.subscription,
    );

    const { start, end } = this.getDates(stripeSub);

    await this.prisma.subscription.create({
      data: {
        business_id: businessId,
        plan_id: planId,
        stripe_subscription_id: stripeSub.id,
        stripe_customer_id: s.customer,
        status: stripeSub.status.toUpperCase(), // TRIALING
        start_date: start,
        renewal_date: end,
      },
    });

    // plan fetch
    const plan = await this.prisma.plan.findUnique({
      where: { id: planId },
    });

    // 🔥 ADD AI CREDITS TO BUSINESS (TRIAL START)
    if (plan?.ai_credits != null) {
      await this.prisma.business.update({
        where: { id: businessId },
        data: {
          ai_credits_total: plan.ai_credits,
          ai_credits_used: 0,
        },
      });
    }
  }

  // ---------------------------------------------
  private async subscriptionUpsert(event: any) {
    const sub = event.data.object;
    const { start, end } = this.getDates(sub);

    await this.prisma.subscription.updateMany({
      where: { stripe_subscription_id: sub.id },
      data: {
        status: sub.status.toUpperCase(), // ONLY place ACTIVE happens
        start_date: start,
        renewal_date: end,
      },
    });
  }

  // ---------------------------------------------
  private async subscriptionDeleted(event: any) {
    await this.prisma.subscription.updateMany({
      where: { stripe_subscription_id: event.data.object.id },
      data: {
        status: 'CANCELED',
        end_date: new Date(),
      },
    });
  }

  // ---------------------------------------------
  // ---------------------------------------------
  // ---------------------------------------------
  // private async invoicePaid(event: any) {
  //   const rawInvoice = event.data.object;

  //   if (!rawInvoice?.id) {
  //     this.logger.warn(`⚠️ invoice id missing`);
  //     return;
  //   }

  //   // 🔧 Stripe returns Response<Invoice>, unwrap safely
  //   const invoice = (await this.stripeService.client.invoices.retrieve(
  //     rawInvoice.id,
  //     {
  //       expand: ['lines.data', 'payment_intent'],
  //     },
  //   )) as any; // 🔥 CAST TO ANY (Stripe typing issue)

  //   // -------- subscription id resolve --------
  //   const stripeSubscriptionId =
  //     typeof invoice.subscription === 'string'
  //       ? invoice.subscription
  //       : invoice.subscription?.id;

  //   if (!stripeSubscriptionId) {
  //     throw new Error('Subscription id missing on invoice');
  //   }

  //   // -------- idempotency check --------
  //   const alreadyExists = await this.prisma.paymentHistory.findUnique({
  //     where: { stripe_invoice_id: invoice.id },
  //   });

  //   if (alreadyExists) return;

  //   // -------- find subscription (retry-safe) --------
  //   let sub: Subscription | null = null;
  //   for (let i = 0; i < 5; i++) {
  //     sub = await this.prisma.subscription.findFirst({
  //       where: { stripe_subscription_id: stripeSubscriptionId },
  //     });
  //     if (sub) break;
  //     await new Promise((r) => setTimeout(r, 500));
  //   }

  //   if (!sub) {
  //     throw new Error('Subscription not ready');
  //   }

  //   // -------- resolve price id (CAST line to any) --------
  //   const line = invoice.lines?.data?.find(
  //     (l: any) => l.price?.id || l.plan?.id, // 🔥 CAST TO ANY
  //   );

  //   const priceId = line?.price?.id ?? line?.plan?.id ?? null;

  //   const planFromInvoice = priceId
  //     ? await this.prisma.plan.findFirst({
  //         where: { stripe_price_id: priceId },
  //       })
  //     : null;

  //   // -------- amount & status --------
  //   const amount = Number(invoice.amount_paid ?? 0) / 100;
  //   const status = amount > 0 ? 'PAID' : 'FREE';

  //   // -------- payment intent id (CAST invoice to any) --------
  //   const paymentIntentId =
  //     typeof invoice.payment_intent === 'string'
  //       ? invoice.payment_intent
  //       : (invoice.payment_intent?.id ?? null);

  //   // -------- upsert payment history --------
  //   await this.prisma.paymentHistory.upsert({
  //     where: { stripe_invoice_id: invoice.id },
  //     update: {
  //       business_id: sub.business_id,
  //       plan_id: planFromInvoice?.id ?? sub.plan_id,
  //       subscription_id: sub.id,
  //       amount,
  //       currency: invoice.currency ?? 'usd',
  //       payment_method:
  //         invoice.payment_settings?.payment_method_types?.[0] ?? 'unknown',
  //       status,
  //       stripe_payment_intent_id: paymentIntentId,
  //       invoice_url: invoice.hosted_invoice_url ?? null,
  //     },
  //     create: {
  //       business_id: sub.business_id,
  //       plan_id: planFromInvoice?.id ?? sub.plan_id,
  //       subscription_id: sub.id,
  //       amount,
  //       currency: invoice.currency ?? 'usd',
  //       payment_method:
  //         invoice.payment_settings?.payment_method_types?.[0] ?? 'unknown',
  //       status,
  //       stripe_invoice_id: invoice.id,
  //       stripe_payment_intent_id: paymentIntentId,
  //       invoice_url: invoice.hosted_invoice_url ?? null,
  //     },
  //   });

  //   // 🔥 RESET / SET AI CREDITS ON SUCCESSFUL PAYMENT
  //   if (planFromInvoice?.ai_credits != null) {
  //     await this.prisma.business.update({
  //       where: { id: sub.business_id },
  //       data: {
  //         ai_credits_total: planFromInvoice.ai_credits,
  //         ai_credits_used: 0, // monthly reset
  //       },
  //     });
  //   }

  //   this.logger.log(
  //     `✅ PaymentHistory saved | invoice=${invoice.id} | amount=${amount}`,
  //   );
  // }

  private async invoicePaid(event: any) {
    const rawInvoice = event.data.object;

    if (!rawInvoice?.id) {
      this.logger.warn('⚠️ invoice id missing');
      return;
    }

    // 🔧 Always re-fetch expanded invoice (safe + consistent)
    const invoice = (await this.stripeService.client.invoices.retrieve(
      rawInvoice.id,
      {
        expand: ['lines.data', 'payment_intent'],
      },
    )) as any;

    // -------- resolve subscription id --------
    const stripeSubscriptionId =
      typeof invoice.subscription === 'string'
        ? invoice.subscription
        : invoice.subscription?.id;

    // ✅ IMPORTANT: ignore non-subscription invoices
    if (!stripeSubscriptionId) {
      this.logger.warn(
        `⚠️ invoice.payment_succeeded ignored (no subscription) | invoice=${invoice.id}`,
      );
      return;
    }

    // -------- idempotency check --------
    const alreadyExists = await this.prisma.paymentHistory.findUnique({
      where: { stripe_invoice_id: invoice.id },
    });
    if (alreadyExists) return;

    // -------- wait for subscription to exist (retry-safe) --------
    let sub: Subscription | null = null;
    for (let i = 0; i < 5; i++) {
      sub = await this.prisma.subscription.findFirst({
        where: { stripe_subscription_id: stripeSubscriptionId },
      });
      if (sub) break;
      await new Promise((r) => setTimeout(r, 500));
    }

    if (!sub) {
      this.logger.warn(
        `⚠️ subscription not ready, skipping | sub=${stripeSubscriptionId}`,
      );
      return;
    }

    // -------- resolve price id (Stripe typing is inconsistent) --------
    const line = invoice.lines?.data?.find(
      (l: any) => l.price?.id || l.plan?.id,
    );
    const priceId = line?.price?.id ?? line?.plan?.id ?? null;

    const planFromInvoice = priceId
      ? await this.prisma.plan.findFirst({
          where: { stripe_price_id: priceId },
        })
      : null;

    // -------- amounts & status --------
    const amount = Number(invoice.amount_paid ?? 0) / 100;
    const status = amount > 0 ? 'PAID' : 'FREE';

    // -------- payment intent id --------
    const paymentIntentId =
      typeof invoice.payment_intent === 'string'
        ? invoice.payment_intent
        : (invoice.payment_intent?.id ?? null);

    // -------- upsert payment history --------
    await this.prisma.paymentHistory.upsert({
      where: { stripe_invoice_id: invoice.id },
      update: {
        business_id: sub.business_id,
        plan_id: planFromInvoice?.id ?? sub.plan_id,
        subscription_id: sub.id,
        amount,
        currency: invoice.currency ?? 'usd',
        payment_method:
          invoice.payment_settings?.payment_method_types?.[0] ?? 'unknown',
        status,
        stripe_payment_intent_id: paymentIntentId,
        invoice_url: invoice.hosted_invoice_url ?? null,
      },
      create: {
        business_id: sub.business_id,
        plan_id: planFromInvoice?.id ?? sub.plan_id,
        subscription_id: sub.id,
        amount,
        currency: invoice.currency ?? 'usd',
        payment_method:
          invoice.payment_settings?.payment_method_types?.[0] ?? 'unknown',
        status,
        stripe_invoice_id: invoice.id,
        stripe_payment_intent_id: paymentIntentId,
        invoice_url: invoice.hosted_invoice_url ?? null,
      },
    });

    // -------- reset AI credits on successful subscription payment --------
    if (planFromInvoice?.ai_credits != null) {
      await this.prisma.business.update({
        where: { id: sub.business_id },
        data: {
          ai_credits_total: planFromInvoice.ai_credits,
          ai_credits_used: 0,
        },
      });
    }

    this.logger.log(
      `✅ PaymentHistory saved | invoice=${invoice.id} | amount=${amount}`,
    );
  }

  private async getSuperAdminMailbox() {
    const mailbox = await this.prisma.mailbox.findFirst({
      where: {
        user: {
          role: {
            name: 'SUPER_ADMIN',
          },
        },
        smtp_password: {
          not: null,
        },
      },
      select: {
        id: true,
        business_id: true,
        email_address: true,
      },
    });

    if (!mailbox) {
      throw new Error('Super Admin SMTP mailbox not found');
    }

    return mailbox;
  }
  // PAYMENT FAILED → SEND EMAIL (SUPER ADMIN SMTP)gg
  // ---------------------------------------------
  private async invoiceFailed(event: any) {
    const invoice = event.data.object;

    const sub = await this.prisma.subscription.findFirst({
      where: { stripe_subscription_id: invoice.subscription },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!sub) return;

    // 1️⃣ Update subscription status
    await this.prisma.subscription.update({
      where: { id: sub.id },
      data: { status: 'PAST_DUE' },
    });

    // 2️⃣ Business email না থাকলে stop
    if (!sub.business?.email) return;

    // 3️⃣ SUPER ADMIN mailbox বের করুন
    const adminMailbox = await this.getSuperAdminMailbox();

    // 4️⃣ Send email using Super Admin SMTP
    await this.mailService.sendSMTPEmail({
      business_id: adminMailbox.business_id ?? sub.business_id,
      mailbox_id: adminMailbox.id, //  SUPER ADMIN SMTP
      to: [sub.business.email],
      subject: '❌ Subscription Payment Failed',
      html: `
      <p>Hello ${sub.business.name},</p>

      <p>We were unable to process your subscription payment.</p>

      <p>
        Please update your payment method to continue using the service.
      </p>

      <p>
        <b>Status:</b> Payment Failed<br/>
        <b>Plan ID:</b> ${sub.plan_id}
      </p>

      <p>— Support Team</p>
    `,
    });
  }
}
