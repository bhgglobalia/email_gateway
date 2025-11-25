import { Module } from '@nestjs/common';
import { SystemService } from './system.service';
import { SystemController } from './system.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Mailbox } from 'src/entities/mailbox.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Mailbox])],
  providers: [SystemService],
  controllers: [SystemController],
})
export class SystemModule {}
