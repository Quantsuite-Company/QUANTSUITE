import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';

interface AlphaRadarProps {
  data: { ticker: string; signals: { [alphaId: string]: number } }[];
  alphaIds: string[];
}

const TICKER_COLORS = [
  '#f59e0b', '#10b981', '#8b5cf6', '#3b82f6', '#ef4444', '#ec4899', '#06b6d4',
  '#f97316', '#14b8a6', '#a855f7', '#6366f1', '#f43f5e',
];

const ALPHA_LABELS: Record<string, string> = {
  momentum21: 'Mom 21d',
  momentum63: 'Mom 63d',
  meanReversion: 'Mean Rev',
  liquidity: 'Liquidity',
  volatility: 'Low Vol',
  rsi: 'RSI MR',
};

export function AlphaRadar({ data, alphaIds }: AlphaRadarProps) {
  const [hoveredTicker, setHoveredTicker] = useState<string | null>(null);

  const size = 380;
  const cx = size / 2;
  const cy = size / 2;
  const maxRadius = size / 2 - 50;
  const levels = 4;
  const numAxes = alphaIds.length;

  const angleSlice = (Math.PI * 2) / numAxes;

  // Normalize all signals to 0-1 range across the dataset
  const { normalizedData, maxAbsVal } = useMemo(() => {
    let maxAbs = 0;
    data.forEach(d => {
      alphaIds.forEach(a => {
        const v = Math.abs(d.signals[a] || 0);
        if (v > maxAbs) maxAbs = v;
      });
    });
    if (maxAbs === 0) maxAbs = 1;

    const norm = data.map(d => ({
      ticker: d.ticker,
      values: alphaIds.map(a => {
        const raw = d.signals[a] || 0;
        return (raw + maxAbs) / (2 * maxAbs); // 0-1 range, 0.5 = neutral
      }),
    }));
    return { normalizedData: norm, maxAbsVal: maxAbs };
  }, [data, alphaIds]);

  const getPoint = (axisIdx: number, val: number) => {
    const angle = angleSlice * axisIdx - Math.PI / 2;
    const r = val * maxRadius;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  };

  const getPolygonPath = (values: number[]) => {
    return values.map((v, i) => {
      const p = getPoint(i, v);
      return `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`;
    }).join(' ') + ' Z';
  };

  return (
    <div className="bg-white/[0.02] border border-white/10 rounded-lg p-4 flex flex-col">
      <div className="text-[10px] text-white/40 tracking-widest uppercase mb-3 font-semibold">
        Alpha Signal Radar
      </div>

      <div className="flex-1 flex items-center justify-center">
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[440px]">
          {/* Grid rings */}
          {Array.from({ length: levels }).map((_, i) => {
            const r = (maxRadius * (i + 1)) / levels;
            const points = Array.from({ length: numAxes }).map((_, j) => {
              const angle = angleSlice * j - Math.PI / 2;
              return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
            }).join(' ');
            return (
              <polygon
                key={i}
                points={points}
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="0.5"
              />
            );
          })}

          {/* Axis lines & labels */}
          {alphaIds.map((a, i) => {
            const end = getPoint(i, 1);
            const labelPos = getPoint(i, 1.2);
            return (
              <g key={a}>
                <line x1={cx} y1={cy} x2={end.x} y2={end.y} stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
                <text
                  x={labelPos.x}
                  y={labelPos.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-white/30 text-[7px] font-mono"
                >
                  {ALPHA_LABELS[a] || a}
                </text>
              </g>
            );
          })}

          {/* Data polygons */}
          {normalizedData.map((d, i) => {
            const isHovered = hoveredTicker === d.ticker;
            const isOtherHovered = hoveredTicker !== null && !isHovered;
            const color = TICKER_COLORS[i % TICKER_COLORS.length];

            return (
              <motion.path
                key={d.ticker}
                d={getPolygonPath(d.values)}
                fill={color}
                fillOpacity={isHovered ? 0.25 : isOtherHovered ? 0.03 : 0.1}
                stroke={color}
                strokeWidth={isHovered ? 2 : 1}
                strokeOpacity={isHovered ? 1 : isOtherHovered ? 0.15 : 0.5}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.8, delay: i * 0.1 }}
                onMouseEnter={() => setHoveredTicker(d.ticker)}
                onMouseLeave={() => setHoveredTicker(null)}
                className="cursor-pointer"
              />
            );
          })}

          {/* Data points */}
          {normalizedData.map((d, i) => {
            const isHovered = hoveredTicker === d.ticker;
            const isOtherHovered = hoveredTicker !== null && !isHovered;
            const color = TICKER_COLORS[i % TICKER_COLORS.length];
            if (isOtherHovered) return null;

            return d.values.map((v, j) => {
              const p = getPoint(j, v);
              return (
                <circle
                  key={`${d.ticker}-${j}`}
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? 3 : 1.5}
                  fill={color}
                  opacity={isHovered ? 1 : 0.6}
                />
              );
            });
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-3">
        {normalizedData.map((d, i) => (
          <button
            key={d.ticker}
            onMouseEnter={() => setHoveredTicker(d.ticker)}
            onMouseLeave={() => setHoveredTicker(null)}
            className={`flex items-center gap-1.5 text-[10px] font-mono transition-opacity ${
              hoveredTicker && hoveredTicker !== d.ticker ? 'opacity-30' : 'opacity-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: TICKER_COLORS[i % TICKER_COLORS.length] }} />
            {d.ticker}
          </button>
        ))}
      </div>
    </div>
  );
}
