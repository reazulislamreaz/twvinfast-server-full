import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from 'src/user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { RefreshTokenStrategy } from './strategies/refresh-token.strategy';
import { PrismaService } from 'prisma/prisma.service';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './strategies/roles.guard';
import { JwtAuthGuard } from './strategies/jwt-auth.guard';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TwoFAService } from './2fa/twofa.service';
import { TwoFAController } from './2fa/twofa.controller';

@Module({
  imports: [
    UserModule,
    PassportModule,
    JwtModule.register({}),
    // ❗ We DO NOT set secrets here.
    // They are passed per-strategy to avoid conflicts
  ],

  controllers: [AuthController, TwoFAController],

  providers: [
    AuthService,
    PrismaService,
    AuthService,
    JwtStrategy,
    RolesGuard,
  TwoFAService,
    RefreshTokenStrategy, // Refresh Token Guard,

    // 1️⃣ FIRST: Global AuthGuard ('jwt')
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard, // <-- we will create this
    },

    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],

  exports: [AuthService],
})
export class AuthModule {}
