import { IsString, IsOptional, IsEmail, IsInt } from 'class-validator';

export class UpdateMailboxDto {
  @IsOptional()
  @IsString()
  provider?: string;

  @IsOptional()
  @IsEmail()
  email_address?: string;

  @IsOptional()
  @IsString()
  imap_host?: string;

  @IsOptional()
  @IsInt()
  imap_port?: number;

  @IsOptional()
  @IsString()
  imap_password?: string;

  @IsOptional()
  @IsString()
  smtp_host?: string;

  @IsOptional()
  @IsInt()
  smtp_port?: number;

  @IsOptional()
  @IsString()
  smtp_password?: string;
}
