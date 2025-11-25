import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';
import { Repository } from 'typeorm';
import { Mailbox } from 'src/entities/mailbox.entity';
import { EventsService } from 'src/events/events.service';
import Redis from 'ioredis';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('MailService', () => {
  let service: MailService;
  let repo: Repository<Mailbox>;
  let eventsService: EventsService;
  let redis: Redis;

  beforeEach(async () => {
    const redisMock = {
      duplicate: jest.fn().mockReturnThis(),
      quit: jest.fn().mockResolvedValue(undefined),
      incr: jest.fn().mockResolvedValue(1),
      get: jest.fn().mockResolvedValue(0),
      publish: jest.fn(),
      subscribe: jest.fn(),
      on: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: getRepositoryToken(Mailbox),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: EventsService,
          useValue: {
            createNormalized: jest.fn(),
          },
        },
        {
          provide: 'REDIS_CLIENT',
          useValue:redisMock,
        },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
    repo = module.get(getRepositoryToken(Mailbox));
    eventsService = module.get<EventsService>(EventsService);
    redis = module.get<Redis>('REDIS_CLIENT');

    service['sendQueue'] = {
      add: jest.fn().mockResolvedValue({ id: '123' }),
      getJobs: jest.fn().mockResolvedValue([]),
      close: jest.fn(),
    } as any;

    jest.spyOn(service['logger'],'error').mockImplementation(()=>{});
  });

  afterEach(() => jest.restoreAllMocks());

  it('should enqueue send job', async () => {
    const result = await service.enqueueSend({
      mailboxId: '1',
      subject: 'Test',
    } as any);
    expect(result.id).toBe('123');
  });

  it('should processSend and mark ok if mailbox valid ', async () => {
    (repo.findOne as jest.Mock).mockResolvedValue({
      id: '1',
      provider: 'gmail',
      totalExpiresAt: new Date(Date.now() + 100000),
      email: 'test@gmail.com',
    });
    await service['processSend']({
      mailboxId: '1',
      subject: 'Hello',
    } as any);
    expect(eventsService.createNormalized).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'ok' }),
    );
  });

  it('should mark error if mailbox expired', async () => {
    (repo.findOne as jest.Mock).mockResolvedValue({
      id: '1',
      tokenExpiresAt: new Date(Date.now() - 1000), // expired
      provider: 'gmail',
    });

    await service['processSend']({
      mailboxId: '1',
      subject: 'Fail',
    } as any);

    expect(eventsService.createNormalized).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'error' }),
    );
  });

  it('should handle processSend with exception gracefully', async () => {
    (repo.findOne as jest.Mock).mockResolvedValue({
      id: 'X',
      provider: 'gmail',
      email: 'test@gmail.com',
    });
  
    (eventsService.createNormalized as jest.Mock).mockImplementationOnce(() => {
      throw new Error('Unexpected fail');
    });
  
    await service['processSend']({
      mailboxId: 'X',
      subject: 'ErrMail',
    } as any);
  
    expect(eventsService.createNormalized).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'error' }),
    );
  });

  it('should list queue with proper mapping', async () => {
    service['sendQueue'].getJobs = jest.fn().mockResolvedValue([
      { id: 1, name: 'send', processedOn: undefined, failedReason: undefined },
      { id: 2, name: 'send', processedOn: Date.now() },
    ]);
    const result = await service.listQueue();
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: '1', name: 'send' }),
      ]),
    );
  });

  it('should close redis connections on destroy', async () => {
    const closeQ = jest.fn();
    const closeW = jest.fn();
    const closeE = jest.fn();
    service['sendQueue'] = { close: closeQ } as any;
    service['sendWorker'] = { close: closeW } as any;
    service['sendQueueEvents'] = { close: closeE } as any;
    await service.onModuleDestroy();
    expect(closeQ).toHaveBeenCalled();
    expect(closeW).toHaveBeenCalled();
    expect(closeE).toHaveBeenCalled();
  });
  
  
});


  
  

