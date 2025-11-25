import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { User } from './entities/user.entity';
import { Client } from './entities/client.entity';
import { Mailbox } from './entities/mailbox.entity';
import { Event } from './entities/event.entity';
import { ClientsModule } from './clients/clients.module';
import { MailboxesModule } from './mailboxes/mailboxes.module';
import { EventsModule } from './events/events.module';
import { WsModule } from './ws/ws.module';
import { MailModule } from './mail/mail.module';
import { SystemModule } from './system/system.module';
import { ConfigModule } from '@nestjs/config';
import { SettingsModule } from './settings/settings.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { WorkerModule } from './worker/worker.module';
import { validationSchema } from './config/env.validation';
import { HttpLoggerMiddleware } from './middleware/http-logger.middleware';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    CacheModule.register({
      isGlobal: true,
      ttl: 300000,
      max: 100,
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
      validationOptions: { allowUnknown: true, abortEarly: true },
      envFilePath: ['.env'],
      expandVariables: true,
      cache: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 10,
      },
    ]),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      synchronize: process.env.NODE_ENV !== 'production',
      logging: false,
      entities: [User, Client, Mailbox, Event],
      migrations: ['dist/migrations/*.js'],
      migrationsRun: true,
    }),
    AuthModule,
    ClientsModule,
    MailboxesModule,
    EventsModule,
    WsModule,
    MailModule,
    SystemModule,
    SettingsModule,
    WebhooksModule,
    WorkerModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HttpLoggerMiddleware).forRoutes('*');
  }
}
