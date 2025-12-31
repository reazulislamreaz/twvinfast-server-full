// src/billing/billing.controller.ts

import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { BillingService } from './services/billing.service';
import { BillingWebhookService } from './services/billing-webhook.service';
import { StripeService } from 'src/stripe/stripe.service';

import { CreatePortalDto, CreateCheckoutDto } from './dto/create-portal.dto';
import { CreatePlanDto } from './dto/create-plan.dto';

import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/strategies/roles.guard';
import { Public } from 'src/auth/decorators/public.decorator';
import { UpdatePlanDto } from './dto/update-plan.dto';

@Controller('billing')
export class BillingController {
  constructor(
    private readonly billingService: BillingService,
    private readonly billingWebhookService: BillingWebhookService,
    private readonly stripeService: StripeService,
  ) {}

  // -------------------------------------------------------------------------
  // ADMIN → Create Billing Portal Session
  // -------------------------------------------------------------------------
  @Post('portal')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  async createPortal(@Req() req, @Body() dto: CreatePortalDto) {
    return this.billingService.createPortal(req.user.sub, dto);
  }

  // -------------------------------------------------------------------------
  // ADMIN → Get Business Subscription
  // -------------------------------------------------------------------------
  @Get('subscription')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  async getSubscription(@Req() req) {
    return this.billingService.getBusinessSubscription(req.user.sub);
  }

  // -------------------------------------------------------------------------
  @Get('all-subscription')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPER_ADMIN')
  async getAllSubscription() {
    return this.billingService.getAllSubscriptions();
  }

  // -------------------------------------------------------------------------
  // ADMIN → Create Checkout Session (Trial / Monthly / Annual)
  // -------------------------------------------------------------------------
  @Post('checkout')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  async createCheckout(@Req() req, @Body() dto: CreateCheckoutDto) {
    return this.billingService.createCheckoutSession(req.user.sub, dto);
  }

  // -------------------------------------------------------------------------
  // SUPER_ADMIN → Create Plan
  // -------------------------------------------------------------------------
  @Post('create-plan')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPER_ADMIN')
  async createPlan(@Body() dto: CreatePlanDto) {
    return this.billingService.createPlan(dto);
  }

  // -------------------------------------------------------------------------
  // SUPER_ADMIN → Get All Plans
  // -------------------------------------------------------------------------
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPER_ADMIN')
  @Get('plans')
  async getAllPlans() {
    return this.billingService.getAllPlans();
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @Get('plans-by-admin')
  async getAllPlansByAdmin() {
    return this.billingService.getAllPlans();
  }
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @Put('subscription/update-plan')
  async updatePlan(@Body() body: any, @Req() req) {
    console.log(req.body.userId);
    const userId = parseInt(req.body.userId);

    // Identify where ID exists

    if (!userId) {
      throw new BadRequestException('User ID missing in token');
    }

    return this.billingService.updateUserPlan(userId, body.planId);
  }
  // Cancel subscription for a business
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @Post('subscription/:businessId/cancel')
  async cancelSubscription(@Param('businessId') businessId: number) {
    return this.billingService.cancelSubscription(Number(businessId));
  }

  // -------------------------------------------------------------------------
  // ADMIN → Update Own Plan (DB-only, Stripe-safe)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPER_ADMIN')
  @Put('plan/:planId')
  async updateClientPlan(
    @Param('planId') planId: number,
    @Body() dto: UpdatePlanDto,
  ) {
    return this.billingService.updateClientPlan(Number(planId), dto);
  }

  // -------------------------------------------------------------------------
  // STRIPE WEBHOOK (Public Route)
  //
  // 🔥 IMPORTANT:
  // main.ts এ এই রুটের জন্য raw body enable থাকতে হবে:
  //
  // app.use('/billing/webhook', bodyParser.raw({ type: '*/*' }));
  //
  // -------------------------------------------------------------------------
  @Post('webhook')
  @Public()
  async handleWebhook(
    @Req() req: any,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing Stripe-Signature header');
    }

    // 🔥 DO NOT modify, stringify, JSON.parse etc.
    const rawBody = req.body;

    const event = this.stripeService.constructEventFromPayload(
      signature,
      rawBody,
    );

    await this.billingWebhookService.handleEvent(event);

    return { received: true };
  }

  //
  // -------------------------------------------------------------------------
  // SUPER ADMIN → Get All Trial + Active Subscriptions
  // -------------------------------------------------------------------------
  // @UseGuards(AuthGuard('jwt'), RolesGuard)
  // @Roles('SUPER_ADMIN')
  // @Get('subscriptions/active-trial')
  // async getAllActiveAndTrialSubs() {
  //   return this.billingService.getAllActiveAndTrialSubscriptions();
  // }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPER_ADMIN')
  @Get('subscriptions/active-trial')
  async getAllActiveAndTrialSubs(
    @Query('search') search?: string,
    @Query('status') status?: 'ACTIVE' | 'TRIALING' | 'SUSPENDED',
  ) {
    return this.billingService.getAllActiveAndTrialSubscriptions({
      search,
      status,
    });
  }

  // SUPER ADMIN → Billing & Subscription Table (Dashboard)
  // -------------------------------------------------------------------------
  // @UseGuards(AuthGuard('jwt'), RolesGuard)
  // @Roles('SUPER_ADMIN')
  // @Get('subscriptions/dashboard')
  // async getSubscriptionDashboard(@Req() req) {
  //   return this.billingService.getSubscriptionDashboard();
  // }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPER_ADMIN')
  @Get('subscriptions/dashboard')
  async getSubscriptionDashboard(
    @Query('search') search?: string,
    @Query('status') status?: 'ACTIVE' | 'TRIALING' | 'SUSPENDED',
  ) {
    return this.billingService.getSubscriptionDashboard({
      search,
      status,
    });
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPER_ADMIN')
  @Get('invoices/dashboard')
  async getInvoicesDashboard() {
    return this.billingService.getInvoicesDashboard();
  }
  //all customer for superAdmin
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPER_ADMIN')
  @Get('admin/customers/dashboard')
  getCustomerDashboard(
    @Query('search') search?: string,
    @Query('status') status?: 'ACTIVE' | 'TRIALING' | 'SUSPENDED',
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.billingService.getCustomerManagementDashboard({
      search,
      status,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  // 🔒 Suspend / Activate Business
  @Patch(':businessId/status')
  updateBusinessStatus(
    @Param('businessId') businessId: number,
    @Body('status') status: 'ACTIVE' | 'SUSPENDED',
  ) {
    return this.billingService.updateBusinessStatus(Number(businessId), status);
  }

  //Get all user by super-admin
  // Get all users by super-admin

  @Get()
  getAllUsers(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.billingService.getAllPlatformUsers({
      status,
      search,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
    });
  }

  //getRevenueOverview
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPER_ADMIN')
  @Get('subscriptions/revenue-overview')
  getRevenueOverview() {
    return this.billingService.getRevenueOverview();
  }

  // SUPER ADMIN → Analytics & Reports → Growth Analysis
  // -------------------------------------------------------------------------
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPER_ADMIN')
  @Get('analytics/growth-analysis')
  getGrowthAnalysis() {
    return this.billingService.getGrowthAnalysis();
  }
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPER_ADMIN')
  @Get('analytics/global-overview')
  getGlobalOverview() {
    return this.billingService.getGlobalOverview();
  }

  //make route for admin
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @Get('global-overview-admin')
  getGlobalOverviewAdmin(@Req() req: any) {
    if (!req?.user?.sub) {
      throw new ForbiddenException('Invalid user context');
    }
    return this.billingService.getGlobalOverviewForAdmin(req.user.sub);
  }
}
