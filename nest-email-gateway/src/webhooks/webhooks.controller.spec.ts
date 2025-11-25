import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WebhooksController } from './webhooks.controller';
import { WorkerService } from 'src/worker/worker.service';
import { Mailbox } from 'src/entities/mailbox.entity';

describe('WebhooksController', () => {
  let controller: WebhooksController;
  let workerService: WorkerService;
  let mailboxRepo: Repository<Mailbox>;

  const mockWorkerService = {
    enqueueInbound: jest.fn(),
  };

  const mockMailboxRepo = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WebhooksController],
      providers: [
        { provide: WorkerService, useValue: mockWorkerService },
        { provide: getRepositoryToken(Mailbox), useValue: mockMailboxRepo },
      ],
    }).compile();

    controller = module.get<WebhooksController>(WebhooksController);
    workerService = module.get<WorkerService>(WorkerService);
    mailboxRepo = module.get<Repository<Mailbox>>(getRepositoryToken(Mailbox));

    jest.clearAllMocks();
    process.env.EVENTS_SHARED_SECRET = 'secret';
  });

  describe('Gmail webhook', () => {
    it('should return success if mailbox exists and secret is correct', async () => {
      const mailbox = { id: 1, email: 'test@gmail.com' } as Mailbox;
      mockMailboxRepo.findOne.mockResolvedValue(mailbox);

      const result = await controller.gmail(
        { mailboxId: 1, subject: 'Test', attachments: [] },
        { headers: { 'x-events-secret': 'secret' } },
      );

      expect(result).toEqual({ success: true });
      expect(mockWorkerService.enqueueInbound).toHaveBeenCalledWith({
        mailboxId: 1,
        provider: 'google',
        subject: 'Test',
        attachments: [],
      });
    });

    it('should throw UnauthorizedException if secret is invalid', async () => {
      await expect(
        controller.gmail(
          { mailboxId: 1 },
          { headers: { 'x-events-secret': 'wrong' } },
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return error if mailboxId is missing', async () => {
      const headers = { 'x-events-secret': 'secret' };

      const result = await controller.gmail({ subject: 'Test' }, { headers });
      expect(result).toEqual({
        success: false,
        message: 'mailboxId is required',
      });
    });

    it('should return error if mailbox not found', async () => {
      const headers = { 'x-events-secret': 'secret' };
      mockMailboxRepo.findOne.mockResolvedValue(null);

      const result = await controller.gmail({ mailboxId: 999 }, { headers });
      expect(result).toEqual({
        success: false,
        message: 'mailboxId not found',
      });
    });

    it('should return token expired if mailbox token is expired',async()=>{
      const expiredDate=new Date(Date.now()-1000);
      const mailbox={id:1,email:'test@gmail.com',tokenExpiresAt:expiredDate} as Mailbox;
      mockMailboxRepo.findOne.mockResolvedValue(mailbox);

      const result=await controller.gmail(
        {mailboxId:1,subject:'Test',attachments:[]},
        {headers:{'x-events-secret':'secret'}},
      );

      expect(result).toEqual({success:false,message:'token expired'});
      expect(mockWorkerService.enqueueInbound).toHaveBeenCalledWith(expect.objectContaining({
        status:'fail',
        error:'token expired',
      }));
    });

  });

  describe('Microsoft webhook', () => {
    it('should return success if mailbox exists and secret is correct', async () => {
      const mailbox = { id: 1, email: 'test@outlook.com' } as Mailbox;
      mockMailboxRepo.findOne.mockResolvedValue(mailbox);

      const result = await controller.microsoft(
        { mailboxId: 1, subject: 'Hello', attachments: [] },
        { headers: { 'x-events-secret': 'secret' } },
      );

      expect(result).toEqual({ success: true });
      expect(mockWorkerService.enqueueInbound).toHaveBeenCalledWith({
        mailboxId: 1,
        provider: 'outlook',
        subject: 'Hello',
        attachments: [],
      });
    });

    it('should throw UnauthorizedException if secret is invalid', async () => {
      await expect(
        controller.microsoft(
          { mailboxId: 1 },
          { headers: { 'x-events-secret': 'wrong' } },
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return error if mailboxId is missing', async () => {
      const headers = { 'x-events-secret': 'secret' };

      const result = await controller.microsoft(
        { subject: 'Test' },
        { headers },
      );
      expect(result).toEqual({
        success: false,
        message: 'mailboxId is required',
      });
    });

    it('should return error if mailbox not found', async () => {
      const headers = { 'x-events-secret': 'secret' };
      mockMailboxRepo.findOne.mockResolvedValue(null);

      const result = await controller.microsoft({ mailboxId: 99 }, { headers });
      expect(result).toEqual({
        success: false,
        message: 'mailboxId not found',
      });
    });

    it('should return token expired if microsoft mailbox token is expired',async()=>{
      const expiredDate=new Date(Date.now()-1000);
      const mailbox={id:1,email:'test@outlook.com',tokenExpiresAt:expiredDate} as Mailbox;
      mockMailboxRepo.findOne.mockResolvedValue(mailbox);
      
      const result=await controller.microsoft(
        {mailboxId:1,subject:'Hello',attachments:[]},
        {headers:{'x-events-secret':'secret'}},
      );

      expect(result).toEqual({success:false,message:'token expired'});
      expect(mockWorkerService.enqueueInbound).toHaveBeenCalledWith(expect.objectContaining({
        status:'fail',
        error:'token expired',
      }));
    });

  });
});
