import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useQuantSuiteStore } from '@/stores/quantsuiteStore';
import { InteractiveMap } from '@/components/pulse/InteractiveMap';
import { MarketTickerStrip } from '@/components/pulse/MarketTickerStrip';
import { LiveNewsFeed, type NewsItem } from '@/components/pulse/LiveNewsFeed';
import { GlobalIndicesGrid } from '@/components/pulse/GlobalIndicesGrid';
import { EventTimeline, type MarketEvent } from '@/components/pulse/EventTimeline';
import { PulseInsights } from '@/components/pulse/PulseInsights';
import { LiveCCTV } from '@/components/pulse/LiveCCTV';
import { Helmet } from 'react-helmet-async';
import { ChevronDown, Maximize2, Minimize2, Volume2, VolumeX, Settings } from 'lucide-react';

type PulseRegion = 'Global' | 'Americas' | 'Europe' | 'Asia' | 'MENA' | 'Africa' | 'Oceania';

const REGIONS: PulseRegion[] = ['Global', 'Americas', 'Europe', 'Asia', 'MENA', 'Africa', 'Oceania'];

const LAYERS = [
  { id: 'exchanges', label: 'STOCK EXCHANGES', emoji: '🏛', enabled: true },
  { id: 'financial', label: 'FINANCIAL CENT...', emoji: '🏦', enabled: true },
  { id: 'central-banks', label: 'CENTRAL BANKS', emoji: '🏗', enabled: true },
  { id: 'commodities', label: 'COMMODITY HUBS', emoji: '🛢', enabled: false },
  { id: 'trade-routes', label: 'TRADE ROUTES', emoji: '⚓', enabled: true },
  { id: 'cables', label: 'UNDERSEA CABLES', emoji: '🔌', enabled: false },
];

const NEWS_SOURCES = ['BLOOMBERG', 'SKYNEWS', 'CNBC', 'CNN', 'REUTERS', 'ALJAZEERA', 'BBC'] as const;

export default function Pulse() {
  const [region, setRegion] = useState<PulseRegion>('MENA');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeLayers, setActiveLayers] = useState(['exchanges', 'financial', 'central-banks', 'trade-routes']);
  const [activeNewsSource, setActiveNewsSource] = useState<string>('BLOOMBERG');
  const [showRegionDropdown, setShowRegionDropdown] = useState(false);
  const [muted, setMuted] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [mapMode, setMapMode] = useState<'2D' | '3D'>('2D');

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const { data: pulseData, isLoading } = useQuery({
    queryKey: ['global-pulse', region],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('fetch-global-pulse', {
        body: { region },
      });
      if (error) throw error;
      return data as { news: NewsItem[]; events: MarketEvent[]; timestamp: string };
    },
    refetchInterval: 60000,
    retry: 2,
  });

  const news = pulseData?.news || [];
  const events = pulseData?.events || [];

  const { addSharedAlert } = useQuantSuiteStore();
  const processedEvents = useRef<Set<string>>(new Set());

  // Dispatch high-impact geopolitical events to the unified alert bus
  useEffect(() => {
    if (!events.length) return;
    
    events.forEach(event => {
      if (event.impact === 'high' && !processedEvents.current.has(event.id)) {
        processedEvents.current.add(event.id);
        addSharedAlert({
          message: `${event.title}: ${event.description}`,
          source: 'PULSE',
          level: 'critical'
        });
      }
    });
  }, [events, addSharedAlert]);

  const formatUTC = (d: Date) => {
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return `${days[d.getUTCDay()]}, ${String(d.getUTCDate()).padStart(2, '0')} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()} ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}:${String(d.getUTCSeconds()).padStart(2, '0')} UTC`;
  };

  const toggleLayer = (id: string) => {
    setActiveLayers(prev =>
      prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]
    );
  };

  return (
    <>
      <Helmet>
        <title>Pulse — Live Global Intelligence | QuantSuite</title>
      </Helmet>

      {/* Custom styles for this page */}
      <style>{`
        .pulse-root { display: flex; flex-direction: column; min-height: calc(100vh - 3.5rem); background: #0a0b0d; max-width: 100%; contain: inline-size; flex-shrink: 0; font-family: 'JetBrains Mono', monospace; color: #e0e0e0; }
        .pulse-subheader { display: flex; align-items: center; justify-content: space-between; padding: 6px 16px; border-bottom: 1px solid rgba(255,255,255,0.1); flex-shrink: 0; background: #0a0b0d; }
        .pulse-body { display: flex; flex-direction: column; flex: 1; }
        .pulse-map-area { position: relative; height: 50vh; min-height: 450px; flex-shrink: 0; border-bottom: 2px solid rgba(255,255,255,0.08); }
        .pulse-bottom { position: relative; display: flex; border-top: 1px solid rgba(255,255,255,0.1); min-height: 700px; background: #0d0e12; }
        .pulse-news-col { flex: 1; display: flex; flex-direction: column; border-right: 1px solid rgba(255,255,255,0.1); overflow: hidden; }
        .pulse-right-col { width: 360px; display: flex; flex-direction: column; border-left: 1px solid rgba(255,255,255,0.1); flex-shrink: 0; background: #0a0b0d; }
        .pulse-panel-header { display: flex; align-items: center; justify-content: space-between; padding: 6px 12px; border-bottom: 1px solid rgba(255,255,255,0.08); flex-shrink: 0; background: rgba(255,255,255,0.03); }
        .pulse-panel-body { flex: 1; overflow-y: auto; padding: 4px; }
        .status-led { width: 4px; height: 4px; border-radius: 50%; box-shadow: 0 0 6px currentColor; }
      `}</style>

      <div className={cn("pulse-root transition-all duration-300", isExpanded && "fixed !inset-0 !m-0 !w-screen !h-screen z-[99999] scale-100 rounded-none overflow-hidden bg-[#0a0b0d]")}>
        {/* ============ TICKER STRIP ============ */}
        <MarketTickerStrip />

        {/* ============ SUB-HEADER: worldmonitor style ============ */}
        <div className="pulse-subheader">
          {/* Left: title */}
          <div className="flex items-center gap-3">
            <h1 className="font-mono text-sm font-bold text-foreground tracking-[0.15em] uppercase">
              GLOBAL SITUATION
            </h1>
          </div>

          {/* Center: UTC */}
          <div className="hidden md:block font-mono text-[12px] text-muted-foreground/70 tracking-wide">
            {formatUTC(currentTime)}
          </div>

          {/* Right: Controls */}
          <div className="flex items-center gap-2">
            {/* Region dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowRegionDropdown(!showRegionDropdown)}
                className="flex items-center gap-1.5 px-3 py-1 bg-white/[0.04] border border-white/20 font-mono text-[11px] font-bold text-[#FFD700] hover:bg-white/[0.1] transition-all uppercase tracking-wider"
              >
                {region}
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              </button>
              {showRegionDropdown && (
                <div className="absolute top-full right-0 mt-1 z-[2000] bg-[#12131a] border border-white/[0.1] rounded-lg shadow-2xl py-1 min-w-[120px]">
                  {REGIONS.map(r => (
                    <button
                      key={r}
                      onClick={() => { setRegion(r); setShowRegionDropdown(false); }}
                      className={cn(
                        'w-full text-left px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors',
                        region === r
                          ? 'text-[#FFD700] bg-[#FFD700]/10'
                          : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04]'
                      )}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* LIVE */}
            <div className="flex items-center gap-1.5 px-2 py-1">
              <div className="live-dot" style={{ width: 6, height: 6 }} />
              <span className="font-mono text-[10px] font-bold text-red-400 uppercase tracking-wider">LIVE</span>
            </div>

            {/* 2D/3D */}
            <button
              onClick={() => setMapMode('2D')}
              className={cn("px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors", mapMode === '2D' ? "text-[#FFD700] bg-[#FFD700]/10 border border-[#FFD700]/30 rounded" : "text-muted-foreground/50 hover:text-foreground/70 rounded border border-transparent")}
            >2D</button>
            <button
              onClick={() => setMapMode('3D')}
              className={cn("px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors", mapMode === '3D' ? "text-[#FFD700] bg-[#FFD700]/10 border border-[#FFD700]/30 rounded" : "text-muted-foreground/50 hover:text-foreground/70 rounded border border-transparent")}
            >3D</button>
            {/* FULLSCREEN */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 px-2 text-muted-foreground/40 hover:text-foreground/80 transition-colors ml-4 border-l border-white/[0.08]"
              title="Toggle Fullscreen"
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* ============ MAIN BODY ============ */}
        <div className="pulse-body">
          {/* ============ MAP SECTION ============ */}
          <div className="pulse-map-area">
            <InteractiveMap region={region} layers={activeLayers} events={events} />

            {/* LAYERS sidebar overlay */}
            <div className="absolute top-4 left-4 z-[1000] w-[200px] bg-[#0a0b0d]/95 backdrop-blur-md border border-white/20 overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06]">
                <span className="font-mono text-[11px] font-bold text-foreground/80 uppercase tracking-[0.15em]">LAYERS</span>
                <span className="font-mono text-[9px] text-muted-foreground/40">?</span>
              </div>
              <div className="p-1.5 space-y-0.5">
                {LAYERS.map(layer => (
                  <button
                    key={layer.id}
                    onClick={() => toggleLayer(layer.id)}
                    className={cn(
                      'w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-all',
                      activeLayers.includes(layer.id) ? 'bg-[#FFD700]/[0.06]' : 'hover:bg-white/[0.03]'
                    )}
                  >
                    <div className={cn(
                      'w-4 h-4 rounded flex items-center justify-center border text-[10px]',
                      activeLayers.includes(layer.id)
                        ? 'bg-[#FFD700]/20 border-[#FFD700]/40 text-[#FFD700]'
                        : 'border-white/[0.1] text-muted-foreground/40'
                    )}>
                      {activeLayers.includes(layer.id) ? '✓' : ''}
                    </div>
                    <span className="text-[10px]">{layer.emoji}</span>
                    <span className={cn(
                      'font-mono text-[10px] font-bold uppercase tracking-wider',
                      activeLayers.includes(layer.id) ? 'text-foreground/80' : 'text-muted-foreground/50'
                    )}>
                      {layer.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ============ BOTTOM PANELS ============ */}
          <div className="pulse-bottom">
            {/* LEFT: LIVE NEWS */}
            <div className="pulse-news-col">
              <div className="pulse-panel-header">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[12px] font-bold text-foreground uppercase tracking-[0.1em]">LIVE NEWS</span>
                  <div className="live-dot" style={{ width: 5, height: 5 }} />
                  <span className="font-mono text-[9px] font-bold text-red-400 uppercase">LIVE</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setMuted(!muted)} className="p-1 text-muted-foreground/40 hover:text-foreground/60 transition-colors">
                    {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Source tabs */}
              <div className="flex items-center gap-0 px-1 py-1 border-b border-white/[0.06] shrink-0 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                {NEWS_SOURCES.map(source => (
                  <button
                    key={source}
                    onClick={() => setActiveNewsSource(source)}
                    className={cn(
                      'px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.1em] rounded-sm transition-all whitespace-nowrap',
                      activeNewsSource === source
                        ? 'bg-[#FFD700]/15 text-[#FFD700] border border-[#FFD700]/30'
                        : 'text-muted-foreground/50 hover:text-foreground/70 border border-transparent'
                    )}
                  >
                    {source}
                  </button>
                ))}
              </div>

              {/* News content */}
              <div className="pulse-panel-body">
                <LiveNewsFeed news={news} isLoading={isLoading} region={region} />
              </div>
            </div>

            {/* RIGHT: AI INSIGHTS + MARKETS + CCTV */}
            <div className="pulse-right-col">
              {/* AI INSIGHTS — top third */}
              <div className="flex flex-col flex-1 min-h-[160px] border-b border-white/[0.06] overflow-hidden">
                <div className="pulse-panel-header">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-foreground uppercase tracking-[0.1em]">AI INSIGHTS</span>
                    <span className="font-mono text-[9px] text-muted-foreground/40">ⓘ</span>
                  </div>
                  <span className="px-2 py-0.5 font-mono text-[9px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded uppercase">LIVE</span>
                </div>
                <div className="pulse-panel-body relative pr-2">
                  <PulseInsights />
                </div>
              </div>

              {/* MARKETS — middle third */}
              <div className="flex flex-col flex-[1.2] min-h-[200px] border-b border-white/[0.06] overflow-hidden">
                <div className="pulse-panel-header">
                  <span className="font-mono text-[11px] font-bold text-foreground uppercase tracking-[0.1em]">MARKETS</span>
                  <span className="font-mono text-[9px] text-[#FFD700]/60 cursor-pointer hover:text-[#FFD700] transition-colors uppercase tracking-wider">Watchlist</span>
                </div>
                <div className="pulse-panel-body p-0 overflow-hidden relative">
                  <GlobalIndicesGrid region={region} />
                </div>
              </div>

              {/* LIVE CCTV — bottom third */}
              <div className="flex flex-col flex-1 min-h-[200px] overflow-hidden bg-black">
                <LiveCCTV />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
