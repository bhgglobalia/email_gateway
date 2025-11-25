import {
  IsArray,
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateEventDto {
  @IsNumber()
  mailboxId: number;

  @IsIn(['inbound', 'outbound'])
  direction: 'inbound' | 'outbound';

  @IsString()
  status: string;

  @IsDateString()
  @IsOptional()
  timestamp?: string;

  @IsString()
  @IsOptional()
  provider?: string;

  @IsString()
  @IsOptional()
  subject?: string;

  @IsString()
  @IsOptional()
  sender?: string;

  @IsArray()
  @IsOptional()
  attachments?: Array<{ name: string; size: number; mimetype: string }>;
}
