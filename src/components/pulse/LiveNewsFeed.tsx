import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ExternalLink, AlertTriangle, TrendingUp, TrendingDown, Minus, Clock, Zap } from 'lucide-react';

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  category: string;
  timestamp: string;
  url: string;
  snippet: string;
  sentiment?: 'bullish' | 'bearish' | 'neutral';
  region?: string;
  impact?: 'high' | 'medium' | 'low';
}

const SOURCES = ['All', 'Bloomberg', 'Reuters', 'CNBC', 'MarketWatch', 'BBC Business', 'NY Times'] as const;

interface LiveNewsFeedProps {
  news: NewsItem[];
  isLoading: boolean;
  region: string;
}

function timeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'NOW';
  if (mins < 60) return `${mins}M`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}H`;
  return `${Math.floor(hours / 24)}D`;
}

const SentimentBar = ({ sentiment }: { sentiment?: string }) => {
  if (sentiment === 'bullish') return <div className="w-0.5 h-full bg-emerald-500 rounded-full" />;
  if (sentiment === 'bearish') return <div className="w-0.5 h-full bg-red-500 rounded-full" />;
  return <div className="w-0.5 h-full bg-zinc-700 rounded-full" />;
};

export function LiveNewsFeed({ news, isLoading, region }: LiveNewsFeedProps) {
  const filtered = news;

  return (
    <div className="flex flex-col h-full">
      {/* News List — terminal-style entries */}
      <div className="flex-1 overflow-y-auto space-y-0.5 pr-1">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-white/[0.03] rounded p-3 space-y-2">
              <div className="h-3 bg-white/[0.06] rounded w-3/4" />
              <div className="h-2 bg-white/[0.04] rounded w-1/2" />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <p className="terminal-label">No intelligence available</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filtered.map((item, idx) => (
              <motion.a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 5 }}
                transition={{ delay: idx * 0.02, duration: 0.15 }}
                className={cn(
                  'group flex gap-2 p-2.5 rounded border transition-all duration-150 cursor-pointer',
                  'border-white/[0.04] hover:border-primary/20 hover:bg-primary/[0.03]',
                  item.impact === 'high' && 'border-l-2 border-l-amber-500/50'
                )}
              >
                {/* Sentiment Bar */}
                <div className="shrink-0 py-0.5">
                  <SentimentBar sentiment={item.sentiment} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Timestamp + Category + Impact */}
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="font-mono text-[9px] font-bold text-muted-foreground/60">
                      {timeAgo(item.timestamp)}
                    </span>
                    <span className="text-white/[0.1]">│</span>
                    <span className="font-mono text-[9px] font-bold text-primary/60 uppercase">
                      {item.source}
                    </span>
                    {item.impact === 'high' && (
                      <>
                        <span className="text-white/[0.1]">│</span>
                        <span className="font-mono text-[8px] font-bold text-red-400 bg-red-500/10 px-1 rounded-sm border border-red-500/20 uppercase">
                          ⚠ ALERT
                        </span>
                      </>
                    )}
                  </div>

                  {/* Title */}
                  <p className="text-[12px] font-medium text-foreground/90 leading-snug group-hover:text-primary transition-colors line-clamp-2">
                    {item.title}
                  </p>

                  {item.snippet && (
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5 line-clamp-1 font-mono">
                      {item.snippet}
                    </p>
                  )}
                </div>

                {/* External indicator */}
                <ExternalLink className="w-3 h-3 text-white/[0.1] group-hover:text-primary/40 shrink-0 mt-1 transition-colors" />
              </motion.a>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
