import { IsString } from 'class-validator';

export class UploadAiDocDto {
  @IsString()
  file_name: string;
}
