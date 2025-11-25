import { IsOptional, IsString } from 'class-validator';

export class OAuthCallbackQueryDto {
  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  clientId?: string;
}
