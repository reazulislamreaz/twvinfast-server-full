import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { AiService } from './ai.service';

@Controller('admin/ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  /* ===============================
     1️⃣ Upload / Create AI metadata
  =============================== */
  @Post('documents')
  upload(@Body() body: any, @Req() req) {
    return this.aiService.createDocument(body, req.user);
  }

  /* ===============================
     2️⃣ Get all AI documents
  =============================== */
  @Get('documents')
  getAll(@Req() req) {
    return this.aiService.getDocuments(req.user.business_id);
  }

  /* ===============================
     3️⃣ Delete AI document
  =============================== */
  // 3️⃣ DELETE (organization_name + file_name from BODY)
  @Delete('documents')
  delete(@Body() body: any, @Req() req) {
    return this.aiService.deleteByOrgAndFile(body, req.user);
  }
}
