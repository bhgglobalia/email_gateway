import { Module } from '@nestjs/common';
import { MailboxesService } from './mailboxes.service';
import { MailboxesController } from './mailboxes.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Mailbox } from 'src/entities/mailbox.entity';
import { Client } from 'src/entities/client.entity';
import { WsModule } from '../ws/ws.module';

@Module({
  imports: [TypeOrmModule.forFeature([Mailbox, Client]), WsModule],
  providers: [MailboxesService],
  controllers: [MailboxesController],
  exports: [MailboxesService],
})
export class MailboxesModule {}
