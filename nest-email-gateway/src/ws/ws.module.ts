import { Module } from '@nestjs/common';
import { RedisModule } from '../shared/redis.module';
import { WsGateway } from './ws.gateway';

@Module({
  imports: [RedisModule],
  providers: [WsGateway],
  exports: [WsGateway],
})
export class WsModule {}
