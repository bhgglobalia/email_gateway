import { INestApplication } from '@nestjs/common';
 
import { Test, TestingModule } from '@nestjs/testing';
 
import request from 'supertest';
 
import { AppModule } from 'src/app.module';
 
import { Event } from 'src/entities/event.entity';
import { Mailbox } from 'src/entities/mailbox.entity';
 
import { DataSource } from 'typeorm';
 
jest.spyOn(console, 'warn').mockImplementation(() => { });
 
describe('Events E2E (full flow)', () => {
 
  let app: INestApplication;
 
  let dataSource: DataSource;
 
  beforeAll(async () => {
 
    process.env.EVENTS_SHARED_SECRET = 'testsecret';
 
    const moduleFixture: TestingModule = await Test.createTestingModule({
 
      imports: [AppModule],
 
    }).compile();
 
    app = moduleFixture.createNestApplication();
 
    await app.init();
 
    dataSource = moduleFixture.get(DataSource);
 
  });
 
  beforeEach(async () => {
 
    await dataSource.getRepository(Event).clear();
 
  });
 
  afterAll(async () => {
 
    await app.close();
 
    jest.clearAllMocks();
 
    jest.resetModules();
 
  });
 
  afterEach(async () => {
 
    await dataSource.getRepository(Event).clear();
 
  });
 
  describe('POST /events', () => {
 
    it('should create event with valid secret', async () => {
 
      // Ensure mailbox exists to satisfy FK
      const mailboxRepo = dataSource.getRepository(Mailbox);
      const mailbox = await mailboxRepo.save(
        mailboxRepo.create({
          email: 'events@mail.test',
          provider: 'gmail',
          accessToken: 'test-access',
          tokenExpiresAt: new Date(Date.now() + 3600_000),
        }) as any,
      );
 
      const payload = {
 
        mailboxId: mailbox.id,
 
        direction: 'outbound',
 
        status: 'sent',
 
        provider: 'gmail',
 
        timestamp: new Date().toISOString(),
 
      };
 
      const response = await request(app.getHttpServer())
 
        .post('/events')
 
        .set('x-events-secret', 'testsecret')
 
        .send(payload)
 
        .expect(201);
 
      expect(response.body.success).toBe(true);
 
      expect(response.body.data).toMatchObject({
 
        mailboxId: mailbox.id,
 
        direction: 'outbound',
 
        status: 'sent',
 
        provider: 'gmail',
 
      });
 
      const saved = await dataSource.getRepository(Event).find();
 
      expect(saved.length).toBe(1);
 
      expect(saved[0].provider).toBe('gmail');
 
    });
 
    it('should reject event with invalid secret', async () => {
 
      const payload = {
 
        mailboxId: 2,
 
        direction: 'inbound',
 
        status: 'failed',
 
      };
 
      const response = await request(app.getHttpServer())
 
        .post('/events')
 
        .set('x-events-secret', 'wrongsecret')
 
        .send(payload)
 
        .expect(401);
 
      expect(response.body.message).toBe('Invalid events secret');
 
    });
 
  });
 
  describe('GET/events', () => {
 
    it('should return event list', async () => {
 
      const repo = dataSource.getRepository(Event);
      const mailboxRepo = dataSource.getRepository(Mailbox);
      const mailbox = await mailboxRepo.save(
        mailboxRepo.create({
          email: 'list@mail.test',
          provider: 'gmail',
          accessToken: 'test-access',
          tokenExpiresAt: new Date(Date.now() + 3600_000),
        }) as any,
      );
 
      await repo.insert([
 
        {
 
          mailboxId: mailbox.id,
 
          direction: 'outbound',
 
          status: 'sent',
 
          provider: 'gmail',
 
          timestamp: new Date(),
 
          attachments: [],
 
        },
 
      ]);
 
      const response = await request(app.getHttpServer())
 
        .get('/events')
 
        .expect(200);
 
      expect(response.body.success).toBe(true);
 
      expect(Array.isArray(response.body.data)).toBe(true);
 
      expect(response.body.data.length).toBeGreaterThan(0);
 
    });
 
  });
 
});