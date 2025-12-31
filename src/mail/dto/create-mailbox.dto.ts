import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsInt,
} from 'class-validator';

export class CreateMailboxDto {
  @IsInt()
  business_id: number;

  @IsInt()
  user_id: number;

  @IsString()
  provider: string; // "SMTP" | "GMAIL" | "OUTLOOK" | "CUSTOM"

  @IsEmail()
  email_address: string;

  // IMAP
  @IsString()
  imap_host: string;

  @IsInt()
  imap_port: number;

  @IsString()
  imap_password: string;

  // SMTP
  @IsString()
  smtp_host: string;

  @IsInt()
  smtp_port: number;

  @IsString()
  smtp_password: string;
}
