import { Module } from '@nestjs/common';
import { WorkerService } from './worker.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Mailbox } from '../entities/mailbox.entity';
import { EventsModule } from '../events/events.module';
import { RedisModule } from '../shared/redis.module';

@Module({
  imports: [TypeOrmModule.forFeature([Mailbox]), EventsModule, RedisModule],
  providers: [WorkerService],
  exports: [WorkerService],
})
export class WorkerModule {}
