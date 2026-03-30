import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

function getLabel(value: number): string {
  if (value <= 20) return 'EXTREME FEAR';
  if (value <= 40) return 'FEAR';
  if (value <= 60) return 'NEUTRAL';
  if (value <= 80) return 'GREED';
  return 'EXTREME GREED';
}

function getColor(value: number): string {
  if (value <= 20) return '#ef4444';
  if (value <= 40) return '#f97316';
  if (value <= 60) return '#f59e0b';
  if (value <= 80) return '#10b981';
  return '#059669';
}

function getTextColor(value: number): string {
  if (value <= 20) return 'text-red-500';
  if (value <= 40) return 'text-orange-400';
  if (value <= 60) return 'text-amber-400';
  if (value <= 80) return 'text-emerald-400';
  return 'text-emerald-500';
}

export function FearGreedGauge() {
  const [value, setValue] = useState(42);

  useEffect(() => {
    const interval = setInterval(() => {
      setValue(prev => {
        const delta = (Math.random() - 0.5) * 3;
        return Math.max(0, Math.min(100, Math.round(prev + delta)));
      });
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // SVG gauge math
  const radius = 55;
  const strokeWidth = 8;
  const cx = 70;
  const cy = 70;
  const startAngle = -210;
  const endAngle = 30;
  const totalAngle = endAngle - startAngle;
  const valueAngle = startAngle + (value / 100) * totalAngle;

  const polarToCartesian = (angle: number) => {
    const rad = (angle * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  };

  const describeArc = (startA: number, endA: number) => {
    const start = polarToCartesian(endA);
    const end = polarToCartesian(startA);
    const sweep = endA - startA <= 180 ? 0 : 1;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${sweep} 0 ${end.x} ${end.y}`;
  };

  const needleEnd = polarToCartesian(valueAngle);
  const color = getColor(value);

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <h3 className="terminal-label text-foreground" style={{ fontSize: '11px' }}>FEAR & GREED INDEX</h3>
      </div>

      <div className="flex flex-col items-center">
        <svg width="140" height="95" viewBox="0 0 140 95">
          {/* Background arc */}
          <path
            d={describeArc(startAngle, endAngle)}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Glow filter */}
          <defs>
            <filter id="glow-gauge">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* Value arc with glow */}
          <motion.path
            d={describeArc(startAngle, valueAngle)}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            filter="url(#glow-gauge)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
          {/* Needle */}
          <motion.line
            x1={cx}
            y1={cy}
            x2={needleEnd.x}
            y2={needleEnd.y}
            stroke="rgba(255,255,255,0.9)"
            strokeWidth="1.5"
            strokeLinecap="round"
            initial={false}
            animate={{ x2: needleEnd.x, y2: needleEnd.y }}
            transition={{ type: 'spring', stiffness: 100, damping: 15 }}
          />
          <circle cx={cx} cy={cy} r="2.5" fill="rgba(255,255,255,0.9)" />

          {/* Scale markers */}
          {[0, 25, 50, 75, 100].map(mark => {
            const angle = startAngle + (mark / 100) * totalAngle;
            const outer = polarToCartesian(angle);
            const r2 = radius + 12;
            const labelPos = { x: cx + r2 * Math.cos((angle * Math.PI) / 180), y: cy + r2 * Math.sin((angle * Math.PI) / 180) };
            return (
              <text
                key={mark}
                x={labelPos.x}
                y={labelPos.y}
                fill="rgba(255,255,255,0.25)"
                fontSize="7"
                fontFamily="'JetBrains Mono', monospace"
                textAnchor="middle"
                dominantBaseline="central"
              >
                {mark}
              </text>
            );
          })}
        </svg>

        <motion.div
          className="text-center -mt-3"
          key={value}
          initial={{ scale: 1.05 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <span className={cn('text-2xl font-bold font-mono', getTextColor(value))}>
            {value}
          </span>
          <p className={cn('text-[10px] font-mono font-bold uppercase tracking-[0.15em] mt-0.5', getTextColor(value))}>
            {getLabel(value)}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
