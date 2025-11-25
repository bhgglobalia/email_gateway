import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from 'src/app.module';

describe('clients E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    jest.setTimeout(20000);
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    process.env.NODE_ENV = 'test';
  });

  afterAll(async () => {
    await app.close();
  });

  it('/clients(POST) should create client', async () => {
    const dto = {
      name: 'E2E Client',
      emailProvider: 'gmail',
      domain: 'gmail.com',
    };

    const response = await request(app.getHttpServer())
      .post('/clients')
      .send(dto)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe('E2E Client');
  });

  it('/clients (GET) should return list of clients', async () => {
    const response = await request(app.getHttpServer())
      .get('/clients')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });
});
