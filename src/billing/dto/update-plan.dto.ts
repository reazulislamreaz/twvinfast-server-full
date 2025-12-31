import {
  IsOptional,
  IsString,
  IsBoolean,
  IsNumber,
  IsObject,
  Min,
} from 'class-validator';

export class UpdatePlanDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  email_limit?: number;

  @IsOptional()
  @IsNumber()
  user_limit?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  ai_credits?: number;

  @IsOptional()
  @IsObject()
  features?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  // ❌ Intentionally excluded:
  // amount
  // interval
  // stripe_price_id
}
