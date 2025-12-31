import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';

import { MailboxService } from '../services/mailbox.service';
import { UpdateMailboxDto } from '../dto/update-mailbox.dto';
import { CreateMailboxDto } from '../dto/create-mailbox.dto';
import { TestConnectionDto } from '../dto/test-connection.dto';

@Controller('mailbox')
export class MailboxController {
  constructor(private readonly mailboxService: MailboxService) {}

  // Create mailbox
  @Post()
  create(@Body() body: CreateMailboxDto) {
    return this.mailboxService.createMailbox(body);
  }

  // Update mailbox
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateMailboxDto,
  ) {
    return this.mailboxService.updateMailbox(id, body);
  }

  // Test IMAP connection
  @Post('test-imap')
  testImap(@Body() body: TestConnectionDto) {
    return this.mailboxService.testImapConnection(
      body.host,
      body.port,
      body.email_address,
      body.password,
    );
  }

  // Test SMTP connection
  @Post('test-smtp')
  testSmtp(@Body() body: TestConnectionDto) {
    return this.mailboxService.testSmtpConnection(
      body.host,
      body.port,
      body.email_address,
      body.password,
    );
  }

  // Get mailboxes for a user
  @Get('user/:user_id')
  getByUser(@Param('user_id', ParseIntPipe) id: number) {
    return this.mailboxService.getUserMailboxes(id);
  }

  // Delete mailbox
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.mailboxService.deleteMailbox(id);
  }
}
