import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Validate,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'EmailOrEmailArray', async: false })
export class EmailOrEmailArrayConstraint implements ValidatorConstraintInterface {
  validate(value: any) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (typeof value === 'string') {
      return emailRegex.test(value);
    }

    if (Array.isArray(value)) {
      return value.every((v) => emailRegex.test(v));
    }

    return false;
  }

  defaultMessage(_args: ValidationArguments) {
    return 'to must be a valid email or array of emails';
  }
}

export class SendSmtpMailDto {
  @IsInt()
  @Type(() => Number)
  mailbox_id: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  draft_id?: number;

  @IsNotEmpty()
  @Validate(EmailOrEmailArrayConstraint)
  to: string | string[];

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  html: string;
}
