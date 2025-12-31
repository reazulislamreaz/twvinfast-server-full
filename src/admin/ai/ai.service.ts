import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class AiService {
  constructor(private prisma: PrismaService) {}

  /* ===============================
     1️⃣ CREATE (Upload metadata)
  =============================== */
  async createDocument(data: any, user: any) {
    const { organization_name, file_name } = data;

    if (!organization_name || !file_name) {
      throw new BadRequestException(
        'organization_name and file_name are required',
      );
    }

    return this.prisma.aiDocumentRegistry.create({
      data: {
        business_id: user.business_id,
        organization_name,
        file_name,
      },
    });
  }

  /* ===============================
     2️⃣ GET ALL
  =============================== */
  async getDocuments(businessId: number) {
    return this.prisma.aiDocumentRegistry.findMany({
      where: { business_id: businessId },
      orderBy: { created_at: 'desc' },
    });
  }

  /* ===============================
     3️⃣ DELETE
  =============================== */
  /* 3️⃣ DELETE (organization_name + file_name) */
  async deleteByOrgAndFile(data: any, user: any) {
    const { organization_name, file_name } = data;

    if (!organization_name || !file_name) {
      throw new BadRequestException(
        'organization_name and file_name are required',
      );
    }

    const doc = await this.prisma.aiDocumentRegistry.findFirst({
      where: {
        business_id: user.business_id,
        organization_name,
        file_name,
      },
    });

    if (!doc) {
      throw new NotFoundException('AI document not found');
    }

    if (doc.business_id !== user.business_id) {
      throw new ForbiddenException(
        'You are not allowed to delete this document',
      );
    }

    await this.prisma.aiDocumentRegistry.delete({
      where: { id: doc.id },
    });

    return {
      success: true,
      organization_name,
      file_name,
    };
  }
}
