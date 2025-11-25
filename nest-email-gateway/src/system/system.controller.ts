import { Controller, Get, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Mailbox } from 'src/entities/mailbox.entity';
import { Repository } from 'typeorm';

@Controller('system')
@UseGuards(JwtAuthGuard)
export class SystemController {
  constructor(@InjectRepository(Mailbox) private repo: Repository<Mailbox>) {}

  @Get('status')
  async status() {
    const mailboxes = await this.repo.find();
    const mb = mailboxes.map((m) => ({
      id: m.id,
      email: m.email,
      provider: m.provider,
      tokenExpiresAt: m.tokenExpiresAt,
    }));
    return {
      success: true,
      data: {
        db: true,
        worker: true,
        mailboxes: mb,
      },
    };
  }
}
