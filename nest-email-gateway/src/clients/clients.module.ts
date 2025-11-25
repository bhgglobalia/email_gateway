import { Module } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { ClientsController } from './clients.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Client } from 'src/entities/client.entity';
import { Mailbox } from 'src/entities/mailbox.entity';

import { WsModule } from '../ws/ws.module';

@Module({
  imports: [TypeOrmModule.forFeature([Client, Mailbox]), WsModule],
  providers: [ClientsService],
  controllers: [ClientsController],
})
export class ClientsModule {}
