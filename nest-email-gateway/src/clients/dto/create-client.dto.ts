import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateClientDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsString()
  @IsOptional()
  emailProvider?: string;

  @IsString()
  @IsOptional()
  domain?: string;
}
