import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { TwoFAService } from './twofa.service';
import { JwtAuthGuard } from '../strategies/jwt-auth.guard';

@Controller('auth/2fa')
export class TwoFAController {
  constructor(private readonly twoFAService: TwoFAService) {}

  // ------------------------------------
  // GET QR CODE
  // ------------------------------------
  @UseGuards(JwtAuthGuard)
  @Post('generate')
  generate(@Req() req) {
    return this.twoFAService.generate2FA(Number(req.user.sub));
  }

  // ------------------------------------
  // VERIFY CODE
  // ------------------------------------
  @UseGuards(JwtAuthGuard)
  @Post('verify')
  verify(@Req() req, @Body('code') code: string) {
    return this.twoFAService.verify2FA(Number(req.user.sub), code);
  }
}
