import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { PrismaModule } from 'prisma/prisma.module';
import { UserController } from './user.controller';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  exports: [UserService],

  controllers: [UserController],
  providers: [UserService, PrismaService],

  imports: [PrismaModule],
})
export class UserModule {}
