import React, { useState } from 'react';
import type { PulseEvent } from '@/lib/pulseEventEngine';
import PropagationGraph from './PropagationGraph';
import { ChevronRight, Clock, MapPin, Zap, TrendingUp, TrendingDown, AlertTriangle, Activity } from 'lucide-react';

interface Props {
  event: PulseEvent;
  isSelected?: boolean;
  onClick?: () => void;
}

const typeIcons: Record<string, string> = {
  geopolitical: '🌍',
  economic: '📊',
  commodity: '🛢️',
  central_bank: '🏦',
  trade: '🔗',
  earnings: '💰',
};

const riskColors: Record<string, string> = {
  low: '#00ff88',
  moderate: '#ffaa00',
  elevated: '#ff8800',
  high: '#ff4444',
  extreme: '#ff0044',
};

export default function EventCard({ event, isSelected, onClick }: Props) {
  const [expanded, setExpanded] = useState(false);
  const riskColor = riskColors[event.signal.riskLevel] || '#ffaa00';
  const intensityPct = (event.intensity / 10) * 100;
  const timeAgo = Math.round((Date.now() - event.timestamp) / 60000);
  
  return (
    <div
      className={`rounded-lg border transition-all cursor-pointer group ${
        isSelected
          ? 'border-white/20 bg-white/[0.04] ring-1 ring-white/10'
          : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10'
      }`}
      onClick={() => { setExpanded(!expanded); onClick?.(); }}
    >
      {/* Header */}
      <div className="p-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <span className="text-sm">{typeIcons[event.type] || '⚡'}</span>
            <span className="text-[10px] font-mono font-bold text-white/80 truncate">{event.title}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[7px] font-mono px-1.5 py-0.5 rounded-full border" style={{ color: riskColor, borderColor: `${riskColor}40`, backgroundColor: `${riskColor}10` }}>
              {event.signal.riskLevel.toUpperCase()}
            </span>
            <ChevronRight className={`w-3 h-3 text-white/20 transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </div>
        </div>
        
        {/* Intensity bar */}
        <div className="mt-1.5 flex items-center gap-2">
          <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${intensityPct}%`,
                background: `linear-gradient(90deg, ${riskColor}60, ${riskColor})`,
                boxShadow: `0 0 8px ${riskColor}40`,
              }}
            />
          </div>
          <span className="text-[8px] font-mono font-bold" style={{ color: riskColor }}>{event.intensity.toFixed(1)}</span>
        </div>
        
        {/* Meta row */}
        <div className="flex items-center gap-3 mt-1.5">
          <span className="flex items-center gap-0.5 text-[8px] text-white/25 font-mono"><MapPin className="w-2.5 h-2.5" />{event.location}</span>
          <span className="flex items-center gap-0.5 text-[8px] text-white/25 font-mono"><Clock className="w-2.5 h-2.5" />{timeAgo < 60 ? `${timeAgo}m ago` : `${Math.round(timeAgo / 60)}h ago`}</span>
        </div>
        
        {/* Affected systems */}
        <div className="flex flex-wrap gap-1 mt-1.5">
          {event.affectedSystems.slice(0, 4).map(sys => (
            <span key={sys} className="text-[7px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-white/35">{sys}</span>
          ))}
          {event.affectedSystems.length > 4 && <span className="text-[7px] font-mono text-white/20">+{event.affectedSystems.length - 4}</span>}
        </div>
      </div>
      
      {/* Expanded view */}
      {expanded && (
        <div className="border-t border-white/5 p-2.5 space-y-3 animate-in slide-in-from-top-2 duration-200">
          {/* Description */}
          <p className="text-[9px] text-white/40 leading-relaxed font-mono">{event.description}</p>
          
          {/* Sector impacts */}
          <div>
            <span className="text-[7px] uppercase tracking-widest text-white/20 font-mono">Sector Impact</span>
            <div className="mt-1 space-y-0.5">
              {event.signal.sectors.map(s => (
                <div key={s.name} className="flex items-center gap-2">
                  <span className="text-[8px] font-mono text-white/40 w-28 truncate">{s.name}</span>
                  <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.abs(s.impact) * 100}%`,
                        backgroundColor: s.impact > 0 ? '#00ff88' : '#ff4444',
                        marginLeft: s.impact < 0 ? 'auto' : 0,
                      }}
                    />
                  </div>
                  <span className="text-[8px] font-mono w-8 text-right" style={{ color: s.impact > 0 ? '#00ff88' : '#ff4444' }}>
                    {s.impact > 0 ? '+' : ''}{(s.impact * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Propagation chain */}
          <PropagationGraph chain={event.propagation} compact />
          
          {/* Insight */}
          <div className="bg-[#00d5ff]/[0.04] border border-[#00d5ff]/10 rounded-md p-2">
            <div className="flex items-center gap-1 mb-1">
              <Zap className="w-2.5 h-2.5 text-[#00d5ff]" />
              <span className="text-[7px] uppercase tracking-widest text-[#00d5ff]/60 font-mono">Intelligence</span>
            </div>
            <p className="text-[9px] text-white/45 leading-relaxed">{event.insight}</p>
          </div>
          
          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white/[0.02] rounded p-1.5">
              <div className="text-[7px] text-white/20 uppercase font-mono">Vol Δ</div>
              <div className={`text-xs font-mono font-bold ${event.signal.volatilityDelta > 0 ? 'text-[#ff4444]' : 'text-[#00ff88]'}`}>
                {event.signal.volatilityDelta > 0 ? '+' : ''}{event.signal.volatilityDelta.toFixed(1)}
              </div>
            </div>
            <div className="bg-white/[0.02] rounded p-1.5">
              <div className="text-[7px] text-white/20 uppercase font-mono">Inflation</div>
              <div className={`text-xs font-mono font-bold ${event.signal.inflationPressure > 0 ? 'text-[#ffaa00]' : 'text-[#00d5ff]'}`}>
                {event.signal.inflationPressure > 0 ? '↑' : '↓'} {Math.abs(event.signal.inflationPressure * 100).toFixed(0)}%
              </div>
            </div>
            <div className="bg-white/[0.02] rounded p-1.5">
              <div className="text-[7px] text-white/20 uppercase font-mono">Confidence</div>
              <div className="text-xs font-mono font-bold text-[#00d5ff]">{(event.confidence * 100).toFixed(0)}%</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
