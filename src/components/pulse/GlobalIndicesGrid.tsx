import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface IndexData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  region: string;
  type: string;
}

const FALLBACK_INDICES: IndexData[] = [
  { symbol: 'SPX', name: 'S&P 500', price: 5842.50, change: 23.75, changePercent: 0.41, region: 'Americas', type: 'index' },
  { symbol: 'NDX', name: 'NASDAQ', price: 20645.00, change: -87.25, changePercent: -0.42, region: 'Americas', type: 'index' },
  { symbol: 'DJI', name: 'DOW', price: 43125.00, change: 156.00, changePercent: 0.36, region: 'Americas', type: 'index' },
  { symbol: 'VIX', name: 'VIX', price: 18.42, change: 1.85, changePercent: 11.16, region: 'Americas', type: 'index' },
  { symbol: 'UKX', name: 'FTSE 100', price: 8432.10, change: 45.20, changePercent: 0.54, region: 'Europe', type: 'index' },
  { symbol: 'DAX', name: 'DAX', price: 19450.30, change: -120.40, changePercent: -0.61, region: 'Europe', type: 'index' },
  { symbol: 'CAC', name: 'CAC 40', price: 8120.50, change: -15.20, changePercent: -0.19, region: 'Europe', type: 'index' },
  { symbol: 'N225', name: 'NIKKEI', price: 39540.00, change: 320.50, changePercent: 0.82, region: 'Asia', type: 'index' },
  { symbol: 'HSI', name: 'HANG SENG', price: 19450.20, change: -150.30, changePercent: -0.77, region: 'Asia', type: 'index' },
  { symbol: 'SHCOMP', name: 'SSE COMP', price: 3450.60, change: 12.40, changePercent: 0.36, region: 'Asia', type: 'index' },
  { symbol: 'TASI', name: 'TADAWUL', price: 12450.80, change: 85.30, changePercent: 0.69, region: 'MENA', type: 'index' },
  { symbol: 'DFMGI', name: 'DFM', price: 4250.20, change: 15.40, changePercent: 0.36, region: 'MENA', type: 'index' },
  { symbol: 'JTOPI', name: 'JSE TOP 40', price: 78450.00, change: -320.00, changePercent: -0.41, region: 'Africa', type: 'index' },
  { symbol: 'XJO', name: 'ASX 200', price: 8240.50, change: 45.20, changePercent: 0.55, region: 'Oceania', type: 'index' },
];

interface GlobalIndicesGridProps {
  region: string;
}

export function GlobalIndicesGrid({ region }: GlobalIndicesGridProps) {
  const { data: liveIndices } = useQuery({
    queryKey: ['pulse-market-quotes'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('fetch-pulse-markets');
      if (error) throw error;
      return data?.quotes as IndexData[] | undefined;
    },
    refetchInterval: 30000,
    retry: 1,
  });

  const sortedLive = (liveIndices || []).filter(q => q.type === 'index').sort((a, b) => b.price - a.price);
  const sortedFallback = FALLBACK_INDICES.filter(q => q.type === 'index').sort((a, b) => b.price - a.price);

  const filtered = sortedLive.length > 0 ? sortedLive : sortedFallback;

  // Determine market open status by region
  const getStatus = (r: string): 'open' | 'closed' => {
    const h = new Date().getUTCHours();
    if (['Americas'].includes(r)) return h >= 14 && h < 21 ? 'open' : 'closed';
    if (['Europe'].includes(r)) return h >= 8 && h < 16 ? 'open' : 'closed';
    if (['Asia'].includes(r)) return h >= 0 && h < 7 ? 'open' : 'closed';
    return 'closed';
  };

  if (filtered.length === 0) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="w-3.5 h-3.5 text-primary" />
          <h3 className="terminal-label text-foreground" style={{ fontSize: '11px' }}>MARKETS</h3>
        </div>
        <div className="terminal-label text-muted-foreground/40 text-center py-4">LOADING LIVE DATA…</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between mb-1 shrink-0 px-2 py-1">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-3.5 h-3.5 text-primary" />
          <h3 className="terminal-label text-foreground" style={{ fontSize: '11px' }}>MARKETS</h3>
        </div>
        <span className="terminal-label text-muted-foreground/40" style={{ fontSize: '8px' }}>
          Watchlist
        </span>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0" style={{ scrollbarWidth: 'none' }}>
        {/* Column headers */}
        <div className="flex items-center justify-between py-1 px-2 border-b border-white/[0.04] sticky top-0 bg-[#0a0b0d] z-10">
          <span className="terminal-label text-muted-foreground/30" style={{ fontSize: '8px' }}>NAME</span>
          <div className="flex items-center gap-4">
            <span className="terminal-label text-muted-foreground/30 w-[60px] text-right" style={{ fontSize: '8px' }}>PRICE</span>
            <span className="terminal-label text-muted-foreground/30 w-[45px] text-right" style={{ fontSize: '8px' }}>CHG%</span>
          </div>
        </div>

        {filtered.map((idx, i) => {
          const status = getStatus(idx.region);
          return (
            <motion.div
              key={idx.symbol}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.02 }}
              className="flex items-center justify-between py-1 px-2 hover:bg-white/[0.02] transition-colors group border-b border-white/[0.02]"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span className={cn(
                  'w-1.5 h-1.5 rounded-full shrink-0',
                  status === 'open' ? 'bg-emerald-500 shadow-[0_0_4px_#10b981]' : 'bg-zinc-700'
                )} />
                <span className="font-mono text-[10px] font-bold text-foreground/90 truncate tracking-wide">
                  {idx.name}
                </span>
                <span className="font-mono text-[8px] text-muted-foreground/40 ml-1 hidden sm:inline-block">
                  ({idx.region.substring(0, 3).toUpperCase()})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-foreground/70 w-[60px] text-right tabular-nums">
                  {idx.price.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                </span>
                <span className={cn(
                  'flex items-center gap-0 font-mono text-[9px] font-bold w-[45px] justify-end tabular-nums rounded px-0.5',
                  idx.change >= 0 ? 'text-[#00f5ff] bg-[#00f5ff]/10' : 'text-red-400 bg-red-400/10'
                )}>
                  {idx.change >= 0 ? '+' : ''}{idx.changePercent.toFixed(2)}%
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
