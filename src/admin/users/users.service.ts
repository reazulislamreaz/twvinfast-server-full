import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // ✔ Get all team users for a business
  async listUsers(businessId: number) {
    return this.prisma.user.findMany({
      where: { business_id: businessId },
      include: {
        role: true,
        mailboxes: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  // ✔ User AI Actions
  async getUserAIActions(userId: number) {
    return this.prisma.aIAction.findMany({
      where: { user_id: userId },
      include: { email: true },
      orderBy: { created_at: 'desc' },
    });
  }

  // ✔ Hallucination Reports
  async getUserHallucinations(userId: number) {
    return this.prisma.aiHallucinationReport.findMany({
      where: { user_id: userId },
      include: { email: true, reply: true },
    });
  }

  // ✔ Analytics
  async getUserAnalytics(userId: number) {
    return {
      generatedReplies: await this.prisma.aiGeneratedReply.count({
        where: { user_id: userId },
      }),
      hallucinations: await this.prisma.aiHallucinationReport.count({
        where: { user_id: userId },
      }),
    };
  }

  // ⭐ UPDATE USER ROLE
  async updateUserRole(userId: number, role_id: number) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { role_id },
      include: { role: true },
    });
  }

  // ⭐ UPDATE USER STATUS
  async updateUserStatus(userId: number, status: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { status },
    });
  }

  // ⭐ DELETE USER (hard delete)
  async deleteUser(userId: number) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { status: 'DELETED' }, // or SUSPENDED
    });
  }
}
