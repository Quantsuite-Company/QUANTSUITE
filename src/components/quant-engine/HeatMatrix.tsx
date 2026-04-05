import { useState } from 'react';
import { motion } from 'framer-motion';

interface HeatMatrixProps {
  data: { ticker: string; signals: { [alphaId: string]: number }; compositeScore: number }[];
  alphaIds: string[];
}

const ALPHA_LABELS: Record<string, string> = {
  momentum21: 'MOM 21D',
  momentum63: 'MOM 63D',
  meanReversion: 'MEAN REV',
  liquidity: 'LIQ',
  volatility: 'LOW VOL',
  rsi: 'RSI MR',
};

function getHeatColor(value: number): string {
  // value is a z-score, typically -3 to +3
  const clamped = Math.max(-3, Math.min(3, value));
  const t = (clamped + 3) / 6; // 0 = deep red, 0.5 = neutral, 1 = deep green

  if (t < 0.5) {
    // Red to neutral
    const s = t / 0.5;
    const r = Math.round(220 - s * 120);
    const g = Math.round(40 + s * 60);
    const b = Math.round(50 + s * 50);
    return `rgb(${r},${g},${b})`;
  } else {
    // Neutral to green
    const s = (t - 0.5) / 0.5;
    const r = Math.round(100 - s * 80);
    const g = Math.round(100 + s * 120);
    const b = Math.round(100 - s * 40);
    return `rgb(${r},${g},${b})`;
  }
}

export function HeatMatrix({ data, alphaIds }: HeatMatrixProps) {
  const [hoveredCell, setHoveredCell] = useState<{ ticker: string; alpha: string } | null>(null);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const sorted = [...data].sort((a, b) => b.compositeScore - a.compositeScore);

  return (
    <div className="bg-white/[0.02] border border-white/10 rounded-lg p-4 flex flex-col">
      <div className="text-[10px] text-white/40 tracking-widest uppercase mb-3 font-semibold">
        Alpha Signal Heatmap
      </div>

      <div className="flex-1 overflow-x-auto">
        <div className="min-w-[400px]">
          {/* Header row */}
          <div className="flex items-center mb-1">
            <div className="w-16 shrink-0 text-[9px] text-white/30 font-mono tracking-wider uppercase pr-2 text-right">
              ASSET
            </div>
            {alphaIds.map(a => (
              <div
                key={a}
                className="flex-1 text-center text-[8px] text-white/30 font-mono tracking-wider uppercase px-1"
              >
                {ALPHA_LABELS[a] || a}
              </div>
            ))}
            <div className="w-14 shrink-0 text-center text-[8px] text-white/30 font-mono tracking-wider uppercase">
              NET
            </div>
          </div>

          {/* Data rows */}
          <div className="space-y-[2px]">
            {sorted.map((row, rowIdx) => (
              <motion.div
                key={row.ticker}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: rowIdx * 0.05 }}
                className={`flex items-center rounded transition-colors ${
                  hoveredRow === row.ticker ? 'bg-white/[0.04]' : ''
                }`}
                onMouseEnter={() => setHoveredRow(row.ticker)}
                onMouseLeave={() => setHoveredRow(null)}
              >
                <div className="w-16 shrink-0 text-[11px] text-white/80 font-mono font-bold pr-2 text-right">
                  {row.ticker}
                </div>

                {alphaIds.map(a => {
                  const val = row.signals[a] || 0;
                  const color = getHeatColor(val);
                  const isHovered = hoveredCell?.ticker === row.ticker && hoveredCell?.alpha === a;

                  return (
                    <div key={a} className="flex-1 px-[2px]">
                      <motion.div
                        className="relative h-8 rounded-[3px] flex items-center justify-center cursor-pointer transition-all"
                        style={{ backgroundColor: color, opacity: isHovered ? 1 : 0.7 }}
                        onMouseEnter={() => setHoveredCell({ ticker: row.ticker, alpha: a })}
                        onMouseLeave={() => setHoveredCell(null)}
                        whileHover={{ scale: 1.05 }}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: rowIdx * 0.05 + 0.2 }}
                      >
                        <span className="text-[9px] font-mono font-bold text-white/90 drop-shadow-md">
                          {val > 0 ? '+' : ''}{val.toFixed(2)}
                        </span>

                        {isHovered && (
                          <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute -top-9 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-black/90 border border-white/20 text-[9px] text-white font-mono whitespace-nowrap z-20 shadow-xl"
                          >
                            {row.ticker} • {ALPHA_LABELS[a] || a}: {val > 0 ? '+' : ''}{val.toFixed(3)}σ
                          </motion.div>
                        )}
                      </motion.div>
                    </div>
                  );
                })}

                <div className="w-14 shrink-0 text-center">
                  <span className={`text-[11px] font-mono font-bold ${
                    row.compositeScore > 0 ? 'text-emerald-400' : row.compositeScore < 0 ? 'text-rose-400' : 'text-white/40'
                  }`}>
                    {row.compositeScore > 0 ? '+' : ''}{row.compositeScore.toFixed(2)}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Color scale legend */}
      <div className="flex items-center gap-2 mt-4 justify-center">
        <span className="text-[8px] text-white/30 font-mono">SELL</span>
        <div className="flex h-2 rounded-full overflow-hidden w-32">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="flex-1" style={{ backgroundColor: getHeatColor(-3 + (6 * i) / 19) }} />
          ))}
        </div>
        <span className="text-[8px] text-white/30 font-mono">BUY</span>
      </div>
    </div>
  );
}
