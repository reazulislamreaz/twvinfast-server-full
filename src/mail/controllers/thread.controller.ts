import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { ThreadService } from '../services/thread.service';
import { ThreadStatus } from '@prisma/client';

@Controller('threads')
export class ThreadController {
  constructor(private readonly threadService: ThreadService) {}

  //
  @Get('business/:businessId')
  getThreadsByBusiness(
    @Param('businessId', ParseIntPipe) businessId: number,
    @Query('search') search?: string,
    @Query('status') status?: ThreadStatus,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    return this.threadService.getThreadsByBusiness({
      business_id: businessId,
      search,
      status,
      page: Number(page),
      limit: Number(limit),
    });
  }
  /* ===============================
     THREAD LIST
  =============================== */
  @Get()
  getThreads(
    @Query('mailbox_id', ParseIntPipe) mailbox_id: number,
    @Query('folder') folder?: string,
    @Query('search') search?: string,
    @Query('status') status?: ThreadStatus,
    @Query('tag') tag?: string, // label_id
    @Query('sort') sort?: 'newest' | 'oldest',
    @Query('page') page = '1',
    @Query('limit') limit = '6',
  ) {
    return this.threadService.getThreadsByMailbox({
      mailbox_id,
      folder,
      search,
      status,
      tag: tag ? Number(tag) : undefined,
      sort,
      page: Number(page),
      limit: Number(limit),
    });
  }

  /* ===============================
     SIDEBAR COUNTS
  =============================== */
  @Get('counts')
  getCounts(@Query('mailbox_id', ParseIntPipe) mailbox_id: number) {
    return this.threadService.getThreadCounts(mailbox_id);
  }

  /* ===============================
     SINGLE THREAD
  =============================== */
  @Get(':id')
  getThread(@Param('id', ParseIntPipe) id: number) {
    return this.threadService.getThreadWithEmails(id);
  }

  /* ===============================
     ARCHIVE / UNARCHIVE
  =============================== */
  @Patch(':id/archive')
  archive(@Param('id', ParseIntPipe) id: number) {
    return this.threadService.archiveThread(id);
  }

  @Patch(':id/unarchive')
  unarchive(@Param('id', ParseIntPipe) id: number) {
    return this.threadService.unarchiveThread(id);
  }

  /* ===============================
     READ / UNREAD
  =============================== */
  @Patch(':id/read')
  markRead(@Param('id', ParseIntPipe) id: number) {
    return this.threadService.markThreadRead(id);
  }

  @Patch(':id/unread')
  markUnread(@Param('id', ParseIntPipe) id: number) {
    return this.threadService.markThreadUnread(id);
  }

  @Patch(':id/trash')
  moveToTrash(@Param('id', ParseIntPipe) id: number) {
    return this.threadService.moveToTrash(id);
  }

  @Patch(':id/restore')
  restore(@Param('id', ParseIntPipe) id: number) {
    return this.threadService.restoreFromTrash(id);
  }
  @Patch('bulk/star')
  bulkStar(@Body('ids') ids: number[]) {
    return this.threadService.bulkStar(ids);
  }

  @Patch('bulk/unstar')
  bulkUnstar(@Body('ids') ids: number[]) {
    return this.threadService.bulkUnstar(ids);
  }
}
