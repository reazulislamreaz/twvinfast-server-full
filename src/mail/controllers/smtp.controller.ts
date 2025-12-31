import {
  Controller,
  Post,
  Body,
  UploadedFiles,
  UseInterceptors,
  Req,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { SmtpService } from '../services/smtp.service';
import { mailMulterConfig } from 'src/config/multer.config';
import { GenerateReplyDto } from '../dto/generate-reply.dto';

@Controller('mail/smtp')
export class SmtpController {
  constructor(private readonly smtpService: SmtpService) {}

  /* ============ SEND MAIL ============ */
  @Post('send')
  @UseInterceptors(FilesInterceptor('files', 10, mailMulterConfig))
  async sendMail(
    @Body('data') data: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const payload = JSON.parse(data);
    return this.smtpService.sendMail({
      ...payload,
      files,
    });
  }
  /* ============ SAVE DRAFT ============ */
  @Post('draft')
  @UseInterceptors(FilesInterceptor('files', 10, mailMulterConfig))
  async saveDraft(
    @Body('data') data: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const payload = JSON.parse(data);

    return this.smtpService.saveDraft({
      ...payload,
      files,
    });
  }

  //
  /* ============ AI GENERATE EMAIL ============ */
  // @Post('generate')
  // async generateEmail(
  //   @Body('prompt') prompt: string,
  //   @Body('organization_name') organizationName: string,
  //   @Body('tone') tone?: string,
  // ) {
  //   return this.smtpService.generateEmail({
  //     prompt,
  //     organization_name: organizationName,
  //     tone,
  //   });
  // }

  /* ============ AI GENERATE EMAIL ============ */
  @Post('generate')
  async generateEmail(
    @Req() req: any, // 🔥 NEW: auth context
    @Body('prompt') prompt: string,
    @Body('organization_name') organizationName: string,
    @Body('tone') tone?: string,
  ) {
    return this.smtpService.generateEmail({
      prompt,
      organization_name: organizationName,
      tone,

      // 🔥 NEW: AI credits tracking এর জন্য
      business_id: req.user.business_id,
      user_id: req.user.id,
    });
  }

  //replay mail
  // @Post('reply')
  // generateReply(@Body() dto: GenerateReplyDto) {
  //   return this.smtpService.generateReply(dto);
  // }
  // replay mail
  @Post('reply')
  generateReply(@Req() req: any, @Body() dto: GenerateReplyDto) {
    return this.smtpService.generateReply({
      ...dto,

      // 🔥 NEW: AI credits tracking এর জন্য
      business_id: req.user.business_id,
      user_id: req.user.id,
    });
  }
}
