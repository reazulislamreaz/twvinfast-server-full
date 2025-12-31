import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class CustomerService {
  constructor(private prisma: PrismaService) {}

  async getAllCustomers(business_id: number, search?: string) {
    return this.prisma.customer.findMany({
      where: {
        business_id,
        ...(search && {
          OR: [
            {
              name: {
                contains: search,
                mode: 'insensitive',
              },
            },
            {
              email: {
                contains: search,
                mode: 'insensitive',
              },
            },
          ],
        }),
      },
      orderBy: {
        last_contact_at: 'desc', // 🔥 recently active first
      },
      // !  include: {
      //     // 🔥 useful for UI
      //     _count: {
      //       //   select: {
      //       //     emails: true,
      //       //   },
      //     },
      //   },
    });
  }
}
