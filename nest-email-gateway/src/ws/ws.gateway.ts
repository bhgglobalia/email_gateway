import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Inject, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
 
@WebSocketGateway({ cors: { origin: process.env.FRONTEND_ORIGIN || '*' } })
export class WsGateway
  implements
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnModuleInit,
    OnModuleDestroy
{
  @WebSocketServer()
  server: Server;
 
  private logger = new Logger('WsGateway');
  private redisSub: Redis;
  private redisPub: Redis;
  private readonly REDIS_CHANNEL = 'ws-events';
  private notificationCount = 0;
  private readonly NOTIF_EVENT = 'notifications:new';
  private readonly NOTIF_COUNT_EVENT = 'notifications:count';
  private readonly NOTIF_COUNTER_KEY = 'ws:notifications:count';
 
  constructor(@Inject('REDIS_CLIENT') private readonly redisClient: Redis) {}
 
  afterInit() {
    this.logger.log('ws init');
  }
 
  async onModuleInit() {
    this.redisSub = this.redisClient.duplicate();
    this.redisPub = this.redisClient.duplicate();
    await this.redisSub.subscribe(this.REDIS_CHANNEL);
    this.logger.log('Redis pub/sub connected for WebSocket events');
    this.redisSub.on('message', (channel, message) => {
      if (channel === this.REDIS_CHANNEL) {
        try {
          const { event, payload, count } = JSON.parse(message);
          if (event === this.NOTIF_EVENT && typeof count === 'number') {
            this.notificationCount = count;
            this.server.emit(this.NOTIF_COUNT_EVENT, { count });
            this.server.emit(this.NOTIF_EVENT, payload);
          } else {
            this.emit(event, payload, true);
          }
        } catch (e) {
          this.logger.error('Failed to parse Redis pubsub message', e);
        }
      }
    });
  }
 
  async onModuleDestroy() {
    if (this.redisSub) await this.redisSub.quit();
    if (this.redisPub) await this.redisPub.quit();
  }
 
  handleConnection(client: Socket) {
    this.logger.log(`client connected: ${client.id}`);
    void this.redisClient
      .get(this.NOTIF_COUNTER_KEY)
      .then((val) => Number(val) || 0)
      .then((cnt) => {
        this.notificationCount = cnt;
        this.server.emit(this.NOTIF_COUNT_EVENT, { count: cnt });
      })
      .catch((e) => this.logger.error('Failed to fetch notification count', e));
  }
 
  handleDisconnect(client: Socket) {
    this.logger.log(`client disconnected: ${client.id}`);
  }
 
  async notify(payload: { title?: string; message: string; meta?: any }) {
    await this.emit(this.NOTIF_EVENT, payload);
  }
 
  async emit(event: string, payload: any, fromRedis = false) {
    if (fromRedis) {
      this.server.emit(event, payload);
      return;
    }
    if (this.redisPub) {
      let countToPublish: number | undefined;
      if (event === this.NOTIF_EVENT) {
        const newCount = await this.redisClient.incr(this.NOTIF_COUNTER_KEY);
        this.notificationCount = newCount;
        countToPublish = newCount;
        this.logger.log(`notification count=${newCount}`);
      }
      void this.redisPub.publish(
        this.REDIS_CHANNEL,
        JSON.stringify(
          countToPublish !== undefined
            ? { event, payload, count: countToPublish }
            : { event, payload },
        ),
      );
    } else {
      if (event === this.NOTIF_EVENT) {
        this.notificationCount += 1;
        this.logger.log(`notification count=${this.notificationCount}`);
        this.server.emit(this.NOTIF_COUNT_EVENT, { count: this.notificationCount });
      }
      this.server.emit(event, payload);
    }
  }
}