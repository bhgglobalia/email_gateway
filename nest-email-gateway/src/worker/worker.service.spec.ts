import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkerService } from './worker.service';
import { EventsService } from '../events/events.service';
import { Mailbox } from '../entities/mailbox.entity';

let lastProcessor: ((job: any) => Promise<void>) | null = null;

jest.mock('bullmq', () => {
  return {
    Queue: class {
      public add = jest.fn(async () => undefined);
      public close = jest.fn(async () => undefined);
      constructor(public name: string, public opts: any) {}
    },
    QueueEvents: class {
      public close = jest.fn(async () => undefined);
      constructor(public name: string, public opts: any) {}
    },
    Worker: class {
      public close = jest.fn(async () => undefined);
      constructor(public name: string, processor: (job: any) => Promise<void>, public opts: any) {
        lastProcessor = processor;
      }
    },
  };
});

const redisMock = {
  duplicate: jest.fn(function (this: any) { return this; }),
  subscribe: jest.fn(async () => 1),
  on: jest.fn(),
  quit: jest.fn(async () => undefined),
};

describe('WorkerService', () => {
  let service: WorkerService;
  let eventsService: { createNormalized: jest.Mock };
  let mailboxRepo: { findOne: jest.Mock };

  beforeEach(async () => {
    eventsService = { createNormalized: jest.fn(async () => ({})) } as any;
    mailboxRepo = { findOne: jest.fn(async () => ({ id: 1 })) } as any;

    const moduleRef = await Test.createTestingModule({
      providers: [
        WorkerService,
        { provide: EventsService, useValue: eventsService },
        { provide: getRepositoryToken(Mailbox), useValue: mailboxRepo as unknown as Repository<Mailbox> },
        { provide: 'REDIS_CLIENT', useValue: redisMock },
      ],
    }).compile();

    service = moduleRef.get(WorkerService);
  });

  afterEach(() => {
    lastProcessor = null;
    jest.clearAllMocks();
  });

  it('should initialize BullMQ components on module init', async () => {
    await service.onModuleInit();
    expect(redisMock.duplicate).not.toHaveBeenCalled();
  });

  it('should enqueue inbound job', async () => {
    await service.onModuleInit();
    const job = { mailboxId: 1, provider: 'google' as const, subject: 'Hi' };
    await expect(service.enqueueInbound(job)).resolves.toBeUndefined();
  });

  it('should process job and create event via EventsService', async () => {
    await service.onModuleInit();
    expect(typeof lastProcessor).toBe('function');
    const payload = { mailboxId: 1, provider: 'google' as const, attachments: [] };
    await lastProcessor!({ data: payload });
    expect(eventsService.createNormalized).toHaveBeenCalled();
    const arg = eventsService.createNormalized.mock.calls[0][0];
    expect(arg.provider).toBe('google');
    expect(arg.direction).toBe('inbound');
  });

  it('should close resources on module destroy', async () => {
    await service.onModuleInit();
    await expect(service.onModuleDestroy()).resolves.toBeUndefined();
  });

  it('should handle processing job with no mailboxId',async()=>{
    await service.onModuleInit();
    const payload={provider:'google' as const};
    await lastProcessor!({data:payload});
    expect(eventsService.createNormalized).toHaveBeenCalledWith(expect.objectContaining({
      direction:'inbound',
      mailboxId:0,
    }));
  });

  it('should include error field if job has error',async()=>{
    await service.onModuleInit();
    const payload={mailboxId:1,provider:'google' as const,error:'fail'};
    await lastProcessor!({data:payload});
    expect(eventsService.createNormalized).toHaveBeenCalledWith(expect.objectContaining({
      error:'fail',
    }));

  });
});
