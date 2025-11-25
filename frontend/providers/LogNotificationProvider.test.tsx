import React from 'react';
import { render, act, cleanup } from '@testing-library/react';

jest.mock('next/navigation', () => ({
    usePathname: jest.fn(),
}));

const incrementMock = jest.fn();
jest.mock('@/store/unreadLogs', () => ({
    useUnreadLogsStore: (selector: any) => selector({ increment: incrementMock }),
}));

const onMock = jest.fn();
const offMock = jest.fn();
const connectMock = jest.fn();
let socketConnected = false;
let registeredHandler: ((evt: { id: string | number }) => void) | null = null;

jest.mock('@/lib/socket', () => ({
    getSocket: () => ({
        connected: socketConnected,
        connect: connectMock,
        on: (event: string, handler: any) => {
            onMock(event, handler);
            if (event === 'email_event') registeredHandler = handler;
        },
        off: (event: string, handler: any) => offMock(event, handler),
    }),
}));

import { usePathname } from 'next/navigation';
import { LogNotificationProvider } from './LogNotificationProvider';

const renderWithProvider = (ui: React.ReactNode) => render(<LogNotificationProvider>{ui}</LogNotificationProvider>);

describe('LogNotificationProvider', () => {
    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();
        socketConnected = false;
        registeredHandler = null;
        (usePathname as jest.Mock).mockReturnValue('/somewhere');
    });

    afterEach(() => {
        cleanup();
    });

    test('connects when socket not connected and increments on new event (non-logs path)', () => {
        renderWithProvider(<div />);

        expect(connectMock).toHaveBeenCalled();
        expect(onMock).toHaveBeenCalledWith('email_event', expect.any(Function));

        act(() => {
            registeredHandler && registeredHandler({ id: 123 });
        });

        expect(incrementMock).toHaveBeenCalledTimes(1);

        act(() => {
            registeredHandler && registeredHandler({ id: 123 });
        });

        expect(incrementMock).toHaveBeenCalledTimes(1);
    });

    test('does not increment when on /dashboard/logs path', () => {
        (usePathname as jest.Mock).mockReturnValue('/dashboard/logs');

        renderWithProvider(<div />);

        act(() => {
            registeredHandler && registeredHandler({ id: 'abc' });
        });

        expect(incrementMock).not.toHaveBeenCalled();
    });

    test('subscribes on mount and unsubscribes on unmount with same handler', () => {
        const { unmount } = renderWithProvider(<div />);

        expect(onMock).toHaveBeenCalledWith('email_event', expect.any(Function));
        const handlerPassed = (onMock.mock.calls[0] || [])[1];

        unmount();

        expect(offMock).toHaveBeenCalledWith('email_event', handlerPassed);
    });
});
