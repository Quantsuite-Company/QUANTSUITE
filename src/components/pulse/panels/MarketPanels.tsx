import { PulsePanel } from '../PulseGrid';
import { LightweightChart, MiniSparkline, BarSparkline } from '@/components/chart/ChartContainer';
import { useState } from 'react';

interface PanelExpandProps {
  panelId?: string;
  onExpand?: (id: string) => void;
  expanded?: boolean;
  onClose?: () => void;
}

function genVolatileData(startVal: number, volatility: number, length = 30) {
  let val = startVal;
  return Array.from({ length }).map((_, i) => {
    val += Math.sin(i / 6) * volatility * 0.3 + (Math.random() - 0.5) * volatility;
    return { time: Math.floor(Date.now() / 1000) - (length - i) * 86400, value: val };
  });
}

const ALL_GICS_SECTORS = [
  { s: 'XLK', n: 'Technology', p: 0.91 },
  { s: 'XLF', n: 'Financials', p: 0.28 },
  { s: 'XLE', n: 'Energy', p: 0.65 },
  { s: 'XLV', n: 'Health Care', p: -0.40 },
  { s: 'XLY', n: 'Consumer Disc', p: -0.21 },
  { s: 'XLI', n: 'Industrials', p: -0.22 },
  { s: 'XLRE', n: 'Real Estate', p: 0.14 },
  { s: 'XLU', n: 'Utilities', p: 0.32 },
  { s: 'XLB', n: 'Materials', p: -0.15 },
  { s: 'XLC', n: 'Comm Services', p: 1.12 },
  { s: 'XLP', n: 'Staples', p: 0.08 },
];

export function HeatmapPanel(props: PanelExpandProps) {
  const [showAll, setShowAll] = useState(false);
  const sectors = showAll || props.expanded ? ALL_GICS_SECTORS : ALL_GICS_SECTORS.slice(0, 6);
  const sectorBars = ALL_GICS_SECTORS.map(s => ({
    name: s.s, value: Math.abs(s.p), color: s.p > 0 ? '#22c55e' : '#ef4444'
  }));

  return (
    <PulsePanel title="Sector Heatmap" category="MARKETS" {...props}
      analysis="Technology (XLK +0.91%) and Communication Services (XLC +1.12%) are leading — classic risk-on rotation. Energy +0.65% provides a commodity floor. Healthcare (-0.40%) and Consumer Disc (-0.21%) red suggests funds rotating OUT of defensive into higher-beta. Tactical: overweight XLK and XLC, underweight XLV."
      expandedContent={
        <div className="space-y-3">
          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Sector Performance Bars (Absolute)</span>
          <BarSparkline data={sectorBars} height={100} />
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-bg-elevated/30 border border-white/5 rounded-lg p-3">
              <span className="text-[9px] font-mono text-slate-500 uppercase">Sector Rotation Signal</span>
              <div className="text-xl font-bold text-positive mt-1">Growth → Value</div>
              <span className="text-[10px] text-slate-400">3-month trend shifting</span>
            </div>
            <div className="bg-bg-elevated/30 border border-white/5 rounded-lg p-3">
              <span className="text-[9px] font-mono text-slate-500 uppercase">Equal Weight vs Cap Weight</span>
              <div className="text-xl font-bold text-amber-400 mt-1">-2.3%</div>
              <span className="text-[10px] text-slate-400">Mega caps outperforming</span>
            </div>
          </div>
        </div>
      }>
      <div className="flex flex-col gap-2 h-full">
        <div className={`grid ${props.expanded ? 'grid-cols-4' : 'grid-cols-3'} gap-2 flex-1`}>
          {sectors.map(sec => (
            <div key={sec.s} className="bg-bg-elevated/40 border border-white/5 rounded p-2 flex flex-col items-center justify-center cursor-pointer hover:border-white/10 transition-colors">
              <span className="text-[11px] font-bold text-slate-300">{sec.s}</span>
              <span className={`text-[11px] font-bold mt-1 ${sec.p > 0 ? 'text-positive' : 'text-negative'}`}>
                {sec.p > 0 ? '+' : ''}{sec.p}%
              </span>
              <span className="text-[8px] text-slate-500 truncate w-full text-center mt-0.5">{sec.n}</span>
            </div>
          ))}
        </div>
        {!props.expanded && !showAll && ALL_GICS_SECTORS.length > 6 && (
          <button onClick={(e) => { e.stopPropagation(); setShowAll(true); }} className="text-[10px] font-mono text-blue-400 hover:text-blue-300 transition-colors text-center py-1">
            Show All {ALL_GICS_SECTORS.length} Sectors ▼
          </button>
        )}
      </div>
    </PulsePanel>
  );
}

export function MarketBreadthPanel(props: PanelExpandProps) {
  const breadthData = genVolatileData(55, 5, 30);

  return (
    <PulsePanel title="Market Breadth" category="MARKETS" {...props}
      analysis="66.1% above the 20-day SMA suggests short-term momentum is solid. However, only 43.4% above the 50-day reveals divergence: the rally is narrowing. Strategy: maintain positions but tighten stops on leadership stocks. Wait for the 50-day reading to catch up above 55% before adding new longs."
      expandedContent={
        <div className="space-y-3">
          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Breadth Oscillator (30d)</span>
          <LightweightChart data={breadthData} height={100} hideAxes lineColor="#22c55e" type="area" />
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-bg-elevated/30 border border-white/5 rounded-lg p-3">
              <span className="text-[9px] font-mono text-slate-500 uppercase">Advance/Decline</span>
              <div className="text-xl font-bold text-positive mt-1">1.82</div>
              <span className="text-[10px] text-slate-400">Bullish breadth</span>
            </div>
            <div className="bg-bg-elevated/30 border border-white/5 rounded-lg p-3">
              <span className="text-[9px] font-mono text-slate-500 uppercase">New Highs/Lows</span>
              <div className="text-xl font-bold text-positive mt-1">3.4x</div>
              <span className="text-[10px] text-slate-400">Strong confirmation</span>
            </div>
          </div>
        </div>
      }>
      <div className="flex flex-col gap-4 justify-center h-full">
        {[
          { label: '% Above 20-day SMA', val: 66.1, c: '#22c55e' },
          { label: '% Above 50-day SMA', val: 43.4, c: '#eab308' },
          { label: '% Above 200-day SMA', val: 53.2, c: '#eab308' },
        ].map(m => (
          <div key={m.label} className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: m.c }} />
            <span className="text-xs text-slate-300 font-mono flex-1">{m.label}</span>
            <span className="text-xs font-bold text-slate-100" style={{ color: m.c }}>{m.val}%</span>
          </div>
        ))}
      </div>
    </PulsePanel>
  );
}

export function MarketRegimePanel(props: PanelExpandProps) {
  const signals = [
    { name: 'VIX Level', value: '19.23', status: 'calm', signal: 'RISK-ON', color: '#22c55e' },
    { name: 'Put/Call Ratio', value: '0.82', status: 'neutral', signal: 'NEUTRAL', color: '#eab308' },
    { name: 'Junk Bond Spread', value: '3.4%', status: 'tight', signal: 'RISK-ON', color: '#22c55e' },
    { name: 'Market Momentum', value: '66.1%', status: '>50 SMA', signal: 'RISK-ON', color: '#22c55e' },
    { name: 'Safe Haven Flow', value: '-1.2%', status: 'outflow', signal: 'RISK-ON', color: '#22c55e' },
    { name: 'Credit Stress', value: '0.15', status: 'low', signal: 'NEUTRAL', color: '#eab308' },
  ];
  
  const riskOn = signals.filter(s => s.signal === 'RISK-ON').length;
  const total = signals.length;
  const regime = riskOn >= 4 ? 'RISK-ON' : riskOn >= 2 ? 'CAUTIOUS' : 'RISK-OFF';
  const regimeColor = regime === 'RISK-ON' ? '#22c55e' : regime === 'CAUTIOUS' ? '#eab308' : '#ef4444';
  const regimeHistory = genVolatileData(4, 1.5, 30);

  return (
    <PulsePanel title="Market Regime" category="MARKETS" {...props}
      analysis={`Composite reads ${regime} with ${riskOn}/${total} signals positive. VIX below 20, junk spreads tight, safe haven outflows — textbook risk-on. Aggressive stance warranted: overweight equities, underweight bonds. Regime flips to CAUTIOUS if VIX breaks 22 or junk spreads widen above 4.5%.`}
      expandedContent={
        <div className="space-y-3">
          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Regime Score (30d History)</span>
          <LightweightChart data={regimeHistory} height={100} hideAxes lineColor={regimeColor} type="area" />
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-bg-elevated/30 border border-white/5 rounded-lg p-2 text-center">
              <span className="text-[9px] font-mono text-slate-500">Avg Drawdown</span>
              <div className="text-lg font-bold text-positive">-1.2%</div>
            </div>
            <div className="bg-bg-elevated/30 border border-white/5 rounded-lg p-2 text-center">
              <span className="text-[9px] font-mono text-slate-500">Win Rate</span>
              <div className="text-lg font-bold text-positive">72%</div>
            </div>
            <div className="bg-bg-elevated/30 border border-white/5 rounded-lg p-2 text-center">
              <span className="text-[9px] font-mono text-slate-500">Days in Regime</span>
              <div className="text-lg font-bold text-blue-400">18</div>
            </div>
          </div>
        </div>
      }>
      <div className="flex-1 flex flex-col gap-3">
        <div className="flex items-center justify-between p-3 rounded-lg border" style={{ borderColor: `${regimeColor}30`, backgroundColor: `${regimeColor}08` }}>
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">Overall Regime</span>
            <span className="text-xl font-bold" style={{ color: regimeColor }}>{regime}</span>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-slate-200">{riskOn}/{total}</span>
            <span className="text-[10px] font-mono text-slate-500 block">signals positive</span>
          </div>
        </div>
        <div className="space-y-1.5 flex-1 overflow-y-auto">
          {signals.map(s => (
            <div key={s.name} className="flex items-center justify-between py-1.5 px-2 bg-bg-elevated/30 rounded border border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-[11px] text-slate-300">{s.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold text-slate-200">{s.value}</span>
                <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded" style={{ color: s.color, backgroundColor: `${s.color}15` }}>
                  {s.signal}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PulsePanel>
  );
}
