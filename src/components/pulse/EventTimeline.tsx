import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Calendar, AlertTriangle, TrendingUp, Globe, Zap, Flame } from 'lucide-react';

export interface MarketEvent {
  id: string;
  type: 'economic' | 'earnings' | 'ipo' | 'dividend' | 'geopolitical' | 'natural';
  title: string;
  description: string;
  timestamp: string;
  impact: 'high' | 'medium' | 'low';
  region: string;
  relatedTickers?: string[];
  lat?: number;
  lng?: number;
}

const typeConfig: Record<string, { icon: typeof Calendar; color: string; label: string }> = {
  economic: { icon: Globe, color: 'text-cyan-400', label: 'ECON' },
  earnings: { icon: TrendingUp, color: 'text-emerald-400', label: 'EARN' },
  ipo: { icon: Zap, color: 'text-purple-400', label: 'IPO' },
  dividend: { icon: Calendar, color: 'text-amber-400', label: 'DIV' },
  geopolitical: { icon: Flame, color: 'text-orange-400', label: 'GEO' },
  natural: { icon: AlertTriangle, color: 'text-red-400', label: 'NAT' },
};

const impactConfig: Record<string, { color: string; bg: string; border: string }> = {
  high: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  medium: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  low: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
};

function formatTimestamp(timestamp: string): string {
  const d = new Date(timestamp);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

interface EventTimelineProps {
  events: MarketEvent[];
  isLoading: boolean;
}

export function EventTimeline({ events, isLoading }: EventTimelineProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Calendar className="w-3.5 h-3.5 text-primary" />
        <h3 className="terminal-label text-foreground" style={{ fontSize: '11px' }}>EVENT TIMELINE</h3>
        <span className="terminal-label text-muted-foreground/40" style={{ fontSize: '8px' }}>{events.length} events</span>
      </div>

      <div className="space-y-0.5">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-white/[0.03] rounded p-2.5 h-14" />
          ))
        ) : events.length === 0 ? (
          <p className="terminal-label text-muted-foreground/50 text-center py-6">NO EVENTS</p>
        ) : (
          events.map((event, idx) => {
            const config = typeConfig[event.type] || typeConfig.economic;
            const impact = impactConfig[event.impact];
            const Icon = config.icon;

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.04 }}
                className={cn(
                  'flex gap-2.5 p-2.5 rounded border transition-all duration-150',
                  'border-white/[0.04] hover:border-white/[0.08] hover:bg-white/[0.02]',
                  event.impact === 'high' && 'border-l-2 border-l-red-500/40'
                )}
              >
                {/* Timestamp */}
                <div className="shrink-0 w-10 text-center">
                  <span className="font-mono text-[11px] font-bold text-muted-foreground/70">
                    {formatTimestamp(event.timestamp)}
                  </span>
                </div>

                {/* Icon */}
                <div className={cn('mt-0.5 shrink-0', config.color)}>
                  <Icon className="w-3.5 h-3.5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={cn(
                      'font-mono text-[8px] font-bold uppercase tracking-wider px-1 py-px rounded-sm border',
                      config.color, 'border-current/20'
                    )}>
                      {config.label}
                    </span>
                    <span className={cn(
                      'font-mono text-[8px] font-bold uppercase tracking-wider px-1 py-px rounded-sm border',
                      impact.color, impact.border, impact.bg
                    )}>
                      {event.impact.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-[12px] font-medium text-foreground/90 mt-0.5 leading-snug">{event.title}</p>
                  <p className="text-[10px] text-muted-foreground/50 font-mono">{event.description}</p>
                  {event.relatedTickers && event.relatedTickers.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {event.relatedTickers.map(t => (
                        <span key={t} className="text-[8px] font-mono font-bold text-primary/60 bg-primary/[0.06] px-1 py-px rounded border border-primary/10">
                          ${t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
