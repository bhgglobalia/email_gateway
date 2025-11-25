import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { MailService } from './mail.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import type { File as MulterFile } from 'multer';
import type { Request } from 'express';
import { SendMailDto } from './dto/send-mail.dto';

@Controller('mail')
export class MailController {
  constructor(private svc: MailService) {}

  @UseGuards(JwtAuthGuard)
  @Post('send')
  @UseInterceptors(FileInterceptor('attachment'))
  async send(
    @Body() dto: SendMailDto,
    @Req() req: Request,
    @UploadedFile() file?: MulterFile,
  ) {
    let data: SendMailDto & {
      attachment?: { name: string; size: number; mimetype: string };
    } = dto as any;
    if (!data || Object.keys(data).length === 0) {
      data = req.body;
    }
    if (file) {
      const att = {
        name: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
      };
      if (Array.isArray((data as any).attachments)) {
        (data as any).attachments.push(att);
      } else if ((data as any).attachment) {
        (data as any).attachments = [(data as any).attachment, att];
        delete (data as any).attachment;
      } else {
        (data as any).attachments = [att];
      }
    }
    const job = await this.svc.enqueueSend(data);
    return { success: true, jobId: job.id };
  }

  @UseGuards(JwtAuthGuard)
  @Get('queue')
  async queue() {
    const q = await this.svc.listQueue();
    return { success: true, data: q };
  }
}
