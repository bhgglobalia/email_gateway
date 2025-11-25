import { render, cleanup } from '@testing-library/react';


const socketMock = {
    id: 'id-1',
    connected: false,
    connect: jest.fn(),
    disconnect: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    onAny: jest.fn(),
    offAny: jest.fn(),
};

jest.mock('@/lib/socket', () => ({
    getSocket: jest.fn(() => socketMock),
}));


import { useSocket } from './useSocket';

function Harness({ onEvent }: { onEvent?: (e: string, d: unknown) => void }) {
    useSocket(onEvent);
    return <div />;
}

describe('useSocket', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        socketMock.connected = false;
    });

    afterEach(() => {
        cleanup();
    });

    test('connects when not connected and registers/unregisters handlers, disconnects on last unmount', () => {
        const { unmount } = render(<Harness />);

        expect(socketMock.connect).toHaveBeenCalled();
        expect(socketMock.on).toHaveBeenCalledWith('connect', expect.any(Function));
        expect(socketMock.on).toHaveBeenCalledWith('disconnect', expect.any(Function));

        unmount();

        expect(socketMock.off).toHaveBeenCalledWith('connect', expect.any(Function));
        expect(socketMock.off).toHaveBeenCalledWith('disconnect', expect.any(Function));
        expect(socketMock.disconnect).toHaveBeenCalled();
    });

    test('multiple consumers: disconnect only when last unmount happens', () => {
        const first = render(<Harness />);
        const second = render(<Harness />);

        expect(socketMock.connect).toHaveBeenCalledTimes(2);

        second.unmount();
        expect(socketMock.disconnect).not.toHaveBeenCalled();

        first.unmount();
        expect(socketMock.disconnect).toHaveBeenCalled();
    });

    test('onEvent registers onAny/offAny', () => {
        const handler = jest.fn();
        const { unmount } = render(<Harness onEvent={handler} />);

        expect(socketMock.onAny).toHaveBeenCalledWith(handler);

        unmount();

        expect(socketMock.offAny).toHaveBeenCalledWith(handler);
    });

    test('no-op when getSocket returns null', async () => {
        const { getSocket } = await import('@/lib/socket');
        (getSocket as jest.Mock).mockReturnValueOnce(null);

        const { unmount } = render(<Harness />);
        unmount();

        expect(socketMock.connect).not.toHaveBeenCalled();
        expect(socketMock.on).not.toHaveBeenCalled();
    });
});
