import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailController } from './mail.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Mailbox } from 'src/entities/mailbox.entity';
import { EventsModule } from '../events/events.module';
import { RedisModule } from '../shared/redis.module';

@Module({
  imports: [TypeOrmModule.forFeature([Mailbox]), EventsModule, RedisModule],
  providers: [MailService],
  controllers: [MailController],
})
export class MailModule {}
