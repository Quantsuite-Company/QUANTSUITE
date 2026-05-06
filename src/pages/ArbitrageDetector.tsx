import React, { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AlertTriangle, Zap, ShieldCheck, ShieldAlert, RotateCcw, TrendingUp, BarChart3, Layers, GitCompareArrows, ArrowLeftRight, Target, Search, Activity, ChevronRight, BookOpen } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer, ReferenceLine, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { calculateBlackScholes } from '@/lib/blackScholes';

/* ═══════════════ EQUITY DB ═══════════════ */
const EQDB: Record<string, { spot: number; iv: number; div: number; sector: string; name: string }> = {
  AAPL: { spot: 189.50, iv: 0.22, div: 0.005, sector: 'Tech', name: 'Apple Inc.' },
  MSFT: { spot: 420.30, iv: 0.20, div: 0.007, sector: 'Tech', name: 'Microsoft' },
  GOOGL: { spot: 175.80, iv: 0.24, div: 0.0, sector: 'Tech', name: 'Alphabet' },
  AMZN: { spot: 185.60, iv: 0.26, div: 0.0, sector: 'Tech', name: 'Amazon' },
  NVDA: { spot: 875.40, iv: 0.42, div: 0.001, sector: 'Tech', name: 'NVIDIA' },
  TSLA: { spot: 172.80, iv: 0.52, div: 0.0, sector: 'Auto', name: 'Tesla' },
  META: { spot: 505.20, iv: 0.28, div: 0.003, sector: 'Tech', name: 'Meta' },
  JPM: { spot: 198.40, iv: 0.18, div: 0.022, sector: 'Finance', name: 'JPMorgan' },
  BAC: { spot: 37.80, iv: 0.22, div: 0.025, sector: 'Finance', name: 'BofA' },
  V: { spot: 278.90, iv: 0.17, div: 0.007, sector: 'Finance', name: 'Visa' },
  JNJ: { spot: 155.60, iv: 0.14, div: 0.030, sector: 'Health', name: 'J&J' },
  UNH: { spot: 520.10, iv: 0.19, div: 0.014, sector: 'Health', name: 'UnitedHealth' },
  XOM: { spot: 112.40, iv: 0.21, div: 0.033, sector: 'Energy', name: 'Exxon' },
  WMT: { spot: 168.30, iv: 0.15, div: 0.013, sector: 'Retail', name: 'Walmart' },
  NFLX: { spot: 628.90, iv: 0.32, div: 0.0, sector: 'Media', name: 'Netflix' },
  AMD: { spot: 165.70, iv: 0.38, div: 0.0, sector: 'Tech', name: 'AMD' },
  COIN: { spot: 225.30, iv: 0.65, div: 0.0, sector: 'Crypto', name: 'Coinbase' },
  SPY: { spot: 520.40, iv: 0.13, div: 0.013, sector: 'ETF', name: 'S&P 500' },
  QQQ: { spot: 445.80, iv: 0.17, div: 0.006, sector: 'ETF', name: 'Nasdaq 100' },
  GS: { spot: 465.20, iv: 0.20, div: 0.021, sector: 'Finance', name: 'Goldman Sachs' },
  PLTR: { spot: 24.50, iv: 0.55, div: 0.0, sector: 'Tech', name: 'Palantir' },
};

function hash(t: string) { let h = 0; for (let i = 0; i < t.length; i++) h = ((h << 5) - h + t.charCodeAt(i)) | 0; return (Math.abs(h) % 1000) / 1000; }

interface P { S: number; K: number; T: number; r: number; sigma: number; q: number; callMkt: number; putMkt: number; K2: number; K3: number; }

function genParams(tk: string): P {
  const eq = EQDB[tk.toUpperCase()]; const h = hash(tk);
  const S = eq ? eq.spot : 50 + h * 200; const iv = eq ? eq.iv : 0.15 + h * 0.4; const dv = eq ? eq.div : h * 0.02;
  const K = Math.round(S * (0.97 + h * 0.06)); const K2 = K + Math.round(S * 0.05);
  const bs = calculateBlackScholes({ S, K, T: 0.25, r: 0.0525, sigma: iv, q: dv });
  const n = (h - 0.5) * 0.4;
  return { S, K, T: 0.25, r: 0.0525, sigma: iv, q: dv, callMkt: Math.max(0.01, +(bs.prices.call * (1 + n * 0.08)).toFixed(2)), putMkt: Math.max(0.01, +(bs.prices.put * (1 - n * 0.06)).toFixed(2)), K2, K3: K + 5 };
}

/* ═══════════════ MATH ENGINE ═══════════════ */
function chkPCP(p: P) { const l = p.callMkt - p.putMkt; const r = p.S * Math.exp(-p.q * p.T) - p.K * Math.exp(-p.r * p.T); const d = Math.abs(l - r); return { lhs: l, rhs: r, diff: d, isArb: d > 0.10, action: l > r ? 'Buy Put + Sell Call + Buy Stock' : 'Buy Call + Sell Put + Short Stock', profit: d }; }
function chkSF(p: P) { const s = p.callMkt - p.putMkt + p.K * Math.exp(-p.r * p.T); const a = p.S * Math.exp((p.r - p.q) * p.T); const d = Math.abs(s - a); return { syn: s, act: a, diff: d, isArb: d > 0.50, action: s > a ? 'Sell Synthetic, Buy Actual' : 'Buy Synthetic, Sell Actual', profit: d }; }
function chkBox(p: P) { const b1 = calculateBlackScholes({ S: p.S, K: p.K, T: p.T, r: p.r, sigma: p.sigma, q: p.q }); const b2 = calculateBlackScholes({ S: p.S, K: p.K2, T: p.T, r: p.r, sigma: p.sigma, q: p.q }); const c = (b1.prices.call - b2.prices.call) + (b2.prices.put - b1.prices.put); const v = (p.K2 - p.K) * Math.exp(-p.r * p.T); const d = Math.abs(c - v); return { cost: c, value: v, diff: d, isArb: d > 0.15, profit: d }; }
function chkCR(p: P) { const sl = p.callMkt - p.putMkt + p.K * Math.exp(-p.r * p.T); const cp = sl - p.S; const rp = p.S - sl; return { cp, rp, isArb: cp > 0.10 || rp > 0.10, type: cp > 0.10 ? 'Conversion' : 'Reversal', profit: Math.max(cp, rp) }; }
function chkBF(p: P) { const K1 = p.K - 5, K2 = p.K, K3 = p.K + 5; const b1 = calculateBlackScholes({ S: p.S, K: K1, T: p.T, r: p.r, sigma: p.sigma, q: p.q }); const b2 = calculateBlackScholes({ S: p.S, K: K2, T: p.T, r: p.r, sigma: p.sigma, q: p.q }); const b3 = calculateBlackScholes({ S: p.S, K: K3, T: p.T, r: p.r, sigma: p.sigma, q: p.q }); const c = b1.prices.call - 2 * b2.prices.call + b3.prices.call; return { cost: c, isArb: c < 0, K1, K2, K3, profit: c < 0 ? Math.abs(c) : 0 }; }
function chkCal(p: P) { return [0.08, 0.17, 0.25, 0.50, 0.75, 1.0].map(t => { const v = p.sigma * Math.sqrt(t) * (1 + (p.r - 0.03) * t) + (p.S - p.K) / p.K * 0.1; const nv = Math.max(0.05, Math.min(0.8, v)); const ev = p.sigma * (1 + t * 0.1); return { expiry: `${Math.round(t * 12)}M`, days: Math.round(t * 365), iv: nv * 100, expected: ev * 100, isAnomaly: Math.abs(nv - ev) > 0.05, t }; }); }

/* ═══════════════ CHART DATA ═══════════════ */
function genOverview(p: P) { return Array.from({ length: 50 }, (_, i) => { const st = p.S * (0.7 + i * 0.012); const c = Math.max(0, st - p.K) - p.callMkt; const pt = Math.max(0, p.K - st) - p.putMkt; const bf = Math.max(0, st - (p.K - 5)) - 2 * Math.max(0, st - p.K) + Math.max(0, st - (p.K + 5)); return { price: +st.toFixed(1), call: +c.toFixed(2), put: +pt.toFixed(2), straddle: +(c + pt).toFixed(2), butterfly: +bf.toFixed(2) }; }); }
function genParity(p: P) { return Array.from({ length: 35 }, (_, i) => { const s = p.S * (0.8 + i * 0.012); const l = p.callMkt - p.putMkt; const r = s * Math.exp(-p.q * p.T) - p.K * Math.exp(-p.r * p.T); return { spot: +s.toFixed(1), 'C − P': +l.toFixed(3), 'S·e − K·e': +r.toFixed(3), gap: +Math.abs(l - r).toFixed(3) }; }); }
function genSynFwd(p: P) { return Array.from({ length: 30 }, (_, i) => { const t = 0.01 + i * 0.035; const syn = p.callMkt - p.putMkt + p.K * Math.exp(-p.r * t); const act = p.S * Math.exp((p.r - p.q) * t); return { time: +t.toFixed(2), synthetic: +syn.toFixed(2), actual: +act.toFixed(2), gap: +Math.abs(syn - act).toFixed(3) }; }); }
function genBoxData(p: P) { return Array.from({ length: 20 }, (_, i) => { const k2 = p.K + 2 + i * 2; const b1 = calculateBlackScholes({ S: p.S, K: p.K, T: p.T, r: p.r, sigma: p.sigma, q: p.q }); const b2 = calculateBlackScholes({ S: p.S, K: k2, T: p.T, r: p.r, sigma: p.sigma, q: p.q }); const cost = (b1.prices.call - b2.prices.call) + (b2.prices.put - b1.prices.put); const val = (k2 - p.K) * Math.exp(-p.r * p.T); return { K2: k2, cost: +cost.toFixed(3), fairPV: +val.toFixed(3), edge: +(val - cost).toFixed(3) }; }); }
function genConvData(p: P) { return Array.from({ length: 30 }, (_, i) => { const s = p.S * (0.85 + i * 0.01); const sl = p.callMkt - p.putMkt + p.K * Math.exp(-p.r * p.T); return { spot: +s.toFixed(1), convProfit: +(sl - s).toFixed(3), revProfit: +(s - sl).toFixed(3) }; }); }
function genBFPayoff(p: P) { const K1 = p.K - 5, K3 = p.K + 5; const bfr = chkBF(p); return Array.from({ length: 40 }, (_, i) => { const st = p.S * (0.85 + i * 0.0075); const payo = Math.max(0, st - K1) - 2 * Math.max(0, st - p.K) + Math.max(0, st - K3); return { price: +st.toFixed(1), payoff: +payo.toFixed(3), net: +(payo - Math.abs(bfr.cost)).toFixed(3) }; }); }
function genGreeks(p: P) { return Array.from({ length: 25 }, (_, i) => { const s = p.S * (0.85 + i * 0.012); const bs = calculateBlackScholes({ S: s, K: p.K, T: p.T, r: p.r, sigma: p.sigma, q: p.q }); return { spot: +s.toFixed(1), delta: +bs.greeks.delta.call.toFixed(4), gamma: +(bs.greeks.gamma * 100).toFixed(4), vega: +bs.greeks.vega.toFixed(4), theta: +(bs.greeks.theta.call * 100).toFixed(4) }; }); }
function genRadar(checks: { name: string; isArb: boolean; profit: number }[]) { return checks.map(c => ({ strategy: c.name, risk: c.isArb ? Math.min(100, c.profit * 200 + 40) : 8 })); }

// HEATMAP: returns a 2D grid for CSS rendering
function genHeatmap(p: P) {
  const rows = 10, cols = 10;
  const grid: { spot: number; strike: number; pnl: number }[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: { spot: number; strike: number; pnl: number }[] = [];
    for (let c = 0; c < cols; c++) {
      const spot = p.S * (0.9 + r * 0.02);
      const strike = p.K * (0.9 + c * 0.02);
      const bs = calculateBlackScholes({ S: spot, K: strike, T: p.T, r: p.r, sigma: p.sigma, q: p.q });
      const pnl = bs.prices.call - p.callMkt;
      row.push({ spot: +spot.toFixed(0), strike: +strike.toFixed(0), pnl: +pnl.toFixed(2) });
    }
    grid.push(row);
  }
  return grid;
}

/* ═══════════════ PER-CHART EXPLANATIONS (retail-friendly) ═══════════════ */
function getExplanation(view: ChartView, tk: string, p: P, pcp: any, sf: any, box: any, cr: any, bf: any, cal: any[], theoBS: any): string {
  const name = EQDB[tk]?.name || tk;
  switch (view) {
    case 'overview':
      return `📊 This is your P&L overview for ${name} options. The green line shows your call option profit — you make money when ${tk} goes above the strike price ($${p.K}). The red line is your put — that profits when the stock drops. The dashed blue line is a straddle (buying both), which wins if the stock moves big in either direction. The yellow dotted butterfly profits when the stock stays near the strike. Right now, buying a call costs you $${p.callMkt} and a put costs $${p.putMkt}. You need ${tk} to move at least $${(p.callMkt + p.putMkt).toFixed(2)} for a straddle to break even.`;
    case 'pcp':
      return `⚖️ Put-Call Parity is a fundamental rule: Call − Put should equal Stock − PV(Strike). If these two don't match, there's free money. For ${name}: C−P = $${pcp.lhs.toFixed(3)} but the theoretical RHS = $${pcp.rhs.toFixed(3)}. The gap is $${pcp.diff.toFixed(3)}. ${pcp.isArb ? `🔴 That's a real violation! You could ${pcp.action} and pocket $${pcp.profit.toFixed(3)} per contract risk-free. In practice, transaction costs might eat part of this — but it's a signal worth watching.` : `✅ The gap is tiny — market makers are keeping this tight. No free lunch here, but the chart shows you how the parity equation behaves across different spot prices.`}`;
    case 'synfwd':
      return `🔄 The Synthetic Forward chart compares two ways to get exposure to ${name}: (1) the "synthetic" forward built from options: Call − Put + PV(Strike), and (2) the actual forward: Stock × e^(r−q)T. When these diverge, it means someone is mispricing options relative to the stock. Current synthetic = $${sf.syn.toFixed(2)}, actual = $${sf.act.toFixed(2)}, gap = $${sf.diff.toFixed(2)}. ${sf.isArb ? `🔴 This gap is large enough to trade! ${sf.action}. This is a classic institutional trade.` : `✅ They're tracking closely — the options market agrees with the stock market on where ${tk} should be.`}`;
    case 'box':
      return `📦 A Box Spread locks in a guaranteed payout at expiry regardless of where the stock goes. You buy a bull call spread and a bear put spread together. The chart scans different upper strikes to find where the Box price deviates from its fair present value (PV). For ${name}: box cost = $${box.cost.toFixed(2)}, fair PV = $${box.value.toFixed(2)}, edge = $${box.diff.toFixed(3)}. ${box.isArb ? `🔴 There's a mispricing! The box is ${box.cost < box.value ? 'cheap' : 'expensive'} — you can lock in risk-free profit.` : `✅ Fair pricing across the strikes. The bars show cost (blue) vs fair value (grey) — they're well-aligned.`}`;
    case 'conv':
      return `🔁 Conversion & Reversal are mirror strategies. A Conversion is: Short Stock + Long Call + Short Put. A Reversal is the opposite. If the synthetic stock (from options) is priced differently than the actual stock, you can lock in the difference. For ${name}: conversion P/L = $${cr.cp.toFixed(3)}, reversal P/L = $${cr.rp.toFixed(3)}. ${cr.isArb ? `🔴 The ${cr.type} is showing a live edge of $${cr.profit.toFixed(3)}. This is one of the safest arb trades because your risk is locked at entry.` : `✅ The synthetic and real stock are priced consistently. No edge here — the green/red lines hug zero across all spot prices.`}`;
    case 'butterfly':
      return `🦋 A Butterfly Spread profits when the stock expires near the middle strike. You buy call at K1=$${bf.K1}, sell 2× at K2=$${bf.K2}, buy at K3=$${bf.K3}. The blue area shows your payoff at expiry — it peaks at the middle strike. The red dashed line is your net P/L after cost. Current butterfly cost = $${bf.cost.toFixed(3)}. ${bf.isArb ? `🔴 NEGATIVE COST — you're getting PAID to enter this trade! That's free money. Max payoff is $${(bf.K2 - bf.K1).toFixed(0)} if ${tk} expires exactly at $${bf.K2}.` : `✅ The cost is positive (fair). Your max profit is $${(bf.K2 - bf.K1 - Math.abs(bf.cost)).toFixed(2)} if ${tk} lands right at $${bf.K2} at expiry.`}`;
    case 'calendar': {
      const anomCount = cal.filter(c => c.isAnomaly).length;
      return `📅 This chart shows how implied volatility (IV) changes across different expiration dates for ${name}. A smooth upward slope is "normal" — longer-dated options typically have higher IV. The blue area is the actual IV, and the white dashed line is what we'd expect based on the current ${(p.sigma * 100).toFixed(1)}% short-term IV. ${anomCount > 0 ? `🔴 ${anomCount} expiries show unusual IV — they're significantly above or below what the term structure predicts. This could mean the market is pricing in an upcoming event (earnings, FDA ruling, etc.).` : `✅ The term structure looks clean and smooth. No unusual spikes or kinks — the market isn't pricing in any surprise events.`}`;
    }
    case 'greeks':
      return `📐 Greeks tell you how your option's price will change. Delta (green) = how much the option moves per $1 stock move — closer to 1.0 means it behaves like owning the stock. Gamma (yellow) = how fast delta changes — high near the strike, meaning your position can flip quickly. Vega (blue) = sensitivity to volatility changes. Theta (red dashed) = time decay eating your premium daily. For ${name} at strike $${p.K}: your call delta is ${theoBS.greeks.delta.call.toFixed(3)} — for every $1 ${tk} moves up, your call gains ~$${theoBS.greeks.delta.call.toFixed(2)}.`;
    case 'heatmap':
      return `🗺️ This heatmap shows your call option P/L across a grid of different spot prices (rows) and strike prices (columns) for ${name}. Bright green = profitable trades, dark red = losses. The "warm" zone shows you exactly where the sweet spot is — where buying a call at today's market price of $${p.callMkt} would be profitable. Hover any cell to see the exact P/L. This gives you a bird's-eye view of how sensitive your position is to both the stock moving AND the strike you choose.`;
    case 'radar':
      return `🎯 The Risk Radar maps all 6 arbitrage strategies on a hexagonal chart for ${name}. Each axis represents one strategy — the further the red line extends, the stronger the signal. A flat, small shape means the market is well-priced with no opportunities. A spike means that strategy found a mispricing. Currently: ${checks.filter(c => c.isArb).length} of 6 strategies are showing signals. Use this as your "at-a-glance" dashboard to instantly see where the opportunities are before diving into individual charts.`;
    default: return '';
  }
}

type ChartView = 'overview' | 'pcp' | 'synfwd' | 'box' | 'conv' | 'butterfly' | 'calendar' | 'greeks' | 'heatmap' | 'radar';
// Need checks in scope for radar explanation
let checks: { name: string; isArb: boolean; profit: number }[] = [];

/* ═══════════════ COMPONENT ═══════════════ */
export default function ArbitrageDetector() {
  const [tickerInput, setTickerInput] = useState('');
  const [ticker, setTicker] = useState('AAPL');
  const [params, setParams] = useState<P>(() => genParams('AAPL'));
  const [view, setView] = useState<ChartView>('overview');
  const [hoveredCell, setHoveredCell] = useState<{ spot: number; strike: number; pnl: number } | null>(null);

  const selectTicker = useCallback((t: string) => { const u = t.toUpperCase().trim(); if (!u) return; setTicker(u); setParams(genParams(u)); setTickerInput(''); }, []);
  const tickers = Object.keys(EQDB);
  const filtered = tickerInput.length > 0 ? tickers.filter(t => t.includes(tickerInput.toUpperCase()) || EQDB[t].name.toLowerCase().includes(tickerInput.toLowerCase())) : [];
  const update = useCallback((k: string, v: number) => setParams(p => ({ ...p, [k]: v })), []);
  const reset = useCallback(() => { setParams(genParams(ticker)); setView('overview'); }, [ticker]);

  const pcp = useMemo(() => chkPCP(params), [params]);
  const sf = useMemo(() => chkSF(params), [params]);
  const box = useMemo(() => chkBox(params), [params]);
  const cr = useMemo(() => chkCR(params), [params]);
  const bf = useMemo(() => chkBF(params), [params]);
  const cal = useMemo(() => chkCal(params), [params]);
  const theoBS = useMemo(() => calculateBlackScholes({ S: params.S, K: params.K, T: params.T, r: params.r, sigma: params.sigma, q: params.q }), [params]);

  checks = [
    { name: 'Put-Call Parity', isArb: pcp.isArb, profit: pcp.profit },
    { name: 'Synth Forward', isArb: sf.isArb, profit: sf.diff },
    { name: 'Box Spread', isArb: box.isArb, profit: box.profit },
    { name: cr.type, isArb: cr.isArb, profit: cr.profit },
    { name: 'Butterfly', isArb: bf.isArb, profit: bf.profit },
    { name: 'Calendar IV', isArb: cal.some(c => c.isAnomaly), profit: 0 },
  ];
  const anyArb = checks.some(c => c.isArb);
  const totalProfit = checks.reduce((s, c) => s + c.profit, 0);

  const overviewData = useMemo(() => genOverview(params), [params]);
  const parityData = useMemo(() => genParity(params), [params]);
  const synFwdData = useMemo(() => genSynFwd(params), [params]);
  const boxData = useMemo(() => genBoxData(params), [params]);
  const convData = useMemo(() => genConvData(params), [params]);
  const bfPayoff = useMemo(() => genBFPayoff(params), [params]);
  const greeksData = useMemo(() => genGreeks(params), [params]);
  const heatmapGrid = useMemo(() => genHeatmap(params), [params]);
  const radarData = useMemo(() => genRadar(checks), [checks]);
  const explanation = useMemo(() => getExplanation(view, ticker, params, pcp, sf, box, cr, bf, cal, theoBS), [view, ticker, params, pcp, sf, box, cr, bf, cal, theoBS]);

  const eq = EQDB[ticker];
  const ts = { backgroundColor: '#0a0a0c', border: '1px solid #ffffff20', borderRadius: '6px', fontFamily: 'monospace', fontSize: '10px' };
  const configs = [
    { key: 'S', label: 'SPOT', step: 0.5 }, { key: 'K', label: 'STRIKE', step: 1 }, { key: 'T', label: 'T(Y)', step: 0.01 },
    { key: 'r', label: 'RATE', step: 0.001 }, { key: 'sigma', label: 'IV', step: 0.005 }, { key: 'q', label: 'DIV', step: 0.001 },
    { key: 'callMkt', label: 'MKT C', step: 0.01 }, { key: 'putMkt', label: 'MKT P', step: 0.01 }, { key: 'K2', label: 'K2', step: 1 },
  ];

  const viewTitles: Record<ChartView, string> = {
    overview: 'PAYOFF & STRATEGY P/L', pcp: 'PUT-CALL PARITY EQUATION', synfwd: 'SYNTHETIC FORWARD CONVERGENCE',
    box: 'BOX SPREAD EDGE SCANNER', conv: 'CONVERSION / REVERSAL P/L', butterfly: 'BUTTERFLY PAYOFF AT EXPIRY',
    calendar: 'IV TERM STRUCTURE', greeks: 'GREEKS SENSITIVITY', heatmap: 'P/L HEATMAP — SPOT × STRIKE', radar: 'RISK RADAR — ALL STRATEGIES',
  };

  // Heatmap color
  const heatColor = (pnl: number) => {
    if (pnl > 2) return '#00ff88';
    if (pnl > 1) return '#00ff88cc';
    if (pnl > 0.5) return '#00ff8888';
    if (pnl > 0) return '#00ff8844';
    if (pnl > -0.5) return '#ff444444';
    if (pnl > -1) return '#ff444488';
    if (pnl > -2) return '#ff4444cc';
    return '#ff4444';
  };

  const renderChart = () => {
    switch (view) {
      case 'overview': return (
        <ResponsiveContainer width="100%" height="100%"><AreaChart data={overviewData}>
          <defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#00ff88" stopOpacity={0.3} /><stop offset="100%" stopColor="#00ff88" stopOpacity={0} /></linearGradient><linearGradient id="pg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ff4444" stopOpacity={0.3} /><stop offset="100%" stopColor="#ff4444" stopOpacity={0} /></linearGradient></defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" /><XAxis dataKey="price" stroke="#ffffff25" tick={{ fontSize: 9, fill: '#ffffff35' }} /><YAxis stroke="#ffffff25" tick={{ fontSize: 9, fill: '#ffffff35' }} /><RTooltip contentStyle={ts} />
          <ReferenceLine y={0} stroke="#ffffff15" strokeDasharray="5 5" /><ReferenceLine x={params.K} stroke="#ffaa00" strokeDasharray="3 3" label={{ value: `K=${params.K}`, fill: '#ffaa00', fontSize: 9 }} />
          <Area type="monotone" dataKey="call" stroke="#00ff88" strokeWidth={2} fill="url(#cg)" dot={false} name="Call P/L" /><Area type="monotone" dataKey="put" stroke="#ff4444" strokeWidth={2} fill="url(#pg)" dot={false} name="Put P/L" />
          <Line type="monotone" dataKey="straddle" stroke="#00d5ff" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="Straddle" /><Line type="monotone" dataKey="butterfly" stroke="#ffaa00" strokeWidth={1} strokeDasharray="2 2" dot={false} name="Butterfly" />
        </AreaChart></ResponsiveContainer>
      );
      case 'pcp': return (
        <ResponsiveContainer width="100%" height="100%"><AreaChart data={parityData}>
          <defs><linearGradient id="gapG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ffaa00" stopOpacity={0.4} /><stop offset="100%" stopColor="#ffaa00" stopOpacity={0} /></linearGradient></defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" /><XAxis dataKey="spot" stroke="#ffffff25" tick={{ fontSize: 9, fill: '#ffffff35' }} /><YAxis stroke="#ffffff25" tick={{ fontSize: 9, fill: '#ffffff35' }} /><RTooltip contentStyle={ts} />
          <Line type="monotone" dataKey="C − P" stroke="#00ff88" strokeWidth={2} dot={false} /><Line type="monotone" dataKey="S·e − K·e" stroke="#ff4444" strokeWidth={2} dot={false} />
          <Area type="monotone" dataKey="gap" stroke="#ffaa00" fill="url(#gapG)" strokeWidth={1.5} dot={false} name="Gap" />
        </AreaChart></ResponsiveContainer>
      );
      case 'synfwd': return (
        <ResponsiveContainer width="100%" height="100%"><LineChart data={synFwdData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" /><XAxis dataKey="time" stroke="#ffffff25" tick={{ fontSize: 9, fill: '#ffffff35' }} /><YAxis stroke="#ffffff25" tick={{ fontSize: 9, fill: '#ffffff35' }} /><RTooltip contentStyle={ts} />
          <Line type="monotone" dataKey="synthetic" stroke="#00d5ff" strokeWidth={2} dot={false} name="Synthetic Fwd" /><Line type="monotone" dataKey="actual" stroke="#ff4444" strokeWidth={2} dot={false} name="Actual Fwd" />
          <Line type="monotone" dataKey="gap" stroke="#ffaa00" strokeWidth={1} strokeDasharray="4 4" dot={false} name="Gap" />
        </LineChart></ResponsiveContainer>
      );
      case 'box': return (
        <ResponsiveContainer width="100%" height="100%"><BarChart data={boxData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} /><XAxis dataKey="K2" stroke="#ffffff25" tick={{ fontSize: 9, fill: '#ffffff35' }} /><YAxis stroke="#ffffff25" tick={{ fontSize: 9, fill: '#ffffff35' }} /><RTooltip contentStyle={ts} />
          <Bar dataKey="cost" fill="#00d5ff" fillOpacity={0.6} radius={[3, 3, 0, 0]} name="Box Cost" /><Bar dataKey="fairPV" fill="#ffffff" fillOpacity={0.12} radius={[3, 3, 0, 0]} name="Fair PV" />
          <Line type="monotone" dataKey="edge" stroke="#00ff88" strokeWidth={2} dot={false} name="Edge" />
        </BarChart></ResponsiveContainer>
      );
      case 'conv': return (
        <ResponsiveContainer width="100%" height="100%"><AreaChart data={convData}>
          <defs><linearGradient id="cvG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#00ff88" stopOpacity={0.3} /><stop offset="100%" stopColor="#00ff88" stopOpacity={0} /></linearGradient></defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" /><XAxis dataKey="spot" stroke="#ffffff25" tick={{ fontSize: 9, fill: '#ffffff35' }} /><YAxis stroke="#ffffff25" tick={{ fontSize: 9, fill: '#ffffff35' }} /><RTooltip contentStyle={ts} />
          <ReferenceLine y={0} stroke="#ffffff15" strokeDasharray="5 5" /><Area type="monotone" dataKey="convProfit" stroke="#00ff88" fill="url(#cvG)" strokeWidth={2} dot={false} name="Conversion" />
          <Line type="monotone" dataKey="revProfit" stroke="#ff4444" strokeWidth={2} dot={false} name="Reversal" />
        </AreaChart></ResponsiveContainer>
      );
      case 'butterfly': return (
        <ResponsiveContainer width="100%" height="100%"><AreaChart data={bfPayoff}>
          <defs><linearGradient id="bfG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#00d5ff" stopOpacity={0.4} /><stop offset="100%" stopColor="#00d5ff" stopOpacity={0} /></linearGradient></defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" /><XAxis dataKey="price" stroke="#ffffff25" tick={{ fontSize: 9, fill: '#ffffff35' }} /><YAxis stroke="#ffffff25" tick={{ fontSize: 9, fill: '#ffffff35' }} /><RTooltip contentStyle={ts} />
          <ReferenceLine y={0} stroke="#ffffff15" strokeDasharray="5 5" /><ReferenceLine x={params.K} stroke="#ffaa00" strokeDasharray="3 3" />
          <Area type="monotone" dataKey="payoff" stroke="#00d5ff" fill="url(#bfG)" strokeWidth={2} dot={false} name="Payoff" /><Line type="monotone" dataKey="net" stroke="#ff4444" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="Net P/L" />
        </AreaChart></ResponsiveContainer>
      );
      case 'calendar': return (
        <ResponsiveContainer width="100%" height="100%"><AreaChart data={cal}>
          <defs><linearGradient id="ivG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#00d5ff" stopOpacity={0.4} /><stop offset="100%" stopColor="#00d5ff" stopOpacity={0} /></linearGradient></defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" /><XAxis dataKey="expiry" stroke="#ffffff25" tick={{ fontSize: 9, fill: '#ffffff35' }} /><YAxis stroke="#ffffff25" tick={{ fontSize: 9, fill: '#ffffff35' }} tickFormatter={v => `${v}%`} /><RTooltip contentStyle={ts} />
          <Area type="monotone" dataKey="iv" stroke="#00d5ff" fill="url(#ivG)" strokeWidth={2} dot={{ r: 4, fill: '#0a0a0c', stroke: '#00d5ff', strokeWidth: 2 }} name="IV %" />
          <Line type="monotone" dataKey="expected" stroke="#ffffff" strokeWidth={1} strokeDasharray="6 3" dot={false} name="Expected" />
        </AreaChart></ResponsiveContainer>
      );
      case 'greeks': return (
        <ResponsiveContainer width="100%" height="100%"><LineChart data={greeksData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" /><XAxis dataKey="spot" stroke="#ffffff25" tick={{ fontSize: 9, fill: '#ffffff35' }} /><YAxis yAxisId="l" stroke="#00ff88" tick={{ fontSize: 9, fill: '#00ff88' }} /><YAxis yAxisId="r" orientation="right" stroke="#ffaa00" tick={{ fontSize: 9, fill: '#ffaa00' }} /><RTooltip contentStyle={ts} />
          <ReferenceLine x={params.S} stroke="#ffffff20" strokeDasharray="3 3" yAxisId="l" />
          <Line yAxisId="l" type="monotone" dataKey="delta" stroke="#00ff88" strokeWidth={2} dot={false} name="Δ Delta" /><Line yAxisId="r" type="monotone" dataKey="gamma" stroke="#ffaa00" strokeWidth={2} dot={false} name="Γ Gamma×100" />
          <Line yAxisId="r" type="monotone" dataKey="vega" stroke="#00d5ff" strokeWidth={1.5} dot={false} name="ν Vega" /><Line yAxisId="r" type="monotone" dataKey="theta" stroke="#ff4444" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="Θ Theta×100" />
        </LineChart></ResponsiveContainer>
      );
      case 'heatmap': return (
        <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-2" onMouseLeave={() => setHoveredCell(null)}>
          <div className="text-[9px] text-white/30 uppercase tracking-widest mb-1">← Strike →</div>
          <div className="flex items-center gap-2">
            <div className="text-[9px] text-white/30 uppercase tracking-widest [writing-mode:vertical-rl] rotate-180">← Spot →</div>
            <div className="relative">
              <div className="flex mb-1 ml-1">
                {heatmapGrid[0]?.map((cell, ci) => (
                  <div key={ci} className="w-[38px] text-center text-[7px] text-white/30">{cell.strike}</div>
                ))}
              </div>
              {heatmapGrid.map((row, ri) => (
                <div key={ri} className="flex items-center">
                  <div className="w-8 text-[7px] text-white/30 text-right pr-1">{row[0].spot}</div>
                  {row.map((cell, ci) => {
                    const isHovered = hoveredCell?.spot === cell.spot && hoveredCell?.strike === cell.strike;
                    return (
                      <div
                        key={ci}
                        onMouseEnter={() => setHoveredCell(cell)}
                        className={`w-[38px] h-[28px] border flex items-center justify-center text-[7px] font-mono transition-all cursor-crosshair ${isHovered ? 'scale-[1.6] z-20 border-white ring-2 ring-white/30 shadow-lg shadow-white/10 rounded' : 'border-black/50 hover:scale-110 hover:z-10 hover:border-white/30'}`}
                        style={{ backgroundColor: heatColor(cell.pnl) }}
                      >
                        <span className={`${Math.abs(cell.pnl) > 0.5 ? 'text-black/80 font-bold' : 'text-white/50'}`}>{cell.pnl > 0 ? '+' : ''}{cell.pnl.toFixed(1)}</span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          {/* HOVER DETAIL PANEL */}
          {hoveredCell ? (
            <div className="mt-2 w-full max-w-md bg-black/90 border border-white/10 rounded-lg p-3 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: heatColor(hoveredCell.pnl) }} />
                  <span className="text-xs font-bold tracking-widest">{hoveredCell.pnl > 0 ? '🟢 PROFITABLE' : '🔴 LOSING'} POSITION</span>
                </div>
                <span className={`text-lg font-mono font-bold ${hoveredCell.pnl > 0 ? 'text-[#00ff88]' : 'text-[#ff4444]'}`}>{hoveredCell.pnl > 0 ? '+' : ''}${hoveredCell.pnl.toFixed(2)}</span>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-2">
                <div><div className="text-[8px] text-white/25 uppercase">Spot Price</div><div className="text-sm text-white/80">${hoveredCell.spot}</div></div>
                <div><div className="text-[8px] text-white/25 uppercase">Strike</div><div className="text-sm text-white/80">${hoveredCell.strike}</div></div>
                <div><div className="text-[8px] text-white/25 uppercase">Mkt Call Cost</div><div className="text-sm text-white/80">${params.callMkt.toFixed(2)}</div></div>
              </div>
              <div className="text-[10px] text-white/45 leading-relaxed border-t border-white/5 pt-2">
                {hoveredCell.pnl > 1 ? `💰 Strong profit zone. If ${ticker} trades at $${hoveredCell.spot} with this $${hoveredCell.strike} strike call, you'd net $${hoveredCell.pnl.toFixed(2)} per contract after the $${params.callMkt.toFixed(2)} premium. This is a high-conviction area.` :
                 hoveredCell.pnl > 0 ? `📈 Marginal profit. The call barely covers the premium you paid. You'd make $${hoveredCell.pnl.toFixed(2)} — but slippage and commissions could eat this. Consider a tighter strike.` :
                 hoveredCell.pnl > -1 ? `📉 Small loss territory. At spot $${hoveredCell.spot} and strike $${hoveredCell.strike}, the option is still near the money but the $${params.callMkt.toFixed(2)} premium isn't fully recovered. Time decay will make this worse.` :
                 `🔴 Deep loss. The stock at $${hoveredCell.spot} is too far from your $${hoveredCell.strike} strike for the call to have value. You'd lose most of your $${params.callMkt.toFixed(2)} premium. Avoid this zone.`}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-[#ff4444]" /><span className="text-[8px] text-white/30">Deep Loss</span></div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-[#ff444444]" /><span className="text-[8px] text-white/30">Small Loss</span></div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-[#00ff8844]" /><span className="text-[8px] text-white/30">Small Gain</span></div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-[#00ff88]" /><span className="text-[8px] text-white/30">Deep Gain</span></div>
              <span className="text-[8px] text-white/20 ml-2">← Hover any cell for details</span>
            </div>
          )}
        </div>
      );
      case 'radar': return (
        <ResponsiveContainer width="100%" height="100%"><RadarChart data={radarData} cx="50%" cy="50%">
          <PolarGrid stroke="#ffffff10" /><PolarAngleAxis dataKey="strategy" stroke="#ffffff40" tick={{ fontSize: 9, fill: '#ffffff60' }} /><PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#ffffff10" tick={{ fontSize: 8, fill: '#ffffff30' }} />
          <Radar name="Risk" dataKey="risk" stroke="#ff4444" fill="#ff4444" fillOpacity={0.2} strokeWidth={2} />
        </RadarChart></ResponsiveContainer>
      );
    }
  };

  const stratCards: { id: ChartView; name: string; icon: any; isArb: boolean; sub: string; badge: string }[] = [
    { id: 'pcp', name: 'Put-Call Parity', icon: ArrowLeftRight, isArb: pcp.isArb, badge: pcp.isArb ? 'VIOLATION' : 'PASS', sub: `Δ${pcp.diff.toFixed(3)}` },
    { id: 'synfwd', name: 'Synth Forward', icon: GitCompareArrows, isArb: sf.isArb, badge: sf.isArb ? 'DIVERGE' : 'ALIGNED', sub: `Gap $${sf.diff.toFixed(2)}` },
    { id: 'box', name: 'Box Spread', icon: Layers, isArb: box.isArb, badge: box.isArb ? 'MISPRICED' : 'FAIR', sub: `Edge $${box.diff.toFixed(3)}` },
    { id: 'conv', name: cr.type, icon: Target, isArb: cr.isArb, badge: cr.isArb ? 'ACTIVE' : 'NONE', sub: `P/L $${cr.profit.toFixed(3)}` },
    { id: 'butterfly', name: 'Butterfly', icon: BarChart3, isArb: bf.isArb, badge: bf.isArb ? 'FREE $' : 'FAIR', sub: `Cost $${bf.cost.toFixed(3)}` },
    { id: 'calendar', name: 'Calendar IV', icon: TrendingUp, isArb: cal.some(c => c.isAnomaly), badge: `${cal.filter(c => c.isAnomaly).length} anom`, sub: `${cal.length} terms` },
  ];

  return (
    <TooltipProvider>
      <div className="relative h-[calc(100vh-3.5rem)] w-full bg-[#09090b] text-white overflow-hidden font-mono flex flex-col">

        {/* ══ COMMAND DECK ══ */}
        <div className="flex-none bg-black/60 border-b border-white/10 flex items-center px-4 z-20 backdrop-blur-md shrink-0 py-1.5 gap-2 flex-wrap">
          <div className="flex items-center gap-2 border-r border-white/10 pr-3 mr-1">
            <AlertTriangle className="h-4 w-4 text-[#ff4444]" />
            <div className="text-[9px] font-bold tracking-widest leading-tight"><span className="text-[#ff4444]">ARB_SCANNER</span><br /><span className="text-white/30 font-light">6-STRATEGY</span></div>
          </div>
          <div className="relative">
            <div className="flex items-center bg-white/5 border border-white/10 rounded px-2 py-0.5 gap-1 w-44">
              <Search className="w-3 h-3 text-white/30" />
              <input type="text" value={tickerInput} onChange={e => setTickerInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && selectTicker(tickerInput)} placeholder={`${ticker} · ${eq?.name || 'Search...'}`} className="bg-transparent text-[11px] text-white w-full outline-none placeholder:text-white/25" />
            </div>
            {filtered.length > 0 && <div className="absolute top-full mt-1 left-0 w-56 bg-[#111] border border-white/10 rounded-lg shadow-2xl z-50 max-h-44 overflow-y-auto">{filtered.map(t => <button key={t} onClick={() => selectTicker(t)} className="w-full px-3 py-1.5 text-left text-[10px] hover:bg-white/5 flex justify-between"><span className="font-bold">{t}</span><span className="text-white/25">{EQDB[t].name} ${EQDB[t].spot}</span></button>)}</div>}
          </div>
          <div className="flex gap-0.5">{['AAPL', 'NVDA', 'TSLA', 'SPY', 'COIN', 'GS'].map(t => <button key={t} onClick={() => selectTicker(t)} className={`px-1.5 py-0.5 text-[8px] rounded border transition-all ${ticker === t ? 'bg-[#ff4444]/20 border-[#ff4444]/40 text-[#ff4444]' : 'border-white/10 text-white/30 hover:bg-white/5'}`}>{t}</button>)}</div>
          <div className="flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {configs.map(c => <div key={c.key} className="flex flex-col min-w-[58px]"><span className="text-[7px] uppercase tracking-widest text-[#ffaa00]">{c.label}</span><input type="number" className="bg-white/5 border border-white/10 text-white text-[10px] px-1 py-0 rounded w-full focus:outline-none focus:border-[#ffaa00] font-mono h-5" value={params[c.key as keyof P]} onChange={e => update(c.key, parseFloat(e.target.value) || 0)} step={c.step} /></div>)}
          </div>
          <Button variant="outline" size="icon" onClick={reset} className="bg-transparent border-white/10 text-white/40 hover:bg-white/5 shrink-0 h-6 w-6"><RotateCcw className="h-3 w-3" /></Button>
        </div>

        {/* ══ MAIN ══ */}
        <div className="flex-1 flex min-h-0">

          {/* LEFT: CHART + EXPLANATION */}
          <div className="flex-1 relative p-3 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#ff444406] via-black to-[#09090b] flex flex-col h-full">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />
            <div className="relative z-10 flex-1 flex flex-col h-full min-h-0">
              {/* Header + quick buttons */}
              <div className="flex justify-between items-center mb-2 shrink-0">
                <div className="text-[9px] tracking-widest text-white/40 uppercase flex items-center gap-1.5"><Activity className="w-3 h-3" /> {ticker} · {viewTitles[view]}</div>
                <div className="flex gap-1">
                  {(['overview', 'greeks', 'heatmap', 'radar'] as ChartView[]).map(v => (
                    <button key={v} onClick={() => setView(v)} className={`px-2 py-0.5 text-[8px] uppercase rounded border transition-all ${view === v ? 'bg-white/10 border-white/20 text-white' : 'border-white/5 text-white/25 hover:bg-white/5'}`}>{v === 'overview' ? 'P&L' : v}</button>
                  ))}
                </div>
              </div>

              {/* Chart area */}
              <div className="flex-1 bg-black/40 border border-white/10 rounded-xl p-3 relative backdrop-blur-sm min-h-0">
                {renderChart()}
              </div>

              {/* AUTO EXPLANATION — always visible */}
              <div className="shrink-0 mt-2 bg-white/[0.02] border border-white/5 rounded-lg px-4 py-2.5 max-h-24 overflow-y-auto">
                <div className="flex items-start gap-2">
                  <BookOpen className="w-3.5 h-3.5 text-[#00d5ff] mt-0.5 shrink-0" />
                  <p className="text-[10px] text-white/50 leading-relaxed">{explanation}</p>
                </div>
              </div>
            </div>
          </div>

          {/* ══ RIGHT HUD ══ */}
          <div className="w-64 shrink-0 border-l border-white/10 bg-black/80 backdrop-blur-xl flex flex-col h-full overflow-y-auto no-scrollbar">

            {/* Verdict */}
            <div className={`p-3 border-b border-white/10 shrink-0 ${anyArb ? 'bg-gradient-to-br from-[#ff4444]/10 to-transparent' : 'bg-gradient-to-br from-[#00ff88]/10 to-transparent'}`}>
              <div className="flex items-center gap-2 mb-1">
                {anyArb ? <ShieldAlert className="w-4 h-4 text-[#ff4444]" /> : <ShieldCheck className="w-4 h-4 text-[#00ff88]" />}
                <span className={`text-[9px] uppercase tracking-widest font-bold ${anyArb ? 'text-[#ff4444]' : 'text-[#00ff88]'}`}>{anyArb ? 'ARBITRAGE DETECTED' : 'EFFICIENT'}</span>
              </div>
              {anyArb && <div className="text-xl font-light tracking-tighter text-[#ff4444]">+${totalProfit.toFixed(3)}<span className="text-[8px] text-white/25 ml-1">/CONTRACT</span></div>}
              <div className="text-[8px] text-white/25 mt-0.5">{checks.filter(c => c.isArb).length}/{checks.length} triggered</div>
            </div>

            {/* Theo */}
            <div className="p-3 border-b border-white/10 shrink-0 grid grid-cols-2 gap-2">
              <div><div className="text-[7px] text-white/20 uppercase">CALL THEO</div><div className="text-base font-light text-[#00ff88]">${theoBS.prices.call.toFixed(2)}</div><div className="text-[7px] text-white/15">MKT ${params.callMkt}</div></div>
              <div><div className="text-[7px] text-white/20 uppercase">PUT THEO</div><div className="text-base font-light text-[#ff4444]">${theoBS.prices.put.toFixed(2)}</div><div className="text-[7px] text-white/15">MKT ${params.putMkt}</div></div>
            </div>

            {/* CLICKABLE STRATEGIES */}
            <div className="p-2 flex-1">
              <div className="text-[8px] uppercase tracking-widest text-primary mb-2 flex items-center gap-1 border-b border-primary/20 pb-1"><Zap className="w-2.5 h-2.5" /> Click Strategy → Chart + Explanation</div>
              <div className="space-y-1">
                {stratCards.map(s => (
                  <button key={s.id} onClick={() => setView(s.id)} className={`w-full p-2 rounded-lg border text-left transition-all group ${view === s.id ? 'border-white/20 bg-white/[0.06] ring-1 ring-white/10' : s.isArb ? 'border-[#ff4444]/20 bg-[#ff4444]/5 hover:bg-[#ff4444]/10' : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.04]'}`}>
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] uppercase tracking-widest text-white/50 flex items-center gap-1"><s.icon className="w-2.5 h-2.5" />{s.name}</span>
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className={`text-[7px] h-3.5 px-1 ${s.isArb ? 'text-[#ff4444] border-[#ff4444]/30' : 'text-[#00ff88] border-[#00ff88]/30'}`}>{s.badge}</Badge>
                        <ChevronRight className={`w-2.5 h-2.5 transition-transform ${view === s.id ? 'text-white rotate-90' : 'text-white/20 group-hover:text-white/40'}`} />
                      </div>
                    </div>
                    <div className="text-[8px] font-mono text-white/25 mt-0.5">{s.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-2 border-t border-white/10 bg-black text-[7px] text-white/20 tracking-[0.15em] uppercase shrink-0">
              LIVE · 6 STRATEGIES · SELF-CONTAINED<br />CLICK ANY STRATEGY → CHART + INSIGHT
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
