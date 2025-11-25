"use client";
import { useEffect } from "react";
import { getSocket } from "@/lib/socket";

let socketUsers = 0; 

export const useSocket = (onEvent?: (event: string, data: unknown) => void) => {
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    socketUsers += 1;

    if (!socket.connected) {
      socket.connect();
    }
    

    
    
    const handleConnect = () => {
      console.log("Connected to WebSocket:", socket.id);
    };
    const handleDisconnect = () => {
      console.log("Disconnected from WebSocket");
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    if (onEvent) {
      socket.onAny(onEvent);
    }

    return () => {
      socketUsers -= 1;

      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);

      if (onEvent) {
        socket.offAny(onEvent);
      }

      if (socketUsers <= 0) {
        socket.disconnect();
        console.log(" Socket fully disconnected (no active listeners)");
      }
    };
  }, [onEvent]);
};
