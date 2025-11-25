import { Test, TestingModule } from '@nestjs/testing';
import { WsGateway } from './ws.gateway';
import Redis from 'ioredis';
import { Logger } from '@nestjs/common';

describe('WsGateway', () => {
  let gateway: WsGateway;
  let redisMock: any;
  let serverMock: any;

  beforeEach(async () => {
    redisMock = {
      duplicate: jest.fn().mockReturnThis(),
      subscribe: jest.fn(),
      on: jest.fn(),
      quit: jest.fn(),
      get: jest.fn().mockResolvedValue('3'),
      incr: jest.fn().mockResolvedValue(4),
      publish: jest.fn(),
    };

    serverMock = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: 'REDIS_CLIENT',
          useValue: redisMock,
        },
        WsGateway,
      ],
    }).compile();

    gateway = module.get(WsGateway);
    gateway['server'] = serverMock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  it('should log after init', () => {
    const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    gateway.afterInit();
    expect(logSpy).toHaveBeenCalledWith('ws init');
  });

  it('should setup redis connections on module init', async () => {
    const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    await gateway.onModuleInit();
    expect(redisMock.duplicate).toHaveBeenCalledTimes(2);
    expect(redisMock.subscribe).toHaveBeenCalledWith('ws-events');
    expect(logSpy).toHaveBeenCalledWith('Redis pub/sub connected for WebSocket events');
  });

  it('should handle redis message event and emit notifications', async () => {
    await gateway.onModuleInit();
    const messageHandler = redisMock.on.mock.calls.find(
      ([event]: [string, any]) => event === 'message',
    )?.[1];
    const message = JSON.stringify({
      event: 'notifications:new',
      payload: { msg: 'hello' },
      count: 5,
    });
    await messageHandler?.('ws-events', message);
    expect(serverMock.emit).toHaveBeenCalledWith('notifications:count', { count: 5 });
    expect(serverMock.emit).toHaveBeenCalledWith('notifications:new', { msg: 'hello' });
  });

  it('should handle invalid JSON in redis message gracefully', async () => {
    const errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    await gateway.onModuleInit();
    const messageHandler = redisMock.on.mock.calls.find(
      ([event]: [string, any]) => event === 'message',
    )?.[1];
    await messageHandler?.('ws-events', 'INVALID_JSON');
    expect(errorSpy).toHaveBeenCalled();
  });

  it('should handle redis message with custom event', async () => {
    await gateway.onModuleInit();
    const messageHandler = redisMock.on.mock.calls.find(
      ([event]: [string, any]) => event === 'message',
    )?.[1];
    const message = JSON.stringify({
      event: 'custom:event',
      payload: { hello: 'world' },
    });
    await messageHandler?.('ws-events', message);
    expect(serverMock.emit).toHaveBeenCalledWith('custom:event', { hello: 'world' });
  });

  it('should quit redis connections on module destroy', async () => {
    gateway['redisSub'] = redisMock;
    gateway['redisPub'] = redisMock;
    await gateway.onModuleDestroy();
    expect(redisMock.quit).toHaveBeenCalledTimes(2);
  });

  it('should handle connection and emit notification count', async () => {
    const client = { id: '123' } as any;
    await gateway.handleConnection(client);
    await new Promise(process.nextTick);
    expect(redisMock.get).toHaveBeenCalledWith('ws:notifications:count');
    expect(serverMock.emit).toHaveBeenCalledWith('notifications:count', { count: 3 });
  });

  it('should handle disconnection and log', () => {
    const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    const client = { id: '456' } as any;
    gateway.handleDisconnect(client);
    expect(logSpy).toHaveBeenCalledWith(`client disconnected: ${client.id}`);
  });

  it('should notify and emit new notification event', async () => {
    jest.spyOn(gateway, 'emit').mockResolvedValueOnce(undefined);
    await gateway.notify({ message: 'New Msg' });
    expect(gateway.emit).toHaveBeenCalledWith('notifications:new', { message: 'New Msg' });
  });

  it('should emit custom event via fallback if redisPub is missing', async () => {
    gateway['redisPub'] = undefined as unknown as Redis;
    const serverEmitSpy = jest.spyOn(gateway['server'], 'emit');
    await gateway.emit('custom:event', { foo: 'bar' });
    expect(serverEmitSpy).toHaveBeenCalledWith('custom:event', { foo: 'bar' });
  });

  it('should emit event directly if fromRedis is true', async () => {
    await gateway.emit('custom:event', { foo: 'bar' }, true);
    expect(serverMock.emit).toHaveBeenCalledWith('custom:event', { foo: 'bar' });
  });

  it('should emit notification event via redis publish', async () => {
    await gateway.onModuleInit();
    await gateway.emit('notifications:new', { text: 'Hi' });
    expect(redisMock.publish).toHaveBeenCalled();
    expect(redisMock.incr).toHaveBeenCalledWith('ws:notifications:count');
  });

  it('should emit when redisPub is missing (fallback mode)', async () => {
    gateway['redisPub'] = undefined as unknown as Redis;
    gateway['notificationCount'] = 1;
    await gateway.emit('notifications:new', { text: 'Offline' });
    expect(serverMock.emit).toHaveBeenCalledWith('notifications:count', { count: 2 });
  });
});
