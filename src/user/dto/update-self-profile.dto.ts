import { IsOptional, IsString, IsEmail, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  email_signature?: string;

  @IsOptional()
  @MinLength(6)
  password?: string;
}
