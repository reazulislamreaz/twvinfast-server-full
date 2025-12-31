import { IsString, IsNotEmpty } from 'class-validator';

export class GenerateReplyDto {
  @IsString()
  @IsNotEmpty()
  incoming_email: string;

  @IsString()
  @IsNotEmpty()
  organization_name: string;
}
