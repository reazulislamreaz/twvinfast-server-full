import {
  Controller,
  Get,
  Param,
  Patch,
  Body,
  UseGuards,
  UseInterceptors,
  Req,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { BusinessUpdateDto } from './dto/business-update.dto';
import { BusinessService } from './business.service';
import type { Express } from 'express';
import { mailMulterConfig } from 'src/config/multer.config';

@Controller('admin/business')
export class BusinessController {
  constructor(private businessService: BusinessService) {}

  // ✔ Company Profile
  @Get(':id')
  getBusiness(@Param('id') id: string) {
    return this.businessService.getBusiness(Number(id));
  }

  // ✔ Update Company Profile + Logo
  @UseGuards(AuthGuard('jwt'))
  @Patch('profile')
  @UseInterceptors(FileInterceptor('logo', mailMulterConfig))
  async updateCompanyProfile(
    @Req() req,
    @Body() dto: BusinessUpdateDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    // 🖼️ logo uploaded?
    if (file) {
      dto.logo_url = `/uploads/${
        file.mimetype.startsWith('image/') ? 'images' : 'files'
      }/${file.filename}`;
    }

    return this.businessService.updateBusiness(req.user.business_id, dto);
  }

  // ✔ Knowledge Base
  @Get(':id/knowledge-base')
  getKnowledge(@Param('id') id: string) {
    return this.businessService.getKnowledgeBase(Number(id));
  }

  // ✔ Customers
  @Get(':id/customers')
  getCustomers(@Param('id') id: string) {
    return this.businessService.getCustomers(Number(id));
  }

  // ✔ Customer Email History
  @Get('customer/:customerId/email-history')
  getCustomerHistory(@Param('customerId') cid: string) {
    return this.businessService.getCustomerEmailHistory(Number(cid));
  }

  // ✔ Integrations
  @Get(':id/integrations')
  getIntegrations(@Param('id') id: string) {
    return this.businessService.getIntegrations(Number(id));
  }
}
