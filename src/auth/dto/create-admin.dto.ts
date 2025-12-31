import { IsEmail, IsNotEmpty, MinLength, IsString } from 'class-validator';

export class AdminSignupDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsNotEmpty()
  companyName: string;
}
