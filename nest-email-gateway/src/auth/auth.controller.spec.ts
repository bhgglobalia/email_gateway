import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ThrottlerGuard } from '@nestjs/throttler';
 
describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;
 
  beforeEach(async () => {
    const mockAuthService = {
      validateUser: jest.fn(),
      login: jest.fn(),
      changePassword: jest.fn(),
    };
 
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();
 
    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });
 
  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
 
  it('should return token for valid login', async () => {
    (service.validateUser as jest.Mock).mockResolvedValue({
      id: 1,
      email: 'a@a.com',
      role: 'admin',
    });
    (service.login as jest.Mock).mockResolvedValue({
      access_token: 'jwt-token',
    });
 
    const result = await controller.login({
      email: 'a@a.com',
      password: 'Password@123',
    });
 
    expect(result).toEqual(
      expect.objectContaining({
        success: true,
        access_token: 'jwt-token',
      }),
    );
  });
 
  it('should return invalid credentials for bad login', async () => {
    (service.validateUser as jest.Mock).mockResolvedValue(null);
 
    const result = await controller.login({
      email: 'x@x.com',
      password: 'bad',
    });
 
    expect(result).toEqual({
      success: false,
      message: 'Invalid credentials',
    });
  });
 
  it('should call changePassword', async () => {
    (service.changePassword as jest.Mock).mockResolvedValue({ success: true });
 
    const result = await controller.changePassword(
      { user: { id: '1' } } as any,
      { currentPassword: 'Old@123', newPassword: 'New@2024' },
    );
 
    expect(service.changePassword).toHaveBeenCalled();
    expect(result).toEqual({ success: true });
  });
});
 