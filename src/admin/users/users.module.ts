import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaService } from 'prisma/prisma.service';
import { CustomerController } from '../customers/customer.controller';
import { CustomerService } from '../customers/customer.service';

@Module({
  controllers: [UsersController, CustomerController],
  providers: [UsersService, PrismaService, CustomerService],
  exports: [UsersService, CustomerService],
})
export class UsersModule {}
