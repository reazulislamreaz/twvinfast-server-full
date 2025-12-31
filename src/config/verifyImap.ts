import { BadRequestException } from '@nestjs/common';
import { ImapFlow } from 'imapflow';
import { UpdateMailboxDto } from 'src/user/dto/update-mailbox.dto';

export async function verifyImap(dto: UpdateMailboxDto) {
  const { imap_host, imap_port, email_address, imap_password } = dto;

  // 🔧 FIX 1: Hard validation (already good, kept as-is)
  if (!imap_host || !imap_port || !email_address || !imap_password) {
    throw new BadRequestException(
      'IMAP credentials missing (host, port, email, password required)',
    );
  }

  let client: ImapFlow | null = null;

  try {
    client = new ImapFlow({
      host: imap_host,
      port: imap_port,
      secure: true,
      auth: {
        user: email_address,
        pass: imap_password,
      },

      // 🔧 FIX 2: Timeouts (avoid stuck connection)
      socketTimeout: 10_000,
      greetingTimeout: 10_000,
    });

    await client.connect(); // 🔐 verify connection
    await client.logout(); // 🔧 FIX 3: clean close

    return { success: true };
  } catch (err: any) {
    throw new BadRequestException(`IMAP verification failed: ${err.message}`);
  } finally {
    // 🔧 FIX 4: safety cleanup (edge-case protection)
    try {
      await client?.logout();
    } catch {}
  }
}

export default verifyImap;
