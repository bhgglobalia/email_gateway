import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from './events.service';
import { createQueryBuilder, Repository } from 'typeorm';
import { WsGateway } from 'src/ws/ws.gateway';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('EventsService', () => {
  let service: EventsService;
  let repo: Repository<Event>;
  let ws: WsGateway;

  const mockRepo = {
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockws = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        { provide: getRepositoryToken(Event), useValue: mockRepo },
        { provide: WsGateway, useValue: mockws },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
    repo = module.get<Repository<Event>>(getRepositoryToken(Event));
    ws = module.get<WsGateway>(WsGateway);
  });

  afterEach(() => jest.clearAllMocks());

  describe('createNormalized', () => {
    it('should save event and emit websocket', async () => {
      const normalized = { mailboxId: 123, provider: 'gmail' } as any;
      const mockEntity = { id: 1, ...normalized };

      mockRepo.create.mockReturnValue(mockEntity);
      mockRepo.save.mockResolvedValue(mockEntity);

      const result = await service.createNormalized(normalized);

      expect(mockRepo.create).toHaveBeenCalledWith(normalized);
      expect(mockRepo.save).toHaveBeenCalledWith(mockEntity);
      expect(ws.emit).toHaveBeenCalledWith('email_event', { ...mockEntity, id: String(mockEntity.id) });
      expect(result).toEqual(mockEntity);
    });
  });

  describe('list', () => {
    it('should return events with filters applied', async () => {
      const mockQueryBuilder: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([{ id: 1 }]),
      };

      mockRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.list(50, 'gmail', '12', '2025-01-01');

      expect(result).toEqual([{ id: 1 }]);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
      expect(mockQueryBuilder.getMany).toHaveBeenCalled();
    });

    it('should apply cursor filter when valid cursor provided', async () => {
      const mockQueryBuilder: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([{ id: 5 }]),
      };
    
      mockRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);
    
      const cursorDate = new Date().toISOString();
      await service.list(10, 'gmail', '1', undefined, 0, cursorDate);
    
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'event.timestamp < :cursor',
        expect.any(Object),
      );
    });

    it('should clamp invalid limit and skip value',async()=>{
      const mockQueryBuilder:any={
        
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      mockRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);
    
      await service.list(-5, undefined, undefined, undefined, -10);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(100);
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
    });

  });
});
