import { IsInt, IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class CreatePortalDto {
  @IsNotEmpty()
  @IsString()
  @IsUrl({
    require_protocol: true,
    require_tld: false, // <— THIS allows localhost
  })
  returnUrl: string;
}

export class CreateCheckoutDto {
  @IsNotEmpty()
  @IsInt()
  planId: number;
}
