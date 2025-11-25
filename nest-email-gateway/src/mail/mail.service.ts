import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Mailbox } from 'src/entities/mailbox.entity';
import { Repository } from 'typeorm';
import { EventsService } from '../events/events.service';
import { SendMailDto } from './dto/send-mail.dto';
import { Queue, Worker, Job, QueueEvents, JobsOptions } from 'bullmq';
import Redis from 'ioredis';

type AttachmentMeta = { name: string; size: number; mimetype: string };
type SendJobPayload = SendMailDto & { attachment?: AttachmentMeta };

const SEND_QUEUE_NAME = 'send-email';

@Injectable()
export class MailService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('MailService');
  private redis: Redis;
  private sendQueue: Queue<SendJobPayload>;
  private sendWorker: Worker<SendJobPayload>;
  private sendQueueEvents: QueueEvents;

  constructor(
    @InjectRepository(Mailbox) private repo: Repository<Mailbox>,
    private events: EventsService,
    @Inject('REDIS_CLIENT') private readonly redisClient: Redis,
  ) {}

  async onModuleInit() {
    this.redis = this.redisClient;
    this.sendQueue = new Queue<SendJobPayload>(SEND_QUEUE_NAME, {
      connection: this.redis,
    });
    this.sendQueueEvents = new QueueEvents(SEND_QUEUE_NAME, {
      connection: this.redis,
    });
    this.sendWorker = new Worker<SendJobPayload>(
      SEND_QUEUE_NAME,
      async (job: Job<SendJobPayload>) => {
        await this.processSend(job.data);
      },
      {
        connection: this.redis,
      },
    );
    this.logger.log('BullMQ queue/worker initialized for outbound emails');
  }

  async onModuleDestroy() {
    if (this.sendQueue) await this.sendQueue.close();
    if (this.sendWorker) await this.sendWorker.close();
    if (this.sendQueueEvents) await this.sendQueueEvents.close();
    // Do not quit the shared Redis client here; it's managed by the provider.
  }

  async enqueueSend(payload: SendJobPayload): Promise<{ id: string }> {
    const opts: JobsOptions = {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: true,
      removeOnFail: 100,
    };
    const job = await this.sendQueue.add('send', payload, opts);
    return { id: job.id as string };
  }

  async listQueue(): Promise<
    Array<{ id: string; name: string; state: string }>
  > {
    const jobs = await this.sendQueue.getJobs([
      'waiting',
      'delayed',
      'active',
      'failed',
    ]);
    return jobs.map((j) => ({
      id: String(j.id),
      name: j.name,
      state: j.finishedOn
        ? 'completed'
        : j.failedReason
          ? 'failed'
          : j.processedOn
            ? 'active'
            : 'waiting',
    }));
  }

  private async processSend(payload: SendJobPayload) {
    const mailbox = await this.repo.findOne({
      where: { id: payload.mailboxId },
    });
    const now = new Date();
    try {
      const isExpired =
        !mailbox || (mailbox.tokenExpiresAt && mailbox.tokenExpiresAt < now);
      if (isExpired) {
        const failPayload: Partial<import('src/entities/event.entity').Event> =
          {
            mailboxId: payload.mailboxId,
            direction: 'outbound',
            status: 'error',
            timestamp: now,
            provider: mailbox?.provider || 'unknown',
            subject: payload.subject,
            sender: payload.from || mailbox?.email,
            attachments:
              (payload as any).attachments ||
              (payload.attachment ? [payload.attachment] : []),
          };
        if (mailbox) (failPayload as any).mailbox = mailbox;
        await this.events.createNormalized(failPayload);
        return;
      }

      const okPayload: Partial<import('src/entities/event.entity').Event> = {
        mailboxId: payload.mailboxId,
        direction: 'outbound',
        status: 'ok',
        timestamp: new Date(),
        provider: mailbox?.provider || 'unknown',
        subject: payload.subject,
        sender: payload.from || mailbox?.email,
        attachments:
          (payload as any).attachments ||
          (payload.attachment ? [payload.attachment] : []),
      };
      if (mailbox) (okPayload as any).mailbox = mailbox;
      await this.events.createNormalized(okPayload);
    } catch (e) {
      const errPayload: Partial<import('src/entities/event.entity').Event> = {
        mailboxId: payload.mailboxId,
        direction: 'outbound',
        status: 'error',
        timestamp: now,
        provider: mailbox?.provider || 'unknown',
        subject: payload.subject,
        sender: payload.from || mailbox?.email,
        attachments:
          (payload as any).attachments ||
          (payload.attachment ? [payload.attachment] : []),
      };
      if (mailbox) (errPayload as any).mailbox = mailbox;
      await this.events.createNormalized(errPayload);
      this.logger.error('Failed processing send job', e as any);
    }
  }
}
