import { motion } from 'framer-motion';

interface RiskDialsProps {
  expectedVol: number;
  netExposure: number;
  grossLeverage: number;
  concentration: number;
}

interface DialConfig {
  label: string;
  value: number;
  maxVal: number;
  format: (v: number) => string;
  getColor: (v: number) => string;
  getArcGradient: () => [string, string];
}

function Dial({ config, delay }: { config: DialConfig; delay: number }) {
  const { label, value, maxVal, format, getColor, getArcGradient } = config;
  const ratio = Math.min(Math.abs(value) / maxVal, 1);
  const size = 160;
  const strokeWidth = 10;
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const arcLength = circumference * 0.75; // 270-degree arc
  const dashOffset = arcLength * (1 - ratio);

  const [c1, c2] = getArcGradient();
  const color = getColor(value);
  const gradId = `dial-${label.replace(/\s/g, '')}`;

  return (
    <div className="flex flex-col items-center">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-32 h-32">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={c1} />
            <stop offset="100%" stopColor={c2} />
          </linearGradient>
        </defs>

        {/* Background arc */}
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${arcLength} ${circumference}`}
          transform={`rotate(135 ${size / 2} ${size / 2})`}
        />

        {/* Value arc */}
        <motion.circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={`url(#${gradId})`} strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${arcLength} ${circumference}`}
          initial={{ strokeDashoffset: arcLength }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 1.2, delay, ease: 'easeOut' }}
          transform={`rotate(135 ${size / 2} ${size / 2})`}
          style={{ filter: `drop-shadow(0 0 6px ${c1}40)` }}
        />

        {/* Center value */}
        <text
          x={size / 2} y={size / 2 - 2}
          textAnchor="middle" dominantBaseline="middle"
          className="text-base font-bold font-mono fill-white"
        >
          {format(value)}
        </text>
      </svg>

      <span className="text-[9px] text-white/40 tracking-widest uppercase font-semibold mt-1">
        {label}
      </span>
    </div>
  );
}

export function RiskDials({ expectedVol, netExposure, grossLeverage, concentration }: RiskDialsProps) {
  const dials: DialConfig[] = [
    {
      label: 'Exp. Volatility',
      value: expectedVol,
      maxVal: 0.5,
      format: v => `${(v * 100).toFixed(1)}%`,
      getColor: v => v > 0.3 ? '#ef4444' : v > 0.15 ? '#f59e0b' : '#10b981',
      getArcGradient: () => expectedVol > 0.3 ? ['#ef4444', '#f97316'] : expectedVol > 0.15 ? ['#f59e0b', '#fbbf24'] : ['#10b981', '#34d399'],
    },
    {
      label: 'Net Exposure',
      value: netExposure,
      maxVal: 1.5,
      format: v => `${(v * 100).toFixed(0)}%`,
      getColor: v => v > 0 ? '#10b981' : '#ef4444',
      getArcGradient: () => netExposure > 0 ? ['#10b981', '#059669'] : ['#ef4444', '#dc2626'],
    },
    {
      label: 'Gross Leverage',
      value: grossLeverage,
      maxVal: 2,
      format: v => `${(v * 100).toFixed(0)}%`,
      getColor: () => '#3b82f6',
      getArcGradient: () => ['#3b82f6', '#6366f1'],
    },
    {
      label: 'HHI Concentration',
      value: concentration,
      maxVal: 1,
      format: v => v.toFixed(3),
      getColor: v => v > 0.5 ? '#ef4444' : v > 0.25 ? '#f59e0b' : '#10b981',
      getArcGradient: () => concentration > 0.5 ? ['#ef4444', '#f97316'] : concentration > 0.25 ? ['#f59e0b', '#fbbf24'] : ['#10b981', '#34d399'],
    },
  ];

  return (
    <div className="bg-white/[0.02] border border-white/10 rounded-lg p-4">
      <div className="text-[10px] text-white/40 tracking-widest uppercase mb-4 font-semibold">
        Risk Profile
      </div>
      <div className="grid grid-cols-4 gap-6">
        {dials.map((d, i) => (
          <Dial key={d.label} config={d} delay={0.2 + i * 0.15} />
        ))}
      </div>
    </div>
  );
}
