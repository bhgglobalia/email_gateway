import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import {
  HealthCheckService,
  HealthIndicatorFunction,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { HealthCheckResult } from '@nestjs/terminus/dist/health-check/health-check-result.interface';

describe('HealthController', () => {
  let controller: HealthController;
  let healthService: HealthCheckService;
  let dbIndicator: TypeOrmHealthIndicator;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthCheckService,
          useValue: { check: jest.fn() },
        },
        {
          provide: TypeOrmHealthIndicator,
          useValue: { pingCheck: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    healthService = module.get<HealthCheckService>(HealthCheckService);
    dbIndicator = module.get<TypeOrmHealthIndicator>(TypeOrmHealthIndicator);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call db.pingCheck through health.check', async () => {
    const mockPing = jest
      .fn()
      .mockResolvedValue({ database: { status: 'up' } });
    dbIndicator.pingCheck = mockPing;

    healthService.check = jest.fn(
      async (checks: HealthIndicatorFunction[]): Promise<HealthCheckResult> => {
        for (const fn of checks) await fn();
        return { status: 'ok', details: {} };
      },
    );

    await controller.check();

    expect(mockPing).toHaveBeenCalledWith('database');
    expect(healthService.check).toHaveBeenCalled();
  });
});
