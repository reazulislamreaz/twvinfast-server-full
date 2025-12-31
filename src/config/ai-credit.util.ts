//  NEW: Centralized AI credit handler (REUSABLE)

import { ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { AIActionType } from '@prisma/client';

export async function consumeAiCredits(params: {
  prisma: PrismaService;
  business_id: number;
  user_id?: number;
  tokens: number;
  route: string;
  model?: string;
  action?: AIActionType;
  category?: string; // 🔥 "Product", "Support", "Billing"
}) {
  const business = await params.prisma.business.findUnique({
    where: { id: params.business_id },
  });

  if (!business) {
    throw new ForbiddenException('Business not found');
  }

  // 🔒 PRE-CHECK
  if (business.ai_credits_used >= business.ai_credits_total) {
    throw new ForbiddenException('AI credit limit exceeded');
  }

  // 🔒 POST-CHECK
  if (business.ai_credits_used + params.tokens > business.ai_credits_total) {
    throw new ForbiddenException('Not enough AI credits');
  }

  // 🧾 LOG (SOURCE OF TRUTH)
  await params.prisma.aiCreditLog.create({
    data: {
      business_id: params.business_id,
      user_id: params.user_id,
      route: params.route,
      model: params.model ?? 'unknown',
      tokens: params.tokens,
      action: params.action,
      category: params.category,
    },
  });

  // ⚡ FAST COUNTER
  await params.prisma.business.update({
    where: { id: params.business_id },
    data: {
      ai_credits_used: {
        increment: params.tokens,
      },
    },
  });
}
