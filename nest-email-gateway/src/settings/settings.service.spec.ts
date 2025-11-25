import { Test, TestingModule } from '@nestjs/testing';
import { maskDbUrl, maskSecret, SettingsService } from './settings.service';
import { Repository } from 'typeorm';
import { Mailbox } from 'src/entities/mailbox.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('SettingsService', () => {
  let service: SettingsService;
  let repo: jest.Mocked<Repository<Mailbox>>;

  const mockRepo = {
    find: jest.fn(),
  } as unknown as jest.Mocked<Repository<Mailbox>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        { provide: getRepositoryToken(Mailbox), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<SettingsService>(SettingsService);
    repo = module.get(getRepositoryToken(Mailbox));
  });

  afterEach(() => jest.clearAllMocks());

  it('should mask database and secret keys', () => {
    process.env.JWT_SECRET = 'supersecretkey';
    process.env.GMAIL_CLIENT_ID = 'abc123';
    process.env.GMAIL_CLIENT_SECRET = 'xyz456';
    process.env.MS_CLIENT_ID = 'msid789';
    process.env.MS_CLIENT_SECRET = 'mssecret123';
    process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/db';

    const result = service.getMaskedKeys();

    expect(result.jwtSecret).toContain('••••••');
    expect(result.databaseUrl).toContain('••••••');
  });

  it('should return token expiry info', async () => {
    const mockMailboxes = [
      { email: 'a@test.com', provider: 'google', tokenExpiresAt: new Date() },
    ];
    mockRepo.find.mockResolvedValue(mockMailboxes as any);

    const result = await service.getTokenExpiryInfo();
    expect(result).toHaveLength(1);
    expect(result[0].email).toBe('a@test.com');
  });

  it('should return worker health', async () => {
    const result = await service.getWorkerHealth();
    expect(result.status).toBe('ok');
  });

  it('should build webhook URLs correctly', () => {
    process.env.PUBLIC_URL = 'http://example.com';
    const result = service.getWebhookUrls();
    expect(result.gmail).toBe('http://example.com/webhook/gmail');
  });

  it('should compute token expiry info correctly', async () => {
    const now = new Date();
    const future = new Date(Date.now() + 60000);
    mockRepo.find.mockResolvedValue([
      {
        id: 1,
        email: 'x@test.com',
        provider: 'google',
        tokenExpiresAt: future,
      },
    ] as any);

    const result = await service.tokenExpiryInfo();
    expect(result[0].willExpireInSeconds).toBeGreaterThan(0);
  });

  it('maskDbUrl should mask password correctly', () => {
    const url = 'postgres://user:password123@host:5432/db';
    expect(maskDbUrl(url)).toBe('postgres://user:p••••••3@host:5432/db');
  });
  
  it('maskSecret should mask long secret correctly', () => {
    expect(maskSecret('abcdef123456')).toBe('abc••••••456');
  });
  
  it('tokenExpiryInfo should handle past expiry correctly', async () => {
    const past = new Date(Date.now() - 10000);
    mockRepo.find.mockResolvedValue([{ id: 1, email: 'x@test.com', provider: 'google', tokenExpiresAt: past }] as any);
    const result = await service.tokenExpiryInfo();
    expect(result[0].willExpireInSeconds).toBe(0);
  });
  

  it('maskDbUrl should return null if url is null', () => {
    expect(maskDbUrl(null)).toBeNull();
  });
  
  it('maskSecret should return null if value is undefined', () => {
    expect(maskSecret(undefined)).toBeNull();
  });
  
  it('maskSecret should return masked if value length <= 6', () => {
    expect(maskSecret('abc')).toBe('••••••');
  });
  
  it('tokenExpiryInfo should handle mailboxes with null tokenExpiresAt', async () => {
    mockRepo.find.mockResolvedValue([{ id: 1, email: 'x@test.com', provider: 'google', tokenExpiresAt: null }] as any);
    const result = await service.tokenExpiryInfo();
    expect(result[0].willExpireInSeconds).toBeNull();
  });
  
});
