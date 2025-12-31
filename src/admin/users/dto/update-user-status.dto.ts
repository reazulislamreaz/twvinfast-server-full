import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateUserStatusDto {
  @IsNotEmpty()
  @IsString()
  status: string; // ACTIVE | SUSPENDED | DISABLED
}
