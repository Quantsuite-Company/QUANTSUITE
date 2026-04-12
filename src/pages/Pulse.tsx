import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useQuantSuiteStore } from '@/stores/quantsuiteStore';
import { generateActiveEvents, computeRiskIndex, eventsToSignals, type PulseEvent } from '@/lib/pulseEventEngine';
import { fetchAllNews, getFallbackNews, CATEGORY_STYLES, SENTIMENT_STYLES, type NewsItem } from '@/lib/newsTerminal';
import { InteractiveMap } from '@/components/pulse/InteractiveMap';
import { MarketTickerStrip } from '@/components/pulse/MarketTickerStrip';
import { GlobalIndicesGrid } from '@/components/pulse/GlobalIndicesGrid';
import ImpactHUD from '@/components/pulse/ImpactHUD';
import { Helmet } from 'react-helmet-async';
import {
  ChevronDown, ChevronLeft, ChevronRight, Shield, Activity, Zap, Globe, TrendingUp,
  TrendingDown, BarChart3, Clock, MapPin, Flame, Eye, AlertTriangle, Newspaper,
  ExternalLink, RefreshCw, Layers, X, Search, Radio, Filter, Maximize2, Minimize2,
  ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

/* ═══ TYPES ═══ */
type ViewRegion = 'global' | 'americas' | 'europe' | 'asia' | 'mena' | 'africa';
type TimeRange = '1h' | '6h' | '24h' | '7d' | '30d';
type BottomTab = 'markets' | 'news' | 'impact' | 'volatility';

const VIEWS: { id: ViewRegion; label: string }[] = [
  { id: 'global', label: 'Global' }, { id: 'americas', label: 'Americas' },
  { id: 'europe', label: 'Europe' }, { id: 'asia', label: 'Asia-Pac' },
  { id: 'mena', label: 'MENA' }, { id: 'africa', label: 'Africa' },
];
const TIME_RANGES: { id: TimeRange; label: string }[] = [
  { id: '1h', label: '1H' }, { id: '6h', label: '6H' }, { id: '24h', label: '24H' },
  { id: '7d', label: '7D' }, { id: '30d', label: '30D' },
];
const LAYER_OPTIONS = [
  { id: 'economic', label: 'Economic Events', color: '#00d5ff', emoji: '📊' },
  { id: 'geopolitical', label: 'Geopolitical', color: '#ff4444', emoji: '🔴' },
  { id: 'commodities', label: 'Commodities', color: '#eab308', emoji: '🛢' },
  { id: 'central-banks', label: 'Central Banks', color: '#ec4899', emoji: '🏦' },
  { id: 'trade-routes', label: 'Trade Routes', color: '#00ff88', emoji: '⚓' },
  { id: 'exchanges', label: 'Exchanges', color: '#a855f7', emoji: '🏛' },
  { id: 'outages', label: 'Infrastructure', color: '#f97316', emoji: '⚡' },
  { id: 'natural', label: 'Natural Events', color: '#22c55e', emoji: '🌊' },
];
const typeIcons: Record<string, string> = {
  geopolitical: '🔴', economic: '📊', commodity: '🛢️', central_bank: '🏦', trade: '⚓', earnings: '💰',
};
const riskColorMap: Record<string, string> = {
  low: '#00ff88', moderate: '#ffaa00', elevated: '#ff8800', high: '#ff4444', extreme: '#ff0044',
};

/* ═══ CHART DATA GENERATORS ═══ */
function genMiniChart(name: string, trend: number) {
  const s = name.length * 7;
  return Array.from({ length: 24 }, (_, i) => ({
    t: i,
    v: +(100 + trend * i * 0.3 + Math.sin(s + i * 0.7) * 2 + Math.cos(s * 0.3 + i * 1.1) * 1.5).toFixed(1),
  }));
}
function genVolData(events: PulseEvent[]) {
  return events.map(e => ({
    name: e.title.split(' ').slice(0, 2).join(' '),
    vol: Math.abs(e.signal.volatilityDelta),
    color: e.signal.volatilityDelta > 0 ? '#ff4444' : '#00ff88',
  }));
}

const ttStyle: React.CSSProperties = {
  backgroundColor: '#111116', border: '1px solid #ffffff15', borderRadius: '6px',
  fontFamily: "'Times New Roman', serif", fontSize: '11px', color: '#ccc', padding: '6px 10px',
};

/* ═══════════════════════════════════════════════════════
   PULSE — WORLD MONITOR STYLE
   Full-screen map + left panel + bottom strip
   ═══════════════════════════════════════════════════════ */
export default function Pulse() {
  /* ─── State ─── */
  const [view, setView] = useState<ViewRegion>('global');
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [activeLayers, setActiveLayers] = useState(['economic', 'geopolitical', 'commodities', 'central-banks', 'trade-routes', 'exchanges']);
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [bottomPanelOpen, setBottomPanelOpen] = useState(true);
  const [bottomTab, setBottomTab] = useState<BottomTab>('markets');
  const [selectedEvent, setSelectedEvent] = useState<PulseEvent | null>(null);
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsFilter, setNewsFilter] = useState<NewsItem['category'] | 'all'>('all');
  const newsRef = useRef(false);

  const { dispatchPulseEvents } = useQuantSuiteStore();

  /* ─── Clock ─── */
  useEffect(() => { const i = setInterval(() => setCurrentTime(new Date()), 1000); return () => clearInterval(i); }, []);

  /* ─── Events ─── */
  const events = useMemo(() => generateActiveEvents(8), []);
  const riskIndex = useMemo(() => computeRiskIndex(events), [events]);
  useEffect(() => { dispatchPulseEvents(events, eventsToSignals(events), riskIndex); }, [events, riskIndex, dispatchPulseEvents]);

  /* ─── News ─── */
  const loadNews = useCallback(async () => {
    setNewsLoading(true);
    try { const items = await fetchAllNews(); setNewsItems(items.length > 0 ? items : getFallbackNews()); }
    catch { setNewsItems(getFallbackNews()); }
    finally { setNewsLoading(false); }
  }, []);
  useEffect(() => {
    if (!newsRef.current) { newsRef.current = true; loadNews(); }
    const i = setInterval(loadNews, 15 * 60 * 1000);
    return () => clearInterval(i);
  }, [loadNews]);

  const filteredNews = useMemo(() => {
    const items = newsFilter === 'all' ? newsItems : newsItems.filter(n => n.category === newsFilter);
    return items.slice(0, 25);
  }, [newsItems, newsFilter]);

  /* ─── Derived ─── */
  const riskColor = riskIndex >= 8 ? '#ff0044' : riskIndex >= 6 ? '#ff4444' : riskIndex >= 4 ? '#ffaa00' : '#00ff88';
  const riskLabel = riskIndex >= 8 ? 'EXTREME' : riskIndex >= 6 ? 'HIGH' : riskIndex >= 4 ? 'ELEVATED' : 'MODERATE';
  const toggleLayer = useCallback((id: string) => setActiveLayers(p => p.includes(id) ? p.filter(l => l !== id) : [...p, id]), []);

  const mapRegion = view === 'global' ? 'Global' : view === 'americas' ? 'Americas' : view === 'europe' ? 'Europe'
    : view === 'asia' ? 'Asia' : view === 'mena' ? 'MENA' : 'Africa';

  const formatUTC = (d: Date) => {
    const h = String(d.getUTCHours()).padStart(2, '0');
    const m = String(d.getUTCMinutes()).padStart(2, '0');
    const s = String(d.getUTCSeconds()).padStart(2, '0');
    return `${h}:${m}:${s} UTC`;
  };

  return (
    <>
      <Helmet><title>Pulse — Global Intelligence | QuantSuite</title></Helmet>

      <style>{`
        .wm-root {
          position: relative; width: 100%; height: calc(100vh - 3.5rem);
          background: #06070a; overflow: hidden;
          font-family: 'Times New Roman', Georgia, 'Palatino Linotype', serif;
          color: #e0e0e0; display: flex; flex-direction: column;
        }
        .wm-mono { font-family: 'JetBrains Mono', 'Consolas', 'SF Mono', monospace; }
        .wm-glass {
          background: rgba(10,11,16,0.92); backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.06);
        }
        .wm-glass-light {
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
          border-radius: 8px;
        }
        .wm-glass-light:hover {
          background: rgba(255,255,255,0.055); border-color: rgba(255,255,255,0.12);
        }
        .wm-scrollbar::-webkit-scrollbar { width: 4px; }
        .wm-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .wm-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }
        .wm-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
        @keyframes wmPulse { 0%,100% { opacity:0.6; } 50% { opacity:1; } }
        @keyframes wmGlow { 0%,100% { box-shadow: 0 0 4px currentColor; } 50% { box-shadow: 0 0 12px currentColor, 0 0 24px currentColor; } }
      `}</style>

      <div className="wm-root">

        {/* ══════ TOP BAR ══════ */}
        <div className="wm-glass flex items-center justify-between px-3 py-1.5 z-50 shrink-0 border-b border-white/[0.06]">
          {/* Left: logo + view tabs */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-[#00d5ff]" />
              <span className="wm-mono text-[11px] font-bold tracking-[0.15em] text-white/80">QUANTSUITE</span>
              <span className="wm-mono text-[9px] text-[#00d5ff]/60 font-bold tracking-wider ml-0.5">PULSE</span>
            </div>
            <div className="h-4 w-[1px] bg-white/8 mx-1" />
            {/* View region tabs */}
            <div className="flex items-center gap-0.5">
              {VIEWS.map(v => (
                <button key={v.id} onClick={() => setView(v.id)}
                  className={cn('px-2.5 py-1 rounded wm-mono text-[9px] font-bold uppercase tracking-wider transition-all',
                    view === v.id ? 'bg-white/[0.08] text-white border border-white/10' : 'text-white/25 hover:text-white/50 hover:bg-white/[0.03] border border-transparent')}>
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          {/* Center: time range */}
          <div className="flex items-center gap-0.5 bg-white/[0.03] rounded-lg p-0.5 border border-white/[0.06]">
            {TIME_RANGES.map(t => (
              <button key={t.id} onClick={() => setTimeRange(t.id)}
                className={cn('px-2 py-0.5 rounded wm-mono text-[9px] font-bold transition-all',
                  timeRange === t.id ? 'bg-[#00d5ff]/15 text-[#00d5ff] border border-[#00d5ff]/20' : 'text-white/25 hover:text-white/50 border border-transparent')}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Right: risk + time + controls */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border" style={{ borderColor: `${riskColor}25`, backgroundColor: `${riskColor}08` }}>
              <Shield className="w-3 h-3" style={{ color: riskColor }} />
              <span className="wm-mono text-[9px] font-bold" style={{ color: riskColor }}>{riskIndex.toFixed(1)}</span>
              <span className="wm-mono text-[7px]" style={{ color: `${riskColor}80` }}>{riskLabel}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500" style={{ animation: 'wmPulse 2s infinite' }} />
              <span className="wm-mono text-[8px] font-bold text-red-400/80">LIVE</span>
            </div>
            <span className="wm-mono text-[9px] text-white/20">{formatUTC(currentTime)}</span>
            <button onClick={() => setShowLayerPanel(!showLayerPanel)} className="p-1 rounded hover:bg-white/5 transition text-white/25 hover:text-white/50">
              <Layers className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ══════ MAIN AREA: MAP + PANELS ══════ */}
        <div className="flex-1 relative overflow-hidden">

          {/* ── FULL-SCREEN MAP ── */}
          <div className="absolute inset-0 z-0">
            <InteractiveMap region={mapRegion} layers={activeLayers} events={[]} />
          </div>

          {/* ── LAYER PANEL (floating, top-right) ── */}
          {showLayerPanel && (
            <div className="absolute top-3 right-3 z-40 wm-glass rounded-xl p-3 w-[220px] shadow-2xl">
              <div className="flex items-center justify-between mb-2">
                <span className="wm-mono text-[10px] font-bold text-white/60 uppercase tracking-[0.12em]">Data Layers</span>
                <button onClick={() => setShowLayerPanel(false)} className="text-white/20 hover:text-white/50 transition"><X className="w-3.5 h-3.5" /></button>
              </div>
              <div className="space-y-0.5">
                {LAYER_OPTIONS.map(l => (
                  <button key={l.id} onClick={() => toggleLayer(l.id)}
                    className={cn('w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all',
                      activeLayers.includes(l.id) ? 'bg-white/[0.05]' : 'hover:bg-white/[0.03]')}>
                    <div className={cn('w-4 h-4 rounded flex items-center justify-center border text-[8px] transition',
                      activeLayers.includes(l.id) ? `border-opacity-60` : 'border-white/10 text-white/15')}
                      style={activeLayers.includes(l.id) ? { borderColor: l.color, color: l.color, backgroundColor: `${l.color}15` } : {}}>
                      {activeLayers.includes(l.id) ? '✓' : ''}
                    </div>
                    <span className="text-[10px]">{l.emoji}</span>
                    <span className={cn('wm-mono text-[9px] font-bold', activeLayers.includes(l.id) ? 'text-white/60' : 'text-white/20')}>
                      {l.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── LEFT PANEL (collapsible event feed) ── */}
          <div className={cn('absolute top-0 left-0 bottom-0 z-30 flex transition-all duration-300',
            leftPanelOpen ? 'translate-x-0' : '-translate-x-[340px]')}>
            {/* Panel content */}
            <div className="wm-glass w-[340px] flex flex-col border-r border-white/[0.06] h-full">
              {/* Panel header */}
              <div className="px-3 py-2 border-b border-white/[0.06] shrink-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-[#ffaa00]" />
                    <span className="wm-mono text-[10px] font-bold text-white/70 uppercase tracking-[0.12em]">Event Feed</span>
                    <span className="wm-mono text-[8px] text-white/20">{events.length}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Radio className="w-3 h-3 text-[#00d5ff]" style={{ animation: 'wmPulse 2.5s infinite' }} />
                    <span className="wm-mono text-[7px] text-[#00d5ff]/50">CONNECTED</span>
                  </div>
                </div>
              </div>

              {/* Event list */}
              <div className="flex-1 overflow-y-auto wm-scrollbar p-2 space-y-1.5" style={{ contain: 'layout' }}>
                {events.sort((a, b) => b.intensity - a.intensity).map(event => {
                  const rc = riskColorMap[event.signal.riskLevel] || '#ffaa00';
                  const timeAgo = Math.round((Date.now() - event.timestamp) / 60000);
                  const isSelected = selectedEvent?.id === event.id;
                  return (
                    <div key={event.id} onClick={() => setSelectedEvent(isSelected ? null : event)}
                      className={cn('rounded-lg p-2.5 cursor-pointer transition-all border',
                        isSelected ? 'bg-white/[0.05] border-white/10' : 'bg-white/[0.015] border-transparent hover:bg-white/[0.03] hover:border-white/[0.06]')}>
                      <div className="flex items-start gap-2">
                        {/* Severity dot */}
                        <div className="mt-1 shrink-0">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: rc, boxShadow: `0 0 8px ${rc}50`, animation: event.intensity >= 7 ? 'wmGlow 2s infinite' : 'none', color: rc }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 mb-0.5">
                            <span className="text-xs">{typeIcons[event.type] || '⚡'}</span>
                            <span className="wm-mono text-[7px] px-1 py-0.5 rounded border font-bold"
                              style={{ color: rc, borderColor: `${rc}30`, backgroundColor: `${rc}08` }}>
                              {event.signal.riskLevel.toUpperCase()}
                            </span>
                            <span className="wm-mono text-[7px] text-white/15 ml-auto">
                              {timeAgo < 60 ? `${timeAgo}m` : `${Math.round(timeAgo / 60)}h`}
                            </span>
                          </div>
                          <h4 className="text-[11px] font-bold text-white/70 leading-snug mb-1">{event.title}</h4>
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-2.5 h-2.5 text-white/15" />
                            <span className="wm-mono text-[8px] text-white/20">{event.location}</span>
                          </div>

                          {/* Expanded detail */}
                          {isSelected && (
                            <div className="mt-2 pt-2 border-t border-white/[0.06] space-y-2">
                              <p className="text-[10px] text-white/35 leading-relaxed">{event.description}</p>
                              {/* Sector impacts */}
                              <div className="space-y-0.5">
                                {event.signal.sectors.slice(0, 4).map(s => (
                                  <div key={s.name} className="flex items-center gap-1.5">
                                    <span className="wm-mono text-[8px] text-white/25 w-20 truncate">{s.name}</span>
                                    <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                                      <div className="h-full rounded-full" style={{ width: `${Math.abs(s.impact) * 100}%`, backgroundColor: s.impact > 0 ? '#00ff88' : '#ff4444' }} />
                                    </div>
                                    <span className="wm-mono text-[7px] font-bold w-7 text-right" style={{ color: s.impact > 0 ? '#00ff88' : '#ff4444' }}>
                                      {s.impact > 0 ? '+' : ''}{(s.impact * 100).toFixed(0)}%
                                    </span>
                                  </div>
                                ))}
                              </div>
                              {/* Insight */}
                              <div className="bg-[#00d5ff]/[0.03] border border-[#00d5ff]/[0.08] rounded-lg p-2">
                                <p className="text-[9px] text-white/30 leading-relaxed">{event.insight}</p>
                              </div>
                              {/* Stats row */}
                              <div className="flex gap-2">
                                <div className="flex-1 bg-white/[0.02] rounded p-1.5">
                                  <span className="wm-mono text-[6px] text-white/15 uppercase block">Vol</span>
                                  <span className={`wm-mono text-[10px] font-bold ${event.signal.volatilityDelta > 0 ? 'text-[#ff4444]' : 'text-[#00ff88]'}`}>
                                    {event.signal.volatilityDelta > 0 ? '+' : ''}{event.signal.volatilityDelta.toFixed(1)}
                                  </span>
                                </div>
                                <div className="flex-1 bg-white/[0.02] rounded p-1.5">
                                  <span className="wm-mono text-[6px] text-white/15 uppercase block">CPI</span>
                                  <span className={`wm-mono text-[10px] font-bold ${event.signal.inflationPressure > 0 ? 'text-[#ffaa00]' : 'text-[#00d5ff]'}`}>
                                    {event.signal.inflationPressure > 0 ? '↑' : '↓'}{Math.abs(event.signal.inflationPressure * 100).toFixed(0)}%
                                  </span>
                                </div>
                                <div className="flex-1 bg-white/[0.02] rounded p-1.5">
                                  <span className="wm-mono text-[6px] text-white/15 uppercase block">Conf</span>
                                  <span className="wm-mono text-[10px] font-bold text-[#00d5ff]">{(event.confidence * 100).toFixed(0)}%</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Connected modules */}
              <div className="px-3 py-2 border-t border-white/[0.06] shrink-0 bg-white/[0.01]">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="wm-mono text-[7px] text-white/15 uppercase tracking-widest">Signal Flow</span>
                </div>
                <div className="flex gap-1">
                  {['MarketMaw', 'Athena', 'Strategy'].map(m => (
                    <span key={m} className="wm-mono text-[7px] px-1.5 py-0.5 rounded bg-[#00d5ff]/5 text-[#00d5ff]/30 border border-[#00d5ff]/8">{m}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Toggle button */}
            <button onClick={() => setLeftPanelOpen(!leftPanelOpen)}
              className="mt-3 wm-glass w-5 h-10 flex items-center justify-center rounded-r-lg border-l-0 hover:bg-white/5 transition text-white/20 hover:text-white/50 shrink-0">
              {leftPanelOpen ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
          </div>

          {/* ── BOTTOM PANEL (collapsible - markets/news/charts) ── */}
          <div className={cn('absolute left-0 right-0 bottom-0 z-30 transition-all duration-300',
            bottomPanelOpen ? 'translate-y-0' : 'translate-y-[calc(100%-32px)]')}>

            {/* Toggle + tabs */}
            <div className="flex items-center justify-between px-3 wm-glass border-t border-white/[0.06] rounded-t-xl" style={{ height: 32 }}>
              <div className="flex items-center gap-0.5">
                {([
                  { id: 'markets' as BottomTab, label: 'Markets', icon: <Activity className="w-3 h-3" /> },
                  { id: 'news' as BottomTab, label: 'News Terminal', icon: <Newspaper className="w-3 h-3" /> },
                  { id: 'impact' as BottomTab, label: 'Impact', icon: <Shield className="w-3 h-3" /> },
                  { id: 'volatility' as BottomTab, label: 'Volatility', icon: <BarChart3 className="w-3 h-3" /> },
                ]).map(tab => (
                  <button key={tab.id} onClick={() => { setBottomTab(tab.id); setBottomPanelOpen(true); }}
                    className={cn('flex items-center gap-1 px-2.5 py-1 rounded wm-mono text-[8px] font-bold uppercase tracking-wider transition',
                      bottomTab === tab.id && bottomPanelOpen ? 'text-[#00d5ff] bg-[#00d5ff]/8' : 'text-white/20 hover:text-white/40')}>
                    {tab.icon}{tab.label}
                  </button>
                ))}
              </div>
              <button onClick={() => setBottomPanelOpen(!bottomPanelOpen)} className="text-white/20 hover:text-white/50 transition">
                {bottomPanelOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Panel content */}
            <div className="wm-glass border-t border-white/[0.04]" style={{ height: 280 }}>
              {bottomTab === 'markets' && (
                <div className="p-3 h-full overflow-y-auto wm-scrollbar">
                  <GlobalIndicesGrid region={mapRegion} />
                </div>
              )}

              {bottomTab === 'news' && (
                <div className="h-full flex flex-col">
                  {/* Filter row */}
                  <div className="flex items-center gap-1 px-3 py-1.5 border-b border-white/[0.04] shrink-0 overflow-x-hidden">
                    {(['all', 'markets', 'economy', 'geopolitics', 'earnings', 'crypto', 'commodities', 'central_bank'] as const).map(cat => {
                      const s = cat === 'all' ? { color: '#00d5ff', label: 'ALL' } : CATEGORY_STYLES[cat];
                      return (
                        <button key={cat} onClick={() => setNewsFilter(cat)}
                          className={cn('px-2 py-0.5 rounded wm-mono text-[7px] font-bold uppercase tracking-wider transition border',
                            newsFilter === cat ? 'border-white/10 bg-white/[0.05]' : 'border-transparent hover:bg-white/[0.03]')}
                          style={{ color: newsFilter === cat ? s.color : `${s.color}40` }}>
                          {s.label}
                        </button>
                      );
                    })}
                    <button onClick={loadNews} disabled={newsLoading} className="ml-auto text-white/15 hover:text-white/40 transition">
                      <RefreshCw className={cn('w-3 h-3', newsLoading && 'animate-spin')} />
                    </button>
                  </div>
                  {/* News list */}
                  <div className="flex-1 overflow-y-auto wm-scrollbar p-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2" style={{ contain: 'layout' }}>
                    {filteredNews.map(item => {
                      const cs = CATEGORY_STYLES[item.category];
                      const ss = SENTIMENT_STYLES[item.sentiment];
                      const ago = Math.round((Date.now() - item.publishedAt.getTime()) / 60000);
                      return (
                        <a key={item.id} href={item.url !== '#' ? item.url : undefined} target="_blank" rel="noopener noreferrer"
                          className="wm-glass-light p-2.5 group block" style={{ textDecoration: 'none' }}>
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <span className="text-xs">{item.sourceIcon}</span>
                            <span className="wm-mono text-[7px] text-white/20 font-bold">{item.source}</span>
                            <span className="wm-mono text-[6px] px-1 py-0.5 rounded-full border font-bold" style={{ color: cs.color, borderColor: `${cs.color}25`, backgroundColor: cs.bg }}>{cs.label}</span>
                            <span className="ml-auto wm-mono text-[7px] font-bold" style={{ color: ss.color }}>{ss.icon}</span>
                          </div>
                          <h5 className="text-[10px] font-bold text-white/65 leading-snug mb-1 group-hover:text-white/85 transition-colors">{item.title}</h5>
                          <p className="text-[9px] text-white/20 leading-relaxed line-clamp-1">{item.description}</p>
                          <div className="flex items-center justify-between mt-1.5">
                            <span className="wm-mono text-[7px] text-white/10">{ago < 60 ? `${ago}m` : ago < 1440 ? `${Math.round(ago / 60)}h` : `${Math.round(ago / 1440)}d`}</span>
                            {item.url !== '#' && <ExternalLink className="w-2.5 h-2.5 text-white/5 group-hover:text-white/20" />}
                          </div>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              {bottomTab === 'impact' && (
                <div className="h-full"><ImpactHUD events={events} riskIndex={riskIndex} /></div>
              )}

              {bottomTab === 'volatility' && (
                <div className="p-4 h-full grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="wm-glass-light p-3 rounded-lg">
                    <span className="wm-mono text-[8px] text-[#ffaa00]/40 uppercase tracking-widest block mb-2">Event Volatility</span>
                    <div style={{ height: 200 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={genVolData(events)}>
                          <defs>
                            <linearGradient id="volG" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#ffaa00" stopOpacity={0.3} />
                              <stop offset="100%" stopColor="#ffaa00" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                          <XAxis dataKey="name" stroke="#ffffff08" tick={{ fontSize: 7, fill: '#ffffff20', fontFamily: "'Times New Roman'" }} />
                          <YAxis stroke="#ffffff08" tick={{ fontSize: 8, fill: '#ffffff20' }} />
                          <RTooltip contentStyle={ttStyle} />
                          <Area type="monotone" dataKey="vol" stroke="#ffaa00" strokeWidth={2} fill="url(#volG)" dot={{ r: 3, fill: '#ffaa00', stroke: '#06070a', strokeWidth: 2 }} name="Vol Δ" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="wm-glass-light p-3 rounded-lg">
                    <span className="wm-mono text-[8px] text-[#ff4444]/40 uppercase tracking-widest block mb-2">Risk Radar</span>
                    <div style={{ height: 200 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={events.map(e => ({ s: e.title.split(' ')[0], r: e.intensity * 10 }))} cx="50%" cy="50%">
                          <PolarGrid stroke="#ffffff06" />
                          <PolarAngleAxis dataKey="s" stroke="#ffffff10" tick={{ fontSize: 8, fill: '#ffffff25', fontFamily: "'Times New Roman'" }} />
                          <PolarRadiusAxis domain={[0, 100]} stroke="#ffffff06" tick={false} />
                          <Radar dataKey="r" stroke="#ff4444" fill="#ff4444" fillOpacity={0.12} strokeWidth={2} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── FLOATING EVENT MARKERS ON MAP ── */}
          <div className="absolute inset-0 pointer-events-none z-20">
            {events.map((e, i) => {
              const rc = riskColorMap[e.signal.riskLevel] || '#ffaa00';
              // Distribute markers across the map area
              const positions = [
                { top: '25%', left: '48%' }, { top: '35%', left: '52%' }, { top: '20%', left: '30%' },
                { top: '45%', left: '65%' }, { top: '30%', left: '75%' }, { top: '55%', left: '45%' },
                { top: '40%', left: '20%' }, { top: '50%', left: '55%' },
              ];
              const pos = positions[i % positions.length];
              return (
                <div key={e.id} className="absolute pointer-events-auto cursor-pointer group" style={{ top: pos.top, left: pos.left }}>
                  <div className="relative">
                    {/* Outer ring (pulse) */}
                    {e.intensity >= 6 && (
                      <div className="absolute inset-[-6px] rounded-full border" style={{ borderColor: `${rc}30`, animation: 'wmGlow 3s infinite', color: rc }} />
                    )}
                    {/* Main dot */}
                    <div className="w-3 h-3 rounded-full border-2" style={{ backgroundColor: rc, borderColor: `${rc}80`, boxShadow: `0 0 10px ${rc}40` }}
                      onClick={() => setSelectedEvent(selectedEvent?.id === e.id ? null : e)} />
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <div className="wm-glass rounded-lg px-2.5 py-1.5 whitespace-nowrap shadow-xl">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[10px]">{typeIcons[e.type]}</span>
                          <span className="wm-mono text-[8px] font-bold" style={{ color: rc }}>{e.signal.riskLevel.toUpperCase()}</span>
                        </div>
                        <p className="text-[9px] text-white/60 font-bold max-w-[200px]">{e.title}</p>
                        <p className="wm-mono text-[7px] text-white/20 mt-0.5">{e.location}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
