import { BadRequestException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { UpdateMailboxDto } from 'src/user/dto/update-mailbox.dto';

export async function verifySmtp(dto: UpdateMailboxDto) {
  if (
    !dto.smtp_host ||
    !dto.smtp_port ||
    !dto.smtp_password ||
    !dto.email_address
  ) {
    throw new BadRequestException(
      'SMTP credentials missing (host, port, email, password required)',
    );
  }

  // 🔧 FIX 1: derive secure strictly from port (NOT user input)
  const secure = Number(dto.smtp_port) === 465 ? true : false;

  // 🔧 FIX 2: validate allowed ports early
  if (![465, 587].includes(Number(dto.smtp_port))) {
    throw new BadRequestException(
      'Invalid SMTP port. Use 465 (SSL) or 587 (STARTTLS)',
    );
  }

  try {
    const transporter = nodemailer.createTransport({
      host: dto.smtp_host,
      port: Number(dto.smtp_port),
      secure, // ✅ FIXED
      auth: {
        user: dto.email_address,
        pass: dto.smtp_password,
      },
      requireTLS: !secure, // 🔧 FIX 3: STARTTLS for 587
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 10_000,
    });

    await transporter.verify();
    return { success: true };
  } catch (err: any) {
    throw new BadRequestException(`SMTP verification failed: ${err.message}`);
  }
}

export default verifySmtp;
