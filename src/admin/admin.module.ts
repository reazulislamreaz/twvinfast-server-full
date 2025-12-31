import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { BusinessModule } from './business/business.module';
import { UsersModule } from './users/users.module';
import { SuperAdminSecurityController } from './super-admin-security.controller';
import { PrismaModule } from 'prisma/prisma.module';

// Submodules

@Module({
  imports: [
    BusinessModule,
    UsersModule,
    PrismaModule
    // TrainingModule,
    // CustomersModule,
    // OpportunitiesModule,
    // IntegrationsModule,
    // AiModule,
    // HallucinationModule,
  ],
  controllers: [AdminController,SuperAdminSecurityController],
  providers: [AdminService],
})
export class AdminModule {}
