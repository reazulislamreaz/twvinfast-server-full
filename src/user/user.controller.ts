import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import {
  UpdateAdminMailboxDto,
  UpdateMailboxDto,
} from './dto/update-mailbox.dto';
import { JwtAuthGuard } from 'src/auth/strategies/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-self-profile.dto';
import { RolesGuard } from 'src/auth/strategies/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { PrismaService } from 'prisma/prisma.service';

@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly prisma: PrismaService,
  ) {}
  @Get('overview')
  getOverview() {
    return this.userService.getOverview();
  }
  // 🔥 Business based overview (business_id from token)
  @Get('business-overview')
  getBusinessOverview(@Req() req: any) {
    const businessId = req.user.business_id;
    return this.userService.getBusinessOverview(businessId);
  }
  @Get('recent-activities')
  getRecentActivities() {
    return this.userService.getRecentActivities();
  }
  // -----------------------------------------
  // USER: Get My Full Profile (ALL INFO)
  // -----------------------------------------
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Req() req) {
    const userId = Number(req.user.sub);
    return this.userService.getMyFullProfile(userId);
  }

  // -----------------------------------------
  // ADMIN: Get All Users
  // -----------------------------------------
  @Get()
  findAll() {
    return this.userService.findAll();
  }

  // -----------------------------------------
  // ADMIN: Get Single User
  // -----------------------------------------
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(Number(id));
  }

  // -----------------------------------------
  // ADMIN: Update User
  // -----------------------------------------
  @Patch('update/:id')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.userService.updateUser(Number(id), dto);
  }
  //User
  @UseGuards(JwtAuthGuard)
  @Patch('me/profile')
  updateMyProfile(@Req() req, @Body() dto: UpdateProfileDto) {
    const userId = Number(req.user.sub);
    return this.userService.updateMyProfile(userId, dto);
  }

  // -----------------------------------------
  // ADMIN: Delete User
  // -----------------------------------------
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.deleteUser(Number(id));
  }

  // =======================================================
  // USER SELF PROFILE → MAILBOX ACCESS & UPDATE
  // =======================================================

  // -----------------------------------------
  // USER: Get My Mailbox Info
  // -----------------------------------------
  @UseGuards(JwtAuthGuard)
  @Get('me/mailbox')
  getMyMailbox(@Req() req) {
    return this.userService.getMyMailboxes(req.user.sub);
  }

  // USER: Update My IMAP / SMTP Settings
  @UseGuards(JwtAuthGuard)
  @Patch('me/mailbox')
  updateMyMailbox(@Req() req, @Body() dto: UpdateMailboxDto) {
    const userId = Number(req.user.sub);
    3;
    return this.userService.upsertMyPrimaryMailbox(userId, dto);
  }

  // -----------------------------------------
  // ADMIN: Update User's IMAP / SMTP Settings
  // -----------------------------------------
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @Patch('super-admin/mailbox')
  upsertUserPrimaryMailboxByAdmin(
    @Req() req,
    @Body() dto: UpdateAdminMailboxDto,
  ) {
    const userId = Number(req.user.sub);
    return this.userService.upsertAdminPrimaryMailbox(userId, dto);
  }
}
