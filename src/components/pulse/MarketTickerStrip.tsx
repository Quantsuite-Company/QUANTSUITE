import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TickerData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  type: string;
}

const FALLBACK_TICKERS: TickerData[] = [
  { symbol: 'SPX', name: 'S&P 500', price: 5842.50, change: 23.75, changePercent: 0.41, type: 'index' },
  { symbol: 'NDX', name: 'NASDAQ', price: 20645.00, change: -87.25, changePercent: -0.42, type: 'index' },
  { symbol: 'DJI', name: 'DOW', price: 43125.00, change: 156.00, changePercent: 0.36, type: 'index' },
  { symbol: 'RUT', name: 'Russell 2K', price: 2089.30, change: -12.40, changePercent: -0.59, type: 'index' },
  { symbol: 'CL', name: 'Crude Oil', price: 78.42, change: 1.23, changePercent: 1.59, type: 'commodity' },
  { symbol: 'GC', name: 'Gold', price: 2945.80, change: 18.60, changePercent: 0.64, type: 'commodity' },
  { symbol: 'SI', name: 'Silver', price: 33.28, change: -0.42, changePercent: -1.25, type: 'commodity' },
  { symbol: 'BTC', name: 'Bitcoin', price: 91450.00, change: 2340.00, changePercent: 2.63, type: 'crypto' },
  { symbol: 'ETH', name: 'Ethereum', price: 3420.15, change: -45.30, changePercent: -1.31, type: 'crypto' },
  { symbol: 'DXY', name: 'US Dollar', price: 104.25, change: -0.18, changePercent: -0.17, type: 'forex' },
  { symbol: 'TNX', name: '10Y Yield', price: 4.285, change: 0.032, changePercent: 0.75, type: 'forex' },
  { symbol: 'VIX', name: 'VIX', price: 18.42, change: 1.85, changePercent: 11.16, type: 'forex' },
];

export function MarketTickerStrip() {
  const { data: liveData } = useQuery({
    queryKey: ['pulse-market-quotes'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('fetch-pulse-markets');
      if (error) throw error;
      return data?.quotes as TickerData[] | undefined;
    },
    refetchInterval: 30000,
    retry: 1,
  });

  const tickers = liveData?.length ? liveData : FALLBACK_TICKERS;

  const formatPrice = (t: TickerData) => {
    if (t.price < 10) return t.price.toFixed(3);
    if (t.price < 1000) return t.price.toFixed(2);
    return t.price.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  return (
    <div className="relative overflow-hidden bg-[hsl(220,26%,2%)] border-b border-border/15">
      {/* LIVE badge on left */}
      <div className="absolute left-0 top-0 bottom-0 z-20 flex items-center pl-3 pr-6 bg-gradient-to-r from-[hsl(220,26%,2%)] via-[hsl(220,26%,2%)] to-transparent">
        <div className="flex items-center gap-1.5">
          <div className="live-dot" style={{ width: 6, height: 6 }} />
          <span className="terminal-label text-red-400" style={{ fontSize: '8px' }}>LIVE</span>
        </div>
      </div>

      {/* Right fade */}
      <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[hsl(220,26%,2%)] to-transparent z-10" />

      {/* Scrolling ticker tape */}
      <div
        className="flex animate-scroll-x gap-6 py-1.5 pl-20 pr-4"
        style={{ width: 'max-content' }}
      >
        {[...tickers, ...tickers].map((t, i) => (
          <div key={`${t.symbol}-${i}`} className="flex items-center gap-2 shrink-0">
            {/* Symbol */}
            <span className="font-mono text-[11px] font-bold text-foreground/90 tracking-wide">
              {t.symbol}
            </span>

            {/* Price */}
            <span className="font-mono text-[11px] text-foreground/60">
              {formatPrice(t)}
            </span>

            {/* Change % with arrow */}
            <span className={cn(
              'flex items-center gap-0.5 font-mono text-[10px] font-bold',
              t.change >= 0 ? 'text-emerald-400' : 'text-red-400'
            )}>
              {t.change >= 0
                ? <TrendingUp className="w-2.5 h-2.5" />
                : <TrendingDown className="w-2.5 h-2.5" />
              }
              {t.change >= 0 ? '+' : ''}{t.changePercent.toFixed(2)}%
            </span>

            {/* Separator */}
            <span className="text-border/15 text-[8px] select-none">•</span>
          </div>
        ))}
      </div>
    </div>
  );
}
