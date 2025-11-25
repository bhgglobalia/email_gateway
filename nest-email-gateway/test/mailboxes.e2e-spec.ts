// import { INestApplication, ValidationPipe } from '@nestjs/common';
// import { Test, TestingModule } from '@nestjs/testing';
// import { AppModule } from 'src/app.module';
// import request from 'supertest';

// describe('Mailboxes E2E', () => {
//   let app: INestApplication;

//   beforeAll(async () => {
//     const moduleFixture: TestingModule = await Test.createTestingModule({
//       imports: [AppModule],
//     }).compile();

//     app = moduleFixture.createNestApplication();
//     app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
//     await app.init();
//   });

//   afterAll(async () => {
//     await app.close();
//   });

//   it('/mailboxes/oauth/google (GET) should return redirect url', async () => {
//     const res = await request(app.getHttpServer())
//       .get('/mailboxes/oauth/google')
//       .query({ clientId: '123', email: 'test@test.com' })
//       .expect(200);

//     expect(res.body.success).toBe(true);
//     expect(res.body.redirectUrl).toContain('accounts.google.com');
//   });

//   it('/mailboxes/oauth/unknown (GET) should return error', async () => {
//     const res = await request(app.getHttpServer())
//       .get('/mailboxes/oauth/unknown')
//       .expect(200);

//     expect(res.body.success).toBe(false);
//   });
// });


import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import request from 'supertest';
 
describe('Mailboxes E2E', () => {
  let app: INestApplication;
 
  beforeAll(async () => {
    // mock global fetch to avoid hitting external APIs
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ access_token: 'test', refresh_token: 'test', expires_in: 3600 }),
      }),
    ) as any;
 
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
 
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });
 
  afterAll(async () => {
    await app.close();
  });
 
  it('/mailboxes/oauth/google returns redirect url', async () => {
    const res = await request(app.getHttpServer())
      .get('/mailboxes/oauth/google')
      .query({ clientId: '123', email: 'test@test.com' });
    expect(res.body.success).toBe(true);
    expect(res.body.redirectUrl).toContain('accounts.google.com');
  });
 
  it('/mailboxes/oauth/microsoft returns redirect url', async () => {
    const res = await request(app.getHttpServer())
      .get('/mailboxes/oauth/microsoft')
      .query({ clientId: '123', email: 'test@test.com' });
    expect(res.body.success).toBe(true);
    expect(res.body.redirectUrl).toContain('login.microsoftonline.com');
  });
 
  it('/mailboxes/oauth/unknown returns error', async () => {
    const res = await request(app.getHttpServer()).get('/mailboxes/oauth/unknown');
    expect(res.body.success).toBe(false);
  });
});
 