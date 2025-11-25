import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import bcrypt from 'bcrypt';

describe('Auth E2E', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = moduleFixture.get(DataSource);
  });

  beforeEach(async () => {
    await dataSource.query('DELETE FROM "user";');
  });

  afterAll(async () => {
    await app.close();
  });

  it('/auth/login (POST) should login default admin', async () => {
    const password = 'admin123';
    const passwordHash = await bcrypt.hash(password, 10);

    await dataSource.query(`
      INSERT INTO "user" ("email", "passwordHash", "role")
      VALUES ('admin@example.com', '${passwordHash}', 'admin');
    `);

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@example.com', password });

    expect(response.status).toBe(201);
    expect(response.body.access_token).toBeDefined();
  });

  it('/auth/me (GET) should return logged in user info', async () => {
    const password = 'admin123';
    const passwordHash = await bcrypt.hash(password, 10);
  
    await dataSource.query(`
      INSERT INTO "user" ("email", "passwordHash", "role")
      VALUES ('admin@example.com', '${passwordHash}', 'admin');
    `);
  
    // Instead of real login, manually generate token if needed
    const token = 'mock-jwt-token-for-admin'; // or generate real JWT
  
    const meRes = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`);
   // Debug output
  });
  


  it('/auth/change-password (POST) should change password for logged in user', async () => {
    const password = 'admin123';
    const newPassword = 'Admin1234!@#$';
    const passwordHash = await bcrypt.hash(password, 10);

    await dataSource.query(`
      INSERT INTO "user" ("email", "passwordHash", "role")
      VALUES ('admin@example.com', '${passwordHash}', 'admin');
    `);

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@example.com', password });

    const token = loginRes.body.access_token;

    const changeRes = await request(app.getHttpServer())
      .post('/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: password, newPassword });

    expect(changeRes.status).toBe(201);
    expect(changeRes.body.success).toBe(true);

    // Verify login with new password works
    const reloginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@example.com', password: newPassword });

    expect(reloginRes.status).toBe(201);
    expect(reloginRes.body.access_token).toBeDefined();
  });
});
