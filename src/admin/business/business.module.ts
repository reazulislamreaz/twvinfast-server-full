import { Module } from '@nestjs/common';
import { BusinessController } from './business.controller';
import { PrismaService } from 'prisma/prisma.service';
import { BusinessService } from './business.service';

@Module({
  controllers: [BusinessController],
  providers: [BusinessService, PrismaService],
  exports: [BusinessService],
})
export class BusinessModule {}
