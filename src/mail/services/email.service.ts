
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class EmailService {
  constructor(private prisma: PrismaService) {}

  getEmailsByThread(thread_id: number) {
    return this.prisma.email.findMany({
      where: { thread_id },
      orderBy: [{ received_at: 'asc' }, { sent_at: 'asc' }],
    });
  }

  async markAsRead(id: number) {
    const exists = await this.prisma.email.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Email not found');

    return this.prisma.email.update({
      where: { id },
      data: { is_read: true },
    });
  }

  getEmailById(id: number) {
    return this.prisma.email.findUnique({ where: { id } });
  }
}
