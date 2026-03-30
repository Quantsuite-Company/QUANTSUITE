import { motion } from 'framer-motion';
import { BarChart3, Plus, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface Backtest {
  id: string;
  strategy_name: string;
  status: string;
}

interface BacktestSectionProps {
  backtests: Backtest[];
  isLoading: boolean;
  onNavigate: (path: string) => void;
}

export function BacktestSection({ backtests, isLoading, onNavigate }: BacktestSectionProps) {
  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'running':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'failed':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default:
        return 'bg-muted/10 text-muted-foreground border-border/20';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-xl bg-card/30 backdrop-blur-xl border border-border/30"
    >
      {/* Left accent border */}
      <div className="absolute top-0 left-0 bottom-0 w-0.5 bg-gradient-to-b from-amber-400 to-orange-500" />

      {/* Header - text focused */}
      <div className="px-5 py-4 border-b border-border/20">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground">Recent Backtests</h3>
            <p className="text-xs text-muted-foreground">Your latest strategy tests</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('/quant-engine')}
            className="text-muted-foreground hover:text-foreground"
          >
            <Plus className="w-4 h-4 mr-1" />
            New
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-3 rounded-lg bg-card/40 border border-border/20">
                <div className="flex items-center justify-between">
                  <div>
                    <Skeleton className="h-4 w-32 mb-1.5" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : backtests.length === 0 ? (
          <div className="text-center py-8">
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <BarChart3 className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
            </motion.div>
            <p className="text-sm text-muted-foreground mb-3">No backtests yet</p>
            <Button
              size="sm"
              onClick={() => onNavigate('/quant-engine')}
              className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30"
            >
              Run your first backtest
            </Button>
          </div>
        ) : (
          <div className="space-y-1.5">
            {backtests.map((backtest, index) => (
              <motion.div
                key={backtest.id}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ scale: 1.02 }}
                transition={{ delay: 0.4 + index * 0.03 }}
                onClick={() => onNavigate('/quant-engine')}
                className={cn(
                  "group flex items-center justify-between p-3 rounded-lg cursor-pointer",
                  "bg-card/30 border border-border/20",
                  "hover:bg-card/50 hover:border-amber-500/40",
                  "transition-all duration-200"
                )}
              >
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm text-foreground group-hover:text-amber-400 transition-colors truncate">
                    {backtest.strategy_name}
                  </h4>
                  <p className="text-xs text-muted-foreground capitalize">
                    {backtest.status}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <Badge variant="outline" className={cn("text-xs border", getStatusStyles(backtest.status))}>
                    {backtest.status}
                  </Badge>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
