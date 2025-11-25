import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { EventsService } from './events.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import type { Request } from 'express';
import { CreateEventDto } from './dto/create-event.dto';

@Controller('events')
@SkipThrottle()
export class EventsController {
  constructor(private svc: EventsService) {}

  @Post()
  async create(@Body() payload: CreateEventDto, @Req() req: Request) {
    const secret = process.env.EVENTS_SHARED_SECRET;
    if (secret) {
      const provided = req.headers['x-events-secret'] as string | undefined;
      if (!provided || provided !== secret) {
        throw new UnauthorizedException('Invalid events secret');
      }
    }
    const normalized: Partial<import('src/entities/event.entity').Event> = {
      mailboxId: payload.mailboxId,
      direction: payload.direction,
      status: payload.status,
      timestamp: payload.timestamp ? new Date(payload.timestamp) : new Date(),
      provider: payload.provider || 'unknown',
      subject: payload.subject ?? undefined,
      sender: payload.sender ?? undefined,
      attachments: payload.attachments || [],
    };

    const saved = await this.svc.createNormalized(normalized);
    return { success: true, data: saved };
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async all(
    @Query('limit') limit = '100',
    @Query('provider') provider?: string,
    @Query('clientId') clientId?: string,
    @Query('date') date?: string,
    @Req() req?: Request,
  ) {
    const raw = Number(limit);
    const safe = Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 100;
    const clamped = Math.min(safe, 500);
    const data = await this.svc.list(clamped, provider, clientId, date);
    return { success: true, data };
  }
}
