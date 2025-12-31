import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private readonly stripe: Stripe;

  constructor() {
    const secret = process.env.STRIPE_SECRET_KEY;

    if (!secret) {
      throw new Error('❌ STRIPE_SECRET_KEY missing');
    }

    this.stripe = new Stripe(secret, {
      apiVersion: '2023-10-16' as any,
    });
  }

  get client() {
    return this.stripe;
  }

  async createCustomer(data: Stripe.CustomerCreateParams) {
    return this.stripe.customers.create(data);
  }

  async retrieveCustomer(id: string) {
    return this.stripe.customers.retrieve(id);
  }

  async retrieveInvoice(id: string) {
    return this.stripe.invoices.retrieve(id);
  }

  async retrieveSubscription(id: string) {
    return this.stripe.subscriptions.retrieve(id);
  }

  async createBillingPortalSession(customerId: string, returnUrl: string) {
    return this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
  }

  // 30-day trial ALWAYS applied
  async createSubscriptionCheckoutSession(params: {
    customerId: string;
    priceId: string;
    successUrl: string;
    cancelUrl: string;
    businessId: number;
    planId: number;
  }) {
    const { customerId, priceId, successUrl, cancelUrl, businessId, planId } =
      params;

    return this.stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      success_url: successUrl,
      cancel_url: cancelUrl,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 30,
        metadata: {
          businessId: String(businessId),
          planId: String(planId),
        },
      },
      metadata: {
        businessId: String(businessId),
        planId: String(planId),
      },
    });
  }

  constructEventFromPayload(signature: string, payload: Buffer) {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) throw new Error('Webhook secret missing');

    return this.stripe.webhooks.constructEvent(payload, signature, secret);
  }
}
