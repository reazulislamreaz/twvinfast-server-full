import {
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleDestroy,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { createSmtpTransporterFromDb } from 'src/config/smtp.config';
import getNameFromEmail from 'src/config/getNameFromEmail';
import { SocketService } from 'src/socket/socket.service';
import axios from 'axios';

// 🔴 NEW IMPORTS (AI CREDITS)
import { AIActionType } from '@prisma/client';
import { consumeAiCredits } from 'src/config/ai-credit.util';

@Injectable()
export class SmtpService implements OnModuleDestroy {
  private logger = new Logger('SMTP');

  constructor(
    private prisma: PrismaService,
    private socketService: SocketService,
  ) {}

  // cache SMTP transporters per mailbox
  private transporters = new Map<number, any>();

  /* ================= SEND / REPLY / FORWARD ================= */
  async sendMail(payload: {
    mailbox_id: number;
    to: string | string[];
    cc?: string | string[];
    bcc?: string | string[];
    subject?: string;
    text?: string;
    reply_message_id?: number;
    forward_message_id?: number;
    draft_id?: number;
    files?: Express.Multer.File[];
  }) {
    try {
      /* ================= TO ================= */
      const toList = Array.isArray(payload.to) ? payload.to : [payload.to];
      if (!toList.length) throw new Error('Recipient missing');

      const customerEmail = toList[0].toLowerCase();

      /* ================= MAILBOX ================= */
      const mailbox = await this.prisma.mailbox.findUnique({
        where: { id: payload.mailbox_id },
      });
      if (!mailbox) throw new Error('Mailbox not found');

      /* ================= DRAFT LOAD ================= */
      let draftEmail: any = null;

      if (payload.draft_id) {
        draftEmail = await this.prisma.email.findUnique({
          where: { id: payload.draft_id },
        });
        if (!draftEmail) throw new Error('Draft not found');

        payload.subject ??= draftEmail.subject;
        payload.text ??= draftEmail.body_text ?? '';
      }

      /* ================= SMTP CHECK ================= */
      if (!mailbox.smtp_host || !mailbox.smtp_port || !mailbox.smtp_password) {
        return { success: false, error: 'SMTP config missing' };
      }

      /* ================= CUSTOMER ================= */
      const customer = await this.prisma.customer.upsert({
        where: {
          business_email_unique: {
            business_id: mailbox.business_id,
            email: customerEmail,
          },
        },
        update: { last_contact_at: new Date() },
        create: {
          business_id: mailbox.business_id,
          email: customerEmail,
          name: getNameFromEmail(customerEmail),
          source: 'OUTBOUND_EMAIL',
          last_contact_at: new Date(),
        },
      });

      /* ================= THREAD ================= */
      let thread = await this.prisma.emailThread.findFirst({
        where: { mailbox_id: mailbox.id, customer_id: customer.id },
      });

      if (!thread) {
        thread = await this.prisma.emailThread.create({
          data: {
            business_id: mailbox.business_id,
            mailbox_id: mailbox.id,
            customer_id: customer.id,
            subject: payload.subject ?? '(no subject)',
            last_message_at: new Date(),
          },
        });
      }

      /* ================= SUBJECT + BODY ================= */
      let subject = payload.subject ?? '(no subject)';
      let finalText = payload.text?.trim() || '(no message body)';

      /* ---------- REPLY ---------- */
      if (payload.reply_message_id) {
        const original = await this.prisma.email.findUnique({
          where: { id: payload.reply_message_id },
        });
        if (!original) throw new Error('Reply email not found');

        subject = original.subject?.startsWith('Re:')
          ? original.subject
          : `Re: ${original.subject}`;

        finalText += `

-----------------------
From: ${original.from_address}
Subject: ${original.subject}

${original.body_text ?? ''}`;
      }

      /* ---------- FORWARD ---------- */
      if (payload.forward_message_id) {
        const original = await this.prisma.email.findUnique({
          where: { id: payload.forward_message_id },
        });
        if (!original) throw new Error('Forward email not found');

        subject = original.subject?.startsWith('Fwd:')
          ? original.subject
          : `Fwd: ${original.subject}`;

        finalText += `

---------- Forwarded message ----------
From: ${original.from_address}
Subject: ${original.subject}

${original.body_text ?? ''}`;
      }

      /* ================= SMTP SEND ================= */
      let transporter = this.transporters.get(mailbox.id);
      if (!transporter) {
        transporter = createSmtpTransporterFromDb({
          smtp_host: mailbox.smtp_host,
          smtp_port: mailbox.smtp_port,
          smtp_password: mailbox.smtp_password,
          email_address: mailbox.email_address,
        });
        this.transporters.set(mailbox.id, transporter);
      }

      const info: any = await Promise.race([
        transporter.sendMail({
          from: `"${mailbox.email_address}" <${mailbox.email_address}>`,
          to: toList,
          cc: payload.cc,
          bcc: payload.bcc,
          subject,
          text: finalText,
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('SMTP timeout')), 15000),
        ),
      ]);

      /* ================= SAVE EMAIL ================= */
      let email;

      if (draftEmail) {
        email = await this.prisma.email.update({
          where: { id: draftEmail.id },
          data: {
            subject,
            body_text: finalText,
            folder: 'SENT',
            sent_at: new Date(),
            message_id: info.messageId,
          },
        });
      } else {
        email = await this.prisma.email.create({
          data: {
            business_id: mailbox.business_id,
            mailbox_id: mailbox.id,
            user_id: mailbox.user_id,
            thread_id: thread.id,
            subject,
            from_address: mailbox.email_address,
            to_addresses: toList,
            cc_addresses: payload.cc
              ? Array.isArray(payload.cc)
                ? payload.cc
                : [payload.cc]
              : [],
            bcc_addresses: payload.bcc
              ? Array.isArray(payload.bcc)
                ? payload.bcc
                : [payload.bcc]
              : [],
            body_text: finalText,
            folder: 'SENT',
            sent_at: new Date(),
            message_id: info.messageId,
          },
        });
      }

      /* ================= THREAD UPDATE ================= */
      await this.prisma.emailThread.update({
        where: { id: thread.id },
        data: {
          last_message_at: new Date(),
          last_message_id: info.messageId,
        },
      });

      this.socketService.emit('thread:updated', {
        thread_id: thread.id,
        last_message_at: new Date(),
      });

      this.socketService.emit('email:sent', {
        mailbox_id: mailbox.id,
        thread_id: thread.id,
        email_id: email.id,
      });

      return {
        success: true,
        messageId: info.messageId,
        thread_id: thread.id,
      };
    } catch (err: any) {
      this.logger.error('sendMail failed', err.message);
      throw new InternalServerErrorException(err.message);
    }
  }

  /* ================= SAVE DRAFT ================= */
  async saveDraft(payload: {
    mailbox_id: number;
    subject?: string;
    text?: string;
    draft_id?: number;
    files?: Express.Multer.File[];
  }) {
    const mailbox = await this.prisma.mailbox.findUnique({
      where: { id: payload.mailbox_id },
    });

    if (!mailbox) throw new Error('Mailbox not found');

    const bodyText =
      typeof payload.text === 'string' && payload.text.trim()
        ? payload.text.trim()
        : '(no draft content)';

    let draft;

    if (payload.draft_id) {
      draft = await this.prisma.email.update({
        where: { id: payload.draft_id },
        data: {
          subject: payload.subject ?? '(no subject)',
          body_text: bodyText,
        },
      });

      await this.prisma.emailAttachment.deleteMany({
        where: { email_id: draft.id },
      });
    } else {
      draft = await this.prisma.email.create({
        data: {
          business_id: mailbox.business_id,
          mailbox_id: mailbox.id,
          user_id: mailbox.user_id,
          subject: payload.subject ?? '(no subject)',
          body_text: bodyText,
          folder: 'DRAFT',
        },
      });
    }

    if (payload.files?.length) {
      await this.prisma.emailAttachment.createMany({
        data: payload.files.map((file) => ({
          email_id: draft.id,
          file_name: file.originalname,
          file_path: `/uploads/${
            file.mimetype.startsWith('image/') ? 'images' : 'files'
          }/${file.filename}`,
          mime_type: file.mimetype,
          file_size: file.size,
        })),
      });
    }

    this.socketService.emit('draft:updated', {
      mailbox_id: mailbox.id,
      draft_id: draft.id,
      subject: draft.subject,
    });

    return {
      success: true,
      draft_id: draft.id,
      subject: draft.subject,
      body_text: draft.body_text,
    };
  }

  async onModuleDestroy() {
    for (const transporter of this.transporters.values()) {
      try {
        transporter.close?.();
      } catch {}
    }
  }

  /* ================= AI GENERATE EMAIL ================= */
  async generateEmail(payload: {
    prompt: string;
    organization_name: string;
    tone?: string;

    // 🔴 NEW
    business_id: number;
    user_id: number;
  }) {
    try {
      if (!payload.prompt || !payload.organization_name) {
        throw new Error('Prompt or organization name missing');
      }

      const finalPrompt = payload.tone
        ? `${payload.prompt}\n\nTone: ${payload.tone}`
        : payload.prompt;

      const response = await axios.post(
        'https://ai.replii.ca/api/v1/emails/generate',
        new URLSearchParams({
          body: finalPrompt,
          organization_name: payload.organization_name,
        }),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          timeout: 30000,
        },
      );

      const data = response.data;

      if (!data?.subject || !data?.email_body) {
        throw new Error('Invalid AI response');
      }

      // 🔴 AI CREDIT DEDUCT
      if (data?.token_usage?.total_tokens) {
        await consumeAiCredits({
          prisma: this.prisma,
          business_id: payload.business_id,
          user_id: payload.user_id,
          tokens: data.token_usage.total_tokens,
          category: data.category,
          route: 'mail/smtp/generate',
          model: 'twinfast-ai',
          action: AIActionType.REPLY_DRAFT,
        });
      }

      return {
        success: true,
        subject: data.subject,
        text: data.email_body,
        usage: data.token_usage ?? null,
      };
    } catch (err: any) {
      this.logger.error('AI generate failed', err.message);
      throw new InternalServerErrorException(
        err?.message || 'AI email generation failed',
      );
    }
  }

  /* ================= AI REPLY ================= */
  async generateReply(payload: {
    incoming_email: string;
    organization_name: string;

    // 🔴 NEW
    business_id: number;
    user_id: number;
  }) {
    try {
      const res = await axios.post('https://ai.replii.ca/reply', payload, {
        headers: { 'Content-Type': 'application/json' },
      });

      // 🔴 AI CREDIT DEDUCT
      if (res.data?.token_usage?.total_tokens) {
        await consumeAiCredits({
          prisma: this.prisma,
          business_id: payload.business_id,
          user_id: payload.user_id,
          tokens: res.data.token_usage.total_tokens,
          category: res.data.category,
          route: 'mail/smtp/reply',
          model: 'twinfast-ai',
          action: AIActionType.REPLY_DRAFT,
        });
      }

      this.socketService.emit('ai:reply-generated', {
        organization_name: payload.organization_name,
        preview: res.data?.generated_reply,
      });

      return res.data;
    } catch (error) {
      throw new InternalServerErrorException('Failed to generate AI reply');
    }
  }
}
