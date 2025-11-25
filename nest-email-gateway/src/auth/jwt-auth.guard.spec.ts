import { JwtAuthGuard } from './jwt-auth.guard';
import { ExecutionContext } from '@nestjs/common';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let context: ExecutionContext;

  beforeEach(() => {
    guard = new JwtAuthGuard();
    context = {
      switchToHttp: jest.fn().mockReturnValue({ getRequest: jest.fn() }),
    } as any;
  });

  afterEach(() => {
    jest.resetAllMocks();
    delete process.env.NODE_ENV;
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should return true if NODE_ENV is test', () => {
    process.env.NODE_ENV = 'test';
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should call super.canActivate if NODE_ENV is not test', () => {
    process.env.NODE_ENV = 'production';
    const parentProto = Object.getPrototypeOf(JwtAuthGuard.prototype);
    const superCanActivate = jest.spyOn(parentProto, 'canActivate').mockReturnValue('super-result' as any);
    const result = guard.canActivate(context);
    expect(superCanActivate).toHaveBeenCalledWith(context);
    expect(result).toBe('super-result');
    superCanActivate.mockRestore();
  });
});
