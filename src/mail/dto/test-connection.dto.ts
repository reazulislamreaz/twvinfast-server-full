import { IsEmail, IsInt, IsString } from 'class-validator';

export class TestConnectionDto {
  @IsEmail()
  email_address: string;

  @IsString()
  host: string;

  @IsInt()
  port: number;

  @IsString()
  password: string;
}
