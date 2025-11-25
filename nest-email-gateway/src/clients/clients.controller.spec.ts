import { Test, TestingModule } from '@nestjs/testing';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

describe('ClientsController', () => {
  let controller: ClientsController;
  let service: ClientsService;

  beforeEach(async () => {
    const mockService = {
      findAll: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientsController],
      providers: [{ provide: ClientsService, useValue: mockService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true }) // bypass auth
      .compile();

    controller = module.get<ClientsController>(ClientsController);
    service = module.get<ClientsService>(ClientsService);
  });

  it('should return all clients', async () => {
    const mockData = [{ id: 1, name: 'Demo' }];
    (service.findAll as jest.Mock).mockResolvedValue(mockData);

    const result = await controller.all('0', '10');
    expect(result).toEqual({ success: true, data: mockData });
  });

  it('should create a new client', async () => {
    const dto = { name: 'New Client' };
    const created = { id: 2, ...dto };
    (service.create as jest.Mock).mockResolvedValue(created);

    const result = await controller.create(dto as any);
    expect(result).toEqual({ success: true, data: created });
  });

  it('should handle non-numeric skip/take gracefully',async()=>{
    (service.findAll as jest.Mock).mockResolvedValue([]);
   const result=await controller.all('abc','xyz');
   expect(service.findAll).toHaveBeenCalledWith(0,100);
   expect(result).toEqual({success:true,data:[]});
  });

  it('should handle valid numeric skip/take parameters correctly', async () => {
    (service.findAll as jest.Mock).mockResolvedValue([]);
    const result = await controller.all('5', '20');
    expect(service.findAll).toHaveBeenCalledWith(5, 20);
    expect(result).toEqual({ success: true, data: [] });
  });

  it('should call service.create with correct dto',async()=>{
    const dto={name:'Client Test'};
    (service.create as jest.Mock).mockResolvedValue({id:1,...dto});
    await controller.create(dto as any);
    expect(service.create).toHaveBeenCalledWith(dto);
  });
});
