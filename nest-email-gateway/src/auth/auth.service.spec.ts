import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from 'src/entities/user.entity';
import { AuthService } from './auth.service';
import { Logger } from '@nestjs/common';
 
describe('AuthService', () => {
  let service: AuthService;
  let userRepo: any;
  let jwt: JwtService;
 
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        JwtService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            count: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();
 
    service = module.get<AuthService>(AuthService);
    userRepo = module.get(getRepositoryToken(User));
    jwt = module.get<JwtService>(JwtService);
  });
 
  it('should validate user with correct credentials', async () => {
    const user = {
      id: '1',
      email: 'test@example.com',
      passwordHash: await bcrypt.hash('Password@123', 10),
      role: 'admin',
    };
    userRepo.findOne.mockResolvedValue(user);
 
    const result = await service.validateUser('test@example.com', 'Password@123');
    expect(result).toMatchObject({ email: 'test@example.com', role: 'admin' });
  });
 
  it('should fail validateUser with wrong password', async () => {
    const user = {
      email: 'test@example.com',
      passwordHash: await bcrypt.hash('password@123', 10),
    };
    userRepo.findOne.mockResolvedValue(user);
 
    const result = await service.validateUser('test@example.com', 'WrongPass');
    expect(result).toBeNull();
  });
 
  it('should reject weak password in changePassword', async () => {
    const user = {
      id: '1',
      passwordHash: await bcrypt.hash('Password@123', 10),
    };
    userRepo.findOne.mockResolvedValue(user);
 
    const result = await service.changePassword('1', 'Password@123', 'weak');
    expect(result.success).toBe(false);
    expect(result.message).toContain('Password too weak');
  });
 
 
  it('should change password successfully', async () => {
    const user = { id: '1', passwordHash: await bcrypt.hash('Password@123', 10) };
    userRepo.findOne.mockResolvedValue(user);
    userRepo.save.mockResolvedValue(user);
 
    const result = await service.changePassword('1', 'Password@123', 'StrongPass@2024');
    expect(result.success).toBe(true);
  });
 
  it('should return user not found in changePassword', async () => {
    userRepo.findOne.mockResolvedValue(null);
    const result = await service.changePassword('1', 'Password@123', 'StrongPass@2024');
    expect(result.success).toBe(false);
    expect(result.message).toContain('User not found');
  });
 
  it('should generate JWT in login()', async () => {
    const user = { id: '1', email: 'test@example.com', role: 'admin' };
    jest.spyOn(jwt, 'sign').mockReturnValue('mocktoken');
    const result = await service.login(user);
    expect(result.access_token).toBe('mocktoken');
    expect(result.requirePasswordChange).toBe(false);
  });
 
  it('should create default admin if none exist', async () => {
    userRepo.count.mockResolvedValue(0);
    userRepo.save.mockResolvedValue({});
    process.env.DEFAULT_ADMIN_EMAIL = 'admin@example.com';
    process.env.DEFAULT_ADMIN_PASSWORD = 'StrongPass@123';
    const spy = jest.spyOn(console, 'warn').mockImplementation(() => { });
    await service.onModuleInit();
    expect(userRepo.save).toHaveBeenCalled();
    spy.mockRestore();
  });
 
  it('should reset admin password if RESET_ADMIN_PASSWORD is true', async () => {
    userRepo.count.mockResolvedValue(1);
    userRepo.findOne.mockResolvedValue({ email: 'admin@example.com' });
    userRepo.save.mockResolvedValue({});
    process.env.RESET_ADMIN_PASSWORD = 'true';
    process.env.DEFAULT_ADMIN_PASSWORD = 'StrongPass@123';
    const spy = jest.spyOn(console, 'warn').mockImplementation(() => { });
    await service.onModuleInit();
    expect(userRepo.save).toHaveBeenCalled();
    spy.mockRestore();
  });
 
  it('should skip weak password reset', async () => {
    userRepo.count.mockResolvedValue(1);
    process.env.RESET_ADMIN_PASSWORD = 'true';
    process.env.DEFAULT_ADMIN_PASSWORD = 'weak';
 
    const spy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => { });
    await service.onModuleInit();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
 