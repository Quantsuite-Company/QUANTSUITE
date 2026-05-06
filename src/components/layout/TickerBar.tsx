import { useQuote } from '@/hooks/useQuote';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const TICKER_SYMBOLS = ['AAPL', 'MSFT', 'BTC/USD', 'ETH/USD', 'TSLA', 'NVDA', 'SPY', 'QQQ'];

function TickerItem({ symbol }: { symbol: string }) {
  const quote = useQuote(symbol);

  if (!quote) return null;

  const isUp = quote.change >= 0;

  return (
    <div className="flex items-center gap-2 group px-4 border-r border-white/5 whitespace-nowrap">
      <span className="font-mono text-[11px] font-bold text-white/80 group-hover:text-white transition-colors">
        {symbol}
      </span>
      <span className={cn(
        "font-mono text-[11px] tabular-nums font-bold",
        isUp ? "text-positive" : "text-negative"
      )}>
        {quote.price.toFixed(2)}
      </span>
      <span className={cn(
        "flex items-center font-mono text-[10px] px-1 py-0.5 rounded",
        isUp ? "bg-positive/10 text-positive" : "bg-negative/10 text-negative"
      )}>
        {isUp ? <TrendingUp className="w-2.5 h-2.5 mr-0.5" /> : <TrendingDown className="w-2.5 h-2.5 mr-0.5" />}
        {Math.abs(quote.changePercent).toFixed(2)}%
      </span>
    </div>
  );
}

export function TickerBar() {
  return (
    <div className="w-full h-8 bg-[#0a0e1a] border-b border-white/5 flex items-center relative z-50 px-2 overflow-x-auto no-scrollbar">
      <div className="flex w-full items-center justify-between max-w-7xl mx-auto">
        {TICKER_SYMBOLS.map((symbol) => (
          <TickerItem key={symbol} symbol={symbol} />
        ))}
      </div>
    </div>
  );
}
