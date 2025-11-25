import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { MailService } from '../src/mail/mail.service';
import { Repository } from 'typeorm';
import { Mailbox } from '../src/entities/mailbox.entity';
import { Client } from '../src/entities/client.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { v4 as uuidv4 } from 'uuid';
 
describe('MailController (E2E)', () => {
  let app: INestApplication;
  let mailService: MailService;
  let mailboxRepo: Repository<Mailbox>;
  let clientRepo: Repository<Client>;
 
  beforeAll(async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
 
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MailService)
      .useValue({
        enqueueSend: jest.fn().mockResolvedValue({ id: 'job1' }),
        listQueue: jest.fn().mockResolvedValue([]),
      })
      .compile();
 
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.init();
 
    mailService = moduleFixture.get<MailService>(MailService);
    mailboxRepo = moduleFixture.get<Repository<Mailbox>>(getRepositoryToken(Mailbox));
    clientRepo = moduleFixture.get<Repository<Client>>(getRepositoryToken(Client));
  });
 
  afterAll(async () => {
    await app.close();
    jest.restoreAllMocks();
  });
 
  beforeEach(async () => {
    // Delete children first, then parents to satisfy FK constraints
    await mailboxRepo
      .createQueryBuilder()
      .delete()
      .from(Mailbox)
      .where('1=1')
      .execute();
    await clientRepo
      .createQueryBuilder()
      .delete()
      .from(Client)
      .where('1=1')
      .execute();
  });
 
  describe('/mail/send (POST)', () => {
    it('should enqueue a mail job', async () => {
      const clientId = uuidv4();
      const client = clientRepo.create({ id: clientId, name: 'Test Client' });
      await clientRepo.save(client);
 
      const mailbox = mailboxRepo.create({
        email: 'test@example.com',
        provider: 'gmail',
        accessToken: 'dummyAccessToken',
        refreshToken: 'dummyRefreshToken',
        tokenExpiresAt: new Date(Date.now() + 1000 * 60 * 60),
        clientId: clientId,
      });
      await mailboxRepo.save(mailbox);
 
      const sendDto = {
        mailboxId: mailbox.id,
        from: 'sender@test.com',
        to: 'recipient@test.com',
        subject: 'Hello',
      };
 
      const response = await request(app.getHttpServer())
        .post('/mail/send')
        .send(sendDto)
        .expect(201);
 
      expect(response.body).toEqual({
        success: true,
        jobId: 'job1',
      });
 
      expect(mailService.enqueueSend).toHaveBeenCalledWith(
        expect.objectContaining(sendDto),
      );
    });
  });
 
  describe('/mail/queue (GET)', () => {
    it('should return mail queue', async () => {
      const response = await request(app.getHttpServer())
        .get('/mail/queue')
        .expect(200);
 
      expect(response.body).toEqual({
        success: true,
        data: [],
      });
 
      expect(mailService.listQueue).toHaveBeenCalled();
    });
  });
});