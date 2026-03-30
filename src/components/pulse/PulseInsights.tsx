import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Brain, AlertTriangle, TrendingUp, Zap, ChevronRight, Shield } from 'lucide-react';

interface InsightItem {
  id: string;
  type: 'alert' | 'signal' | 'anomaly';
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  timestamp: string;
  tickers?: string[];
}

const MOCK_INSIGHTS: InsightItem[] = [
  {
    id: '1',
    type: 'alert',
    title: 'Unusual Options Activity Detected',
    description: 'Large call volume on NVDA ahead of earnings — 3.2x average volume on 950C expiring this week.',
    severity: 'warning',
    timestamp: new Date(Date.now() - 300000).toISOString(),
    tickers: ['NVDA'],
  },
  {
    id: '2',
    type: 'signal',
    title: 'VIX Regime Shift Detected',
    description: 'VIX crossed above 20-day moving average with expanding Bollinger bands. Risk-off rotation likely.',
    severity: 'critical',
    timestamp: new Date(Date.now() - 900000).toISOString(),
    tickers: ['VIX', 'SPY'],
  },
  {
    id: '3',
    type: 'anomaly',
    title: 'Cross-Asset Correlation Break',
    description: 'Gold-Dollar inverse correlation has broken down — both rising simultaneously for 5th consecutive session.',
    severity: 'warning',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    tickers: ['GLD', 'UUP'],
  },
  {
    id: '4',
    type: 'signal',
    title: 'Sector Rotation Signal',
    description: 'Money flow analysis shows rotation from growth to value. XLK outflows accelerating while XLF sees inflows.',
    severity: 'info',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    tickers: ['XLK', 'XLF'],
  },
  {
    id: '5',
    type: 'alert',
    title: 'Yield Curve Steepening',
    description: '2s10s spread widened by 8bps today — fastest steepening in 3 months. Watch bank stocks.',
    severity: 'info',
    timestamp: new Date(Date.now() - 5400000).toISOString(),
    tickers: ['TLT', 'KBE'],
  },
];

const severityConfig = {
  critical: {
    color: 'text-red-400',
    bg: 'bg-transparent',
    border: 'border-red-500/30',
    icon: AlertTriangle,
    label: 'CRITICAL'
  },
  warning: {
    color: 'text-amber-400',
    bg: 'bg-transparent',
    border: 'border-amber-500/30',
    icon: Zap,
    label: 'WARNING'
  },
  info: {
    color: 'text-cyan-400',
    bg: 'bg-transparent',
    border: 'border-cyan-500/20',
    icon: TrendingUp,
    label: 'INFO'
  },
};

export function PulseInsights() {
  const [insights] = useState(MOCK_INSIGHTS);
  const [activeFilter, setActiveFilter] = useState<'all' | 'alert' | 'signal' | 'anomaly'>('all');

  const filtered = activeFilter === 'all' ? insights : insights.filter(i => i.type === activeFilter);

  const counts = {
    critical: insights.filter(i => i.severity === 'critical').length,
    warnings: insights.filter(i => i.severity === 'warning').length,
    total: insights.length,
  };

  return (
    <div>
      {/* Header with counter badges */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Brain className="w-3.5 h-3.5 text-primary" />
          <h3 className="terminal-label text-foreground" style={{ fontSize: '11px' }}>AI INTELLIGENCE</h3>
        </div>
      </div>

      {/* Metric counters — worldmonitor-inspired */}
      <div className="grid grid-cols-3 gap-1 mb-3">
        <div className="text-center p-1.5 rounded bg-white/[0.02] border border-white/[0.04]">
          <span className="font-mono text-lg font-bold text-red-400">{counts.critical}</span>
          <p className="terminal-label text-muted-foreground/50" style={{ fontSize: '7px' }}>CRITICAL</p>
        </div>
        <div className="text-center p-1.5 rounded bg-white/[0.02] border border-white/[0.04]">
          <span className="font-mono text-lg font-bold text-amber-400">{counts.warnings}</span>
          <p className="terminal-label text-muted-foreground/50" style={{ fontSize: '7px' }}>WARNINGS</p>
        </div>
        <div className="text-center p-1.5 rounded bg-white/[0.02] border border-white/[0.04]">
          <span className="font-mono text-lg font-bold text-foreground/80">{counts.total}</span>
          <p className="terminal-label text-muted-foreground/50" style={{ fontSize: '7px' }}>TOTAL</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-0 mb-2 border-b border-white/[0.06] pb-1">
        {(['all', 'alert', 'signal', 'anomaly'] as const).map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={cn(
              'px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.1em] transition-all',
              activeFilter === f
                ? 'text-primary border-b-2 border-primary bg-primary/5'
                : 'text-muted-foreground/50 hover:text-foreground/70'
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Insights List */}
      <div className="space-y-1">
        <AnimatePresence mode="popLayout">
          {filtered.map((item, idx) => {
            const config = severityConfig[item.severity];
            const Icon = config.icon;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ delay: idx * 0.03 }}
                className={cn(
                  'px-2 py-1.5 border-b border-white/[0.03] transition-colors duration-200 cursor-pointer hover:bg-white/[0.02]',
                  config.bg
                )}
              >
                <div className="flex items-start gap-2">
                  <Icon className={cn('w-3.5 h-3.5 mt-0.5 shrink-0', config.color)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={cn(
                        'font-mono text-[8px] font-bold uppercase tracking-wider px-1 py-px rounded-sm border',
                        config.color, config.border
                      )}>
                        {config.label}
                      </span>
                    </div>
                    <p className="text-[12px] font-semibold text-foreground/90 leading-snug">{item.title}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5 leading-relaxed font-mono">{item.description}</p>
                    {item.tickers && (
                      <div className="flex gap-1 mt-1.5">
                        {item.tickers.map(t => (
                          <span key={t} className="text-[8px] font-mono font-bold text-primary/70 bg-primary/[0.08] px-1 py-px rounded border border-primary/15">
                            ${t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
