'use client';

import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { getApiAccessToken } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export function useDirectMessagesSocket(enabled = true) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const accessToken = useAuthStore((state) => state.accessToken);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!enabled || !isAuthenticated) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setSocket(null);
      setConnected(false);
      return;
    }
    const token = accessToken ?? getApiAccessToken();
    if (!token) return;

    const instance = io(`${API_URL}/messages`, {
      auth: { token },
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
    });
    socketRef.current = instance;
    setSocket(instance);
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    instance.on('connect', onConnect);
    instance.on('disconnect', onDisconnect);

    return () => {
      instance.off('connect', onConnect);
      instance.off('disconnect', onDisconnect);
      instance.disconnect();
      socketRef.current = null;
      setSocket(null);
      setConnected(false);
    };
  }, [accessToken, enabled, isAuthenticated]);

  return { socket, connected };
}
