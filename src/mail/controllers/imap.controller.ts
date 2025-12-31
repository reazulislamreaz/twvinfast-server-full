import { Controller, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ImapSyncService } from '../services/imap-sync.service';

@Controller('mail')
export class ImapController {
  constructor(private readonly imapSyncService: ImapSyncService) {}

  // 🔹 Manual sync trigger (Admin / Debug / Button click)
  @Post('sync/:mailbox_id')
  async manualSync(@Param('mailbox_id', ParseIntPipe) mailbox_id: number) {
    await this.imapSyncService.syncInbox(mailbox_id);

    return {
      success: true,
      mailbox_id,
      message: 'Mailbox synced successfully',
    };
  }
}
