describe('useUnreadLogsStore (persisted zustand store)', () => {
    const STORE_KEY = 'unread-logs';

    beforeEach(() => {
        localStorage.clear();
        jest.resetModules();
    });

    test('initial state unreadCount is 0', async () => {
        const { useUnreadLogsStore } = await import('./unreadLogs');

        expect(useUnreadLogsStore.getState().unreadCount).toBe(0);
    });

    test('increment increases unreadCount', async () => {
        const { useUnreadLogsStore } = await import('./unreadLogs');

        useUnreadLogsStore.getState().increment();
        expect(useUnreadLogsStore.getState().unreadCount).toBe(1);
    });

    test('reset sets unreadCount back to 0', async () => {
        const { useUnreadLogsStore } = await import('./unreadLogs');

        useUnreadLogsStore.getState().increment();
        useUnreadLogsStore.getState().increment();
        expect(useUnreadLogsStore.getState().unreadCount).toBe(2);

        useUnreadLogsStore.getState().reset();
        expect(useUnreadLogsStore.getState().unreadCount).toBe(0);
    });

    test('persistence writes to localStorage with current state', async () => {
        const { useUnreadLogsStore } = await import('./unreadLogs');

        useUnreadLogsStore.getState().increment();
        useUnreadLogsStore.getState().increment();

        const raw = localStorage.getItem(STORE_KEY);
        expect(raw).toBeTruthy();
        const parsed = JSON.parse(raw as string);
        expect(parsed.state.unreadCount).toBe(2);
    });

    test('rehydration reads state from localStorage on fresh import', async () => {
        localStorage.setItem(
            STORE_KEY,
            JSON.stringify({ state: { unreadCount: 5 }, version: 0 })
        );

        const { useUnreadLogsStore } = await import('./unreadLogs');

        await new Promise((r) => setTimeout(r, 0));

        expect(useUnreadLogsStore.getState().unreadCount).toBe(5);
    });
});
