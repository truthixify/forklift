import { useState, useEffect, useRef, useCallback } from 'react';
import { WS_FEED_URL } from '@/lib/config';

export interface FeedEvent {
  type: string;
  bountyId?: string;
  data?: Record<string, unknown>;
  blockNumber?: string;
  transactionHash?: string;
  timestamp: number;
}

export function useRealFeed(maxEvents = 60) {
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;

    try {
      const ws = new WebSocket(WS_FEED_URL);

      ws.onopen = () => { if (mountedRef.current) setConnected(true); };
      ws.onclose = () => {
        if (!mountedRef.current) return;
        setConnected(false);
        setTimeout(connect, 5000);
      };
      ws.onerror = () => { try { ws.close(); } catch {} };
      ws.onmessage = (e) => {
        if (!mountedRef.current) return;
        try {
          const event = JSON.parse(e.data) as FeedEvent;
          setEvents((prev) => [event, ...prev].slice(0, maxEvents));
        } catch {}
      };

      wsRef.current = ws;
    } catch {}
  }, [maxEvents]);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      try { wsRef.current?.close(); } catch {}
    };
  }, [connect]);

  return { events, connected };
}
