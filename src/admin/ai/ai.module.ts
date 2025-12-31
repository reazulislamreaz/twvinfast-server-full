import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  controllers: [AiController],
  providers: [AiService, PrismaService],
})
export class AiModule {}
