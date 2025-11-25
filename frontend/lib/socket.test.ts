describe('getSocket', () => {
  const ORIGINAL_ENV = process.env;
  const originalWindow = (global as any).window;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    (global as any).window = originalWindow;
    jest.clearAllMocks();
  });

  // Server-side branch is exercised in env tests; here we focus on client behavior

  test('creates socket with correct URL and options on first call', async () => {
    (global as any).window = {};
    process.env.NEXT_PUBLIC_WS_URL = 'https://ws.example.com';

    jest.doMock('socket.io-client', () => ({
      io: jest.fn(() => ({ id: 'socket-1' })),
    }));

    const { getSocket } = await import('./socket');
    const { io } = await import('socket.io-client');

    const s1 = getSocket();
    expect(s1).toBeTruthy();
    expect((io as unknown as jest.Mock).mock.calls[0][0]).toBe('https://ws.example.com');
    expect((io as unknown as jest.Mock).mock.calls[0][1]).toEqual(
      expect.objectContaining({
        transports: ['websocket'],
        autoConnect: false,
        reconnection: true,
      })
    );
  });

  test('returns same singleton on subsequent calls (io called once)', async () => {
    (global as any).window = {};
    process.env.NEXT_PUBLIC_WS_URL = 'http://singleton.test';

    jest.doMock('socket.io-client', () => ({
      io: jest.fn(() => ({ id: 'socket-singleton' })),
    }));

    const { getSocket } = await import('./socket');
    const { io } = await import('socket.io-client');

    const s1 = getSocket();
    const s2 = getSocket();

    expect(s1).toBe(s2);
    expect((io as unknown as jest.Mock).mock.calls.length).toBe(1);
  });
});
