import { Test, TestingModule } from '@nestjs/testing';
import { MailboxesController } from './mailboxes.controller';
import { MailboxesService } from './mailboxes.service';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Reflector } from '@nestjs/core';

describe('MailboxesController', () => {
  let controller: MailboxesController;
  let service: MailboxesService;

  beforeEach(async () => {
    const mockValues = {
      PUBLIC_URL: 'http://localhost:3000',
      FRONTEND_ORIGIN: 'http://localhost:3001',
      GMAIL_CLIENT_ID: 'G123',
      MS_CLIENT_ID: 'M123',
    } as const;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MailboxesController],
      providers: [
        {
          provide: MailboxesService,
          useValue: {
            findAll: jest.fn().mockResolvedValue([{ id: 1 }]),
            refreshTokenExpiry: jest.fn().mockResolvedValue({ id: 1 }),
            countActive: jest.fn().mockResolvedValue(5),
            saveTokens: jest.fn().mockResolvedValue({ id: 99 }),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: keyof typeof mockValues) => mockValues[key]),
          },
        },
        { provide: CACHE_MANAGER, useValue: { get: jest.fn(), set: jest.fn(), del: jest.fn() } },
        { provide: Reflector, useValue: { get: jest.fn(), getAllAndOverride: jest.fn() } },
      ],
    }).compile();

    controller = module.get<MailboxesController>(MailboxesController);
    service = module.get<MailboxesService>(MailboxesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('all() returns mailbox list', async () => {
    const result = await controller.all('0', '10');
    expect(result.data).toEqual([{ id: 1 }]);
  });

  it('refresh() calls service', async () => {
    const result = await controller.refresh('1');
    expect(service.refreshTokenExpiry).toHaveBeenCalledWith(1, 3600);
    expect(result.success).toBe(true);
  });

  it('countActive() returns active count', async () => {
    const result = await controller.countActive();
    expect(result.count).toBe(5);
  });

  it('oauthRedirect() google returns URL', async () => {
    const result = await controller.oauthRedirect('google', { clientId: 'c1', email: 'x' });
    expect(result.redirectUrl).toContain('accounts.google.com');
  });

  it('oauthRedirect() microsoft returns URL', async () => {
    const result = await controller.oauthRedirect('microsoft', { clientId: 'c1', email: 'x' });
    expect(result.redirectUrl).toContain('login.microsoftonline.com');
  });

  it('oauthRedirect() unknown provider returns error', async () => {
    const result = await controller.oauthRedirect('yahoo', { clientId: 'c1' });
    expect(result.success).toBe(false);
  });

  it('callback() should redirect on invalid OAuth state', async () => {
    const res = { redirect: jest.fn() } as any;
    await controller.callback('google', { state: 'invalid.sig', code: 'x' } as any, res);
    expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining('error=Invalid%20OAuth%20state'));
  });
  
  it('callback() should redirect if unknown provider', async () => {
    const res = { redirect: jest.fn() } as any;
    await controller.callback('yahoo', { code: 'x' } as any, res);
    expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining('error=Unknown%20provider'));
  });
  
  it('oauthRedirect() should return error if GMAIL_CLIENT_ID missing', async () => {
    const cfg = controller['config'] as any;
    cfg.get.mockImplementation((key: string) => (key === 'GMAIL_CLIENT_ID' ? null : 'v'));
    const result = await controller.oauthRedirect('google', { clientId: 'c1', email: 'x' });
    expect(result.success).toBe(false);
    expect(result.message).toBe('GMAIL_CLIENT_ID is not configured on the server');
  });
  
  it('saveTokensJson() should call service with body', async () => {
    const spy = jest.spyOn(controller['svc'], 'saveTokens');
    const body = { email: 'a', provider: 'google', accessToken: 't' };
    await controller.saveTokensJson(body);
    expect(spy).toHaveBeenCalledWith('a', 'google', 't', undefined, undefined, undefined);
  });

it('callback() redirects on token exchange failure', async () => {
  const res = { redirect: jest.fn() } as any;
  global.fetch = jest.fn().mockResolvedValue({
    ok: false,
    json: async () => ({ error: 'bad_request', error_description: 'Invalid code' }),
  }) as any;

  await controller.callback('google', { code: 'x' } as any, res);
  expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining('error=Invalid%20code'));
});

it('callback() redirects on fetch exception', async () => {
  const res = { redirect: jest.fn() } as any;
  global.fetch = jest.fn().mockRejectedValue(new Error('Network fail')) as any;

  await controller.callback('google', { code: 'x' } as any, res);
  expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining('error=Network%20fail'));
});

it('oauthRedirect() should return error if MS_CLIENT_ID missing', async () => {
  const cfg = controller['config'] as any;
  cfg.get.mockImplementation((key: string) => null); 
  const result = await controller.oauthRedirect('microsoft', { clientId: 'c1', email: 'x' });
  expect(result.success).toBe(false);
  expect(result.message).toBe('MICROSOFT_CLIENT_ID is not configured on the server');
});


it('all() should default skip and take', async () => {
  await controller.all(undefined, undefined);
  expect(service.findAll).toHaveBeenCalledWith(0, 100);
});

});
