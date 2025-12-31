import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class MailService {
  constructor(private prisma: PrismaService) {}

  async sendSMTPEmail(payload: {
    business_id: number;
    mailbox_id: number;
    user_id?: number;
    to: string[];
    subject: string;
    html: string;
    cc?: string[];
    bcc?: string[];
  }) {
    const mailbox = await this.prisma.mailbox.findUnique({
      where: { id: payload.mailbox_id },
    });

    if (!mailbox) {
      throw new InternalServerErrorException('Mailbox not found');
    }

    if (!mailbox.smtp_password) {
      throw new InternalServerErrorException('SMTP password missing');
    }

    try {
      /* ===============================
         SMTP TRANSPORT
      =============================== */

      const transporter = nodemailer.createTransport({
        host: mailbox.smtp_host,
        port: mailbox.smtp_port,
        secure: mailbox.smtp_port === 465,
        auth: {
          user: mailbox.email_address,
          pass: mailbox.smtp_password, // Gmail → App Password
        },
        tls: { rejectUnauthorized: false },
      });

      await transporter.sendMail({
        from: mailbox.email_address,
        to: payload.to,
        cc: payload.cc ?? [],
        bcc: payload.bcc ?? [],
        subject: payload.subject,
        html: payload.html,
      });

      /* ===============================
         THREAD (REUSE OR CREATE)
      =============================== */

      const thread = await this.ensureThread(
        payload.mailbox_id,
        payload.business_id,
        payload.subject,
      );

      /* ===============================
         SAVE SENT EMAIL
         (NO message_id, NO imap_uid)
      =============================== */

      const email = await this.prisma.email.create({
        data: {
          business_id: payload.business_id,
          mailbox_id: payload.mailbox_id,
          thread_id: thread.id,
          user_id: payload.user_id ?? null,

          from_address: mailbox.email_address,
          to_addresses: payload.to,
          cc_addresses: payload.cc ?? [],
          bcc_addresses: payload.bcc ?? [],

          subject: payload.subject,
          // body_html: payload.html,

          folder: 'SENT',
          sent_at: new Date(),
          is_read: true,
        },
      });

      return {
        success: true,
        email_id: email.id,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        error?.message || 'Failed to send email',
      );
    }
  }

  /* ===============================
     THREAD HANDLER
  =============================== */

  private async ensureThread(
    mailbox_id: number,
    business_id: number,
    subject: string,
  ) {
    let thread = await this.prisma.emailThread.findFirst({
      where: {
        mailbox_id,
        subject,
      },
    });

    if (!thread) {
      thread = await this.prisma.emailThread.create({
        data: {
          mailbox_id,
          business_id,
          subject,
          last_message_at: new Date(),
        },
      });
    } else {
      await this.prisma.emailThread.update({
        where: { id: thread.id },
        data: { last_message_at: new Date() },
      });
    }

    return thread;
  }
}
