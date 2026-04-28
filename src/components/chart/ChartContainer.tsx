'use client';
import { cn } from '@/lib/utils';
import { Area, AreaChart, ResponsiveContainer, Tooltip, YAxis, Line, LineChart, Bar, BarChart, XAxis, Cell } from 'recharts';

interface RechartsChartProps {
  data: { time: string | number; value: number }[];
  type?: 'line' | 'area';
  lineColor?: string;
  topColor?: string;
  height?: number;
  className?: string;
  hideAxes?: boolean;
}

export function MiniSparkline({ data, height = 40, color = "#22c55e", className }: { data: number[], height?: number, color?: string, className?: string }) {
  // SVG Sparkline
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const safeRange = range === 0 ? 1 : range;
  
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((v - min) / safeRange) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className={cn("w-full relative", className)} style={{ height }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible drop-shadow-[0_0_5px_currentColor]" style={{ color }}>
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.4" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
        <polygon
          points={`0,100 ${points} 100,100`}
          fill={`url(#grad-${color.replace('#', '')})`}
        />
      </svg>
    </div>
  );
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-bg-card/90 border border-white/10 rounded-lg p-2 shadow-xl backdrop-blur">
        <p className="text-white font-mono text-sm font-bold">
          {Number(payload[0].value).toFixed(2)}
        </p>
      </div>
    );
  }
  return null;
};

export function LightweightChart({
  data,
  type = 'area',
  lineColor = '#3b82f6',
  height = 150,
  className,
  hideAxes = false
}: RechartsChartProps) {
  
  // Create safe bounding box for Y axis
  const vals = data.map(d => d.value);
  const min = Math.min(...(vals.length ? vals : [0]));
  const max = Math.max(...(vals.length ? vals : [100]));
  const domain = [min * 0.95, max * 1.05];

  return (
    <div className={cn("w-full relative", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        {type === 'area' ? (
          <AreaChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`colorValueArea`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={lineColor} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={lineColor} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} />
            {!hideAxes && <YAxis domain={domain as any} hide />}
            <Area 
               type="monotone" 
               dataKey="value" 
               stroke={lineColor} 
               strokeWidth={2}
               fillOpacity={1} 
               fill={`url(#colorValueArea)`} 
               isAnimationActive={false}
               style={{ filter: `drop-shadow(0px 0px 4px ${lineColor}80)` }}
            />
          </AreaChart>
        ) : (
          <LineChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} />
            {!hideAxes && <YAxis domain={domain as any} hide />}
            <Line 
               type="monotone" 
               dataKey="value" 
               stroke={lineColor} 
               strokeWidth={2}
               dot={false}
               isAnimationActive={false}
               style={{ filter: `drop-shadow(0px 0px 4px ${lineColor}80)` }}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

// ── Bar chart for volume/inventory style data ──
export function BarSparkline({ data, height = 60, color = '#3b82f6', className }: { 
  data: { name: string; value: number; color?: string }[]; height?: number; color?: string; className?: string 
}) {
  return (
    <div className={cn("w-full relative", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <Bar dataKey="value" radius={[2, 2, 0, 0]} isAnimationActive={false}>
            {data.map((entry, idx) => (
              <Cell key={idx} fill={entry.color || color} fillOpacity={0.8} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
