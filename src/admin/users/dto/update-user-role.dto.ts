import { IsNotEmpty, IsNumber } from 'class-validator';

export class UpdateUserRoleDto {
  @IsNotEmpty()
  @IsNumber()
  role_id: number; // FK -> Role.id
}
