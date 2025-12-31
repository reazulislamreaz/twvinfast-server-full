import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCompanyDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsString()
  address?: string;

  @IsString()
  website?: string;
}
