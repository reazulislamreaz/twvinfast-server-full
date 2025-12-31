import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { htmlToText } from 'html-to-text';
import { cleanEmailText } from '../../common/utils/clean-email-text';
import { isProfessionalHumanEmail } from '../utils/email-filter';
import { normalizeReferences } from 'src/common/utils/normalizeReferences';

import getNameFromEmail from 'src/config/getNameFromEmail';
import { SocketService } from 'src/socket/socket.service';

/* ===============================
   🔧 SIGNATURE STRIPPER
=============================== */
function stripSignature(text: string): string {
  const patterns = [
    /\n--\s*\n[\s\S]*$/i,
    /\nRegards[\s\S]*$/i,
    /\nBest regards[\s\S]*$/i,
    /\nThanks[\s\S]*$/i,
    /\nThank you[\s\S]*$/i,
    /\nSincerely[\s\S]*$/i,
  ];

  for (const p of patterns) {
    if (p.test(text)) return text.replace(p, '').trim();
  }
  return text.trim();
}

@Injectable()
export class ImapSyncService implements OnModuleInit, OnModuleDestroy {
  private logger = new Logger('IMAP-SYNC');
  private clients = new Map<number, ImapFlow>();
  private syncing = new Set<number>();
  private lastSyncAt = new Map<number, number>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly socket: SocketService,
  ) {}

  /* ================= INIT ================= */

  async onModuleInit() {
    this.logger.log('🚀 IMAP Sync Engine Started');

    const mailboxes = await this.prisma.mailbox.findMany();
    for (const box of mailboxes) {
      // 🔧 FIX: one mailbox fail → server safe
      this.startMailbox(box).catch(() => null);
    }
  }

  async onModuleDestroy() {
    for (const client of this.clients.values()) {
      await client.logout().catch(() => null);
    }
  }

  /* ================= CONNECT ================= */

  private async startMailbox(box: any) {
    if (!box.imap_host || !box.imap_port || !box.imap_password) return;

    const client = new ImapFlow({
      host: box.imap_host,
      port: box.imap_port,
      secure: true,
      auth: {
        user: box.email_address,
        pass: box.imap_password,
      },
      tls: { rejectUnauthorized: false },
    });

    client.on('exists', () => {
      setTimeout(() => this.syncInbox(box.id, true), 1500);
    });

    // 🔧 FIX: log error but do NOT crash
    client.on('error', (err) => {
      this.logger.warn(`IMAP error mailbox=${box.id}: ${err.message}`);
      this.reconnect(box);
    });

    client.on('close', () => this.reconnect(box));

    // 🔧 FIX: critical try/catch
    try {
      await client.connect();
      await client.mailboxOpen('INBOX');
    } catch (err: any) {
      this.logger.error(
        `❌ IMAP connect failed mailbox=${box.id}`,
        err.message,
      );
      return; // 🔥 server stays alive
    }

    this.clients.set(box.id, client);
    await this.syncInbox(box.id, true);

    this.logger.log(`✅ IMAP Connected → ${box.email_address}`);
  }

  private reconnect(box: any) {
    setTimeout(() => {
      // 🔧 FIX: safe reconnect
      this.startMailbox(box).catch(() => null);
    }, 30_000);
  }

  /* ================= HEALTH ================= */

  @Cron(CronExpression.EVERY_30_SECONDS)
  async ensureHealthyConnections() {
    const mailboxes = await this.prisma.mailbox.findMany();

    for (const box of mailboxes) {
      try {
        const client = this.clients.get(box.id);
        if (!client || !client.usable) {
          await this.startMailbox(box);
        } else {
          await this.syncInbox(box.id);
        }
      } catch {
        // 🔧 FIX: Cron never crashes server
        continue;
      }
    }
  }

  /* ================= SYNC ================= */

  async syncInbox(mailboxId: number, force = false) {
    const now = Date.now();
    const last = this.lastSyncAt.get(mailboxId) || 0;

    if (!force && now - last < 20_000) return;
    if (this.syncing.has(mailboxId)) return;

    this.lastSyncAt.set(mailboxId, now);
    this.syncing.add(mailboxId);

    try {
      const box = await this.prisma.mailbox.findUnique({
        where: { id: mailboxId },
      });

      const client = this.clients.get(mailboxId);
      if (!box || !client) return;

      const status = await client.status('INBOX', { messages: true });
      // const start = Math.max((status.messages ?? 1) - 9, 1);

      const LIMIT = 3;
      const start = Math.max((status.messages ?? 1) - (LIMIT - 1), 1);

      for await (const msg of client.fetch(`${start}:${status.messages}`, {
        uid: true,
        source: true,
      })) {
        await this.processEmail(box, msg);
      }
    } finally {
      this.syncing.delete(mailboxId);
    }
  }

  /* ================= PROCESS ================= */

  private async processEmail(box: any, msg: any) {
    const uid = Number(msg.uid);
    if (!uid) return;

    const parsed = await simpleParser(msg.source);
    const from = parsed.from?.value?.[0]?.address?.toLowerCase();
    if (!from) return;

    const { isHuman } = isProfessionalHumanEmail(from);
    if (!isHuman) return;

    const subject = parsed.subject || '(no subject)';
    const rawHtml =
      typeof parsed.html === 'string'
        ? parsed.html
        : parsed.html?.toString() || '';

    let text =
      htmlToText(rawHtml, {
        wordwrap: false,
        selectors: [
          { selector: 'img', format: 'skip' },
          { selector: 'a', options: { ignoreHref: true } },
        ],
      }) ||
      parsed.text ||
      '';

    text = cleanEmailText(text);
    text = stripSignature(text);

    const body_text = text;

    const senderName = parsed.from?.value?.[0]?.name || getNameFromEmail(from);

    const customer = await this.prisma.customer.upsert({
      where: {
        business_email_unique: {
          business_id: box.business_id,
          email: from,
        },
      },
      update: { last_contact_at: new Date() },
      create: {
        business_id: box.business_id,
        email: from,
        name: senderName,
        source: 'INBOUND_EMAIL',
        last_contact_at: new Date(),
      },
    });

    let thread = await this.prisma.emailThread.findFirst({
      where: { mailbox_id: box.id, customer_id: customer.id },
    });

    if (thread) {
      console.log(`📨 Same thread mail received → thread_id=${thread.id}`);
    }

    if (!thread) {
      thread = await this.prisma.emailThread.create({
        data: {
          business_id: box.business_id,
          mailbox_id: box.id,
          customer_id: customer.id,
          subject,
          last_message_at: new Date(),
        },
      });
    }

    try {
      const email = await this.prisma.email.create({
        data: {
          business_id: box.business_id,
          user_id: box.user_id,
          mailbox_id: box.id,
          thread_id: thread.id,
          imap_uid: uid,
          message_id: parsed.messageId,
          in_reply_to: parsed.inReplyTo,
          references: normalizeReferences(parsed.references),
          from_address: from,
          subject,
          body_text,
          folder: 'INBOX',
          received_at: new Date(),
        },
      });

      this.socket.emitToMailbox(box.id, 'email:new', {
        mailbox_id: box.id,
        thread_id: thread.id,
        email_id: email.id,
        from,
        subject,
        snippet: body_text.slice(0, 120),
        received_at: email.received_at,
      });

      this.logger.log(`📩 IMAP saved → ${from}`);
    } catch (e: any) {
      if (e.code === 'P2002') return;
      throw e;
    }
  }
}
