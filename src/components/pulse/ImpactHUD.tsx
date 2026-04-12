import React from 'react';
import type { PulseEvent, MarketSignal } from '@/lib/pulseEventEngine';
import { useQuantSuiteStore } from '@/stores/quantsuiteStore';
import { Shield, TrendingUp, TrendingDown, Activity, BarChart3, Target, AlertTriangle } from 'lucide-react';

interface Props {
  events: PulseEvent[];
  riskIndex: number;
}

const riskColors: Record<string, string> = {
  low: '#00ff88',
  moderate: '#ffaa00',
  elevated: '#ff8800',
  high: '#ff4444',
  extreme: '#ff0044',
};

export default function ImpactHUD({ events, riskIndex }: Props) {
  const { watchlist } = useQuantSuiteStore();

  // Aggregate sector impacts across all events
  const aggregatedSectors: Record<string, number> = {};
  events.forEach(e => {
    e.signal.sectors.forEach(s => {
      aggregatedSectors[s.name] = (aggregatedSectors[s.name] || 0) + s.impact;
    });
  });
  const sortedSectors = Object.entries(aggregatedSectors)
    .map(([name, impact]) => ({ name, impact: Math.max(-1, Math.min(1, impact)) }))
    .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
    .slice(0, 6);

  // Risk gauge
  const riskColor = riskIndex >= 8 ? '#ff0044' : riskIndex >= 6 ? '#ff4444' : riskIndex >= 4 ? '#ffaa00' : '#00ff88';
  const riskLabel = riskIndex >= 8 ? 'EXTREME' : riskIndex >= 6 ? 'HIGH' : riskIndex >= 4 ? 'ELEVATED' : riskIndex >= 2 ? 'MODERATE' : 'LOW';

  // Aggregate vol delta
  const avgVol = events.length > 0 ? events.reduce((s, e) => s + e.signal.volatilityDelta, 0) / events.length : 0;
  
  // Aggregate inflation
  const avgInflation = events.length > 0 ? events.reduce((s, e) => s + e.signal.inflationPressure, 0) / events.length : 0;

  // Strategy bias
  const stratBias = avgVol > 2 ? 'Hedging / Options' : avgVol < -1 ? 'Carry / Income' : 'Directional OK';

  return (
    <div className="bg-black/60 backdrop-blur-xl border-t border-white/10">
      {/* Top bar: risk gauge */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5" style={{ color: riskColor }} />
          <span className="text-[9px] font-mono uppercase tracking-widest text-white/40">System Risk Assessment</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-20 h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${riskIndex * 10}%`, background: `linear-gradient(90deg, #00ff88, ${riskColor})`, boxShadow: `0 0 8px ${riskColor}40` }}
              />
            </div>
            <span className="text-xs font-mono font-bold" style={{ color: riskColor }}>{riskIndex.toFixed(1)}</span>
          </div>
          <span className="text-[8px] font-mono px-2 py-0.5 rounded-full border" style={{ color: riskColor, borderColor: `${riskColor}30`, backgroundColor: `${riskColor}08` }}>
            {riskLabel}
          </span>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-4 divide-x divide-white/5">
        {/* Market Impact */}
        <div className="p-3">
          <div className="flex items-center gap-1 mb-2">
            <Activity className="w-3 h-3 text-[#00d5ff]" />
            <span className="text-[8px] font-mono uppercase tracking-widest text-[#00d5ff]/60">Market Impact</span>
          </div>
          <div className="space-y-1">
            {sortedSectors.slice(0, 4).map(s => (
              <div key={s.name} className="flex items-center justify-between">
                <span className="text-[9px] font-mono text-white/40 truncate mr-2">{s.name}</span>
                <span className="text-[9px] font-mono font-bold" style={{ color: s.impact > 0 ? '#00ff88' : '#ff4444' }}>
                  {s.impact > 0 ? '↑' : '↓'}{Math.abs(s.impact * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Volatility */}
        <div className="p-3">
          <div className="flex items-center gap-1 mb-2">
            <BarChart3 className="w-3 h-3 text-[#ffaa00]" />
            <span className="text-[8px] font-mono uppercase tracking-widest text-[#ffaa00]/60">Volatility</span>
          </div>
          <div className="text-lg font-mono font-bold" style={{ color: avgVol > 0 ? '#ff4444' : '#00ff88' }}>
            {avgVol > 0 ? '+' : ''}{avgVol.toFixed(1)}<span className="text-[9px] text-white/20 ml-1">pts</span>
          </div>
          <div className="text-[8px] font-mono text-white/25 mt-1">
            {avgVol > 3 ? 'VIX Expansion Expected' : avgVol > 0 ? 'Slight Uptick' : avgVol > -1 ? 'Stable Environment' : 'Vol Compression'}
          </div>
        </div>

        {/* Inflation Pressure */}
        <div className="p-3">
          <div className="flex items-center gap-1 mb-2">
            {avgInflation > 0 ? <TrendingUp className="w-3 h-3 text-[#ff8800]" /> : <TrendingDown className="w-3 h-3 text-[#00d5ff]" />}
            <span className="text-[8px] font-mono uppercase tracking-widest text-white/30">Inflation</span>
          </div>
          <div className="text-lg font-mono font-bold" style={{ color: avgInflation > 0 ? '#ff8800' : '#00d5ff' }}>
            {avgInflation > 0 ? '↑' : '↓'} {Math.abs(avgInflation * 100).toFixed(0)}%
          </div>
          <div className="text-[8px] font-mono text-white/25 mt-1">
            {avgInflation > 0.3 ? 'Hawkish Pressure' : avgInflation < -0.2 ? 'Deflationary Signal' : 'Neutral'}
          </div>
        </div>

        {/* Strategy Suitability */}
        <div className="p-3">
          <div className="flex items-center gap-1 mb-2">
            <Target className="w-3 h-3 text-[#00ff88]" />
            <span className="text-[8px] font-mono uppercase tracking-widest text-[#00ff88]/60">Strategy</span>
          </div>
          <div className="text-xs font-mono font-bold text-white/70">{stratBias}</div>
          <div className="text-[8px] font-mono text-white/25 mt-1">
            {events.length} active signal{events.length !== 1 ? 's' : ''}
          </div>
          {watchlist.length > 0 && (
            <div className="flex gap-1 mt-1.5 flex-wrap">
              {watchlist.slice(0, 3).map(s => (
                <span key={s} className="text-[7px] font-mono px-1 py-0.5 rounded bg-[#00ff88]/5 text-[#00ff88]/40 border border-[#00ff88]/10">{s}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
