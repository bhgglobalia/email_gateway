import {
  IsArray,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AttachmentMetaDto {
  @IsString()
  name: string;

  @IsNumber()
  size: number;

  @IsString()
  mimetype: string;
}

export class SendMailDto {
  @Type(() => Number)
  @IsNumber()
  mailboxId: number;

  @IsString()
  @IsOptional()
  subject?: string;

  @IsEmail()
  to: string;

  @IsString()
  @IsOptional()
  from?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AttachmentMetaDto)
  attachments?: AttachmentMetaDto[];
}
