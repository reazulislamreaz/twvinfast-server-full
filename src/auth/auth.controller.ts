import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AdminSignupDto } from './dto/create-admin.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { Public } from './decorators/public.decorator';

import { ChangePasswordDto, LoginDto } from './dto/registerUser.dto';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './strategies/roles.guard';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  // -----------------------------------------------------------
  // ADMIN SIGNUP → BUSINESS AUTO-CREATE
  // -----------------------------------------------------------
  @Public()
  @Post('admin-signup')
  adminSignup(@Body() dto: AdminSignupDto) {
    return this.auth.adminSignup(dto);
  }

  // -----------------------------------------------------------
  // EMPLOYEE SIGNUP (requires Admin)
  // -----------------------------------------------------------
  // // !need to use
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @Post('employee')
  createEmployee(@Req() req, @Body() dto: CreateUserDto) {
    return this.auth.createEmployee(req.user.sub, dto);
  }

  // -----------------------------------------------------------
  // LOGIN
  // -----------------------------------------------------------
  @Public()
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  // -----------------------------------------------------------
  // REFRESH TOKEN
  // -----------------------------------------------------------
  @Public()
  @UseGuards(AuthGuard('jwt-refresh'))
  @Post('refresh')
  refresh(@Req() req) {
    return this.auth.refreshTokens(req.user.sub, req.user.refreshToken);
  }

  // -----------------------------------------------------------
  // CHANGE PASSWORD (Authenticated users only)
  // -----------------------------------------------------------
  @UseGuards(AuthGuard('jwt'))
  @Post('change-password')
  changePassword(@Req() req, @Body() dto: ChangePasswordDto) {
    return this.auth.changePassword(req.user.sub, dto);
  }

  // -----------------------------------------------------------
  // LOGOUT
  // -----------------------------------------------------------
  @UseGuards(AuthGuard('jwt'))
  @Post('logout')
  logout(@Req() req) {
    return this.auth.logout(req.user.sub);
  }

  // -----------------------------------------------------------
  // PROTECTED TESTING ROUTE
  // -----------------------------------------------------------
  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  me(@Req() req) {
    return { message: 'Protected route success', user: req.user };
  }

  // -----------------------------------------------------------
  // ADMIN ONLY ROUTE
  // -----------------------------------------------------------
  @UseGuards(AuthGuard('jwt'))
  @Roles('ADMIN')
  @Get('admin')
  adminRoute() {
    return 'Admin Access Granted';
  }

  // -----------------------------------------------------------
  // SUPER ADMIN ONLY ROUTE
  // -----------------------------------------------------------
  @UseGuards(AuthGuard('jwt'))
  @Roles('SUPER_ADMIN')
  @Get('super-admin')
  superAdminRoute() {
    return 'Super Admin Access Granted';
  }
  // UPDATE NOTIFICATION SETTINGS (Login alert & New mail alert)
  // -----------------------------------------------------------
  @UseGuards(AuthGuard('jwt'))
  @Post('notification')
  updateNotification(
    @Req() req,
    @Body()
    body: {
      login_alert_enabled?: boolean;
      email_alert_enabled?: boolean;
    },
  ) {
    return this.auth.updateNotificationSettings(req.user.sub, body);
  }
}
