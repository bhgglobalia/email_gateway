import { Injectable } from '@nestjs/common';
import { WsGateway } from '../ws/ws.gateway';
import { InjectRepository } from '@nestjs/typeorm';
import { Event } from 'src/entities/event.entity';
import { Repository } from 'typeorm';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event) private repo: Repository<Event>,
    private ws: WsGateway,
  ) {}

  async createNormalized(normalized: Partial<Event>) {
    const e = this.repo.create(normalized as Event);
    const saved = await this.repo.save(e as Event);
    this.ws.emit('email_event', { ...saved, id: String(saved.id) });
    return saved;
  }

  async list(
    limit = 100,
    provider?: string,
    clientId?: string,
    date?: string,
    skip: number = 0,
    cursor?: string,
  ) {
    const safeLimit = Number.isFinite(Number(limit)) && Number(limit) > 0
      ? Math.floor(Number(limit))
      : 100;
    const clamped = Math.min(safeLimit, 500);
    const safeSkip = Number.isFinite(Number(skip)) && Number(skip) >= 0
      ? Math.floor(Number(skip))
      : 0;
    const clampedSkip = Math.min(safeSkip, 10000);
    let qb = this.repo
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.mailbox', 'mailbox')
      .leftJoinAndSelect('mailbox.client', 'client')
      .orderBy('event.timestamp', 'DESC')
      .take(clamped)
      .skip(clampedSkip);
    if (provider) {
      qb = qb.andWhere('TRIM(LOWER(event.provider)) = TRIM(LOWER(:provider))', {
        provider,
      });
    }

    if (clientId) {
      qb = qb.andWhere('mailbox.clientId = :clientId', { clientId });
    }
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      qb = qb.andWhere('event.timestamp >= :start AND event.timestamp < :end', {
        start,
        end,
      });
    }
    if (cursor) {
      const cursorDate = new Date(cursor);
      if (!isNaN(cursorDate.getTime())) {
        qb = qb.andWhere('event.timestamp < :cursor', { cursor: cursorDate });
      }
    }
    return qb.getMany();
  }
}