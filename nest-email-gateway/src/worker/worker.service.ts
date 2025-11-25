import {
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { Queue, Worker, QueueEvents, Job, JobsOptions } from 'bullmq';
import Redis from 'ioredis';
import { EventsService } from '../events/events.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mailbox } from '../entities/mailbox.entity';

interface InboundJob {
  mailboxId?: number;
  provider: 'google' | 'outlook';
  subject?: string;
  attachments?: any[];
  status?: 'ok' | 'fail';
  error?: string;
}

const INBOUND_QUEUE_NAME = 'inbound-email-jobs';

@Injectable()
export class WorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('WorkerService');
  private queue: Queue<InboundJob>;
  private worker: Worker<InboundJob>;
  private queueEvents: QueueEvents;
  private redis: Redis;

  constructor(
    private events: EventsService,
    @InjectRepository(Mailbox) private mailboxes: Repository<Mailbox>,
    @Inject('REDIS_CLIENT') private readonly redisClient: Redis,
  ) {}

  async onModuleInit() {
    this.redis = this.redisClient;
    this.queue = new Queue<InboundJob>(INBOUND_QUEUE_NAME, {
      connection: this.redis,
    });
    this.queueEvents = new QueueEvents(INBOUND_QUEUE_NAME, {
      connection: this.redis,
    });
    this.worker = new Worker<InboundJob>(
      INBOUND_QUEUE_NAME,
      async (job: Job<InboundJob>) => {
        await this.process(job.data);
      },
      {
        connection: this.redis,
      },
    );
    this.logger.log('BullMQ Worker initialized for inbound emails');
  }

  async onModuleDestroy() {
    await this.queue.close();
    await this.worker.close();
    await this.queueEvents.close();
  }

  async enqueueInbound(job: InboundJob, opts?: JobsOptions) {
    await this.queue.add('inbound', job, opts);
    this.logger.log(`Enqueued inbound job: ${JSON.stringify(job)}`);
  }

  private async process(job: InboundJob) {
    try {
      const mailbox = job.mailboxId
        ? await this.mailboxes.findOne({ where: { id: job.mailboxId } })
        : undefined;
      const now = new Date();
      const eventPayload: any = {
        mailboxId: mailbox?.id || job.mailboxId || 0,
        direction: 'inbound',
        status: job.status || 'ok',
        timestamp: now,
        provider: job.provider,
        subject:
          job.subject ||
          `New ${job.provider} message @ ${now.toLocaleTimeString()}`,
        sender: 'sender@example.com',
        attachments: job.attachments || [],
      };
      if (job.error) eventPayload.error = job.error;
      if (mailbox) eventPayload.mailbox = mailbox;
      await this.events.createNormalized(eventPayload);
    } catch (e) {
      this.logger.error('Failed processing inbound job', e as any);
    }
  }
}
