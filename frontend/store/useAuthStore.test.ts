jest.mock('@/lib/api', () => {
    return {
        api: {
            post: jest.fn(),
            defaults: { headers: { common: {} as Record<string, string> } },
        },
    };
});

describe('useAuthStore', () => {
    const USER = { id: 'u1', name: 'Test User', email: 't@example.com' } as any;

    beforeEach(() => {
        jest.resetModules();
        localStorage.clear();
        jest.clearAllMocks();
    });

    test('login success sets token, user, and Authorization header', async () => {
        const { api } = await import('@/lib/api');
        (api.post as jest.Mock).mockResolvedValue({ data: { success: true, token: 'abc', user: USER } });

        const { useAuthStore } = await import('./useAuthStore');

        await useAuthStore.getState().login('e', 'p');

        expect(localStorage.getItem('token')).toBe('abc');
        expect(api.defaults.headers.common['Authorization']).toBe('Bearer abc');
        expect(useAuthStore.getState().token).toBe('abc');
        expect(useAuthStore.getState().user).toEqual(USER);
    });

    test('login failure throws and does not set state', async () => {
        const { api } = await import('@/lib/api');
        (api.post as jest.Mock).mockResolvedValue({ data: { success: false, message: 'Invalid credentials' } });

        const { useAuthStore } = await import('./useAuthStore');

        await expect(useAuthStore.getState().login('e', 'p')).rejects.toThrow('Invalid credentials');
        expect(localStorage.getItem('token')).toBeNull();
        expect(useAuthStore.getState().token).toBeNull();
        expect(useAuthStore.getState().user).toBeNull();
    });

    test('logout clears storage, headers, and resets state', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

        const { api } = await import('@/lib/api');
        (api.post as jest.Mock).mockResolvedValue({ data: { success: true, token: 'abc', user: USER } });

        const { useAuthStore } = await import('./useAuthStore');

        await useAuthStore.getState().login('e', 'p');

        expect(localStorage.getItem('token')).toBe('abc');

        useAuthStore.getState().logout();

        expect(localStorage.getItem('token')).toBeNull();
        expect(api.defaults.headers.common['Authorization']).toBeUndefined();
        expect(useAuthStore.getState().user).toBeNull();
        expect(useAuthStore.getState().token).toBeNull();

        consoleErrorSpy.mockRestore();
    });
});
