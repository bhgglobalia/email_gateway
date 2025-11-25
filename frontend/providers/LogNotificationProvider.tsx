
"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useUnreadLogsStore } from "@/store/unreadLogs";
import { getSocket } from "@/lib/socket";

export function LogNotificationProvider({ children }: { children: React.ReactNode }) {
  const incrementUnread = useUnreadLogsStore((s) => s.increment);
  const pathname = usePathname();
  const seenEventIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    if (!socket.connected) socket.connect();
    const handler = (event: { id: number | string }) => {
      const eventId = String(event.id);

      if (eventId && !seenEventIdsRef.current.has(eventId) &&
        pathname !== "/dashboard/logs") {
        seenEventIdsRef.current.add(eventId);
        incrementUnread();
      }
    };
    socket.on("email_event", handler);
    return () => {
      socket.off("email_event", handler);
    };
  }, [pathname, incrementUnread]);

  return <>{children}</>;
}
