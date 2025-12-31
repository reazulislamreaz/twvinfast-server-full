import { IsOptional, IsString, IsEmail, IsUrl } from 'class-validator';

export class BusinessUpdateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsUrl()
  website?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  description?: string;

  // 🖼️ Company Logo (set from multer, not user input)
  @IsOptional()
  @IsString()
  logo_url?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
