/** @jest-environment node */
describe('env module', () => {
    const ORIGINAL_ENV = process.env;
    const originalNodeEnv = process.env.NODE_ENV;
    const originalWindow = (global as any).window;
    let warnSpy: jest.SpyInstance;

    beforeEach(() => {
        jest.resetModules();
        process.env = { ...ORIGINAL_ENV };
        warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });
    });

    afterEach(() => {
        process.env = ORIGINAL_ENV;
        (global as any).window = originalWindow;
        (process as any).env.NODE_ENV = originalNodeEnv;
        warnSpy.mockRestore();
    });

    test('uses provided NEXT_PUBLIC_API_URL and NEXT_PUBLIC_WS_URL', async () => {
        process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com';
        process.env.NEXT_PUBLIC_WS_URL = 'https://ws.example.com';

        const { env } = await import('./env');

        expect(env.API_URL).toBe('https://api.example.com');
        expect(env.WS_URL).toBe('https://ws.example.com');
    });

    test('WS_URL falls back to NEXT_PUBLIC_API_URL when WS not set', async () => {
        process.env.NEXT_PUBLIC_API_URL = 'https://api.only.com';
        delete process.env.NEXT_PUBLIC_WS_URL;

        const { env } = await import('./env');

        expect(env.WS_URL).toBe('https://api.only.com');
    });

    test('both fall back to localhost when unset', async () => {
        delete process.env.NEXT_PUBLIC_API_URL;
        delete process.env.NEXT_PUBLIC_WS_URL;

        const { env } = await import('./env');

        expect(env.API_URL).toBe('http://localhost:3000');
        expect(env.WS_URL).toBe('http://localhost:3000');
    });

    test('warns on server when required env missing and NODE_ENV !== test', async () => {
        delete process.env.NEXT_PUBLIC_API_URL;
        delete process.env.NEXT_PUBLIC_WS_URL;
        (process as any).env.NODE_ENV = 'production';

        const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });
        jest.isolateModules(() => {
            require('./env');
        });
        expect(warnSpy).toHaveBeenCalledWith('Missing environment variable: NEXT_PUBLIC_API_URL');
        warnSpy.mockRestore();
    });
});
