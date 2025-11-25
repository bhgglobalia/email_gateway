import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import request from 'supertest';

describe('settings E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/settings/ping/app (GET)', async () => {
    const res = await request(app.getHttpServer()).get('/settings/ping/app');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('/settings/masked-keys (GET)', async () => {
    const res = await request(app.getHttpServer()).get('/settings/masked-keys');
    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
  });

  it('/settings/webhooks (GET)', async () => {
    const res = await request(app.getHttpServer()).get('/settings/webhooks');
    expect(res.status).toBe(200);
    expect(res.body.gmail).toBeDefined();
  });

  it('/settings/token-expiry (GET)', async () => {
    const res = await request(app.getHttpServer()).get(
      '/settings/token-expiry',
    );
    expect(res.status).toBe(200);
  });
});
