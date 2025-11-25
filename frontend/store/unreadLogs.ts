import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UnreadLogsState {
  unreadCount: number;
  increment: () => void;
  reset: () => void;
}

export const useUnreadLogsStore = create(
  persist<UnreadLogsState>(
    (set) => ({
      unreadCount: 0,
      increment: () => set((state) => ({ unreadCount: state.unreadCount + 1 })),
      reset: () => set({ unreadCount: 0 }),
    }),
    { name: 'unread-logs' }
  )
);