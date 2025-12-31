import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class BusinessService {
  constructor(private prisma: PrismaService) {}

  // ✔ Get Company Profile
  async getBusiness(businessId: number) {
    return this.prisma.business.findUnique({
      where: { id: businessId },
    });
  }

  // ✔ Update Company Profile (FIXED)
  async updateBusiness(businessId: number, dto: any) {
    let data = dto;

    // 🔧 CASE: multipart/form-data with "data" field (JSON string)
    if (typeof dto.data === 'string') {
      try {
        data = {
          ...JSON.parse(dto.data),
          ...(dto.logo_url && { logo_url: dto.logo_url }),
        };
      } catch (e) {
        throw new Error('Invalid business update payload');
      }
    }

    // 🧹 remove undefined fields
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined),
    );

    return this.prisma.business.update({
      where: { id: businessId },
      data: cleanData,
    });
  }

  // ✔ Get Knowledge Base Documents
  async getKnowledgeBase(businessId: number) {
    return this.prisma.aiTrainingData.findMany({
      where: { business_id: businessId },
      orderBy: { created_at: 'desc' },
    });
  }

  // ✔ Get Customers
  async getCustomers(businessId: number) {
    return this.prisma.customer.findMany({
      where: { business_id: businessId },
      include: {
        threads: true,
        opportunities: true,
      },
    });
  }

  // ✔ Get Email History for a Customer
  async getCustomerEmailHistory(customerId: number) {
    return this.prisma.emailThread.findMany({
      where: { customer_id: customerId },
      orderBy: { last_message_at: 'desc' },
    });
  }

  // ✔ Get Integrations
  async getIntegrations(businessId: number) {
    return this.prisma.integration.findMany({
      where: { business_id: businessId },
    });
  }
}
