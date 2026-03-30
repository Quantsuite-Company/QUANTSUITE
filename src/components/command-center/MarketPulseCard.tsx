import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MarketData {
  name: string;
  value: number;
  change: number;
  positive: boolean;
  unavailable?: boolean;
}

interface MarketPulseCardProps {
  market: MarketData;
  index: number;
}

// Ticker-specific color themes - compact version
const tickerThemes: Record<string, { 
  text: string; 
  border: string;
  bg: string;
}> = {
  'S&P 500': {
    text: 'text-blue-400',
    border: 'border-l-blue-500',
    bg: 'from-blue-500/10 to-blue-600/5',
  },
  'NASDAQ': {
    text: 'text-emerald-400',
    border: 'border-l-emerald-500',
    bg: 'from-emerald-500/10 to-emerald-600/5',
  },
  'DOW': {
    text: 'text-amber-400',
    border: 'border-l-amber-500',
    bg: 'from-amber-500/10 to-amber-600/5',
  },
  'VIX': {
    text: 'text-violet-400',
    border: 'border-l-violet-500',
    bg: 'from-violet-500/10 to-violet-600/5',
  },
};

const getTheme = (name: string) => {
  return tickerThemes[name] || {
    text: 'text-cyan-400',
    border: 'border-l-cyan-500',
    bg: 'from-cyan-500/10 to-cyan-600/5',
  };
};

export function MarketPulseCard({ market, index }: MarketPulseCardProps) {
  const isUnavailable = market.unavailable || market.value === 0;
  const theme = getTheme(market.name);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ 
        delay: index * 0.05,
        duration: 0.3,
        ease: [0.16, 1, 0.3, 1]
      }}
      className={cn(
        "relative rounded-lg bg-gradient-to-br backdrop-blur-sm p-3",
        "border border-border/20 border-l-2",
        theme.border,
        theme.bg
      )}
    >
      <div className="space-y-1.5">
        {/* Market name - compact */}
        <span className={cn("text-xs font-medium uppercase tracking-wide", theme.text)}>
          {market.name}
        </span>

        {/* Value - reduced size (was text-3xl, now text-lg) */}
        {isUnavailable ? (
          <div className="text-base font-semibold text-muted-foreground">—</div>
        ) : (
          <div className={cn("text-lg font-bold font-mono", theme.text)}>
            {market.value.toLocaleString(undefined, { 
              minimumFractionDigits: 2, 
              maximumFractionDigits: 2 
            })}
          </div>
        )}

        {/* Change indicator - compact */}
        {isUnavailable ? (
          <span className="text-[10px] text-muted-foreground">Unavailable</span>
        ) : (
          <div className="flex items-center gap-1.5">
            {market.positive ? (
              <TrendingUp className="w-3 h-3 text-emerald-400" />
            ) : (
              <TrendingDown className="w-3 h-3 text-rose-400" />
            )}
            <span className={cn(
              "text-sm font-semibold font-mono",
              market.positive ? "text-emerald-400" : "text-rose-400"
            )}>
              {market.change > 0 ? '+' : ''}{market.change.toFixed(2)}%
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
