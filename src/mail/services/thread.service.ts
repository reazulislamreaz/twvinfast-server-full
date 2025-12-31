import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { ThreadStatus, Prisma } from '@prisma/client';
import { SocketService } from 'src/socket/socket.service';

@Injectable()
export class ThreadService {
  constructor(
    private prisma: PrismaService,
    private socket: SocketService,
  ) {}

  /* ===============================
     THREAD LIST
  =============================== */
  // async getThreadsByMailbox(params: {
  //   mailbox_id: number;
  //   folder?: string;
  //   search?: string;
  //   status?: ThreadStatus;
  //   tag?: number;
  //   sort?: 'newest' | 'oldest';
  //   page?: number;
  //   limit?: number;
  // }) {
  //   const {
  //     mailbox_id,
  //     folder = 'inbox',
  //     search,
  //     status,
  //     tag,
  //     sort = 'newest',
  //     page = 1,
  //     limit = 6,
  //   } = params;

  //   const skip = (page - 1) * limit;

  //   const where: Prisma.EmailThreadWhereInput = {
  //     mailbox_id,
  //   };

  //   /* ---------- Folder ---------- */
  //   switch (folder) {
  //     case 'starred':
  //       where.is_starred = true;
  //       where.is_deleted = false;
  //       break;
  //     case 'archived':
  //       where.is_archived = true;
  //       where.is_deleted = false;
  //       break;
  //     case 'trash':
  //       where.is_deleted = true;
  //       break;
  //     case 'unread':
  //       where.status = ThreadStatus.NEW;
  //       where.is_deleted = false;
  //       where.is_archived = false;
  //       break;
  //     default:
  //       where.is_deleted = false;
  //       where.is_archived = false;
  //   }

  //   /* ---------- Search ---------- */
  //   if (search) {
  //     where.OR = [
  //       { subject: { contains: search, mode: 'insensitive' } },
  //       { customer: { email: { contains: search, mode: 'insensitive' } } },
  //       { customer: { name: { contains: search, mode: 'insensitive' } } },
  //     ];
  //   }

  //   /* ---------- Status ---------- */
  //   if (status) {
  //     where.status = status;
  //   }

  //   /* ---------- Label ---------- */
  //   if (tag) {
  //     where.labels = {
  //       some: {
  //         label_id: tag,
  //       },
  //     };
  //   }

  //   const total = await this.prisma.emailThread.count({ where });

  //   const data = await this.prisma.emailThread.findMany({
  //     where,
  //     skip,
  //     take: limit,
  //     orderBy: {
  //       last_message_at: sort === 'oldest' ? 'asc' : 'desc',
  //     },
  //     include: {
  //       customer: true,
  //       labels: {
  //         include: { label: true },
  //       },
  //     },
  //   });

  //   return {
  //     data,
  //     pagination: {
  //       total,
  //       page,
  //       limit,
  //       totalPages: Math.ceil(total / limit),
  //     },
  //   };
  // }

  async getThreadsByMailbox(params: {
    mailbox_id: number;
    folder?: string;
    search?: string;
    status?: ThreadStatus;
    tag?: number;
    sort?: 'newest' | 'oldest';
    page?: number;
    limit?: number;
  }) {
    const {
      mailbox_id,
      folder = 'inbox',
      search,
      status,
      tag,
      sort = 'newest',
      page = 1,
      limit = 6,
    } = params;

    const skip = (page - 1) * limit;

    const where: Prisma.EmailThreadWhereInput = {
      mailbox_id,
    };

    /* ---------- Folder ---------- */
    switch (folder) {
      case 'starred':
        where.is_starred = true;
        where.is_deleted = false;
        break;

      case 'archived':
        where.is_archived = true;
        where.is_deleted = false;
        break;

      case 'trash':
        where.is_deleted = true;
        break;

      case 'unread':
        where.status = ThreadStatus.NEW;
        where.is_deleted = false;
        where.is_archived = false;
        break;

      case 'all':
        // intentionally no extra filter
        break;

      default: // inbox
        where.is_deleted = false;
        where.is_archived = false;
    }

    /* ---------- Search ---------- */
    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { customer: { email: { contains: search, mode: 'insensitive' } } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    /* ---------- Status ---------- */
    if (status) {
      where.status = status;
    }

    /* ---------- Label / Tag ---------- */
    if (tag) {
      where.labels = {
        some: {
          label_id: tag,
        },
      };
    }

    /* ---------- Total Count ---------- */
    const total = await this.prisma.emailThread.count({ where });

    /* ---------- Threads + Last Mail ---------- */
    const data = await this.prisma.emailThread.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        last_message_at: sort === 'oldest' ? 'asc' : 'desc',
      },
      include: {
        customer: true,
        labels: {
          include: {
            label: true,
          },
        },
        emails: {
          take: 1,
          orderBy: {
            created_at: 'desc',
          },
          select: {
            id: true,
            from_address: true,
            to_addresses: true,
            subject: true,
            body_text: true,
            // body_html: true,
            created_at: true,
            direction: true,
            is_read: true,
          },
        },
      },
    });

    /* ---------- Response ---------- */
    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /* ===============================
     COUNTS (FIXED)
  =============================== */
  async getThreadCounts(mailbox_id: number) {
    if (!mailbox_id) {
      throw new NotFoundException('mailbox_id missing');
    }

    const base = { mailbox_id };

    const [inbox, starred, archived, trash, unread] = await Promise.all([
      this.prisma.emailThread.count({
        where: {
          ...base,
          is_deleted: false,
          is_archived: false,
        },
      }),
      this.prisma.emailThread.count({
        where: {
          ...base,
          is_starred: true,
          is_deleted: false,
        },
      }),
      this.prisma.emailThread.count({
        where: {
          ...base,
          is_archived: true,
          is_deleted: false,
        },
      }),
      this.prisma.emailThread.count({
        where: {
          ...base,
          is_deleted: true,
        },
      }),
      this.prisma.emailThread.count({
        where: {
          ...base,
          status: ThreadStatus.NEW,
          is_deleted: false,
          is_archived: false,
        },
      }),
    ]);

    return { inbox, starred, archived, trash, unread };
  }

  /* ===============================
     SINGLE THREAD
  =============================== */
  async getThreadWithEmails(thread_id: number) {
    const thread = await this.prisma.emailThread.findUnique({
      where: { id: thread_id },
      include: {
        emails: true,
        labels: { include: { label: true } },
      },
    });

    if (!thread) throw new NotFoundException('Thread not found');
    return thread;
  }

  /* ===============================
     READ / UNREAD
  =============================== */
  async markThreadRead(thread_id: number) {
    const thread = await this.prisma.emailThread.update({
      where: { id: thread_id },
      data: { status: ThreadStatus.OPENED },
    });

    await this.prisma.email.updateMany({
      where: { thread_id },
      data: { is_read: true },
    });

    this.socket.emitToMailbox(thread.mailbox_id, 'thread:read', { thread_id });
    return { success: true };
  }

  async markThreadUnread(thread_id: number) {
    const thread = await this.prisma.emailThread.update({
      where: { id: thread_id },
      data: { status: ThreadStatus.NEW },
    });

    await this.prisma.email.updateMany({
      where: { thread_id },
      data: { is_read: false },
    });

    this.socket.emitToMailbox(thread.mailbox_id, 'thread:unread', {
      thread_id,
    });
    return { success: true };
  }

  /* ===============================
     ARCHIVE / UNARCHIVE
  =============================== */
  async archiveThread(id: number) {
    const thread = await this.prisma.emailThread.update({
      where: { id, is_deleted: false },
      data: {
        is_archived: true,
        status: ThreadStatus.OPENED,
      },
    });

    this.socket.emitToMailbox(thread.mailbox_id, 'thread:archived', {
      thread_id: id,
    });

    return thread;
  }

  async unarchiveThread(id: number) {
    const thread = await this.prisma.emailThread.update({
      where: { id, is_deleted: false },
      data: { is_archived: false },
    });

    this.socket.emitToMailbox(thread.mailbox_id, 'thread:unarchived', {
      thread_id: id,
    });

    return thread;
  }

  /* ===============================
     TRASH / RESTORE
  =============================== */
  async moveToTrash(thread_id: number) {
    const thread = await this.prisma.emailThread.update({
      where: { id: thread_id },
      data: {
        is_deleted: true,
        is_archived: false,
        status: ThreadStatus.OPENED,
      },
    });

    this.socket.emitToMailbox(thread.mailbox_id, 'thread:trashed', {
      thread_id,
    });

    return thread;
  }

  async restoreFromTrash(thread_id: number) {
    const thread = await this.prisma.emailThread.update({
      where: { id: thread_id },
      data: {
        is_deleted: false,
        is_archived: false,
      },
    });

    this.socket.emitToMailbox(thread.mailbox_id, 'thread:restored', {
      thread_id,
    });

    return thread;
  }

  /* ===============================
     BULK STAR / UNSTAR
  =============================== */
  async bulkStar(ids: number[]) {
    if (!ids?.length) return { success: false };

    const threads = await this.prisma.emailThread.findMany({
      where: { id: { in: ids } },
    });

    await this.prisma.emailThread.updateMany({
      where: { id: { in: ids }, is_deleted: false },
      data: { is_starred: true },
    });

    const mailboxMap = new Map<number, number[]>();
    threads.forEach((t) => {
      mailboxMap.set(t.mailbox_id, [
        ...(mailboxMap.get(t.mailbox_id) || []),
        t.id,
      ]);
    });

    mailboxMap.forEach((threadIds, mailboxId) => {
      this.socket.emitToMailbox(mailboxId, 'thread:starred', {
        thread_ids: threadIds,
      });
    });

    return { success: true };
  }

  async bulkUnstar(ids: number[]) {
    if (!ids?.length) return { success: false };

    const threads = await this.prisma.emailThread.findMany({
      where: { id: { in: ids } },
    });

    await this.prisma.emailThread.updateMany({
      where: { id: { in: ids }, is_deleted: false },
      data: { is_starred: false },
    });

    const mailboxMap = new Map<number, number[]>();
    threads.forEach((t) => {
      mailboxMap.set(t.mailbox_id, [
        ...(mailboxMap.get(t.mailbox_id) || []),
        t.id,
      ]);
    });

    mailboxMap.forEach((threadIds, mailboxId) => {
      this.socket.emitToMailbox(mailboxId, 'thread:unstarred', {
        thread_ids: threadIds,
      });
    });

    return { success: true };
  }

  /* ===============================
   THREADS BY BUSINESS
=============================== */
  async getThreadsByBusiness(params: {
    business_id: number;
    search?: string;
    status?: ThreadStatus;
    page?: number;
    limit?: number;
  }) {
    const { business_id, search, status, page = 1, limit = 10 } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.EmailThreadWhereInput = {
      business_id, // ✅ DIRECT FILTER
      is_deleted: false,
    };

    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { customer: { email: { contains: search, mode: 'insensitive' } } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const total = await this.prisma.emailThread.count({ where });

    const data = await this.prisma.emailThread.findMany({
      where,
      skip,
      take: limit,
      orderBy: { last_message_at: 'desc' },
      include: {
        customer: true,
        mailbox: true,
      },
    });

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
