import { Test, TestingModule } from '@nestjs/testing';
import { MailboxesService } from './mailboxes.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Mailbox } from '../entities/mailbox.entity';
import { Client } from '../entities/client.entity';
import { WsGateway } from '../ws/ws.gateway';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('MailboxesService', () => {
  let service: MailboxesService;
  let mailboxRepo: Repository<Mailbox>;
  let clientRepo: Repository<Client>;
  let wsGateway: WsGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailboxesService,
        {
          provide: getRepositoryToken(Mailbox),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            count: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Client),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: WsGateway,
          useValue: { emit: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(MailboxesService);
    mailboxRepo = module.get(getRepositoryToken(Mailbox));
    clientRepo = module.get(getRepositoryToken(Client));
    wsGateway = module.get(WsGateway);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('findAll returns mapped list with status', async () => {
    const now = new Date();
    (mailboxRepo.find as jest.Mock).mockResolvedValue([
      { id: 1, tokenExpiresAt: new Date(now.getTime() + 1000), client: null },
      { id: 2, tokenExpiresAt: new Date(now.getTime() - 1000), client: null },
    ]);

    const result = await service.findAll();
    expect(result[0].status).toBe('active');
    expect(result[1].status).toBe('expired');
  });

  it('countActive returns correct count', async () => {
    (mailboxRepo.count as jest.Mock).mockResolvedValue(5);
    const count = await service.countActive();
    expect(count).toBe(5);
  });

  it('refreshTokenExpiry throws NotFoundException if mailbox missing', async () => {
    (mailboxRepo.findOne as jest.Mock).mockResolvedValue(null);
    await expect(service.refreshTokenExpiry(1)).rejects.toThrow(NotFoundException);
  });

  it('refreshTokenExpiry updates mailbox', async () => {
    const mailbox = { id: 1, tokenExpiresAt: new Date(), client: null };
    (mailboxRepo.findOne as jest.Mock).mockResolvedValueOnce(mailbox);
    (mailboxRepo.save as jest.Mock).mockResolvedValue(mailbox);
    (mailboxRepo.findOne as jest.Mock).mockResolvedValueOnce(mailbox);

    const result = await service.refreshTokenExpiry(1);
    expect(wsGateway.emit).toHaveBeenCalledWith('mailboxUpdated', mailbox);
    expect(result).toEqual(mailbox);
  });

  it('saveTokens creates new mailbox if not exists', async () => {
    (mailboxRepo.findOne as jest.Mock).mockResolvedValue(null);
    (mailboxRepo.create as jest.Mock).mockReturnValue({ id: 10, email: 'new@test.com' });
    (mailboxRepo.save as jest.Mock).mockResolvedValue({ id: 10, email: 'new@test.com' });
    (mailboxRepo.findOne as jest.Mock).mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 10 });

    const result = await service.saveTokens('new@test.com', 'google', 'a', 'b', 3600);
    expect(wsGateway.emit).toHaveBeenCalledWith('mailboxAdded', expect.anything());
    expect(result!.id).toBe(10);
  });

  it('saveTokens updates existing mailbox tokens', async () => {
    const existing = { id: 1, email: 'ex@test.com', refreshToken: '', tokenExpiresAt: null };
    (mailboxRepo.findOne as jest.Mock).mockResolvedValue(existing);
    (mailboxRepo.save as jest.Mock).mockResolvedValue(existing);
    (mailboxRepo.findOne as jest.Mock).mockResolvedValue(existing);

    const result = await service.saveTokens('ex@test.com', 'google', 'newAccess', 'newRefresh', 3600);
    expect(wsGateway.emit).toHaveBeenCalledWith('mailboxUpdated', existing);
  });

  it('saveTokens throws ConflictException if client already connected to different provider', async () => {
    const client = { id: '1', emailProvider: 'outlook', save: jest.fn() };
    (clientRepo.findOne as jest.Mock).mockResolvedValue(client);
    (mailboxRepo.findOne as jest.Mock).mockResolvedValue(null);

    await expect(service.saveTokens('test@test.com', 'google', 'a', 'b', 3600, '1'))
      .rejects
      .toThrow(ConflictException);
  });

  it('saveTokens handles missing optional params', async () => {
    (mailboxRepo.findOne as jest.Mock).mockResolvedValue(null);
    (mailboxRepo.create as jest.Mock).mockReturnValue({ id: 11 });
    (mailboxRepo.save as jest.Mock).mockResolvedValue({ id: 11 });
    (mailboxRepo.findOne as jest.Mock).mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 11 });
  
    const result = await service.saveTokens('test2@test.com', 'google', 'a');
    expect(result!.id).toBe(11);
  });
  
  it('findAll marks status active if tokenExpiresAt missing', async () => {
    (mailboxRepo.find as jest.Mock).mockResolvedValue([{ id: 1, tokenExpiresAt: null, client: null }]);
    const res = await service.findAll();
    expect(res[0].status).toBe('active');
  });
  
});
