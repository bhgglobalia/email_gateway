import { Test, TestingModule } from '@nestjs/testing';
import { ClientsService } from './clients.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Client } from 'src/entities/client.entity';
import { Mailbox } from 'src/entities/mailbox.entity';
import { WsGateway } from '../ws/ws.gateway';
import { Repository } from 'typeorm';

describe('ClientsService', () => {
  let service: ClientsService;
  let clientRepo: Repository<Client>;
  let mailboxRepo: Repository<Mailbox>;
  let wsGateway: WsGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientsService,
        {
          provide: getRepositoryToken(Client),
          useValue: { find: jest.fn(), create: jest.fn(), save: jest.fn() },
        },
        {
          provide: getRepositoryToken(Mailbox),
          useValue: { find: jest.fn() },
        },
        {
          provide: WsGateway,
          useValue: { emit: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<ClientsService>(ClientsService);
    clientRepo = module.get(getRepositoryToken(Client));
    mailboxRepo = module.get(getRepositoryToken(Mailbox));
    wsGateway = module.get(WsGateway);
  });

  describe('findAll', () => {
    it('should return clients with mailbox stats', async () => {
      const now = new Date();
      const clients = [{ id: '1', name: 'Client A', createdAt: now }] as any;
      const mailboxes = [
        {
          id: 'm1',
          clientId: '1',
          tokenExpiresAt: new Date(Date.now() + 1000),
        },
      ];

      (clientRepo.find as jest.Mock).mockResolvedValue(clients);
      (mailboxRepo.find as jest.Mock).mockResolvedValue(mailboxes);

      const result = await service.findAll();
      expect(result[0]).toMatchObject({
        id: '1',
        mailboxes: 1,
        status: 'active',
      });
    });

    it('should mark client as inactive if mailbox token expired',async()=>{
      const now=new Date();
      const clients=[{id:'2',name:'Client B',createdAt:now}] as any;
      const mailboxes=[
        {
          id:'m2',
          clientId:'2',
          tokenExpiresAt:new Date(Date.now()-1000),
        },
      ];

      (clientRepo.find as jest.Mock).mockResolvedValue(clients);
      (mailboxRepo.find as jest.Mock).mockResolvedValue(mailboxes);

      const result=await service.findAll();
      expect(result[0].status).toBe('expired');
    });

    it('should mark client as expired if no mailboxes are found',async()=>{
      const now=new Date();
      const clients=[{id:'3',name:'Client C',createdAt:now}] as any;
      const mailboxes:any[]=[];

      (clientRepo.find as jest.Mock).mockResolvedValue(clients);
      (mailboxRepo.find as jest.Mock).mockResolvedValue(mailboxes);

      const result=await service.findAll();
      expect(result[0]).toMatchObject({
        id:'3',
        mailboxes:0,
        status:'expired',
      });
    });
  });

  describe('create', () => {
    it('should save and emit websocket event', async () => {
      const payload = { name: 'Test Client' };
      const created = { id: 1, ...payload };

      (clientRepo.create as jest.Mock).mockReturnValue(created);
      (clientRepo.save as jest.Mock).mockResolvedValue(created);

      const result = await service.create(payload);

      expect(clientRepo.create).toHaveBeenCalledWith(payload);
      expect(clientRepo.save).toHaveBeenCalledWith(created);
      expect(wsGateway.emit).toHaveBeenCalledWith('clientAdded', created);
      expect(result).toEqual(created);
    });
  });
});
