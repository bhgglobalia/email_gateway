import { IsEmail, IsOptional, IsString } from 'class-validator';

export class OAuthRedirectQueryDto {
  @IsString()
  @IsOptional()
  clientId?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  // Alias accepted for Outlook flows: ?outlook=<email>
  @IsEmail()
  @IsOptional()
  outlook?: string;
}
