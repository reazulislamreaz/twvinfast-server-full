import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ThreadLabelService } from '../services/thread-label.service';

@Controller('thread-labels')
export class ThreadLabelController {
  constructor(private readonly labelService: ThreadLabelService) {}

  /* ===============================
     LABEL LIST (SIDEBAR)
  =============================== */
  @Get()
  getLabels(@Query('mailbox_id', ParseIntPipe) mailbox_id: number) {
    return this.labelService.getLabels(mailbox_id);
  }

  /* ===============================
  =============================== */
  @Post()
  createLabel(
    @Query('mailbox_id', ParseIntPipe) mailbox_id: number, // ✅ QUERY
    @Body('name') name: string,
  ) {
    return this.labelService.createLabel(mailbox_id, name);
  }

  /* ===============================
     UPDATE LABEL
  =============================== */
  @Patch(':id')
  updateLabel(
    @Param('id', ParseIntPipe) id: number,
    @Body('name') name: string,
  ) {
    return this.labelService.updateLabel(id, name);
  }

  /* ===============================
     DELETE LABEL
  =============================== */
  @Delete(':id')
  deleteLabel(@Param('id', ParseIntPipe) id: number) {
    return this.labelService.deleteLabel(id);
  }

  /* ===============================
     ASSIGN LABEL TO THREAD
  =============================== */
  @Post('assign')
  addLabelToThread(
    @Body('thread_id', ParseIntPipe) thread_id: number,
    @Body('label_id', ParseIntPipe) label_id: number,
  ) {
    return this.labelService.addLabelToThread(thread_id, label_id);
  }

  /* ===============================
     REMOVE LABEL FROM THREAD
  =============================== */
  @Delete('assign/:thread_id/:label_id')
  removeLabelFromThread(
    @Param('thread_id', ParseIntPipe) thread_id: number,
    @Param('label_id', ParseIntPipe) label_id: number,
  ) {
    return this.labelService.removeLabelFromThread(thread_id, label_id);
  }
}
