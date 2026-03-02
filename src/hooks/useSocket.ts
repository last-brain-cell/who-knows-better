"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Socket } from "socket.io-client";
import { connectSocket, disconnectSocket } from "@/lib/socket";

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [ping, setPing] = useState<number | null>(null);

  useEffect(() => {
    const socket = connectSocket();
    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("pong_server", (serverTimestamp: number) => {
      setPing(Date.now() - serverTimestamp);
    });

    // Ping every 5 seconds
    const pingInterval = setInterval(() => {
      if (socket.connected) {
        socket.emit("ping_server");
      }
    }, 5000);

    return () => {
      clearInterval(pingInterval);
      disconnectSocket();
    };
  }, []);

  const emit = useCallback((event: string, ...args: any[]) => {
    socketRef.current?.emit(event, ...args);
  }, []);

  const on = useCallback((event: string, handler: (...args: any[]) => void) => {
    socketRef.current?.on(event, handler);
    return () => {
      socketRef.current?.off(event, handler);
    };
  }, []);

  return { socket: socketRef.current, connected, ping, emit, on };
}
