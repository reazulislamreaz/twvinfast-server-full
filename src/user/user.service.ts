import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../auth/dto/registerUser.dto';
import { UpdateMailboxDto } from './dto/update-mailbox.dto';
import verifyImap from 'src/config/verifyImap';
import verifySmtp from 'src/config/verifySmtp';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  // --------------------------
  // FIND BY EMAIL
  // --------------------------
  async findByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        role: true,
        business: true,
        mailboxes: true,
        emails: true,
        aiActions: true,
        aiReplies: true,
        hallucinations: true,
      },
    });

    if (!user) return null;

    const { password_hash, ...clean } = user;
    return clean;
  }

  // GET ALL USERS

  async findAll() {
    const users = await this.prisma.user.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        role: true,
        business: true,
      },
    });

    return users.map(({ password_hash, ...rest }) => rest);
  }

  // --------------------------
  // GET ONE USER BY ID
  // --------------------------
  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
        business: true,
        mailboxes: true,
        emails: true,
        aiActions: true,
        aiReplies: true,
        hallucinations: true,
      },
    });

    if (!user) return null;

    const { password_hash, ...clean } = user;
    return clean;
  }

  // --------------------------
  // UPDATE USER (ADMIN PANEL থেকে)
  // --------------------------
  async updateUser(id: number, data: any) {
    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        name: data.name,
        status: data.status,
        twoFAEnabled: data.twoFAEnabled,
        role: data.role_id ? { connect: { id: data.role_id } } : undefined,
      },
      include: {
        role: true,
        business: true,
      },
    });

    return updated;
  }

  // --------------------------
  // DELETE USER
  // --------------------------
  async deleteUser(id: number) {
    const deleted = await this.prisma.user.delete({
      where: { id },
      include: {
        role: true,
        business: true,
      },
    });

    const { password_hash, ...clean } = deleted;
    return clean;
  }

  // --------------------------
  // SELF PROFILE UPDATE (optional – যদি আগে যুক্ত করো)
  async updateMyProfile(userId: number, dto: any) {
    const data: any = {};

    if (dto.name) data.name = dto.name;
    if (dto.phone) data.phone = dto.phone;
    if (dto.location) data.location = dto.location;
    if (dto.email_signature) data.email_signature = dto.email_signature;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data,
    });

    return updated;
  }

  // ==============================
  // ✨ MAILBOX LOGIC INSIDE USER SERVICE
  // ==============================

  // USER-এর সব mailbox (সাধারণত ১টা, কিন্তু future-proof)
  async getMyMailboxes(userId: number) {
    console.log(userId);
    return this.prisma.mailbox.findFirst({
      where: { user_id: userId },
    });
  }

  async upsertMyPrimaryMailbox(userId: number, dto: UpdateMailboxDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!user.business_id) {
      throw new BadRequestException('User has no business');
    }

    // ==================================================
    // 🔧 STEP 1: VERIFY CREDENTIALS FIRST (NO DB TOUCH)
    // ==================================================

    // 🔧 FIX: only verify if required fields present
    if (dto.smtp_host && dto.smtp_port && dto.smtp_password) {
      await verifySmtp(dto); // ❌ error → function stops here
    }

    if (dto.imap_host && dto.imap_port && dto.imap_password) {
      await verifyImap(dto); // ❌ error → function stops here
    }

    // ==================================================
    // 🔧 STEP 2: SAVE ONLY IF VERIFY PASSED
    // ==================================================

    const existing = await this.prisma.mailbox.findFirst({
      where: {
        user_id: userId,
        business_id: user.business_id,
      },
    });

    if (existing) {
      return this.prisma.mailbox.update({
        where: { id: existing.id },
        data: {
          provider: dto.provider ?? undefined,
          email_address: dto.email_address ?? undefined,
          imap_host: dto.imap_host ?? undefined,
          imap_port: dto.imap_port ?? undefined,
          smtp_host: dto.smtp_host ?? undefined,
          smtp_port: dto.smtp_port ?? undefined,
          imap_password: dto.imap_password ?? undefined,
          smtp_password: dto.smtp_password ?? undefined,
          is_ssl: dto.is_ssl ?? undefined,
        },
      });
    }

    return this.prisma.mailbox.create({
      data: {
        business_id: user.business_id,
        user_id: userId,
        provider: dto.provider ?? 'SMTP',
        email_address: dto.email_address ?? user.email,
        imap_host: dto.imap_host ?? undefined,
        imap_port: dto.imap_port ?? undefined,
        smtp_host: dto.smtp_host ?? undefined,
        smtp_port: dto.smtp_port ?? undefined,
        is_ssl: dto.is_ssl ?? true,
      },
    });
  }

  // async upsertMyPrimaryMailbox(userId: number, dto: UpdateMailboxDto) {
  //   const user = await this.prisma.user.findUnique({
  //     where: { id: userId },
  //   });

  //   if (!user) {
  //     throw new BadRequestException('User not found');
  //   }

  //   if (!user.business_id) {
  //     throw new BadRequestException('User has no business assigned');
  //   }

  //   // প্রতি user + business combo এর জন্য ১টা mailbox
  //   const existing = await this.prisma.mailbox.findFirst({
  //     where: {
  //       user_id: userId,
  //       business_id: user.business_id,
  //     },
  //   });

  //   // -------------------------------------------
  //   // ⭐ UPDATE mailbox IF EXISTS
  //   // -------------------------------------------
  //   if (existing) {
  //     return this.prisma.mailbox.update({
  //       where: { id: existing.id },
  //       data: {
  //         provider: dto.provider ?? undefined,
  //         email_address: dto.email_address ?? undefined,
  //         imap_host: dto.imap_host ?? undefined,
  //         imap_port: dto.imap_port ?? undefined,
  //         smtp_host: dto.smtp_host ?? undefined,
  //         smtp_port: dto.smtp_port ?? undefined,
  //         imap_password: dto.imap_password ?? undefined,
  //         smtp_password: dto.smtp_password ?? undefined,
  //         is_ssl: dto.is_ssl ?? undefined,
  //       },
  //     });
  //   }

  //   // -------------------------------------------
  //   // ⭐ CREATE mailbox IF NOT EXISTS
  //   // -------------------------------------------
  //   return this.prisma.mailbox.create({
  //     data: {
  //       business_id: user.business_id,
  //       user_id: userId,
  //       provider: dto.provider ?? 'SMTP',
  //       email_address: dto.email_address ?? user.email,

  //       // Prisma optional fields → must be undefined to skip OR null if user sends null
  //       imap_host: dto.imap_host ?? undefined,
  //       imap_port: dto.imap_port ?? undefined,

  //       smtp_host: dto.smtp_host ?? undefined,
  //       smtp_port: dto.smtp_port ?? undefined,

  //       is_ssl: dto.is_ssl ?? true,
  //     },
  //   });
  // }
  async upsertAdminPrimaryMailbox(userId: number, dto: UpdateMailboxDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // প্রতি user + business combo এর জন্য ১টা mailbox
    const existing = await this.prisma.mailbox.findFirst({
      where: {
        user_id: userId,
      },
    });

    // -------------------------------------------
    // ⭐ UPDATE mailbox IF EXISTS
    // -------------------------------------------
    if (existing) {
      return this.prisma.mailbox.update({
        where: { id: existing.id },
        data: {
          provider: dto.provider ?? undefined,
          email_address: dto.email_address ?? undefined,
          smtp_host: dto.smtp_host ?? undefined,
          smtp_port: dto.smtp_port ?? undefined,
          smtp_password: dto.smtp_password ?? undefined,
          is_ssl: dto.is_ssl ?? undefined,
        },
      });
    }

    // -------------------------------------------
    // ⭐ CREATE mailbox IF NOT EXISTS
    // -------------------------------------------
    return this.prisma.mailbox.create({
      data: {
        business_id: 1,
        user_id: userId,
        provider: dto.provider ?? 'SMTP',
        email_address: dto.email_address ?? user.email,
        // Prisma optional fields → must be undefined to skip OR null if user sends null
        smtp_host: dto.smtp_host ?? undefined,
        smtp_port: dto.smtp_port ?? undefined,
        is_ssl: dto.is_ssl ?? true,
      },
    });
  }

  //
  // --------------------------
  // GET LOGGED-IN USER FULL INFO
  // --------------------------
  async getMyFullProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        business: true,
        mailboxes: true,
        notificationSetting: true,

        // optional but useful
        // emails: true,
        // aiActions: true,
        // aiReplies: true,
        // hallucinations: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 🔐 remove sensitive data
    const { password_hash, ...clean } = user;

    return clean;
  }

  // admin part
  async getOverview() {
    const [totalUsers, adminCount, aiResponses] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({
        where: { role: { name: 'ADMIN' } },
      }),
      this.prisma.aiGeneratedReply.count(),
    ]);

    return {
      totalUsers,
      adminCount,
      aiResponses,
    };
  }

  async getRecentActivities() {
    const [users, logins, aiReplies, emails] = await Promise.all([
      this.prisma.user.findMany({
        orderBy: { created_at: 'desc' },
        take: 3,
        select: { name: true, created_at: true },
      }),
      this.prisma.user.findMany({
        where: { last_login_at: { not: null } },
        orderBy: { last_login_at: 'desc' },
        take: 3,
        select: { name: true, last_login_at: true },
      }),
      this.prisma.aiGeneratedReply.findMany({
        orderBy: { created_at: 'desc' },
        take: 3,
        select: { created_at: true },
      }),
      this.prisma.email.findMany({
        where: { received_at: { not: null } },
        orderBy: { received_at: 'desc' },
        take: 3,
        select: { subject: true, received_at: true },
      }),
    ]);

    return [
      ...users.map((u) => ({
        text: `${u.name} created a new account`,
        time: u.created_at,
      })),
      ...logins.map((l) => ({
        text: `${l.name} logged in`,
        time: l.last_login_at,
      })),
      ...aiReplies.map(() => ({
        text: `AI response generated`,
        time: new Date(),
      })),
      ...emails.map((e) => ({
        text: `New email received: ${e.subject}`,
        time: e.received_at,
      })),
    ]
      .filter((a) => a.time)
      .sort((a, b) => +new Date(b.time!) - +new Date(a.time!))
      .slice(0, 5);
  }

  async getBusinessOverview(businessId: number) {
    if (!businessId) {
      throw new BadRequestException('Business id missing from token');
    }

    const [totalUsers, adminCount, aiResponses] = await Promise.all([
      // 👤 total users of this business
      this.prisma.user.count({
        where: { business_id: businessId, role: { name: 'USER' } },
      }),

      // 👑 admin users of this business
      this.prisma.user.count({
        where: {
          business_id: businessId,
          role: { name: 'ADMIN' },
        },
      }),

      // 🤖 AI responses of this business
      this.prisma.aiGeneratedReply.count({
        where: { business_id: businessId },
      }),
    ]);

    return {
      business_id: businessId,
      totalUsers,
      adminCount,
      aiResponses,
    };
  }
}
