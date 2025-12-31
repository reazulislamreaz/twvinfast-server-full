import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class TwoFAService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  // ------------------------------------
  // STEP 1: GENERATE QR + SECRET
  // ------------------------------------
  async generate2FA(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) throw new BadRequestException('User not found');

    const secret = speakeasy.generateSecret({
      name: `Twvinfast (${user.email})`,
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFASecret: secret.base32,
      },
    });

    const qrCode = await QRCode.toDataURL(secret.otpauth_url as string);

    return {
      qrCode,
      manualKey: secret.base32,
    };
  }

  // ------------------------------------
  // STEP 2: VERIFY & ENABLE 2FA
  // ------------------------------------
  async verify2FA(userId: number, token: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user || !user.twoFASecret) {
      throw new BadRequestException('2FA not initialized');
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFASecret,
      encoding: 'base32',
      token,
      window: 1,
    });

    if (!verified) {
      throw new BadRequestException('Invalid 2FA code');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFAEnabled: true },
    });

    // ✅ FULL ACCESS TOKEN AFTER SUCCESS
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role.name,
      business_id: user.business_id ?? null,
      twoFARequired: false,
      twoFAVerified: true,
    };

    const accessToken = await this.jwt.signAsync(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: '1d',
    });

    const refreshToken = await this.jwt.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '7d',
    });

    return {
      message: '2FA enabled successfully',
      user,
      accessToken,
      refreshToken,
    };
  }
}
