'use client';
import { useEffect, useRef, useCallback, useState } from 'react';

// Auto-detect wss:// or ws:// from the API URL
const _apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/$/, '');
const WS_URL = _apiUrl.replace(/^https:\/\//, 'wss://').replace(/^http:\/\//, 'ws://');

interface WSMessage {
  type: string;
  [key: string]: unknown;
}

export function useWebSocket(onMessage: (msg: WSMessage) => void) {
  const ws = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) return;

    try {
      ws.current = new WebSocket(`${WS_URL}/ws/${token}`);

      ws.current.onopen = () => {
        setConnected(true);
        // Ping every 25s to keep alive
        const ping = setInterval(() => {
          if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send('ping');
          } else {
            clearInterval(ping);
          }
        }, 25000);
      };

      ws.current.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          onMessage(msg);
        } catch {}
      };

      ws.current.onclose = () => {
        setConnected(false);
        // Reconnect after 3s
        reconnectTimer.current = setTimeout(connect, 3000);
      };

      ws.current.onerror = () => {
        ws.current?.close();
      };
    } catch {}
  }, [onMessage]);

  useEffect(() => {
    connect();
    return () => {
      reconnectTimer.current && clearTimeout(reconnectTimer.current);
      ws.current?.close();
    };
  }, [connect]);

  return { connected };
}
