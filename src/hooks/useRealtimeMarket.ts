import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';

interface LiveQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  timestamp: number;
  volume?: number;
  bid?: number;
  ask?: number;
}

interface UseRealtimeMarketReturn {
  quotes: Record<string, LiveQuote>;
  isConnected: boolean;
  subscribe: (symbols: string[]) => void;
  unsubscribe: (symbols: string[]) => void;
  reconnect: () => void;
}

const WS_URL = `wss://gllbecnpkvnxfhmxuinq.supabase.co/functions/v1/realtime-market`;

/**
 * Real-time market data hook using WebSockets
 */
export function useRealtimeMarket(initialSymbols: string[] = []): UseRealtimeMarketReturn {
  const [quotes, setQuotes] = useState<Record<string, LiveQuote>>({});
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();

  const connect = () => {
    try {
      const ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        console.log('[QuantSuite] WebSocket connected to real-time market data');
        setIsConnected(true);

        // Subscribe to initial symbols
        if (initialSymbols.length > 0) {
          ws.send(JSON.stringify({ action: 'subscribe', symbols: initialSymbols }));
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'quote') {
            const quote: LiveQuote = {
              symbol: data.symbol,
              price: data.price,
              change: data.change,
              changePercent: data.changePercent,
              timestamp: data.timestamp || Date.now(),
              volume: data.volume,
              bid: data.bid,
              ask: data.ask,
            };

            setQuotes((prev) => ({
              ...prev,
              [quote.symbol]: quote,
            }));
          } else if (data.type === 'error') {
            console.error('[QuantSuite] WebSocket error:', data.message);
            toast({
              title: 'Market Data Error',
              description: data.message,
              variant: 'destructive',
            });
          }
        } catch (error) {
          console.error('[QuantSuite] Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('[QuantSuite] WebSocket error:', error);
        setIsConnected(false);
      };

      ws.onclose = () => {
        console.log('[QuantSuite] WebSocket closed, attempting reconnect...');
        setIsConnected(false);

        // Exponential backoff reconnection
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('[QuantSuite] Failed to connect WebSocket:', error);
      setIsConnected(false);
    }
  };

  const subscribe = (symbols: string[]) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: 'subscribe', symbols }));
    }
  };

  const unsubscribe = (symbols: string[]) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: 'unsubscribe', symbols }));
    }
  };

  const reconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    connect();
  };

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return {
    quotes,
    isConnected,
    subscribe,
    unsubscribe,
    reconnect,
  };
}
