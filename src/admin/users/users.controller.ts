import { Controller, Get, Param, Patch, Body, Delete } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';

@Controller('admin/users')
export class UsersController {
  constructor(private users: UsersService) {}

  // ✔ Team users by business
  @Get('business/:businessId')
  getUsers(@Param('businessId') id: string) {
    return this.users.listUsers(Number(id));
  }

  // ✔ User AI Actions
  @Get(':userId/ai-actions')
  getAiActions(@Param('userId') id: string) {
    return this.users.getUserAIActions(Number(id));
  }

  // ✔ User hallucinations
  @Get(':userId/hallucinations')
  getHallucinations(@Param('userId') id: string) {
    return this.users.getUserHallucinations(Number(id));
  }

  // ✔ User AI analytics
  @Get(':userId/analytics')
  getAnalytics(@Param('userId') id: string) {
    return this.users.getUserAnalytics(Number(id));
  }

  // ⭐ UPDATE USER ROLE
  @Patch(':userId/update-role')
  updateRole(@Param('userId') id: string, @Body() dto: UpdateUserRoleDto) {
    return this.users.updateUserRole(Number(id), dto.role_id);
  }

  // ⭐ UPDATE USER STATUS
  @Patch(':userId/update-status')
  updateStatus(@Param('userId') id: string, @Body() dto: UpdateUserStatusDto) {
    return this.users.updateUserStatus(Number(id), dto.status);
  }

  // ⭐ DELETE USER
  @Delete(':userId')
  deleteUser(@Param('userId') id: string) {
    return this.users.deleteUser(Number(id));
  }


  // admin part
  
}
