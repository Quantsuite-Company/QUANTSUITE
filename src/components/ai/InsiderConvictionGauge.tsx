import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";

interface InsiderConvictionGaugeProps {
  trades: any[];
}

export const InsiderConvictionGauge: React.FC<InsiderConvictionGaugeProps> = ({ trades }) => {
  const stats = React.useMemo(() => {
    const buyValue = trades.filter(t => t.type === "Buy").reduce((acc, t) => acc + t.value, 0);
    const sellValue = trades.filter(t => t.type === "Sell").reduce((acc, t) => acc + t.value, 0);
    const totalValue = buyValue + sellValue;
    
    // Calculate conviction score (0 to 100, 100 being extreme buy)
    const score = totalValue > 0 ? (buyValue / totalValue) * 100 : 50;
    
    return {
      buyValue,
      sellValue,
      totalValue,
      score,
      label: score > 70 ? "EXTREME BULLISH" : score > 55 ? "BULLISH" : score > 45 ? "NEUTRAL" : score > 30 ? "BEARISH" : "EXTREME BEARISH",
      color: score > 60 ? "text-chart-profit" : score < 40 ? "text-chart-loss" : "text-qs-brand-400"
    };
  }, [trades]);

  return (
    <Card className="bg-card/30 backdrop-blur-xl border-border/30 overflow-hidden relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
      
      <CardHeader className="pb-2 relative z-10">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            C-Suite Conviction
          </CardTitle>
          <Badge variant="outline" className={`${stats.color} border-current/20 bg-current/5`}>
            {stats.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-4 relative z-10">
        <div className="flex flex-col items-center justify-center space-y-6">
          {/* Gauge Visualization */}
          <div className="relative w-48 h-24 overflow-hidden">
            {/* Background Arch */}
            <div className="absolute inset-0 w-48 h-48 border-[12px] border-muted/20 rounded-full" />
            
            {/* Buy/Sell Indicators */}
            <div className="absolute bottom-0 left-0 text-[10px] font-bold text-chart-loss opacity-50">SELL</div>
            <div className="absolute bottom-0 right-0 text-[10px] font-bold text-chart-profit opacity-50">BUY</div>

            {/* Progress Arch */}
            <svg className="absolute inset-0 w-48 h-48 -rotate-90 origin-center" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="44"
                fill="none"
                stroke="currentColor"
                strokeWidth="12"
                strokeDasharray="138 276"
                className={`${stats.color} opacity-20`}
              />
              <motion.circle
                cx="50"
                cy="50"
                r="44"
                fill="none"
                stroke="currentColor"
                strokeWidth="12"
                strokeDasharray={`${(stats.score / 100) * 138} 276`}
                className={stats.color}
                initial={{ strokeDasharray: "0 276" }}
                animate={{ strokeDasharray: `${(stats.score / 100) * 138} 276` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            </svg>

            {/* Needle */}
            <motion.div 
              className="absolute bottom-0 left-1/2 w-1 h-20 -ml-[2px] bg-foreground rounded-full origin-bottom"
              style={{ rotate: -90 }}
              animate={{ rotate: (stats.score / 100) * 180 - 90 }}
              transition={{ duration: 1.5, delay: 0.2, ease: "backOut" }}
            >
              <div className="absolute top-0 left-1/2 -ml-2 -mt-2 w-4 h-4 bg-primary rounded-full shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
            </motion.div>
          </div>

          <div className="text-center">
            <h3 className="text-3xl font-bold font-serif tracking-tight">
              {stats.score.toFixed(1)}%
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Aggregate Institutional Sentiment
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full pt-4 border-t border-border/20">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-chart-profit">
                <TrendingUp className="w-3 h-3" /> Accumulating
              </div>
              <p className="text-sm font-medium font-serif">${(stats.buyValue / 1e6).toFixed(1)}M</p>
            </div>
            <div className="space-y-1 text-right">
              <div className="flex items-center justify-end gap-1.5 text-[10px] font-bold uppercase text-chart-loss">
                Unloading <TrendingDown className="w-3 h-3" />
              </div>
              <p className="text-sm font-medium font-serif">${(stats.sellValue / 1e6).toFixed(1)}M</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
