import * as nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 🔐 SuperAdmin SMTP transporter
 * Uses mailbox table (id = 1)
 */
export const createSuperAdminSmtpTransporter = async () => {
  const mailbox = await prisma.mailbox.findUnique({
    where: { id: 1 }, // ✅ SuperAdmin mailbox
  });

  if (
    !mailbox ||
    !mailbox.smtp_host ||
    !mailbox.smtp_port ||
    !mailbox.smtp_password ||
    !mailbox.email_address
  ) {
    throw new Error('SuperAdmin SMTP config missing in mailbox');
  }

  return nodemailer.createTransport({
    host: mailbox.smtp_host,
    port: mailbox.smtp_port,
    secure: mailbox.smtp_port === 465, 
    auth: {
      user: mailbox.email_address,
      pass: mailbox.smtp_password,
    },
  });
};

