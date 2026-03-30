import { motion } from 'framer-motion';
import { MarketPulseCard } from './MarketPulseCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity } from 'lucide-react';

interface MarketData {
  name: string;
  value: number;
  change: number;
  positive: boolean;
  unavailable?: boolean;
}

interface MarketPulseSectionProps {
  marketData: MarketData[];
  isLoading?: boolean;
}

export function MarketPulseSection({ marketData, isLoading }: MarketPulseSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-xl bg-card/30 backdrop-blur-xl border border-border/30"
    >
      {/* Left accent border - gradient */}
      <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 via-emerald-500 to-purple-500" />

      {/* Header - compact */}
      <div className="px-4 py-3 border-b border-border/10 flex items-center gap-2">
        <div className="p-1.5 rounded-md bg-primary/10">
          <Activity className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Market Pulse</h3>
          <p className="text-[10px] text-muted-foreground">Live indices</p>
        </div>
      </div>

      {/* Market cards grid - responsive and compact */}
      <div className="p-4">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-3 rounded-lg bg-card/40">
                <Skeleton className="h-3 w-16 mb-2" />
                <Skeleton className="h-5 w-20 mb-1" />
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {marketData.map((market, index) => (
              <MarketPulseCard key={market.name} market={market} index={index} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
