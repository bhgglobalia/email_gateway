import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { WorkerModule } from '../worker/worker.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Mailbox } from '../entities/mailbox.entity';

@Module({
  imports: [WorkerModule, TypeOrmModule.forFeature([Mailbox])],
  controllers: [WebhooksController],
})
export class WebhooksModule {}
