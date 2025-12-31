import {
  Body,
  Controller,
  Patch,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { JwtAuthGuard } from 'src/auth/strategies/jwt-auth.guard';
import { RolesGuard } from 'src/auth/strategies/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';

/**
 * 🔐 SUPER ADMIN SECURITY CONTROLLER
 * - Force 2FA for all users & admins
 * - Only SUPER_ADMIN can access
 */
@Controller('super-admin/security')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
export class SuperAdminSecurityController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * ----------------------------------------
   * FORCE / UNFORCE 2FA FOR ALL USERS
   * ----------------------------------------
   * Body:
   * {
   *   "force": true | false
   * }
   */
  @Patch('force-2fa')
  async force2FAForAll(@Body('force') force: boolean) {
    if (typeof force !== 'boolean') {
      throw new BadRequestException('force must be true or false');
    }

    const setting = await this.prisma.securitySetting.upsert({
      where: {
        id: 1, // 👈 fixed global row
      },
      update: {
        force2FAForAll: force,
      },
      create: {
        id: 1,
        force2FAForAll: force,
      },
    });

    return {
      message: force
        ? '2FA has been enforced for all users'
        : '2FA enforcement has been disabled',
      setting,
    };
  }


}
