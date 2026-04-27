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

  const connect = useCallback(() => {
    const ws = new WebSocket(WS_FEED_URL);

    ws.onopen = () => setConnected(true);
    ws.onclose = () => {
      setConnected(false);
      setTimeout(connect, 5000);
    };
    ws.onerror = () => ws.close();
    ws.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data) as FeedEvent;
        setEvents((prev) => [event, ...prev].slice(0, maxEvents));
      } catch { /* ignore non-JSON */ }
    };

    wsRef.current = ws;
  }, [maxEvents]);

  useEffect(() => {
    connect();
    return () => wsRef.current?.close();
  }, [connect]);

  return { events, connected };
}
