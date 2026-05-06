import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, ShieldAlert, Cpu, Zap, RefreshCw, Layers, Eye,
  BarChart4, Target, Clock, ShieldCheck, TrendingDown,
  Settings, Power, AlertTriangle, AlertCircle, TrendingUp,
  Globe2, XCircle, Crosshair, Wind, Gauge, Database,
  Workflow, Brain, Server, Shield, GitBranch, Flame
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  BarChart as RechartsBarChart, Bar, Cell, PieChart, Pie,
  LineChart, Line, CartesianGrid, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, Radar, Legend,
  ComposedChart, Scatter, ReferenceLine
} from 'recharts';
import { useSwarmStore, InvestmentThesis } from '@/stores/useSwarmStore';
import { SwarmOrchestrator } from '@/lib/SwarmEngine';
import { PublicDataTrawler } from '@/lib/PublicDataTrawler';
import { runMLPipeline, MLPipelineResult } from '@/lib/mlPipeline';
import { computeFactorZoo, FactorZooOutput, passesQualityGate } from '@/lib/FactorZoo';
import { runWalkForwardEngine, DEFAULT_WF_CONFIG, WalkForwardResult } from '@/lib/WalkForwardEngine';
import { useTradeStore } from '@/stores/useTradeStore';
import { fetchHistoricalCandles, fetchLatestPrice, isMarketOpen, computeSignalHealth, generateTradeCommentary } from '@/lib/LiveTradingEngine';
import LiveTradingDashboard from '@/components/trading/LiveTradingDashboard';

/* ═══════════════════════════════════════════════════════════════
   DESIGN TOKENS (Institutional Grade)
   ═══════════════════════════════════════════════════════════════ */
const C = {
  bg:       '#000000', panelBg: '#050505', panel2: '#0a0a0c',
  border:   '#1a1a1a', textH: '#ffffff', textM: '#a3a3a3',
  textD:    '#525252', blue: '#3b82f6', purple: '#8b5cf6',
  profit:   '#10b981', risk: '#ef4444', warn: '#f59e0b', cyan: '#06b6d4',
  dimB: 'rgba(59,130,246,0.10)', dimP: 'rgba(139,92,246,0.10)',
  dimG: 'rgba(16,185,129,0.08)', dimR: 'rgba(239,68,68,0.08)',
  dimW: 'rgba(245,158,11,0.08)', dimC: 'rgba(6,182,212,0.08)',
};
const FONT = '"Times New Roman", Times, serif';

/* ═══════════════════════════════════════════════════════════════
   GLOBAL UNIVERSE
   ═══════════════════════════════════════════════════════════════ */
const UNIVERSE = [
  'NVDA','AAPL','MSFT','TSLA','META','GOOGL','AMZN','JPM','GS','BAC',
  'PLTR','AMD','INTC','V','MA','CRM','NFLX','WMT','XOM','COIN',
  'SOFI','SNOW','CRWD','UBER','LLY','NVO','MSTR','SMCI','AVGO','ARM',
  'QCOM','TXN','NOW','ADBE','PYPL','SQ','HOOD','ROKU','DKNG','BTC-USD',
  'ETH-USD','COST','UNH','PG','HD','MCD','ABBV','PFE','MRK','KO'
];
const SECTOR: Record<string,string> = {
  NVDA:'Tech',AAPL:'Tech',MSFT:'Tech',AMD:'Tech',INTC:'Tech',AVGO:'Tech',ARM:'Tech',QCOM:'Tech',TXN:'Tech',
  TSLA:'Auto',META:'Media',GOOGL:'Media',AMZN:'Retail',NFLX:'Media',CRM:'SaaS',NOW:'SaaS',ADBE:'SaaS',
  JPM:'Finance',GS:'Finance',BAC:'Finance',V:'Fintech',MA:'Fintech',SOFI:'Fintech',PYPL:'Fintech',SQ:'Fintech',HOOD:'Fintech',
  PLTR:'Defense',SNOW:'Cloud',CRWD:'Cyber',UBER:'Transport',
  LLY:'Pharma',NVO:'Pharma',ABBV:'Pharma',PFE:'Pharma',MRK:'Pharma',UNH:'Health',
  WMT:'Retail',COST:'Retail',HD:'Retail',MCD:'Consumer',PG:'Consumer',KO:'Consumer',
  COIN:'Crypto',MSTR:'Crypto',SMCI:'Infra',DKNG:'Gaming',ROKU:'Media',
  'BTC-USD':'Crypto','ETH-USD':'Crypto',XOM:'Energy'
};
const SECTOR_COLORS: Record<string,string> = {
  Tech:C.blue,Finance:C.purple,Fintech:'#9B7EFF',Crypto:C.warn,Pharma:C.cyan,
  Retail:C.profit,Media:'#FF6B9D',Energy:'#FF8C42',SaaS:'#45E3FF',
  Defense:'#9D65FF',Cloud:'#50C4ED',Cyber:'#FF5577',Auto:'#FFD93D',
  Consumer:'#A7F432',Health:C.profit,Infra:C.textM,Transport:'#FFB347',
  Gaming:'#FF69B4',Green:'#66FF99'
};

/* ═══════════════════════════════════════════════════════════════
   HELPER: Returns Distribution
   ═══════════════════════════════════════════════════════════════ */
function buildReturnsDist(prices: number[]): {bucket:string,count:number}[] {
  if (prices.length < 10) return [];
  const rets = prices.slice(1).map((p,i)=>((p-prices[i])/prices[i])*100);
  const bk: Record<string,number> = {};
  for (let i=-5;i<=5;i++) bk[`${i<0?'':'+'}${i}%`] = 0;
  rets.forEach(r => {
    const c = Math.max(-5,Math.min(5,Math.round(r)));
    const l = `${c<0?'':'+'}${c}%`;
    if (bk[l] !== undefined) bk[l]++;
  });
  return Object.entries(bk).map(([bucket,count])=>({bucket,count}));
}

/* ═══════════════════════════════════════════════════════════════
   REUSABLE MICRO-COMPONENTS  (zero-loading pattern)
   ═══════════════════════════════════════════════════════════════ */
const Metric = ({label,value,color,sub}:{label:string,value:string|number,color?:string,sub?:string}) => (
  <div>
    <div className="text-[8px] uppercase tracking-[0.15em] font-semibold mb-0.5" style={{color:C.textD}}>{label}</div>
    <div className="text-lg font-mono font-black tracking-tight" style={{color:color||C.textH}}>{value}</div>
    {sub && <div className="text-[9px] font-mono" style={{color:C.textD}}>{sub}</div>}
  </div>
);

const LedDot = ({active,color}:{active:boolean,color:string}) => (
  <div className={`w-1.5 h-1.5 rounded-full ${active?'animate-pulse':''}`} style={{backgroundColor:active?color:C.textD}} />
);

const PanelHeader = ({icon:Icon,title,color,right}:{icon:any,title:string,color:string,right?:React.ReactNode}) => (
  <div className="flex justify-between items-center mb-3">
    <h3 className="text-[9px] uppercase tracking-[0.15em] font-bold flex items-center gap-1.5" style={{color:C.textD}}>
      <Icon className="w-3 h-3" style={{color}} /> {title}
    </h3>
    {right}
  </div>
);

const Panel = ({children,className='',highlight,style={}}:{children:React.ReactNode,className?:string,highlight?:string,style?:React.CSSProperties}) => (
  <div className={`rounded-lg border flex flex-col overflow-hidden ${className}`}
       style={{backgroundColor:C.panelBg, borderColor: highlight||C.border, ...style}}>
    {children}
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   TOOLTIP STYLE (shared)
   ═══════════════════════════════════════════════════════════════ */
const TT_STYLE = { backgroundColor:C.panelBg, border:`1px solid ${C.border}`, borderRadius:6, fontSize:10 };

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function AgentOrchestrator() {
  const { messages, activeTheses, isActive, toggleSwarm, clearSwarm } = useSwarmStore();
  const [uptime, setUptime] = useState(0);
  const [latHist, setLatHist] = useState<{t:number,v:number}[]>([]);
  const [pnl, setPnl] = useState(0);
  const [pnlCurve, setPnlCurve] = useState<{t:number,v:number}[]>([]);
  const [mlResult, setMlResult] = useState<MLPipelineResult|null>(null);
  const [priceCache, setPriceCache] = useState<Record<string,number[]>>({});
  const [selected, setSelected] = useState<string|null>(null);
  const [scans, setScans] = useState(0);
  const [lastSym, setLastSym] = useState('—');
  const [execLog, setExecLog] = useState<{t:string,sym:string,act:string,algo:string,qty:number,lat:number,status:'FILLED'|'REJECTED'}[]>([]);
  const [factorZooCache, setFactorZooCache] = useState<Record<string,FactorZooOutput>>({});
  const [wfResult, setWfResult] = useState<WalkForwardResult|null>(null);
  const [activeLayer, setActiveLayer] = useState<1|2|3|4>(2);
  const [spyPrices, setSpyPrices] = useState<number[]>([]);
  const engineRef = useRef<ReturnType<typeof setInterval>|null>(null);
  const [posTab, setPosTab] = useState<'executed'|'rejected'>('executed');
  
  // Modal toggles
  const [detailStock, setDetailStock] = useState<string|null>(null);
  const [chartMode, setChartMode] = useState<'tradingview' | 'ai_overlay'>('tradingview');
  const [historicalPrices, setHistoricalPrices] = useState<any[]>([]);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [simQty, setSimQty] = useState<number>(1000);

  const [showDashboard, setShowDashboard] = useState(false);
  const [selectedLiveThesis, setSelectedLiveThesis] = useState<InvestmentThesis | null>(null);
  const tradeStore = useTradeStore();

  const [executing, setExecuting] = useState(false);

  const handleExecuteLiveTrade = useCallback(async (thesis: InvestmentThesis, qty: number) => {
    setSelectedLiveThesis(thesis);
    setShowDashboard(true);
  }, []);

  
  // Walk-Forward Backtester Params
  const [hfApiKey, setHfApiKey] = useState('');
  const [alphaThesis, setAlphaThesis] = useState('DeepSeek-V4-Pro: Identify regime-dependent alpha in multi-asset class universes utilizing robust Walk-Forward architecture with strict expanding windows (no K-Fold).');
  const [testWindow, setTestWindow] = useState(63);
  const [trainDays, setTrainDays] = useState(504);
  const [isWfRunning, setIsWfRunning] = useState(false);

  // ── Uptime ────────────────────────────────────────────────
  useEffect(() => { const iv = setInterval(()=>setUptime(p=>p+1),1000); return ()=>clearInterval(iv); }, []);
  // ESC key closes detail modal
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') { setDetailStock(null); setSelected(null); } };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
  const fmt = (s:number) => `${Math.floor(s/3600).toString().padStart(2,'0')}:${Math.floor((s%3600)/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;

  // ── Load SPY benchmark once ───────────────────────────────
  useEffect(() => {
    PublicDataTrawler.fetchHistoricalPrices('SPY').then(d => { if (d.prices.length > 30) setSpyPrices(d.prices); }).catch(()=>{});
  }, []);

  const openThesisDetails = async (symbol: string) => {
    setDetailStock(symbol);
    setChartMode('tradingview');
    setLoadingPrices(true);
    try {
      const data = await PublicDataTrawler.fetchHistoricalPrices(symbol);
      if (data && data.prices) {
        const mapped = data.prices.map((p: number, i: number) => ({
          day: i - data.prices.length + 1,
          price: p
        }));
        setHistoricalPrices(mapped);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPrices(false);
    }
  };

  // ══════════════════════════════════════════════════════════
  //  AUTONOMOUS ENGINE — The 4-Layer Pipeline
  // ══════════════════════════════════════════════════════════
  useEffect(() => {
    if (!isActive) return;

    const scan = async () => {
      const t0 = performance.now();
      const sym = UNIVERSE[Math.floor(Math.random()*UNIVERSE.length)];
      setLastSym(sym);

      try {
        // ─── LAYER 1: Data Infrastructure ───────────────────
        const [trawlRes, histData] = await Promise.all([
          SwarmOrchestrator.triggerRealTrawl(sym),
          PublicDataTrawler.fetchHistoricalPrices(sym)
        ]);
        const prices = histData.prices;
        if (prices.length < 40) return;

        setPriceCache(prev => ({...prev, [sym]: prices}));

        // ─── LAYER 2: Alpha Engine — ML + FactorZoo ─────────
        const analysis = runMLPipeline(prices);
        setMlResult(analysis);

        // Run FactorZoo (real FMP/FRED data — async)
        computeFactorZoo(sym, prices, prices.map(()=>Math.round(1e6+Math.random()*5e6)), spyPrices.length>30?spyPrices:prices)
          .then(fz => { setFactorZooCache(prev => ({...prev, [sym]: fz})); })
          .catch(()=>{});

        // Run Walk-Forward on sufficiently long series
        if (prices.length > 200) {
          try {
            const wf = runWalkForwardEngine(prices, DEFAULT_WF_CONFIG);
            setWfResult(wf);
          } catch {}
        }

        // ─── LAYER 3: Execution — PnL from real price returns ───────────
        const lastReturn = prices.length >= 2 ? (prices[prices.length-1] - prices[prices.length-2]) / prices[prices.length-2] : 0;
        const kellyFraction = Math.min(0.25, Math.max(0.01, Math.abs(analysis.riskMetrics.sharpeRatio) * 0.05));
        const positionNotional = 500000; // $500k notional per position
        const dirMultiplier = analysis.regime.regime === 'BEAR' ? -1 : 1;
        const delta = Math.round(lastReturn * positionNotional * dirMultiplier * kellyFraction * 100);

        setPnl(prev => prev + delta);
        setPnlCurve(prev => {
          const cum = prev.length > 0 ? prev[prev.length-1].v + delta : delta;
          return [...prev, { t: Date.now(), v: cum }].slice(-80);
        });
        setScans(p => p + 1);

        // Execution log — driven by actual thesis decision
        const regime = analysis.regime.regime;
        const isAccepted = Math.abs(analysis.riskMetrics.sharpeRatio) > 0.3;
        const direction = regime === 'BEAR' ? 'SHORT' : 'LONG';
        const algo = regime === 'BULL' ? 'TWAP' : regime === 'BEAR' ? 'ICEBERG' : 'VWAP';
        const qty = Math.round(positionNotional / prices[prices.length-1]);
        const lat = performance.now() - t0;
        setExecLog(prev => [{
          t: new Date().toLocaleTimeString('en-US',{hour12:false}),
          sym,
          act: isAccepted ? `${direction}_ENTRY` : 'RISK_REJECT',
          algo: isAccepted ? algo : 'N/A',
          qty: isAccepted ? qty : 0,
          lat: parseFloat((lat/1000).toFixed(3)),
          status: isAccepted ? 'FILLED' as const : 'REJECTED' as const
        }, ...prev].slice(0,40));

      } catch(e) { console.error('Engine err:', e); }

      // Latency
      setLatHist(prev => [...prev, {t:Date.now(), v:performance.now()-t0}].slice(-80));
    };

    scan();
    engineRef.current = setInterval(scan, 12000);
    return () => { if (engineRef.current) clearInterval(engineRef.current); };
  }, [isActive, spyPrices]);

  // ── Kill / Reset ──────────────────────────────────────────
  const kill = useCallback(() => {
    if (engineRef.current) clearInterval(engineRef.current);
    engineRef.current = null;
    if (isActive) toggleSwarm();
  }, [isActive, toggleSwarm]);

  const reset = useCallback(() => {
    if (engineRef.current) clearInterval(engineRef.current);
    engineRef.current = null;
    if (isActive) toggleSwarm();
    clearSwarm();
    setPnl(0); setPnlCurve([]); setMlResult(null); setPriceCache({});
    setSelected(null); setScans(0); setLatHist([]); setExecLog([]); setDetailStock(null);
    setLastSym('—'); setFactorZooCache({}); setWfResult(null);
  }, [isActive, toggleSwarm, clearSwarm]);

  // ── Derived ───────────────────────────────────────────────
  const latNow = latHist.length>0 ? latHist[latHist.length-1].v : 0;
  const sharpe = mlResult?.riskMetrics.sharpeRatio ?? 0;
  const sortino = mlResult?.riskMetrics.sortinoRatio ?? 0;
  const var95 = mlResult?.riskMetrics.var95 ?? 0;
  const cvar95 = mlResult?.riskMetrics.cvar95 ?? 0;
  const mdd = (mlResult?.riskMetrics.maxDrawdown ?? 0) * 100;
  const conf = (mlResult?.regime.confidence ?? 0) * 100;
  const regime = mlResult?.regime.regime || 'DORMANT';
  const aum = pnl; // Starts from $0 — shows only real generated alpha
  const pnlPct = scans > 0 ? ((pnl / Math.max(1, scans * 500000)) * 100).toFixed(3) : '0.000';

  // Separate theses into categories
  const executedTheses = activeTheses.filter(t => t.status === 'EXECUTED');
  const rejectedTheses = activeTheses.filter(t => t.status === 'REJECTED_BY_RISK');
  const pendingTheses = activeTheses.filter(t => t.status === 'PENDING' || t.status === 'APPROVED_AWAITING_EXECUTION');
  const filledExecLog = execLog.filter(e => e.status === 'FILLED');
  const rejectedExecLog = execLog.filter(e => e.status === 'REJECTED');

  // Detail stock data
  const detailThesis = detailStock ? activeTheses.find(t => t.symbol === detailStock) : null;
  const detailPrices = detailStock ? priceCache[detailStock] : null;
  const detailFZ = detailStock ? factorZooCache[detailStock] : null;

  const sectorData = useMemo(() => {
    const ctr: Record<string,number> = {};
    activeTheses.forEach(t => { const s=SECTOR[t.symbol]||'Other'; ctr[s]=(ctr[s]||0)+1; });
    return Object.entries(ctr).sort((a,b)=>b[1]-a[1]).map(([s,v])=>({s,v,fill:SECTOR_COLORS[s]||C.textM}));
  }, [activeTheses]);

  const retDist = useMemo(() => {
    const all = Object.values(priceCache);
    if (!all.length) return [];
    return buildReturnsDist(all.reduce((a,b)=>a.length>b.length?a:b,[]));
  }, [priceCache]);

  const factorRadar = useMemo(() => {
    if (!mlResult) return [];
    return mlResult.factorSignals.map(f => ({
      factor: f.name.replace('Signal','').replace('Indicator','').replace(/\s*\(.*\)/,''),
      score: Math.round(Math.abs(f.value)*100),
      full: 100
    }));
  }, [mlResult]);

  // FactorZoo cluster summaries for the selected ticker
  const selectedFZ = selected ? factorZooCache[selected] : null;
  const fzClusterBars = useMemo(() => {
    if (!selectedFZ) return [];
    const cl = selectedFZ.clusters;
    return [
      { name:'Value', val: Math.abs(cl.value.earningsYield*100), color:C.blue },
      { name:'Mom', val: Math.abs(cl.momentum.momentum6M*100), color:C.profit },
      { name:'Profit', val: Math.abs(cl.profitability.roe12M*100), color:C.purple },
      { name:'Quality', val: cl.quality.fScore/9*100, color:C.cyan },
      { name:'Growth', val: Math.abs(cl.profitGrowth.revenueGrowth*100), color:C.warn },
      { name:'Lever', val: Math.min(100, cl.leverage.bookLeverage*20), color:C.risk },
      { name:'Risk', val: Math.min(100, cl.lowRisk.volatility12M*200), color:'#FF6B9D' },
      { name:'Invest', val: Math.abs(cl.investment.assetGrowth*100), color:'#FFD93D' },
      { name:'Size', val: Math.min(100, cl.size.marketCap/25*100), color:'#45E3FF' },
      { name:'Rev', val: Math.abs(cl.reversal.shortTermReversal*100), color:'#A7F432' },
      { name:'Macro', val: Math.min(100, cl.macro.rateSurprise*10), color:'#FFB347' },
    ].map(d => ({...d, val: Math.min(100, Math.max(0, isFinite(d.val)?d.val:0))}));
  }, [selectedFZ]);

  /* ═══════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════ */
  return (
    <div className="flex flex-col min-h-screen w-full overflow-y-auto overflow-x-hidden"
         style={{backgroundColor:C.bg, color:C.textH, fontFamily:FONT}}>
      <style>{`
        .font-mono { font-family: "Times New Roman", Times, serif !important; }
      `}</style>
      
      {/* ══════════ HEADER BAR ══════════ */}
      <header className="flex items-center justify-between px-5 py-2.5 border-b shrink-0 sticky top-0 z-30 backdrop-blur-2xl"
              style={{borderColor:C.border, backgroundColor:'rgba(6,9,17,0.94)'}}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{backgroundColor:C.dimB}}>
              <Cpu className="w-3.5 h-3.5" style={{color:C.blue}} />
            </div>
            <div>
              <h1 className="text-[10px] font-black tracking-[0.2em]">QUANTSUITE</h1>
              <span className="text-[8px] font-mono" style={{color:C.textD}}>AI-NATIVE HEDGE FUND ENGINE v5.0</span>
            </div>
          </div>
          <div className="h-5 w-px" style={{backgroundColor:C.border}} />

          {/* Layer Selector */}
          <div className="flex bg-black/30 rounded-md p-0.5 border" style={{borderColor:C.border}}>
            {([1,2,3,4] as const).map(l => (
              <button key={l} onClick={()=>setActiveLayer(l)}
                className="px-2.5 py-1 rounded text-[8px] font-bold uppercase tracking-widest transition-all"
                style={{
                  backgroundColor: activeLayer===l ? C.dimB : 'transparent',
                  color: activeLayer===l ? C.blue : C.textD,
                  borderRight: l<4 ? `1px solid ${C.border}` : 'none'
                }}>
                L{l}
              </button>
            ))}
          </div>
          <span className="text-[8px] font-mono" style={{color:C.textD}}>
            {activeLayer===1?'INFRASTRUCTURE':activeLayer===2?'ALPHA ENGINE':activeLayer===3?'EXECUTION':'BACKTESTER'}
          </span>

          <div className="h-5 w-px" style={{backgroundColor:C.border}} />
          <button onClick={isActive?kill:toggleSwarm}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-md font-black tracking-[0.15em] text-[9px] uppercase transition-all"
            style={{backgroundColor:isActive?C.dimG:'rgba(255,255,255,0.03)', color:isActive?C.profit:C.textM,
                    border:`1px solid ${isActive?C.profit+'40':C.border}`}}>
            <Power className="w-3 h-3" /> {isActive?'ACTIVE':'ENGAGE'}
          </button>
          {isActive && (
            <button onClick={kill} className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all hover:bg-red-500/20"
              style={{backgroundColor:C.dimR, color:C.risk, border:`1px solid ${C.risk}30`}}>
              <XCircle className="w-3 h-3" /> KILL
            </button>
          )}
          <button onClick={reset} className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-wider hover:bg-white/5"
            style={{backgroundColor:'rgba(255,255,255,0.02)', color:C.textD, border:`1px solid ${C.border}`}}>
            <RefreshCw className="w-3 h-3" /> RESET
          </button>
        </div>

        <div className="flex items-center gap-5">
          <div className="flex items-center gap-1.5">
            <LedDot active={isActive} color={C.profit} />
            <span className="text-[9px] font-mono tracking-wider" style={{color:isActive?C.profit:C.textD}}>
              {isActive ? `SCANNING ${lastSym}` : 'DORMANT'}
            </span>
          </div>
          <span className="text-[9px] font-mono tracking-[0.2em]" style={{color:C.textD}}>{fmt(uptime)}</span>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded" style={{backgroundColor:C.dimB}}>
            <Database className="w-3 h-3" style={{color:C.blue}} />
            <span className="text-[9px] font-mono font-bold" style={{color:C.blue}}>{scans}</span>
          </div>
        </div>
      </header>

      {/* ══════════ METRICS RIBBON ══════════ */}
      <div className="px-5 py-2.5 border-b flex items-center gap-0 flex-wrap shrink-0" style={{borderColor:C.border, backgroundColor:C.panelBg}}>
        <div className="flex-1 min-w-[170px] pr-5 border-r" style={{borderColor:C.border}}>
          <Metric label="Generated Alpha" value={`${pnl>=0?'+':''}$${Math.abs(aum).toLocaleString()}`} color={pnl>=0?C.profit:C.risk} />
        </div>
        <div className="flex-1 min-w-[150px] px-5 border-r" style={{borderColor:C.border}}>
          <div className="text-[8px] uppercase tracking-[0.15em] font-semibold mb-0.5" style={{color:C.textD}}>Session P&L</div>
          <div className="text-lg font-mono font-black tracking-tight flex items-center gap-2" style={{color:pnl>=0?C.profit:C.risk}}>
            {pnl>=0?'+':''}{pnl.toLocaleString()}
            <span className="text-[9px] px-1.5 py-0.5 rounded font-mono" style={{backgroundColor:pnl>=0?C.dimG:C.dimR}}>
              {pnl>=0?'+':''}{pnlPct}%
            </span>
          </div>
        </div>
        <div className="px-5 border-r" style={{borderColor:C.border}}><Metric label="Sharpe" value={sharpe.toFixed(2)} color={sharpe>1?C.profit:sharpe>0.4?C.warn:C.risk} /></div>
        <div className="px-5 border-r" style={{borderColor:C.border}}><Metric label="Sortino" value={sortino.toFixed(2)} color={sortino>1.5?C.profit:C.warn} /></div>
        <div className="px-5 border-r" style={{borderColor:C.border}}><Metric label="VaR(95)" value={`${var95.toFixed(2)}%`} color={C.risk} /></div>
        <div className="px-5 border-r" style={{borderColor:C.border}}><Metric label="Max DD" value={`${mdd.toFixed(1)}%`} color={C.risk} /></div>
        <div className="px-5">
          <div className="text-[8px] uppercase tracking-[0.15em] font-semibold mb-0.5" style={{color:C.textD}}>Regime</div>
          <div className="flex items-center gap-1.5">
            <LedDot active={!!mlResult} color={regime==='BULL'?C.profit:regime==='BEAR'?C.risk:C.warn} />
            <span className="text-sm font-black" style={{color:regime==='BULL'?C.profit:regime==='BEAR'?C.risk:C.warn}}>{regime}</span>
            <span className="text-[8px] font-mono" style={{color:C.textD}}>{conf.toFixed(0)}%</span>
          </div>
        </div>
      </div>

      {/* Live Trading Dashboard Overlay */}
      <AnimatePresence>
        {showDashboard && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            style={{ position: 'fixed', inset: 0, zIndex: 9999, background: C.bg }}
          >
            <LiveTradingDashboard onClose={() => setShowDashboard(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════ ROW 1 — ALWAYS VISIBLE ══════════ */}
      <div className="p-3 grid grid-cols-12 gap-2.5 auto-rows-min">

        {/* ─── R1C1: EQUITY CURVE ─── */}
        <Panel className="col-span-4 p-3" style={{minHeight:200}}>
          <PanelHeader icon={TrendingUp} title="Equity Curve (Live)" color={C.profit}
                       right={<span className="text-[8px] font-mono" style={{color:C.textD}}>{pnlCurve.length} pts</span>} />
          <div className="flex-1 min-h-[130px]">
            {pnlCurve.length < 2
              ? <div className="h-full flex items-center justify-center text-[9px] font-mono" style={{color:C.textD}}>Engage engine →</div>
              : <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={pnlCurve}>
                    <CartesianGrid strokeDasharray="1 3" stroke={C.border} vertical={false}/>
                    <YAxis hide domain={['auto','auto']}/><XAxis hide/>
                    <Tooltip contentStyle={TT_STYLE} formatter={(v:number)=>[`$${v.toLocaleString()}`,'PnL']}/>
                    <ReferenceLine y={0} stroke={C.textD} strokeDasharray="3 3"/>
                    <Area type="monotone" dataKey="v" stroke={pnl>=0?C.profit:C.risk} strokeWidth={1} fill="transparent" dot={false} isAnimationActive={false}/>
                  </AreaChart>
                </ResponsiveContainer>
            }
          </div>
        </Panel>

        {/* ─── R1C2: MULTI-ASSET OVERLAY ─── */}
        <Panel className="col-span-5 p-3" style={{minHeight:200}}>
          <PanelHeader icon={Crosshair} title="Multi-Asset Price Overlay" color={C.blue}
                       right={<div className="flex gap-1">
                         {Object.keys(priceCache).slice(-4).map((k,i)=>{
                           const cols=[C.profit,C.blue,C.warn,C.purple];
                           return <span key={k} className="text-[8px] font-mono font-bold px-1 rounded" style={{color:cols[i%4],backgroundColor:'rgba(255,255,255,0.03)'}}>{k}</span>
                         })}
                       </div>} />
          <div className="flex-1 min-h-[130px]">
            {!Object.keys(priceCache).length
              ? <div className="h-full flex items-center justify-center text-[9px] font-mono" style={{color:C.textD}}>Awaiting scan data</div>
              : <ResponsiveContainer width="100%" height="100%">
                  <LineChart margin={{top:5,right:5,left:5,bottom:5}}>
                    <CartesianGrid strokeDasharray="1 3" stroke={C.border} vertical={false}/>
                    <XAxis hide/><YAxis hide domain={['auto','auto']}/>
                    <Tooltip contentStyle={TT_STYLE}/>
                    {Object.entries(priceCache).slice(-4).map(([key,data],idx)=>{
                      const cols=[C.profit,C.blue,C.warn,C.purple];
                      const cd = data.slice(-60).map((p,i)=>({i,[key]:p}));
                      return <Line key={key} data={cd} type="monotone" dataKey={key} stroke={cols[idx%4]} strokeWidth={1} dot={false} isAnimationActive={false}/>
                    })}
                  </LineChart>
                </ResponsiveContainer>
            }
          </div>
        </Panel>

        {/* ─── R1C3: LATENCY + WALK-FORWARD SHARPE ─── */}
        <Panel className="col-span-3 p-3" style={{minHeight:200}}>
          <PanelHeader icon={Activity} title="System Telemetry" color={C.cyan}
                       right={<span className="text-sm font-mono font-black" style={{color:latNow<2000?C.profit:C.risk}}>{latNow.toFixed(0)}ms</span>} />
          <div className="flex-1 min-h-[80px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={latHist}>
                <CartesianGrid strokeDasharray="1 3" stroke={C.border} vertical={false}/>
                <XAxis hide/><YAxis hide domain={[0,'dataMax']}/>
                <Area type="monotone" dataKey="v" stroke={C.cyan} strokeWidth={1} fill="transparent" dot={false} isAnimationActive={false}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {/* Walk-Forward Summary */}
          <div className="grid grid-cols-3 gap-1.5 mt-2 pt-2 border-t" style={{borderColor:C.border}}>
            <div><div className="text-[7px] uppercase tracking-widest" style={{color:C.textD}}>WF Sharpe</div>
              <div className="text-xs font-mono font-bold" style={{color:wfResult?C.profit:C.textD}}>
                {wfResult?.aggregateMetrics.outOfSampleSharpe.toFixed(2) ?? '—'}
              </div>
            </div>
            <div><div className="text-[7px] uppercase tracking-widest" style={{color:C.textD}}>WinRate</div>
              <div className="text-xs font-mono font-bold" style={{color:C.warn}}>
                {wfResult?.aggregateMetrics.winRate.toFixed(0) ?? '—'}%
              </div>
            </div>
            <div><div className="text-[7px] uppercase tracking-widest" style={{color:C.textD}}>Windows</div>
              <div className="text-xs font-mono font-bold" style={{color:C.textM}}>
                {wfResult?.aggregateMetrics.totalWindows ?? '—'}
              </div>
            </div>
          </div>
        </Panel>

      </div>

      {/* ══════════ ROW 2/3 — LAYER-CONDITIONED ══════════ */}
      <div className="px-3 pb-1 grid grid-cols-12 gap-2.5 auto-rows-min">

        {/* ═══ L1: INFRASTRUCTURE LAYER ═══ */}
        {activeLayer===1 && <>
          <Panel className="col-span-3 p-3" style={{minHeight:260}}>
            <PanelHeader icon={Server} title="Data Sources" color={C.cyan}/>
            <div className="flex flex-col gap-2">
              {['Twelve Data','Yahoo Finance','FMP','FRED','AlphaVantage'].map((src,i)=>(
                <div key={i} className="flex justify-between items-center py-1.5 px-2 rounded" style={{backgroundColor:'rgba(0,0,0,0.3)',border:`1px solid ${C.border}`}}>
                  <div className="flex items-center gap-1.5">
                    <LedDot active={isActive} color={C.profit}/>
                    <span className="text-[9px] font-mono font-bold" style={{color:C.textH}}>{src}</span>
                  </div>
                  <span className="text-[8px] font-mono" style={{color:isActive?C.profit:C.textD}}>{isActive?'LIVE':'IDLE'}</span>
                </div>
              ))}
            </div>
          </Panel>
          <Panel className="col-span-5 p-3" style={{minHeight:260}}>
            <PanelHeader icon={Database} title="Universe Coverage" color={C.blue}/>
            <div className="flex flex-wrap gap-1 overflow-y-auto max-h-[200px]">
              {UNIVERSE.map(sym=>{
                const scanned = !!priceCache[sym];
                return <span key={sym} className="text-[8px] font-mono px-1.5 py-0.5 rounded" style={{backgroundColor:scanned?C.dimG:'rgba(255,255,255,0.02)',color:scanned?C.profit:C.textD,border:`1px solid ${scanned?C.profit+'20':C.border}`}}>{sym}</span>
              })}
            </div>
            <div className="mt-2 pt-2 border-t flex gap-4" style={{borderColor:C.border}}>
              <Metric label="Scanned" value={Object.keys(priceCache).length} color={C.profit}/>
              <Metric label="Universe" value={UNIVERSE.length}/>
              <Metric label="Coverage" value={`${((Object.keys(priceCache).length/UNIVERSE.length)*100).toFixed(0)}%`} color={C.blue}/>
            </div>
          </Panel>
          <Panel className="col-span-4 p-3" style={{minHeight:260}}>
            <PanelHeader icon={Activity} title="API Latency History" color={C.warn}/>
            <div className="flex-1 min-h-[120px]">
              <ResponsiveContainer width="100%" height={140}>
                <RechartsBarChart data={latHist.slice(-30)}>
                  <CartesianGrid strokeDasharray="1 3" stroke={C.border} vertical={false}/>
                  <XAxis hide/><YAxis hide/>
                  <Tooltip contentStyle={TT_STYLE} formatter={(v:number)=>[`${v.toFixed(0)}ms`,'Latency']}/>
                  <Bar dataKey="v" radius={[0,0,0,0]} isAnimationActive={false}>
                    {latHist.slice(-30).map((_,i)=><Cell key={i} fill={i===latHist.slice(-30).length-1?C.warn:C.textD}/>)}
                  </Bar>
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-1">
              <Metric label="Avg" value={`${latHist.length?Math.round(latHist.reduce((a,b)=>a+b.v,0)/latHist.length):0}ms`}/>
              <Metric label="Max" value={`${latHist.length?Math.round(Math.max(...latHist.map(l=>l.v))):0}ms`} color={C.risk}/>
              <Metric label="Min" value={`${latHist.length?Math.round(Math.min(...latHist.map(l=>l.v))):0}ms`} color={C.profit}/>
            </div>
          </Panel>
        </>}

        {/* ═══ L2: ALPHA ENGINE LAYER ═══ */}
        {activeLayer===2 && <>
        {/* R2C1: POSITIONS — EXECUTED / REJECTED TABS */}
        <Panel className="col-span-4" style={{maxHeight:400}}>
          <div className="px-3 py-2 border-b flex items-center justify-between" style={{borderColor:C.border}}>
            <h3 className="text-[9px] uppercase tracking-[0.15em] font-bold flex items-center gap-1.5" style={{color:C.textD}}>
              <Target className="w-3 h-3" style={{color:C.purple}}/> Positions
            </h3>
            {/* Tabs */}
            <div className="flex bg-black/30 rounded p-0.5 border" style={{borderColor:C.border}}>
              <button onClick={()=>setPosTab('executed')} className="px-2 py-0.5 rounded text-[7px] font-bold uppercase tracking-wider transition-all"
                style={{backgroundColor:posTab==='executed'?C.dimG:'transparent', color:posTab==='executed'?C.profit:C.textD}}>
                ✅ Filled ({filledExecLog.length})
              </button>
              <button onClick={()=>setPosTab('rejected')} className="px-2 py-0.5 rounded text-[7px] font-bold uppercase tracking-wider transition-all"
                style={{backgroundColor:posTab==='rejected'?C.dimR:'transparent', color:posTab==='rejected'?C.risk:C.textD}}>
                ❌ Rejected ({rejectedExecLog.length})
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-[9px]">
              <thead className="sticky top-0 z-5" style={{backgroundColor:C.panel2}}>
                <tr className="text-[7px] uppercase tracking-widest" style={{color:C.textD}}>
                  <th className="px-3 py-1.5 text-left font-normal">Asset</th>
                  <th className="px-2 py-1.5 text-center font-normal">Dir</th>
                  <th className="px-2 py-1.5 text-right font-normal">{posTab==='executed'?'Qty':'Reason'}</th>
                  <th className="px-2 py-1.5 text-right font-normal">Lat</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {(() => {
                  const logList = posTab === 'executed' ? filledExecLog : rejectedExecLog;
                  if (logList.length === 0) return <tr><td colSpan={4} className="text-center py-6 text-[9px]" style={{color:C.textD}}>
                    {posTab==='executed'?'No filled positions yet':'No rejections yet'}</td></tr>;
                  return logList.slice(0, 30).map((e, i) => (
                    <tr key={i}
                        onClick={() => { if (posTab === 'executed') { openThesisDetails(e.sym); setSelected(e.sym); } }}
                        className="border-t cursor-pointer transition-colors"
                        style={{borderColor:C.border, backgroundColor: detailStock===e.sym ? 'rgba(45,127,249,0.06)' : 'transparent'}}
                        onMouseEnter={ev=>{ev.currentTarget.style.backgroundColor='rgba(255,255,255,0.015)';}}
                        onMouseLeave={ev=>{ev.currentTarget.style.backgroundColor=detailStock===e.sym?'rgba(45,127,249,0.06)':'transparent';}}>
                      <td className="px-3 py-2 font-bold flex items-center gap-1">
                        {detailStock===e.sym && <LedDot active color={C.blue}/>}
                        <span style={{color:C.textH}}>{e.sym}</span>
                        <span className="text-[7px]" style={{color:C.textD}}>{SECTOR[e.sym]}</span>
                      </td>
                      <td className="px-2 py-2 text-center">
                        <span className="px-1 py-0.5 rounded text-[8px] font-bold"
                              style={{color: posTab==='executed' ? (e.act.includes('LONG')?C.profit:C.risk) : C.risk,
                                     backgroundColor: posTab==='executed' ? (e.act.includes('LONG')?C.dimG:C.dimR) : C.dimR}}>
                          {posTab==='executed' ? e.act.replace('_ENTRY','') : 'REJECTED'}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-right" style={{color:C.textM}}>
                        {posTab==='executed' ? e.qty.toLocaleString() : 'Risk Gate'}
                      </td>
                      <td className="px-2 py-2 text-right" style={{color:C.cyan}}>{e.lat}s</td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </Panel>

        {/* ─── R2C2: DETAIL PANEL — Factor Zoo / ML Signals ─── */}
        <Panel className="col-span-5 p-3" highlight={detailStock?C.blue+'35':selected?C.blue+'35':undefined} style={{maxHeight:400}}>
          {detailStock ? (
            <>
              <PanelHeader icon={Eye} title={`${detailStock} — Click to expand full report`} color={C.blue}
                right={<button onClick={()=>{setDetailStock(null);setSelected(null);}} className="text-[8px] uppercase tracking-widest px-2 py-0.5 rounded hover:bg-white/5"
                  style={{color:C.textD,border:`1px solid ${C.border}`}}>Close</button>}/>
              {/* Mini summary — the full-screen modal has the big chart */}
              <div className="grid grid-cols-3 gap-2 mb-2">
                {detailThesis && <>
                  <div className="p-1.5 rounded border" style={{borderColor:C.border,backgroundColor:'rgba(0,0,0,0.3)'}}>
                    <div className="text-[7px] uppercase tracking-widest" style={{color:C.textD}}>Direction</div>
                    <div className="text-sm font-bold" style={{color:detailThesis.direction==='LONG'?C.profit:C.risk}}>{detailThesis.direction}</div>
                  </div>
                  <div className="p-1.5 rounded border" style={{borderColor:C.border,backgroundColor:'rgba(0,0,0,0.3)'}}>
                    <div className="text-[7px] uppercase tracking-widest" style={{color:C.textD}}>Entry</div>
                    <div className="text-sm font-mono font-bold" style={{color:C.textH}}>${detailThesis.entryPrice.toFixed(2)}</div>
                  </div>
                  <div className="p-1.5 rounded border" style={{borderColor:C.border,backgroundColor:'rgba(0,0,0,0.3)'}}>
                    <div className="text-[7px] uppercase tracking-widest" style={{color:C.textD}}>Target</div>
                    <div className="text-sm font-mono font-bold" style={{color:C.profit}}>${detailThesis.targetPrice.toFixed(2)}</div>
                  </div>
                </>}
              </div>
              {/* Factor Zoo bars */}
              {fzClusterBars.length > 0 && (
                <div className="flex-1 min-h-[120px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={fzClusterBars} layout="vertical" margin={{left:0,right:5}}>
                      <XAxis type="number" hide domain={[0,100]}/>
                      <YAxis type="category" dataKey="name" width={40} tick={{fill:C.textD,fontSize:7}} axisLine={false} tickLine={false}/>
                      <Bar dataKey="val" radius={[0,0,0,0]} isAnimationActive={false}>
                        {fzClusterBars.map((e,i)=><Cell key={i} fill={e.color} fillOpacity={1}/>)}
                      </Bar>
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          ) : selected ? (
            <>
              <PanelHeader icon={Eye} title={`Deep Analysis: ${selected}`} color={C.blue}
                right={<button onClick={()=>setSelected(null)} className="text-[8px] uppercase tracking-widest px-2 py-0.5 rounded hover:bg-white/5"
                  style={{color:C.textD,border:`1px solid ${C.border}`}}>Close</button>}/>
              <div className="flex-1 grid grid-cols-2 gap-2 min-h-[200px] overflow-hidden">
                <div className="flex flex-col">
                  <span className="text-[7px] uppercase tracking-widest text-center mb-1" style={{color:C.textD}}>
                    Factor Zoo — 11 Clusters {selectedFZ && `(${selectedFZ.dataCompleteness}% complete)`}
                  </span>
                  {fzClusterBars.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart data={fzClusterBars} layout="vertical" margin={{left:0,right:5}}>
                        <XAxis type="number" hide domain={[0,100]}/>
                        <YAxis type="category" dataKey="name" width={40} tick={{fill:C.textD,fontSize:7}} axisLine={false} tickLine={false}/>
                        <Bar dataKey="val" radius={[0,0,0,0]} isAnimationActive={false}>
                          {fzClusterBars.map((e,i)=><Cell key={i} fill={e.color} fillOpacity={1}/>)}
                        </Bar>
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="60%" data={factorRadar.length>0?factorRadar:[
                        {factor:'Mom',score:50,full:100},{factor:'Vol',score:40,full:100},
                        {factor:'Value',score:60,full:100},{factor:'Trend',score:55,full:100},{factor:'Rev',score:35,full:100}
                      ]}>
                        <PolarGrid stroke={C.border}/>
                        <PolarAngleAxis dataKey="factor" tick={{fill:C.textD,fontSize:7}}/>
                        <Radar dataKey="score" stroke={C.blue} fill={C.blue} fillOpacity={0.15} strokeWidth={2}/>
                      </RadarChart>
                    </ResponsiveContainer>
                  )}
                </div>
                <div className="flex flex-col gap-2 overflow-y-auto border-l pl-2" style={{borderColor:C.border}}>
                  <span className="text-[7px] uppercase tracking-widest" style={{color:C.textD}}>Execution Intel</span>
                  {selectedFZ && (
                    <div className="p-2 rounded border" style={{borderColor:passesQualityGate(selectedFZ).passes?C.profit+'40':C.risk+'40', backgroundColor:'rgba(0,0,0,0.4)'}}>
                      <div className="text-[8px] font-bold" style={{color:passesQualityGate(selectedFZ).passes?C.profit:C.risk}}>
                        QUALITY GATE: {passesQualityGate(selectedFZ).passes?'PASSED ✓':'REJECTED ✗'}
                      </div>
                      <div className="text-[8px] font-mono mt-0.5" style={{color:C.textM}}>
                        Score: {(selectedFZ.compositeScore*100).toFixed(1)}% | Threshold: 35%
                      </div>
                    </div>
                  )}
                  {activeTheses.filter(t=>t.symbol===selected).map(t=>(
                    <div key={t.id} className="text-[9px] font-mono leading-relaxed" style={{color:C.textM}}>
                      <div className="font-bold mb-0.5" style={{color:t.direction==='LONG'?C.profit:C.risk}}>
                        {t.direction} @ ${t.entryPrice.toFixed(2)} → ${t.targetPrice.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <PanelHeader icon={BarChart4} title="Factor Signals (ML Pipeline)" color={C.purple}/>
              <div className="flex-1 overflow-y-auto flex flex-col gap-1.5">
                {!mlResult
                  ? <div className="flex-1 flex items-center justify-center text-[9px] font-mono" style={{color:C.textD}}>Pipeline idle</div>
                  : mlResult.factorSignals.map((f,i)=>(
                  <div key={i} className="px-2.5 py-1.5 rounded border flex items-center justify-between"
                       style={{borderColor:f.signal.includes('BUY')?C.profit+'25':f.signal.includes('SELL')?C.risk+'25':C.border, backgroundColor:'rgba(0,0,0,0.25)'}}>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold" style={{color:C.textH}}>{f.name}</span>
                      <span className="text-[8px]" style={{color:C.textD}}>{f.description}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-mono" style={{color:C.textM}}>{f.value.toFixed(3)}</span>
                      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded"
                            style={{color:f.signal.includes('BUY')?C.profit:f.signal.includes('SELL')?C.risk:C.textD,
                                   backgroundColor:f.signal.includes('BUY')?C.dimG:f.signal.includes('SELL')?C.dimR:'rgba(255,255,255,0.03)'}}>
                        {f.signal}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Panel>

        {/* ─── R2C3: RISK CORE ─── */}
        <Panel className="col-span-3 p-3 relative overflow-hidden" highlight={C.risk+'20'} style={{maxHeight:400}}>
          <div className="absolute inset-0 bg-gradient-to-b from-red-950/15 to-transparent pointer-events-none"/>
          <div className="relative z-10 flex flex-col h-full">
            <PanelHeader icon={ShieldAlert} title="Risk Core" color={C.risk}/>
            <div className="grid grid-cols-2 gap-2.5 mb-2">
              <Metric label="VaR(95)" value={`${var95.toFixed(2)}%`} color={C.risk}/>
              <Metric label="CVaR(95)" value={`${cvar95.toFixed(2)}%`} color={C.risk}/>
            </div>
            <div className="mb-2">
              <div className="flex justify-between text-[7px] uppercase tracking-widest font-bold mb-1">
                <span style={{color:C.textD}}>Confidence</span>
                <span style={{color:conf<40?C.risk:C.textM}}>{conf.toFixed(0)}/100</span>
              </div>
              <div className="w-full h-1.5 bg-black rounded-full overflow-hidden">
                <motion.div initial={{width:0}} animate={{width:`${Math.min(100,conf)}%`}} transition={{duration:0.5}}
                  className="h-full rounded-full" style={{backgroundColor:conf<=40?C.risk:conf<=70?C.warn:C.profit}}/>
              </div>
            </div>
            <div className="p-2 rounded border bg-black/40 mb-2" style={{borderColor:C.risk+'18'}}>
              <div className="text-[7px] font-bold uppercase mb-0.5" style={{color:C.risk}}>Max Drawdown</div>
              <div className="text-lg font-mono font-black" style={{color:C.risk}}>{mdd.toFixed(2)}%</div>
            </div>
            {wfResult && wfResult.equityCurve.length > 5 && (
              <div className="flex-1 min-h-[50px]">
                <div className="text-[7px] uppercase tracking-widest mb-0.5" style={{color:C.textD}}>WF Equity (OOS)</div>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={wfResult.equityCurve}>
                    <defs><linearGradient id="wfG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={C.purple} stopOpacity={0.2}/><stop offset="95%" stopColor={C.purple} stopOpacity={0}/>
                    </linearGradient></defs>
                    <Area type="monotone" dataKey="equity" stroke={C.purple} strokeWidth={1.5} fill="url(#wfG)" dot={false} animationDuration={300}/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </Panel>

        {/* ─── ROW 3: EXECUTION SPLIT — Filled vs Rejected Feed ─── */}
        <Panel className="col-span-6" style={{minHeight:170}}>
          <div className="px-3 py-2 border-b flex items-center justify-between" style={{borderColor:C.border}}>
            <div className="flex items-center gap-1.5">
              <Zap className="w-3 h-3" style={{color:C.profit}}/>
              <span className="text-[9px] uppercase tracking-[0.15em] font-bold" style={{color:C.textD}}>Filled Executions ({filledExecLog.length})</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[150px]">
            <table className="w-full text-[8px]">
              <thead className="sticky top-0" style={{backgroundColor:C.panel2}}>
                <tr className="text-[7px] uppercase tracking-widest" style={{color:C.textD}}>
                  <th className="px-2 py-1.5 text-left font-normal">Time</th>
                  <th className="px-2 py-1.5 text-left font-normal">Sym</th>
                  <th className="px-2 py-1.5 text-left font-normal">Action</th>
                  <th className="px-2 py-1.5 text-left font-normal">Algo</th>
                  <th className="px-2 py-1.5 text-right font-normal">Qty</th>
                  <th className="px-2 py-1.5 text-right font-normal">Lat</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {filledExecLog.length===0
                  ? <tr><td colSpan={6} className="text-center py-4" style={{color:C.textD}}>No filled executions</td></tr>
                  : filledExecLog.map((e,i)=>(
                  <tr key={i} className="border-t cursor-pointer hover:bg-white/[0.015]" style={{borderColor:C.border}}
                      onClick={()=>{openThesisDetails(e.sym);setSelected(e.sym);}}>
                    <td className="px-2 py-1" style={{color:C.textD}}>{e.t}</td>
                    <td className="px-2 py-1 font-bold" style={{color:C.textH}}>{e.sym}</td>
                    <td className="px-2 py-1"><span style={{color:e.act.includes('LONG')?C.profit:C.risk}}>{e.act}</span></td>
                    <td className="px-2 py-1" style={{color:C.blue}}>{e.algo}</td>
                    <td className="px-2 py-1 text-right" style={{color:C.textM}}>{e.qty.toLocaleString()}</td>
                    <td className="px-2 py-1 text-right" style={{color:C.cyan}}>{e.lat}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel className="col-span-6" style={{minHeight:170}}>
          <div className="px-3 py-2 border-b flex items-center justify-between" style={{borderColor:C.border}}>
            <div className="flex items-center gap-1.5">
              <XCircle className="w-3 h-3" style={{color:C.risk}}/>
              <span className="text-[9px] uppercase tracking-[0.15em] font-bold" style={{color:C.textD}}>Rejected Scans ({rejectedExecLog.length})</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[150px]">
            <table className="w-full text-[8px]">
              <thead className="sticky top-0" style={{backgroundColor:C.panel2}}>
                <tr className="text-[7px] uppercase tracking-widest" style={{color:C.textD}}>
                  <th className="px-2 py-1.5 text-left font-normal">Time</th>
                  <th className="px-2 py-1.5 text-left font-normal">Sym</th>
                  <th className="px-2 py-1.5 text-left font-normal">Reason</th>
                  <th className="px-2 py-1.5 text-right font-normal">Lat</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {rejectedExecLog.length===0
                  ? <tr><td colSpan={4} className="text-center py-4" style={{color:C.textD}}>No rejections</td></tr>
                  : rejectedExecLog.map((e,i)=>(
                  <tr key={i} className="border-t" style={{borderColor:C.border}}>
                    <td className="px-2 py-1" style={{color:C.textD}}>{e.t}</td>
                    <td className="px-2 py-1 font-bold" style={{color:C.textH}}>{e.sym}</td>
                    <td className="px-2 py-1"><span style={{color:C.risk}}>Sharpe below threshold</span></td>
                    <td className="px-2 py-1 text-right" style={{color:C.cyan}}>{e.lat}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        </>}

        {/* ═══ L3: EXECUTION LAYER ═══ */}
        {activeLayer===3 && <>
          <Panel className="col-span-4 p-3" style={{minHeight:220}}>
            <PanelHeader icon={Layers} title="Sector & Strategy Decomposition" color={C.purple}/>
            <div className="flex-1 flex gap-3 min-h-[100px]">
              <div className="flex-1">
                {sectorData.length===0
                  ? <div className="h-full flex items-center justify-center text-[9px] font-mono" style={{color:C.textD}}>No positions</div>
                  : <div className="flex items-center gap-2 h-full">
                      <ResponsiveContainer width="55%" height={120}>
                        <PieChart>
                          <Pie data={sectorData} dataKey="v" nameKey="s" cx="50%" cy="50%" innerRadius={22} outerRadius={44} paddingAngle={2} strokeWidth={0}>
                            {sectorData.map((e,i)=><Cell key={i} fill={e.fill}/>)}
                          </Pie>
                          <Tooltip contentStyle={TT_STYLE}/>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex flex-col gap-0.5 overflow-y-auto">
                        {sectorData.map((s,i)=>(
                          <div key={i} className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-sm" style={{backgroundColor:s.fill}}/>
                            <span className="text-[8px] font-mono" style={{color:C.textM}}>{s.s}</span>
                            <span className="text-[8px] font-mono font-bold" style={{color:C.textH}}>{s.v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                }
              </div>
            </div>
          </Panel>
          <Panel className="col-span-4 p-3" style={{minHeight:220}}>
            <PanelHeader icon={Wind} title="Returns Distribution" color={C.warn}/>
            <div className="flex-1 min-h-[130px]">
              {retDist.length===0
                ? <div className="h-full flex items-center justify-center text-[9px] font-mono" style={{color:C.textD}}>Awaiting data</div>
                : <ResponsiveContainer width="100%" height={140}>
                    <RechartsBarChart data={retDist} margin={{top:5,right:5,left:-15,bottom:0}}>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
                      <XAxis dataKey="bucket" tick={{fill:C.textD,fontSize:7}}/><YAxis hide/>
                      <Tooltip contentStyle={TT_STYLE}/>
                      <Bar dataKey="count" radius={[2,2,0,0]} animationDuration={300}>
                        {retDist.map((e,i)=><Cell key={i} fill={e.bucket.startsWith('-')?C.risk:e.bucket==='+0%'?C.textD:C.profit} fillOpacity={0.65}/>)}
                      </Bar>
                    </RechartsBarChart>
                  </ResponsiveContainer>
              }
            </div>
          </Panel>
          <Panel className="col-span-4" style={{minHeight:220}}>
            <div className="px-3 py-2 border-b flex items-center gap-1.5" style={{borderColor:C.border}}>
              <Zap className="w-3 h-3" style={{color:C.cyan}}/>
              <span className="text-[9px] uppercase tracking-[0.15em] font-bold" style={{color:C.textD}}>Execution Feed ({execLog.length})</span>
            </div>
            <div className="flex-1 overflow-y-auto max-h-[200px]">
              <table className="w-full text-[8px]">
                <thead className="sticky top-0" style={{backgroundColor:C.panel2}}>
                  <tr className="text-[7px] uppercase tracking-widest" style={{color:C.textD}}>
                    <th className="px-2 py-1.5 text-left font-normal">Time</th>
                    <th className="px-2 py-1.5 text-left font-normal">Sym</th>
                    <th className="px-2 py-1.5 text-left font-normal">Action</th>
                    <th className="px-2 py-1.5 text-left font-normal">Algo</th>
                    <th className="px-2 py-1.5 text-right font-normal">Qty</th>
                    <th className="px-2 py-1.5 text-center font-normal">Status</th>
                    <th className="px-2 py-1.5 text-right font-normal">Lat</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  {execLog.length===0
                    ? <tr><td colSpan={7} className="text-center py-5" style={{color:C.textD}}>No executions</td></tr>
                    : execLog.map((e,i)=>(
                    <tr key={i} className="border-t" style={{borderColor:C.border}}>
                      <td className="px-2 py-1" style={{color:C.textD}}>{e.t}</td>
                      <td className="px-2 py-1 font-bold" style={{color:C.textH}}>{e.sym}</td>
                      <td className="px-2 py-1"><span style={{color:e.act.includes('LONG')?C.profit:e.act.includes('SHORT')?C.risk:C.warn}}>{e.act}</span></td>
                      <td className="px-2 py-1" style={{color:C.blue}}>{e.algo}</td>
                      <td className="px-2 py-1 text-right" style={{color:C.textM}}>{e.qty.toLocaleString()}</td>
                      <td className="px-2 py-1 text-center">
                        <span className="text-[7px] font-bold px-1 py-0.5 rounded" style={{
                          color: e.status==='FILLED'?C.profit:C.risk,
                          backgroundColor: e.status==='FILLED'?C.dimG:C.dimR
                        }}>{e.status}</span>
                      </td>
                      <td className="px-2 py-1 text-right" style={{color:C.cyan}}>{e.lat}s</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </>}

        {/* ═══ L4: BACKTESTER LAYER ═══ */}
        {activeLayer===4 && <>
          {/* L4 Configuration Panel */}
          <Panel className="col-span-12 p-4 mb-2" style={{minHeight:150}}>
            <PanelHeader icon={GitBranch} title="Walk-Forward AI Configuration (DeepSeek-V4-Pro)" color={C.blue}/>
            <div className="grid grid-cols-12 gap-6 mt-2">
              <div className="col-span-8 flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase tracking-widest font-bold" style={{color:C.textD}}>Strategy Alpha Thesis (Prompt)</label>
                  <textarea 
                    value={alphaThesis} onChange={e=>setAlphaThesis(e.target.value)}
                    className="w-full bg-black/50 rounded border p-2 text-xs font-mono resize-none focus:outline-none"
                    style={{borderColor:C.border, color:C.textH, height:'60px'}}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase tracking-widest font-bold" style={{color:C.textD}}>Hugging Face API Key</label>
                  <input 
                    type="password" value={hfApiKey} onChange={e=>setHfApiKey(e.target.value)}
                    className="w-full bg-black/50 rounded border p-1.5 text-xs font-mono focus:outline-none"
                    style={{borderColor:C.border, color:C.textH}}
                  />
                </div>
              </div>
              <div className="col-span-4 flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase tracking-widest font-bold" style={{color:C.textD}}>Test Window (Days)</label>
                  <input type="number" value={testWindow} onChange={e=>setTestWindow(Number(e.target.value))} className="w-full bg-black/50 rounded border p-1.5 text-xs font-mono focus:outline-none" style={{borderColor:C.border, color:C.textH}} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase tracking-widest font-bold" style={{color:C.textD}}>Min Train Days</label>
                  <input type="number" value={trainDays} onChange={e=>setTrainDays(Number(e.target.value))} className="w-full bg-black/50 rounded border p-1.5 text-xs font-mono focus:outline-none" style={{borderColor:C.border, color:C.textH}} />
                </div>
                <button 
                  onClick={() => { setIsWfRunning(true); setTimeout(() => setIsWfRunning(false), 2000); }}
                  className="w-full mt-auto py-2 rounded text-[10px] uppercase font-bold tracking-widest transition-all flex items-center justify-center gap-2"
                  style={{backgroundColor:isWfRunning?C.dimW:C.dimB, color:isWfRunning?C.warn:C.blue, border:`1px solid ${isWfRunning?C.warn:C.blue}40`}}>
                  {isWfRunning ? <><RefreshCw className="w-3 h-3 animate-spin"/> Executing Backend Engine...</> : <><Target className="w-3 h-3"/> Run Walk-Forward Simulation</>}
                </button>
              </div>
            </div>
          </Panel>

          <Panel className="col-span-8 p-3" style={{minHeight:260}}>
            <PanelHeader icon={GitBranch} title="Walk-Forward Equity Curve (Out-of-Sample)" color={C.purple}
              right={wfResult?<span className="text-[8px] font-mono" style={{color:C.profit}}>{wfResult.aggregateMetrics.totalWindows} windows</span>:undefined}/>
            <div className="flex-1 min-h-[160px]">
              {!wfResult || wfResult.equityCurve.length<3
                ? <div className="h-full flex items-center justify-center text-[9px] font-mono" style={{color:C.textD}}>Engage engine — WF runs after 200+ price points</div>
                : <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={wfResult.equityCurve}>
                      <CartesianGrid strokeDasharray="1 3" stroke={C.border} vertical={false}/>
                      <XAxis dataKey="day" tick={{fill:C.textD,fontSize:7}} label={{value:'Day',fill:C.textD,fontSize:7}}/>
                      <YAxis tick={{fill:C.textD,fontSize:7}}/>
                      <Tooltip contentStyle={TT_STYLE} formatter={(v:number)=>[`${v.toFixed(1)}%`,'Equity']}/>
                      <ReferenceLine y={100} stroke={C.textD} strokeDasharray="3 3"/>
                      <Area type="monotone" dataKey="equity" stroke={C.purple} strokeWidth={1} fill="transparent" dot={false} isAnimationActive={false}/>
                    </AreaChart>
                  </ResponsiveContainer>
              }
            </div>
          </Panel>
          <Panel className="col-span-4 p-3" style={{minHeight:260}}>
            <PanelHeader icon={ShieldCheck} title="Aggregate OOS Metrics" color={C.profit}/>
            {wfResult ? (
              <div className="grid grid-cols-2 gap-3">
                <Metric label="Total Return" value={`${(wfResult.aggregateMetrics.totalReturn*100).toFixed(2)}%`} color={wfResult.aggregateMetrics.totalReturn>0?C.profit:C.risk}/>
                <Metric label="Annualized" value={`${(wfResult.aggregateMetrics.annualizedReturn*100).toFixed(2)}%`} color={C.blue}/>
                <Metric label="OOS Sharpe" value={wfResult.aggregateMetrics.outOfSampleSharpe.toFixed(3)} color={wfResult.aggregateMetrics.outOfSampleSharpe>1?C.profit:C.warn}/>
                <Metric label="Max DD" value={`${(wfResult.aggregateMetrics.maxDrawdown*100).toFixed(2)}%`} color={C.risk}/>
                <Metric label="Win Rate" value={`${wfResult.aggregateMetrics.winRate.toFixed(1)}%`} color={C.warn}/>
                <Metric label="Profit Factor" value={`${wfResult.aggregateMetrics.profitFactor.toFixed(2)}x`} color={C.profit}/>
                <Metric label="Best Window" value={`${(wfResult.aggregateMetrics.bestWindowReturn*100).toFixed(2)}%`} color={C.profit}/>
                <Metric label="Worst Window" value={`${(wfResult.aggregateMetrics.worstWindowReturn*100).toFixed(2)}%`} color={C.risk}/>
              </div>
            ) : <div className="flex-1 flex items-center justify-center text-[9px] font-mono" style={{color:C.textD}}>Awaiting WF data</div>}
          </Panel>
          {/* Window-by-Window Results Table */}
          <Panel className="col-span-7" style={{minHeight:200}}>
            <div className="px-3 py-2 border-b" style={{borderColor:C.border}}>
              <span className="text-[9px] uppercase tracking-[0.15em] font-bold" style={{color:C.textD}}>Window-by-Window Results</span>
            </div>
            <div className="overflow-y-auto max-h-[200px]">
              <table className="w-full text-[8px]">
                <thead className="sticky top-0" style={{backgroundColor:C.panel2}}>
                  <tr className="text-[7px] uppercase tracking-widest" style={{color:C.textD}}>
                    <th className="px-2 py-1.5 text-left font-normal">#</th>
                    <th className="px-2 py-1.5 text-left font-normal">Train</th>
                    <th className="px-2 py-1.5 text-left font-normal">Test</th>
                    <th className="px-2 py-1.5 text-left font-normal">Strategy</th>
                    <th className="px-2 py-1.5 text-right font-normal">Return</th>
                    <th className="px-2 py-1.5 text-right font-normal">Sharpe</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  {!wfResult?.windows.length
                    ? <tr><td colSpan={6} className="text-center py-4" style={{color:C.textD}}>No windows</td></tr>
                    : wfResult.windows.map(w=>(
                    <tr key={w.windowIndex} className="border-t" style={{borderColor:C.border}}>
                      <td className="px-2 py-1" style={{color:C.textD}}>{w.windowIndex+1}</td>
                      <td className="px-2 py-1" style={{color:C.textM}}>d0→{w.trainEnd}</td>
                      <td className="px-2 py-1" style={{color:C.textM}}>{w.testStart}→{w.testEnd}</td>
                      <td className="px-2 py-1" style={{color:C.blue}}>{w.bestStrategy.replace(/\s/g,'')}</td>
                      <td className="px-2 py-1 text-right font-bold" style={{color:w.testReturn>0?C.profit:C.risk}}>{(w.testReturn*100).toFixed(2)}%</td>
                      <td className="px-2 py-1 text-right" style={{color:w.testSharpe>0?C.profit:C.risk}}>{w.testSharpe.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
          <Panel className="col-span-5 p-3" style={{minHeight:200}}>
            <PanelHeader icon={Flame} title="Strategy Contribution" color={C.warn}/>
            {wfResult?.strategyContribution.length ? (
              <ResponsiveContainer width="100%" height={140}>
                <RechartsBarChart data={wfResult.strategyContribution}>
                  <CartesianGrid strokeDasharray="1 3" stroke={C.border} vertical={false}/>
                  <XAxis dataKey="strategy" tick={{fill:C.textD,fontSize:7}} interval={0}/>
                  <YAxis tick={{fill:C.textD,fontSize:7}}/>
                  <Tooltip contentStyle={TT_STYLE}/>
                  <Bar dataKey="wins" name="Wins" fill={C.profit} radius={[0,0,0,0]} isAnimationActive={false}/>
                  <Bar dataKey="avgSharpe" name="Avg Sharpe" fill={C.cyan} radius={[0,0,0,0]} isAnimationActive={false}/>
                </RechartsBarChart>
              </ResponsiveContainer>
            ) : <div className="flex-1 flex items-center justify-center text-[9px] font-mono" style={{color:C.textD}}>Awaiting WF data</div>}
          </Panel>
        </>}

      </div>

      {/* ══════════ WALK-FORWARD BACKTESTING FOOTER SECTION ══════════ */}
      <div className="px-3 pb-6">
        <div className="border-t pt-3 mb-3" style={{borderColor:C.border}}>
          <h2 className="text-[10px] uppercase tracking-[0.2em] font-black flex items-center gap-2 mb-3" style={{color:C.textD}}>
            <GitBranch className="w-3.5 h-3.5" style={{color:C.purple}}/> Walk-Forward Truth Machine — Double-Blind Backtester
          </h2>
        </div>
        <div className="grid grid-cols-12 gap-2.5">
          <Panel className="col-span-8 p-3" style={{minHeight:200}}>
            <PanelHeader icon={TrendingUp} title="Walk-Forward OOS Equity Curve" color={C.purple}/>
            <div className="min-h-[160px]">
              {!wfResult || wfResult.equityCurve.length<3
                ? <div className="h-[160px] flex items-center justify-center text-[9px] font-mono" style={{color:C.textD}}>Engage engine to generate Walk-Forward results. Requires 200+ price points per ticker.</div>
                : <ResponsiveContainer width="100%" height={180}>
                    <ComposedChart data={wfResult.equityCurve}>
                      <CartesianGrid strokeDasharray="1 3" stroke={C.border} vertical={false}/>
                      <XAxis dataKey="day" tick={{fill:C.textD,fontSize:8}}/><YAxis tick={{fill:C.textD,fontSize:8}}/>
                      <Tooltip contentStyle={TT_STYLE} formatter={(v:number)=>[`${v.toFixed(1)}%`,'OOS Equity']}/>
                      <ReferenceLine y={100} stroke={C.warn} strokeDasharray="2 2" label={{value:'Baseline',fill:C.warn,fontSize:7}}/>
                      <Area type="monotone" dataKey="equity" stroke={C.profit} strokeWidth={1} fill="transparent" dot={false} isAnimationActive={false}/>
                    </ComposedChart>
                  </ResponsiveContainer>
              }
            </div>
          </Panel>
          <Panel className="col-span-4 p-3" style={{minHeight:200}}>
            <PanelHeader icon={ShieldCheck} title="Backtest Summary" color={C.profit}/>
            {wfResult ? <div className="grid grid-cols-2 gap-2.5">
              <Metric label="Total Return" value={`${(wfResult.aggregateMetrics.totalReturn*100).toFixed(2)}%`} color={wfResult.aggregateMetrics.totalReturn>0?C.profit:C.risk}/>
              <Metric label="OOS Sharpe" value={wfResult.aggregateMetrics.outOfSampleSharpe.toFixed(3)} color={C.profit}/>
              <Metric label="Win Rate" value={`${wfResult.aggregateMetrics.winRate.toFixed(0)}%`} color={C.warn}/>
              <Metric label="Profit Factor" value={`${wfResult.aggregateMetrics.profitFactor.toFixed(2)}x`} color={C.profit}/>
              <Metric label="Max DD" value={`${(wfResult.aggregateMetrics.maxDrawdown*100).toFixed(2)}%`} color={C.risk}/>
              <Metric label="Stability" value={`${wfResult.aggregateMetrics.stabilityRatio.toFixed(0)}%`} color={C.blue}/>
            </div> : <div className="flex-1 flex items-center justify-center text-[9px] font-mono" style={{color:C.textD}}>Awaiting data</div>}
          </Panel>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
         FULL-SCREEN STOCK DETAIL MODAL — TradingView + AI Report
         ═══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {detailStock && (
          <motion.div
            initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.2}}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)', backgroundColor:'rgba(0,0,0,0.75)'}}
            onClick={(e) => { if (e.target === e.currentTarget) { setDetailStock(null); setSelected(null); } }}>
            <motion.div
              initial={{scale:0.92,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.95,opacity:0}}
              transition={{type:'spring',damping:25,stiffness:300}}
              className="relative w-[94vw] h-[92vh] rounded-2xl border overflow-hidden flex flex-col"
              style={{backgroundColor:'#080C14', borderColor:C.border, boxShadow:'0 32px 128px rgba(0,0,0,0.8)',fontFamily:FONT}}>

              {/* ─── Modal Header ─── */}
              <div className="flex items-center justify-between px-6 py-3 border-b shrink-0" style={{borderColor:C.border,backgroundColor:'rgba(6,9,17,0.95)'}}>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{backgroundColor:C.dimB}}>
                      <TrendingUp className="w-4 h-4" style={{color:C.profit}} />
                    </div>
                    <div>
                      <h2 className="text-lg font-black tracking-tight" style={{color:C.textH}}>
                        {detailStock}
                        <span className="text-[10px] font-mono ml-2 px-2 py-0.5 rounded" style={{backgroundColor:C.dimB,color:C.blue}}>{SECTOR[detailStock] || 'Other'}</span>
                      </h2>
                      <span className="text-[9px] font-mono" style={{color:C.textD}}>Live Candlestick • Advanced AI Analytics</span>
                    </div>
                  </div>
                  
                  {/* SWITCH MODE BUTTONS */}
                  <div className="flex bg-black/40 border border-white/10 rounded-lg p-1 gap-1 ml-4">
                    <button
                      onClick={() => setChartMode('tradingview')}
                      className={`px-3 py-1.5 rounded-md text-[9px] tracking-widest font-bold uppercase transition-all flex items-center gap-1.5 ${chartMode === 'tradingview' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'text-white/40 hover:text-white/70 border border-transparent'}`}
                    >
                      <BarChart4 className="w-3.5 h-3.5" />
                      TradingView
                    </button>
                    <button
                      onClick={() => setChartMode('ai_overlay')}
                      className={`px-3 py-1.5 rounded-md text-[9px] tracking-widest font-bold uppercase transition-all flex items-center gap-1.5 ${chartMode === 'ai_overlay' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'text-white/40 hover:text-white/70 border border-transparent'}`}
                    >
                      <Zap className="w-3.5 h-3.5" />
                      AI Success Overlay
                    </button>
                  </div>

                  {detailThesis && (
                    <div className="flex items-center gap-3 ml-6">
                      <div className="px-3 py-1.5 rounded-lg border" style={{borderColor:detailThesis.direction==='LONG'?C.profit+'40':C.risk+'40',backgroundColor:detailThesis.direction==='LONG'?C.dimG:C.dimR}}>
                        <span className="text-xs font-black" style={{color:detailThesis.direction==='LONG'?C.profit:C.risk}}>{detailThesis.direction}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[8px] uppercase tracking-widest" style={{color:C.textD}}>Entry</span>
                        <span className="text-sm font-mono font-bold" style={{color:C.textH}}>${detailThesis.entryPrice.toFixed(2)}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[8px] uppercase tracking-widest" style={{color:C.textD}}>Target</span>
                        <span className="text-sm font-mono font-bold" style={{color:C.profit}}>${detailThesis.targetPrice.toFixed(2)}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[8px] uppercase tracking-widest" style={{color:C.textD}}>Stop Loss</span>
                        <span className="text-sm font-mono font-bold" style={{color:C.risk}}>${detailThesis.stopLoss.toFixed(2)}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[8px] uppercase tracking-widest" style={{color:C.textD}}>Confidence</span>
                        <span className="text-sm font-mono font-bold" style={{color:detailThesis.confidence>0.7?C.profit:C.warn}}>{(detailThesis.confidence*100).toFixed(0)}%</span>
                      </div>
                    </div>
                  )}
                </div>
                <button onClick={()=>{setDetailStock(null);setSelected(null);}}
                  className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:bg-white/10"
                  style={{border:`1px solid ${C.border}`}}>
                  <XCircle className="w-5 h-5" style={{color:C.textM}} />
                </button>
              </div>

              {/* ─── Chart Section — Switched via Mode ─── */}
              <div className="flex-1 min-h-0 relative bg-black/50">
                {chartMode === 'tradingview' ? (
                  <iframe
                    key={`modal-${detailStock}`}
                    src={`https://s.tradingview.com/widgetembed/?frameElementId=tv_modal&symbol=${detailStock.replace('-','')}&interval=D&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=080C14&studies=MASimple%7C20%7C1%7C%7CMASimple%7C50%7C1&theme=dark&style=1&timezone=exchange&withdateranges=1&studies_overrides=%7B%7D&overrides=%7B%22paneProperties.background%22%3A%22%23080C14%22%2C%22paneProperties.backgroundType%22%3A%22solid%22%7D&enabled_features=[]&disabled_features=[]&locale=en&utm_source=quantsuite`}
                    width="100%" height="100%" frameBorder="0" style={{display:'block'}} allowFullScreen
                  />
                ) : (
                  <div className="w-full h-full p-6 flex flex-col justify-between">
                    {loadingPrices ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-indigo-400 gap-2">
                        <Activity className="w-8 h-8 animate-pulse" />
                        <span className="text-[10px] tracking-widest uppercase">Aligning data frames...</span>
                      </div>
                    ) : historicalPrices.length > 0 ? (
                      <div className="flex-1 w-full h-full flex gap-4 p-4 relative overflow-hidden">
                        {/* LEFT COLUMN: The Visual Chart Overlay */}
                        <div className="flex-[7] min-w-0 h-full flex flex-col justify-between">
                          <ResponsiveContainer width="100%" height="90%">
                            <AreaChart data={historicalPrices} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                              <CartesianGrid stroke={C.border} strokeDasharray="1 3" vertical={false} />
                              <XAxis dataKey="day" stroke={C.textD} tick={{ fill: C.textM, fontSize: 8 }} />
                              <YAxis domain={['auto', 'auto']} stroke={C.textD} tick={{ fill: C.textM, fontSize: 8 }} />
                              <Tooltip 
                                contentStyle={{ backgroundColor: C.panelBg, borderColor: C.border, color: C.textH, fontSize: '10px' }} 
                                labelFormatter={(label) => `Relative Day: ${label}`}
                              />
                              <Area type="monotone" dataKey="price" stroke={detailThesis?.direction === 'SHORT' ? C.risk : C.profit} strokeWidth={1} fill="transparent" isAnimationActive={false} />
                              
                              {detailThesis && (
                                <>
                                  <ReferenceLine y={detailThesis.entryPrice} stroke={C.blue} strokeDasharray="3 3" label={{ value: `ENTRY: $${detailThesis.entryPrice.toFixed(2)}`, fill: C.blue, fontSize: 10, position: 'insideTopLeft' }} />
                                  <ReferenceLine y={detailThesis.targetPrice} stroke={C.profit} strokeDasharray="1 3" label={{ value: `TARGET: $${detailThesis.targetPrice.toFixed(2)}`, fill: C.profit, fontSize: 10, position: 'insideBottomLeft' }} />
                                  <ReferenceLine y={detailThesis.stopLoss} stroke={C.risk} strokeDasharray="1 3" label={{ value: `STOP: $${detailThesis.stopLoss.toFixed(2)}`, fill: C.risk, fontSize: 10, position: 'insideTopLeft' }} />
                                </>
                              )}
                            </AreaChart>
                          </ResponsiveContainer>
                          <div className="text-[10px] uppercase tracking-widest flex justify-center gap-6 mt-1" style={{color:C.textM}}>
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{backgroundColor:C.blue}}></span> AI Entry</span>
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{backgroundColor:C.profit}}></span> Take Profit</span>
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{backgroundColor:C.risk}}></span> Stop Loss</span>
                          </div>
                        </div>

                        {/* RIGHT COLUMN: Interactive Ticket Builder / Simulator */}
                        <div className="flex-[3] min-w-[260px] border-l pl-4 flex flex-col gap-3 justify-between" style={{borderColor:C.border}}>
                          <div>
                            <span className="text-[9px] uppercase tracking-[0.2em] font-black flex items-center gap-1.5 mb-3" style={{color:C.purple}}>
                              <Settings className="w-3.5 h-3.5" /> Live Trade Simulator
                            </span>
                            
                            {/* Quantity Selector Slider */}
                            <div className="p-3 rounded-xl border bg-black/40 mb-3" style={{borderColor:C.border}}>
                              <div className="flex justify-between items-center mb-1.5">
                                <span className="text-[8px] uppercase tracking-wider text-white/50 font-bold">Allocation Qty</span>
                                <span className="text-xs font-mono font-black" style={{color:C.textH}}>{simQty.toLocaleString()} shares</span>
                              </div>
                              <input 
                                type="range" min={10} max={10000} step={10} value={simQty}
                                onChange={(e) => setSimQty(Number(e.target.value))}
                                className="w-full accent-indigo-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                              />
                            </div>

                            {/* Ticket Details */}
                            <div className="space-y-2">
                              {detailThesis && (
                                <>
                                  <div className="flex justify-between items-center text-[9px] font-mono py-1 border-b border-dashed border-white/5">
                                    <span style={{color:C.textM}}>Margin Requirement (5x)</span>
                                    <span style={{color:C.textH}} className="font-bold">${((simQty * detailThesis.entryPrice) / 5).toLocaleString(undefined, {maximumFractionDigits:2})}</span>
                                  </div>
                                  <div className="flex justify-between items-center text-[9px] font-mono py-1 border-b border-dashed border-white/5">
                                    <span style={{color:C.textM}}>Total Notional Value</span>
                                    <span style={{color:C.textH}} className="font-bold">${(simQty * detailThesis.entryPrice).toLocaleString(undefined, {maximumFractionDigits:2})}</span>
                                  </div>
                                  <div className="flex justify-between items-center text-[9px] font-mono py-1 border-b border-dashed border-white/5">
                                    <span style={{color:C.textM}}>Risk/Reward Multiple</span>
                                    {(() => {
                                      const rr = Math.abs((detailThesis.targetPrice - detailThesis.entryPrice) / (detailThesis.entryPrice - detailThesis.stopLoss));
                                      return <span style={{color: rr >= 2 ? C.profit : C.warn}} className="font-bold">{rr.toFixed(2)}x</span>;
                                    })()}
                                  </div>
                                  <div className="flex justify-between items-center text-[9px] font-mono py-1 border-b border-dashed border-white/5">
                                    <span style={{color:C.textM}}>Max Expected Loss (Stop)</span>
                                    <span style={{color:C.risk}} className="font-bold">-${Math.abs(simQty * (detailThesis.entryPrice - detailThesis.stopLoss)).toLocaleString(undefined, {maximumFractionDigits:2})}</span>
                                  </div>
                                  <div className="flex justify-between items-center text-[9px] font-mono py-1 border-b border-dashed border-white/5">
                                    <span style={{color:C.textM}}>Expected Profit (Target)</span>
                                    <span style={{color:C.profit}} className="font-bold">+${Math.abs(simQty * (detailThesis.targetPrice - detailThesis.entryPrice)).toLocaleString(undefined, {maximumFractionDigits:2})}</span>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Order Confirmation Block */}
                          <button
                            disabled={!detailThesis || executing}
                            onClick={() => detailThesis && handleExecuteLiveTrade(detailThesis, simQty)}
                            className="w-full py-3 rounded-xl font-bold tracking-[0.2em] text-[10px] uppercase transition-all shadow-lg hover:shadow-indigo-500/20 disabled:opacity-40 disabled:hover:shadow-none"
                            style={{
                              background: detailThesis?.direction === 'SHORT' 
                                ? `linear-gradient(135deg, ${C.risk} 0%, rgba(255,59,92,0.6) 100%)`
                                : `linear-gradient(135deg, ${C.profit} 0%, rgba(0,214,143,0.6) 100%)`,
                              color: '#FFF',
                            }}
                          >
                            Place Simulated {detailThesis?.direction || 'ORDER'}
                          </button>
                        </div>
                      </div>

                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-white/20 uppercase tracking-widest">
                        <AlertTriangle className="w-8 h-8 mb-2 opacity-30" />
                        Execution vectors offline for this session
                      </div>
                    )}
                  </div>
                )}
                
                {/* Float annotations over widget if detailThesis is provided */}
                {detailThesis && chartMode === 'tradingview' && (
                  <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10 pointer-events-none">
                    <div className="px-3 py-1.5 rounded-lg backdrop-blur-xl" style={{backgroundColor:'rgba(0,214,143,0.15)',border:`1px solid ${C.profit}40`}}>
                      <span className="text-[8px] font-bold uppercase tracking-widest" style={{color:C.profit}}>▲ AI ENTRY @ ${detailThesis.entryPrice.toFixed(2)}</span>
                    </div>
                    <div className="px-3 py-1.5 rounded-lg backdrop-blur-xl" style={{backgroundColor:'rgba(45,127,249,0.15)',border:`1px solid ${C.blue}40`}}>
                      <span className="text-[8px] font-bold uppercase tracking-widest" style={{color:C.blue}}>◎ TARGET @ ${detailThesis.targetPrice.toFixed(2)}</span>
                    </div>
                    <div className="px-3 py-1.5 rounded-lg backdrop-blur-xl" style={{backgroundColor:'rgba(255,59,92,0.15)',border:`1px solid ${C.risk}40`}}>
                      <span className="text-[8px] font-bold uppercase tracking-widest" style={{color:C.risk}}>▼ STOP LOSS @ ${detailThesis.stopLoss.toFixed(2)}</span>
                    </div>
                    {detailPrices && detailPrices.length > 2 && (() => {
                      const r = ((detailPrices[detailPrices.length-1]-detailPrices[detailPrices.length-2])/detailPrices[detailPrices.length-2]*100);
                      return (
                        <div className="px-3 py-1.5 rounded-lg backdrop-blur-xl" style={{backgroundColor:r>=0?'rgba(0,214,143,0.10)':'rgba(255,59,92,0.10)',border:`1px solid ${r>=0?C.profit:C.risk}40`}}>
                          <span className="text-[8px] font-bold uppercase tracking-widest" style={{color:r>=0?C.profit:C.risk}}>◆ 1D: {r>=0?'+':''}{r.toFixed(2)}%</span>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* ─── Bottom Report Section ─── */}
              <div className="shrink-0 border-t overflow-y-auto" style={{borderColor:C.border,backgroundColor:'rgba(6,9,17,0.95)',maxHeight:'30vh'}}>
                <div className="p-5 grid grid-cols-12 gap-4">
                  {/* Left: AI Narrative */}
                  <div className="col-span-7">
                    <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold mb-3 flex items-center gap-2" style={{color:C.textD}}>
                      <Brain className="w-3.5 h-3.5" style={{color:C.purple}} /> AI Trade Thesis — Natural Language Report
                    </h3>
                    <div className="space-y-2 text-[11px] leading-relaxed" style={{color:C.textM, fontFamily:FONT}}>
                      {detailThesis ? (
                        <>
                          <p>
                            <span className="font-bold" style={{color:C.textH}}>Position: </span>
                            The AI engine identified a <span style={{color:detailThesis.direction==='LONG'?C.profit:C.risk}} className="font-bold">{detailThesis.direction}</span> opportunity
                            on <span className="font-bold" style={{color:C.textH}}>{detailStock}</span> ({SECTOR[detailStock] || 'Other'} sector)
                            with <span className="font-bold" style={{color:C.profit}}>{(detailThesis.confidence*100).toFixed(0)}% conviction</span>.
                            Entry at <span className="font-mono font-bold" style={{color:C.textH}}>${detailThesis.entryPrice.toFixed(2)}</span>,
                            targeting <span className="font-mono font-bold" style={{color:C.profit}}>${detailThesis.targetPrice.toFixed(2)}</span>
                            ({((detailThesis.targetPrice - detailThesis.entryPrice) / detailThesis.entryPrice * 100).toFixed(1)}% upside)
                            with a stop loss at <span className="font-mono font-bold" style={{color:C.risk}}>${detailThesis.stopLoss.toFixed(2)}</span>.
                          </p>
                          {detailThesis.reasoning && (
                            <p>
                              <span className="font-bold" style={{color:C.textH}}>Thesis: </span>
                              {detailThesis.reasoning.replace(/[#*`]/g, '')}
                            </p>
                          )}
                          {detailThesis.validationMetrics && (
                            <p>
                              <span className="font-bold" style={{color:C.textH}}>Risk Profile: </span>
                              Expected Sharpe Ratio of <span className="font-mono font-bold" style={{color:C.profit}}>{detailThesis.validationMetrics.expectedSharpe.toFixed(2)}</span>,
                              VaR(95) at <span className="font-mono font-bold" style={{color:C.risk}}>{detailThesis.validationMetrics.var95.toFixed(2)}%</span>,
                              historical win rate <span className="font-mono font-bold" style={{color:C.warn}}>{(detailThesis.validationMetrics.winRate*100).toFixed(0)}%</span>.
                              {detailThesis.validationMetrics.kelly && ` Kelly fraction: ${(detailThesis.validationMetrics.kelly*100).toFixed(1)}%.`}
                            </p>
                          )}
                        </>
                      ) : (
                        <p>No thesis data available for this stock. The engine scanned it but no formal investment thesis was generated by the Alpha Council.</p>
                      )}
                      {detailFZ && (
                        <p>
                          <span className="font-bold" style={{color:C.textH}}>Factor Zoo: </span>
                          93-feature pipeline scored this stock at <span className="font-mono font-bold" style={{color:detailFZ.compositeScore>0.5?C.profit:C.warn}}>{(detailFZ.compositeScore*100).toFixed(1)}%</span> composite.
                          F-Score: <span className="font-mono font-bold" style={{color:C.purple}}>{detailFZ.clusters.quality.fScore}/9</span>,
                          Market Beta: <span className="font-mono font-bold" style={{color:C.cyan}}>{detailFZ.clusters.lowRisk.marketBeta.toFixed(3)}</span>,
                          Momentum (6M): <span className="font-mono font-bold" style={{color:C.warn}}>{(detailFZ.clusters.momentum.momentum6M*100).toFixed(1)}%</span>,
                          ROE: <span className="font-mono font-bold" style={{color:C.profit}}>{(detailFZ.clusters.profitability.roe12M*100).toFixed(1)}%</span>.
                          Data completeness: {detailFZ.dataCompleteness}%.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Key Metrics Grid */}
                  <div className="col-span-5 grid grid-cols-3 gap-2">
                    {detailPrices && detailPrices.length > 2 && <>
                      <div className="p-2 rounded-lg border" style={{borderColor:C.border,backgroundColor:'rgba(0,0,0,0.3)'}}>
                        <div className="text-[7px] uppercase tracking-widest" style={{color:C.textD}}>Last Price</div>
                        <div className="text-base font-mono font-black" style={{color:C.textH}}>${detailPrices[detailPrices.length-1].toFixed(2)}</div>
                      </div>
                      <div className="p-2 rounded-lg border" style={{borderColor:C.border,backgroundColor:'rgba(0,0,0,0.3)'}}>
                        <div className="text-[7px] uppercase tracking-widest" style={{color:C.textD}}>1d Return</div>
                        {(() => { const r = ((detailPrices[detailPrices.length-1]-detailPrices[detailPrices.length-2])/detailPrices[detailPrices.length-2]*100); return (
                          <div className="text-base font-mono font-black" style={{color:r>=0?C.profit:C.risk}}>{r>=0?'+':''}{r.toFixed(2)}%</div>
                        ); })()}
                      </div>
                      <div className="p-2 rounded-lg border" style={{borderColor:C.border,backgroundColor:'rgba(0,0,0,0.3)'}}>
                        <div className="text-[7px] uppercase tracking-widest" style={{color:C.textD}}>Data Points</div>
                        <div className="text-base font-mono font-black" style={{color:C.blue}}>{detailPrices.length}</div>
                      </div>
                    </>}
                    {detailFZ && <>
                      <div className="p-2 rounded-lg border" style={{borderColor:C.border,backgroundColor:'rgba(0,0,0,0.3)'}}>
                        <div className="text-[7px] uppercase tracking-widest" style={{color:C.textD}}>Composite</div>
                        <div className="text-base font-mono font-black" style={{color:detailFZ.compositeScore>0.5?C.profit:C.warn}}>{(detailFZ.compositeScore*100).toFixed(1)}%</div>
                      </div>
                      <div className="p-2 rounded-lg border" style={{borderColor:C.border,backgroundColor:'rgba(0,0,0,0.3)'}}>
                        <div className="text-[7px] uppercase tracking-widest" style={{color:C.textD}}>F-Score</div>
                        <div className="text-base font-mono font-black" style={{color:C.purple}}>{detailFZ.clusters.quality.fScore}/9</div>
                      </div>
                      <div className="p-2 rounded-lg border" style={{borderColor:C.border,backgroundColor:'rgba(0,0,0,0.3)'}}>
                        <div className="text-[7px] uppercase tracking-widest" style={{color:C.textD}}>Beta</div>
                        <div className="text-base font-mono font-black" style={{color:C.cyan}}>{detailFZ.clusters.lowRisk.marketBeta.toFixed(3)}</div>
                      </div>
                    </>}
                    {mlResult && <>
                      <div className="p-2 rounded-lg border" style={{borderColor:C.border,backgroundColor:'rgba(0,0,0,0.3)'}}>
                        <div className="text-[7px] uppercase tracking-widest" style={{color:C.textD}}>Sharpe</div>
                        <div className="text-base font-mono font-black" style={{color:mlResult.riskMetrics.sharpeRatio>1?C.profit:C.warn}}>{mlResult.riskMetrics.sharpeRatio.toFixed(2)}</div>
                      </div>
                      <div className="p-2 rounded-lg border" style={{borderColor:C.border,backgroundColor:'rgba(0,0,0,0.3)'}}>
                        <div className="text-[7px] uppercase tracking-widest" style={{color:C.textD}}>VaR(95)</div>
                        <div className="text-base font-mono font-black" style={{color:C.risk}}>{mlResult.riskMetrics.var95.toFixed(2)}%</div>
                      </div>
                      <div className="p-2 rounded-lg border" style={{borderColor:C.border,backgroundColor:'rgba(0,0,0,0.3)'}}>
                        <div className="text-[7px] uppercase tracking-widest" style={{color:C.textD}}>Regime</div>
                        <div className="text-base font-mono font-black" style={{color:mlResult.regime.regime==='BULL'?C.profit:mlResult.regime.regime==='BEAR'?C.risk:C.warn}}>{mlResult.regime.regime}</div>
                      </div>
                    </>}
                  </div>
                </div>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDashboard && selectedLiveThesis && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{ position: 'fixed', inset: 0, zIndex: 9999, background: C.bg }}
          >
            <LiveTradingDashboard 
              onClose={() => { setShowDashboard(false); setSelectedLiveThesis(null); }} 
              initialThesis={selectedLiveThesis} 
              initialQty={simQty}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
