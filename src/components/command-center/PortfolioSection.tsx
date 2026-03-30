import { motion } from 'framer-motion';
import { PieChart, Plus, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface Portfolio {
  id: string;
  name: string;
  positions: unknown;
}

interface PortfolioSectionProps {
  portfolios: Portfolio[];
  isLoading: boolean;
  onNavigate: (path: string) => void;
}

export function PortfolioSection({ portfolios, isLoading, onNavigate }: PortfolioSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-xl bg-card/30 backdrop-blur-xl border border-border/30"
    >
      {/* Left accent border */}
      <div className="absolute top-0 left-0 bottom-0 w-0.5 bg-gradient-to-b from-violet-400 to-purple-500" />

      {/* Header - text focused */}
      <div className="px-5 py-4 border-b border-border/20">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground">My Portfolios</h3>
            <p className="text-xs text-muted-foreground">Your saved portfolios</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('/portfolios')}
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
                <Skeleton className="h-4 w-28 mb-1.5" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))}
          </div>
        ) : portfolios.length === 0 ? (
          <div className="text-center py-8">
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <PieChart className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
            </motion.div>
            <p className="text-sm text-muted-foreground mb-3">No portfolios yet</p>
            <Button
              size="sm"
              onClick={() => onNavigate('/portfolios')}
              className="bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 border border-violet-500/30"
            >
              Create your first portfolio
            </Button>
          </div>
        ) : (
          <div className="space-y-1.5">
            {portfolios.map((portfolio, index) => (
              <motion.div
                key={portfolio.id}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ scale: 1.02 }}
                transition={{ delay: 0.35 + index * 0.03 }}
                onClick={() => onNavigate('/portfolios')}
                className={cn(
                  "group flex items-center justify-between p-3 rounded-lg cursor-pointer",
                  "bg-card/30 border border-border/20",
                  "hover:bg-card/50 hover:border-violet-500/40",
                  "transition-all duration-200"
                )}
              >
                <div>
                  <h4 className="font-medium text-sm text-foreground group-hover:text-violet-400 transition-colors">
                    {portfolio.name}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {Array.isArray(portfolio.positions) ? portfolio.positions.length : 0} positions
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-violet-400 group-hover:translate-x-1 transition-all" />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
