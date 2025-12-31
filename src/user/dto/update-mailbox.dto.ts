import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class UpdateMailboxDto {
  @IsOptional()
  @IsString()
  provider?: string | null;

  @IsOptional()
  @IsString()
  email_address?: string | null;

  @IsOptional()
  @IsString()
  imap_host?: string | null;

  @IsOptional()
  @IsNumber()
  imap_port?: number | null;

  @IsOptional()
  @IsString()
  smtp_host?: string | null;

  @IsOptional()
  @IsNumber()
  smtp_port?: number | null;

  @IsOptional()
  @IsString()
  imap_password?: string;

  @IsOptional()
  @IsString()
  smtp_password?: string;
  @IsOptional()
  @IsBoolean()
  is_ssl?: boolean | null;
}
export class UpdateAdminMailboxDto {
  @IsOptional()
  @IsString()
  provider?: string | null;

  @IsOptional()
  @IsString()
  email_address?: string | null;

  @IsOptional()
  @IsString()
  smtp_host?: string | null;

  @IsOptional()
  @IsNumber()
  smtp_port?: number | null;

  @IsOptional()
  @IsString()
  smtp_password?: string;
  @IsOptional()
  @IsBoolean()
  is_ssl?: boolean | null;
}
