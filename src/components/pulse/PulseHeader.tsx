import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const REGIONS = ['Global', 'Americas', 'Europe', 'Asia', 'MENA', 'Africa', 'Oceania'] as const;
export type PulseRegion = typeof REGIONS[number];

interface PulseHeaderProps {
  activeRegion: PulseRegion;
  onRegionChange: (region: PulseRegion) => void;
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
}

export function PulseHeader({ activeRegion, onRegionChange, connectionStatus }: PulseHeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const statusLabel = {
    connected: 'LIVE',
    connecting: 'SYNC',
    disconnected: 'OFFLINE',
  }[connectionStatus];

  const formatUTC = (d: Date) => {
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return `${days[d.getUTCDay()]}, ${String(d.getUTCDate()).padStart(2, '0')} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()} ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}:${String(d.getUTCSeconds()).padStart(2, '0')} UTC`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
    >
      {/* Left: Title + LIVE Status + Timestamp */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          {/* LIVE dot */}
          {connectionStatus === 'connected' ? (
            <div className="live-dot" />
          ) : (
            <div className={cn(
              'w-2 h-2 rounded-full',
              connectionStatus === 'connecting' ? 'bg-amber-500 animate-pulse' : 'bg-zinc-600'
            )} />
          )}

          <h1 className="font-mono text-lg font-bold tracking-[0.2em] text-foreground uppercase">
            PULSE
          </h1>

          <span className={cn(
            'terminal-label px-2 py-0.5 rounded-sm border',
            connectionStatus === 'connected'
              ? 'text-red-400 bg-red-500/10 border-red-500/30'
              : connectionStatus === 'connecting'
                ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                : 'text-zinc-500 bg-zinc-500/10 border-zinc-500/30'
          )}>
            {statusLabel}
          </span>
        </div>

        {/* UTC Timestamp */}
        <span className="hidden sm:block font-mono text-[11px] text-muted-foreground/80 tracking-wide">
          {formatUTC(currentTime)}
        </span>
      </div>

      {/* Right: Region Selector — terminal-style tabs */}
      <div className="flex items-center gap-0.5 bg-[hsl(220,20%,5%)] rounded p-0.5 border border-border/20">
        {REGIONS.map((region) => (
          <button
            key={region}
            onClick={() => onRegionChange(region)}
            className={cn(
              'px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] rounded-sm transition-all duration-150',
              activeRegion === region
                ? 'bg-primary/15 text-primary border border-primary/30 shadow-[0_0_8px_rgba(0,245,255,0.15)]'
                : 'text-muted-foreground/60 hover:text-foreground/80 hover:bg-muted/30 border border-transparent'
            )}
          >
            {region}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
