import { Test, TestingModule } from '@nestjs/testing';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { UnauthorizedException } from '@nestjs/common';
import { timestamp } from 'rxjs';

describe('EventsController (Integration)', () => {
  let controller: EventsController;
  let service: jest.Mocked<EventsService>;

  const mockService: jest.Mocked<EventsService> = {
    createNormalized: jest.fn(),
    list: jest.fn(),
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [{ provide: EventsService, useValue: mockService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<EventsController>(EventsController);
    service = module.get(EventsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('POST /events', () => {
    it('should create event with valid secret', async () => {
      process.env.EVENTS_SHARED_SECRET = 'topsecret';

      const req: any = { headers: { 'x-events-secret': 'topsecret' } };

      const payload = { mailboxId: 1, status: 'sent', direction: 'outbound' };
      const mockSaved = { id: 10, ...payload };

      service.createNormalized.mockResolvedValue(mockSaved as any);

      const result = await controller.create(payload as any, req);

      expect(service.createNormalized).toHaveBeenCalledWith(
        expect.objectContaining({
          mailboxId: payload.mailboxId,
          direction: payload.direction,
          status: payload.status,
        }),
      );
      expect(result).toEqual({ success: true, data: mockSaved });
    });

    it('should throw error for invalid secret', async () => {
      process.env.EVENTS_SHARED_SECRET = 'valid';
      const req: any = { headers: { 'x-events-secret': 'wrong' } };
      await expect(controller.create({} as any, req)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should assign current timestamp if none provided',async()=>{
      process.env.EVENTS_SHARED_SECRET='topsecret';
      const req:any={headers:{'x-events-secret':'topsecret'}};
      const payload={mailboxId:1,direction:'outbound',status:'sent'};

      const mockSaved={id:99,...payload};
      service.createNormalized.mockResolvedValue(mockSaved as any);

      const result=await controller.create(payload as any,req);

      expect(service.createNormalized).toHaveBeenCalledWith(
        expect.objectContaining({
          timestamp:expect.any(Date),
        }),
      );
      expect(result).toEqual({success:true,data:mockSaved});
    });

    it('should default provider to unknown if not provided',async()=>
    {
      process.env.EVENTS_SHARED_SECRET='topsecret';
      const req:any={headers:{'x-events-secret':'topsecret'}};
      const payload={mailboxId:1,direction:'inbound',status:'received'};

      const mockSaved={id:2,...payload};
      service.createNormalized.mockResolvedValue(mockSaved as any);

      await controller.create(payload as any,req);

      expect(service.createNormalized).toHaveBeenCalledWith(
        expect.objectContaining({
          provider:'unknown',
        }),
      );
    });

    it('should skip secret validation if EVENTS_SHARED_SECRET is not set',async()=>{
      delete process.env.EVENTS_SHARED_SECRET;
      const req:any={headers:{}};
      const payload={mailboxId:3,direction:'inbound',status:'queued'};
      const mockSaved={id:3,...payload};

      service.createNormalized.mockResolvedValue(mockSaved as any);

      const result=await  controller.create(payload as any,req);
      expect(result).toEqual({success:true,data:mockSaved});
      expect(service.createNormalized).toHaveBeenCalled();
    })
  });

  describe('GET/events', () => {
    it('should return events list', async () => {
      const mockList = [{ id: 1 }] as any;
      service.list.mockResolvedValue(mockList);
      const result = await controller.all('10', 'gmail', '12', '2025-01-01');
      expect(result).toEqual({ success: true, data: mockList });
    });

    it('should clamp invalid limit value to default 100', async () => {
      service.list.mockResolvedValue([{ id: 42 }]as any);
      const result = await controller.all('invalid', undefined, undefined, undefined);
      expect(result).toEqual({ success: true, data: [{ id: 42 }] });
      expect(service.list).toHaveBeenCalledWith(100, undefined, undefined, undefined);
    });
  });
});
