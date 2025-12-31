import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { ImapFlow } from 'imapflow';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailboxService {
  constructor(private prisma: PrismaService) {}

  // Create Mailbox
  async createMailbox(data: any) {
    return this.prisma.mailbox.create({ data });
  }

  // Update Mailbox
  async updateMailbox(id: number, data: any) {
    return this.prisma.mailbox.update({
      where: { id },
      data,
    });
  }

  // IMAP Test
  async testImapConnection(
    host: string,
    port: number,
    email: string,
    password: string,
  ) {
    const client = new ImapFlow({
      host,
      port,
      secure: port === 993,
      auth: { user: email, pass: password },
      tls: { rejectUnauthorized: false },
    });

    try {
      await client.connect();
      await client.logout();
      return { success: true, message: 'IMAP connection successful' };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }

  // SMTP Test
  async testSmtpConnection(
    host: string,
    port: number,
    email: string,
    password: string,
  ) {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user: email, pass: password },
      tls: { rejectUnauthorized: false },
    });

    try {
      await transporter.verify();
      return { success: true, message: 'SMTP connection successful' };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }

  // Get all mailboxes for a user
  async getUserMailboxes(user_id: number) {
    return this.prisma.mailbox.findMany({ where: { user_id } });
  }

  // Delete mailbox
  async deleteMailbox(id: number) {
    return this.prisma.mailbox.delete({ where: { id } });
  }
}
