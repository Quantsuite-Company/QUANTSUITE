import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SectorData {
  name: string;
  change: number;
  marketCap: number; // relative size
}

const SECTORS: SectorData[] = [
  { name: 'Technology', change: 1.24, marketCap: 35 },
  { name: 'Healthcare', change: -0.58, marketCap: 15 },
  { name: 'Financials', change: 0.87, marketCap: 14 },
  { name: 'Consumer', change: -0.32, marketCap: 12 },
  { name: 'Energy', change: 2.15, marketCap: 10 },
  { name: 'Industrials', change: 0.45, marketCap: 9 },
  { name: 'Materials', change: -1.12, marketCap: 5 },
  { name: 'Utilities', change: 0.21, marketCap: 4 },
  { name: 'Real Estate', change: -0.78, marketCap: 3 },
  { name: 'Telecom', change: 0.33, marketCap: 3 },
];

export function MarketHeatmap() {
  const [sectors, setSectors] = useState(SECTORS);

  useEffect(() => {
    const interval = setInterval(() => {
      setSectors(prev => prev.map(s => ({
        ...s,
        change: +(s.change + (Math.random() - 0.5) * 0.3).toFixed(2),
      })));
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const maxAbs = Math.max(...sectors.map(s => Math.abs(s.change)), 1);

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <h3 className="terminal-label text-foreground" style={{ fontSize: '11px' }}>SECTOR MAP</h3>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-5 gap-0.5">
        {sectors.map((sector, i) => {
          const intensity = Math.min(Math.abs(sector.change) / maxAbs, 1);
          const bgColor = sector.change >= 0
            ? `hsla(152, 69%, 45%, ${0.06 + intensity * 0.35})`
            : `hsla(0, 84%, 60%, ${0.06 + intensity * 0.35})`;
          const borderColor = sector.change >= 0
            ? `hsla(152, 69%, 45%, ${0.1 + intensity * 0.25})`
            : `hsla(0, 84%, 60%, ${0.1 + intensity * 0.25})`;

          return (
            <motion.div
              key={sector.name}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
              className="rounded p-1.5 text-center cursor-default transition-all duration-300 border"
              style={{
                backgroundColor: bgColor,
                borderColor: borderColor,
                gridColumn: sector.marketCap > 20 ? 'span 2' : undefined,
              }}
            >
              <p className="font-mono text-[8px] font-bold text-foreground/70 truncate uppercase tracking-wider">{sector.name}</p>
              <p className={cn(
                'text-[12px] font-bold font-mono tabular-nums',
                sector.change >= 0 ? 'text-emerald-400' : 'text-red-400'
              )}>
                {sector.change >= 0 ? '+' : ''}{sector.change.toFixed(2)}%
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Minimal legend */}
      <div className="flex items-center justify-center gap-3 mt-2">
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-1.5 rounded-sm" style={{ backgroundColor: 'hsla(0, 84%, 60%, 0.4)' }} />
          <span className="terminal-label text-muted-foreground/40" style={{ fontSize: '7px' }}>BEAR</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-1.5 rounded-sm bg-white/[0.06]" />
          <span className="terminal-label text-muted-foreground/40" style={{ fontSize: '7px' }}>FLAT</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-1.5 rounded-sm" style={{ backgroundColor: 'hsla(152, 69%, 45%, 0.4)' }} />
          <span className="terminal-label text-muted-foreground/40" style={{ fontSize: '7px' }}>BULL</span>
        </div>
      </div>
    </div>
  );
}
