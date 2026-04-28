import { useEffect, useState } from 'react';
import { ws } from '@/lib/ws';
import type { Quote } from '@/types/market';

export function useQuote(symbol: string) {
  const [quote, setQuote] = useState<Quote | null>(null);

  useEffect(() => {
    // We use "mock" for setup
    ws.connect('mock');

    ws.send({ type: 'subscribe', symbol });
    const unsub = ws.subscribe(`quote:${symbol}`, (data) => {
      setQuote(data as Quote);
    });

    return () => {
      unsub();
      ws.send({ type: 'unsubscribe', symbol });
    };
  }, [symbol]);

  return quote;
}
