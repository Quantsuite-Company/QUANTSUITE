import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface PositionBookProps {
  data: {
    ticker: string;
    score: number;
    weight: number;
    signals: { [alphaId: string]: number };
  }[];
}

type SortKey = 'ticker' | 'score' | 'weight';

function getActionBadge(score: number, weight: number) {
  if (score > 1.5) return { label: 'STRONG BUY', cls: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-emerald-500/10 shadow-lg' };
  if (score > 0.5) return { label: 'BUY', cls: 'bg-emerald-500/10 text-emerald-400/80 border-emerald-500/30' };
  if (score > -0.5) return { label: 'HOLD', cls: 'bg-white/5 text-white/40 border-white/10' };
  if (score > -1.5) return { label: 'SELL', cls: 'bg-rose-500/10 text-rose-400/80 border-rose-500/30' };
  return { label: 'SHORT', cls: 'bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-rose-500/10 shadow-lg' };
}

export function PositionBook({ data }: PositionBookProps) {
  const [sortKey, setSortKey] = useState<SortKey>('score');
  const [sortAsc, setSortAsc] = useState(false);

  const sorted = useMemo(() => {
    const s = [...data].sort((a, b) => {
      const va = a[sortKey] ?? 0;
      const vb = b[sortKey] ?? 0;
      if (typeof va === 'string') return sortAsc ? (va as string).localeCompare(vb as string) : (vb as string).localeCompare(va as string);
      return sortAsc ? (va as number) - (vb as number) : (vb as number) - (va as number);
    });
    return s;
  }, [data, sortKey, sortAsc]);

  const maxAbsWeight = Math.max(...data.map(d => Math.abs(d.weight)), 0.01);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="w-3 h-3 text-white/20" />;
    return sortAsc ? <ArrowUp className="w-3 h-3 text-amber-400" /> : <ArrowDown className="w-3 h-3 text-amber-400" />;
  };

  return (
    <div className="bg-white/[0.02] border border-white/10 rounded-lg overflow-hidden">
      <div className="px-4 py-3 bg-white/[0.02] border-b border-white/5">
        <span className="text-[10px] text-white/40 tracking-widest uppercase font-semibold">
          Position Book — Optimized Allocation Matrix
        </span>
      </div>

      {/* Header */}
      <div className="grid grid-cols-12 gap-2 px-4 py-2 border-b border-white/5 bg-black/30">
        <button onClick={() => toggleSort('ticker')} className="col-span-2 flex items-center gap-1 text-[9px] text-white/40 tracking-widest uppercase font-semibold hover:text-white/60 transition-colors">
          ASSET <SortIcon col="ticker" />
        </button>
        <button onClick={() => toggleSort('score')} className="col-span-2 flex items-center gap-1 text-[9px] text-white/40 tracking-widest uppercase font-semibold hover:text-white/60 transition-colors justify-end">
          Z-SCORE <SortIcon col="score" />
        </button>
        <div className="col-span-3 text-[9px] text-white/40 tracking-widest uppercase font-semibold text-center">
          ALLOCATION
        </div>
        <button onClick={() => toggleSort('weight')} className="col-span-2 flex items-center gap-1 text-[9px] text-white/40 tracking-widest uppercase font-semibold hover:text-white/60 transition-colors justify-end">
          WEIGHT <SortIcon col="weight" />
        </button>
        <div className="col-span-3 text-[9px] text-white/40 tracking-widest uppercase font-semibold text-right">
          ACTION
        </div>
      </div>

      {/* Body */}
      <div className="divide-y divide-white/[0.03]">
        {sorted.map((row, i) => {
          const badge = getActionBadge(row.score, row.weight);
          const weightPct = Math.abs(row.weight * 100);
          const barWidth = (Math.abs(row.weight) / maxAbsWeight) * 100;

          return (
            <motion.div
              key={row.ticker}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-white/[0.03] transition-colors group"
            >
              {/* Ticker */}
              <div className="col-span-2">
                <span className="text-sm font-bold text-white font-mono tracking-wider group-hover:text-amber-400 transition-colors">
                  {row.ticker}
                </span>
              </div>

              {/* Z-Score */}
              <div className="col-span-2 text-right">
                <span className={`text-sm font-mono font-semibold ${
                  row.score > 0 ? 'text-emerald-400' : row.score < 0 ? 'text-rose-400' : 'text-white/40'
                }`}>
                  {row.score > 0 ? '+' : ''}{row.score.toFixed(3)}
                </span>
              </div>

              {/* Allocation Bar */}
              <div className="col-span-3 px-1">
                <div className="h-4 rounded-sm bg-white/5 overflow-hidden relative">
                  <motion.div
                    className={`h-full rounded-sm ${row.weight >= 0 ? 'bg-emerald-500/40' : 'bg-rose-500/40'}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${barWidth}%` }}
                    transition={{ delay: i * 0.04 + 0.3, duration: 0.6, ease: 'easeOut' }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-[9px] font-mono text-white/60">
                    {weightPct.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Weight Number */}
              <div className="col-span-2 text-right">
                <span className="text-xs font-mono text-white/60">{weightPct.toFixed(2)}%</span>
              </div>

              {/* Action Badge */}
              <div className="col-span-3 flex justify-end">
                <span className={`px-2 py-1 rounded text-[9px] font-bold tracking-widest uppercase border ${badge.cls}`}>
                  {badge.label}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
