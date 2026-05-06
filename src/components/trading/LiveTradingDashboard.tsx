import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Bell, Wallet, X, AlertCircle, Crosshair, Target, ShieldAlert, Activity, Cpu, Clock } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Cell, PieChart, Pie } from 'recharts';
import { useTradeStore } from '@/stores/useTradeStore';
import { InvestmentThesis } from '@/stores/useSwarmStore';
import { fetchHistoricalCandles, fetchLatestPrice, isMarketOpen, computeSignalHealth, generateTradeCommentary } from '@/lib/LiveTradingEngine';
import LiveTradingChart from './LiveTradingChart';

// ─── DESIGN TOKENS (Golden Execution Terminal) ───
const C = {
  bg: '#050505',
  panel: '#0a0a0c',
  border: '#2a2a2a',
  textH: '#ffffff',
  textM: '#a3a3a3',
  textD: '#525252',
  gold: '#D4AF37', // The primary accent color from screenshot
  goldDim: 'rgba(212, 175, 55, 0.1)',
  red: '#ff4444',
  redDim: 'rgba(255, 68, 68, 0.1)',
  green: '#00C853',
  greenDim: 'rgba(0, 200, 83, 0.1)',
};

const F = '"Times New Roman", Times, serif';
const F_MONO = '"Courier New", Courier, monospace';

interface Props {
  onClose: () => void;
  initialThesis: InvestmentThesis;
  initialQty: number;
}

export default function LiveTradingDashboard({ onClose, initialThesis, initialQty }: Props) {
  const store = useTradeStore();
  const trade = store.activeTrade;

  // ─── LOCAL STATE (Pre-Trade) ───
  const [allocation, setAllocation] = useState(initialQty);
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentPrice, setCurrentPrice] = useState(initialThesis?.entryPrice || 0);
  const [historicalCandles, setHistoricalCandles] = useState<any[]>([]);

  if (!initialThesis) {
    return <div style={{ background: C.bg, height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.red }}>Error: No thesis provided</div>;
  }


  // Derived metrics
  const notional = allocation * currentPrice;
  const marginReq = notional * 0.2; // 5x leverage assumption
  const maxLoss = allocation * Math.abs(currentPrice - initialThesis.stopLoss);
  const targetProfit = allocation * Math.abs(initialThesis.targetPrice - currentPrice);
  const rr = targetProfit / (maxLoss || 1);

  // ─── INIT ───
  useEffect(() => {
    // Reset store on mount just in case
    if (store.activeTrade) {
      store.closeTrade(0, 'LOSS');
    }

    
    // Fetch initial data
    async function init() {
      const price = await fetchLatestPrice(initialThesis.symbol);
      if (price) setCurrentPrice(price);
      
      const candles = await fetchHistoricalCandles(initialThesis.symbol);
      setHistoricalCandles(candles);
    }
    init();
  }, [initialThesis.symbol]);

  // ─── EXECUTION HANDLER ───
  const executeTrade = async () => {
    setLoading(true);
    try {
      const livePrice = await fetchLatestPrice(initialThesis.symbol) || currentPrice;
      const direction = initialThesis.direction;
      const target = initialThesis.targetPrice;
      const stop = initialThesis.stopLoss;

      store.openTrade({
        ticker: initialThesis.symbol, 
        direction, 
        entryPrice: livePrice, 
        targetPrice: target, 
        stopLoss: stop,
        confidence: initialThesis.confidence, 
        quantity: allocation,
        reasoning: initialThesis.reasoning,
        strategyName: 'Golden Terminal Swarm',
      });

      store.setPriceHistory(historicalCandles);
      store.updatePrice(livePrice);
      store.setMarketOpen(isMarketOpen());

      const mockFactors = {
        ticker: initialThesis.symbol, prices: [], volumes: [],
        momentum6M: direction === 'LONG' ? 0.08 : -0.08,
        rsi14: direction === 'LONG' ? 45 : 55,
        sharpe: initialThesis.validationMetrics?.expectedSharpe || 1.5,
        beta: 1.2, volatility: 0.25, fScore: 6, roe: 0.1, peRatio: 20, fcfYield: 0.05, revenueGrowth: 0.1, netMargin: 0.1, bookLeverage: 0.5
      };

      const signals = computeSignalHealth(mockFactors as any, direction);
      store.setSignalHealth(signals);

      generateTradeCommentary(
        initialThesis.symbol, direction, livePrice, target, stop,
        initialThesis.confidence, initialThesis.reasoning,
        'Golden Terminal', signals,
      ).then(c => store.setCommentary(c)).catch(() => {});

      setIsLive(true);
      setTimeout(() => store.setTradeState('LIVE'), 2000);
    } catch (e) {
      console.error(e);
      alert('Execution engine failed to connect.');
    } finally {
      setLoading(false);
    }
  };

  // ─── MOCK DATA FOR CHARTS ───
  const radarData = [
    { subject: 'Momentum', A: 80, fullMark: 100 },
    { subject: 'Value', A: 60, fullMark: 100 },
    { subject: 'Quality', A: 90, fullMark: 100 },
    { subject: 'Volatility', A: 40, fullMark: 100 },
    { subject: 'Sentiment', A: 75, fullMark: 100 },
  ];

  const topSignals = [
    { name: 'MOM_6M', z: -1.8, color: C.red },
    { name: 'PE_RATIO', z: -2.1, color: C.red },
    { name: 'VOL_20D', z: 0.9, color: C.gold },
    { name: 'RSI_14D', z: -3.1, color: C.red },
    { name: 'MACD_H', z: -1.2, color: C.red },
    { name: 'SKEW', z: 1.4, color: C.gold },
  ];

  const gaugeData = [
    { name: 'Fill', value: initialThesis.confidence, fill: C.gold },
    { name: 'Empty', value: 100 - initialThesis.confidence, fill: '#1a1a1a' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: F, color: C.textH, display: 'flex', flexDirection: 'column' }}>
      
      {/* ─── HEADER ─── */}
      <div style={{ height: 50, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', padding: '0 24px', justifyContent: 'space-between', background: '#000' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: C.gold, letterSpacing: 2 }}>QUANTSUITE</div>
          <div style={{ fontSize: 10, color: C.textD, letterSpacing: 1, textTransform: 'uppercase' }}>
            RESEARCH &gt; {initialThesis.symbol} &gt; 
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: C.panel, padding: '4px 12px', borderRadius: 4, border: `1px solid ${C.border}` }}>
            <span style={{ fontSize: 14, fontWeight: 'bold' }}>{initialThesis.symbol}</span>
            <span style={{ fontSize: 12, color: C.gold, fontFamily: F_MONO }}>${currentPrice.toFixed(2)} (+0.63%)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: initialThesis.direction === 'LONG' ? C.green : C.red }} />
            <span style={{ fontSize: 11, fontWeight: 'bold', letterSpacing: 1, color: C.textH }}>{initialThesis.direction}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, color: C.textD }}>CONF:</span>
            <div style={{ width: 60, height: 4, background: '#1a1a1a', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ width: `${initialThesis.confidence}%`, height: '100%', background: C.gold }} />
            </div>
            <span style={{ fontSize: 10, color: C.gold, fontFamily: F_MONO }}>{initialThesis.confidence.toFixed(0)}%</span>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ fontSize: 11, color: C.textD, letterSpacing: 1 }}>
            EQUITY: <span style={{ color: C.gold, fontFamily: F_MONO, fontWeight: 'bold', fontSize: 12 }}>$1,000,000</span>
          </div>
          <div style={{ fontSize: 10, color: C.gold, letterSpacing: 1, borderLeft: `1px solid ${C.border}`, paddingLeft: 24, display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 4, height: 12, background: C.gold }} />
            CONNECTED (IC MARKETS)
          </div>
          <div style={{ display: 'flex', gap: 16, color: C.textM, borderLeft: `1px solid ${C.border}`, paddingLeft: 24 }}>
            <Wallet size={16} />
            <Bell size={16} />
            <Settings size={16} />
            <X size={18} style={{ cursor: 'pointer', color: C.red }} onClick={onClose} />
          </div>
        </div>
      </div>

      {/* ─── MAIN CONTENT ─── */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        
        {/* LEFT COLUMN (Chart & Radar) */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 16, gap: 16 }}>
          
          {/* Chart Header Tabs */}
          <div style={{ display: 'flex', gap: 8 }}>
            {['15M', '1H', '4H', '1D', '1W'].map(t => (
              <div key={t} style={{ 
                padding: '4px 8px', fontSize: 10, border: `1px solid ${t === '1D' ? C.gold : C.border}`, 
                color: t === '1D' ? C.gold : C.textM, cursor: 'pointer' 
              }}>
                {t}
              </div>
            ))}
            <div style={{ marginLeft: 'auto', background: C.panel, border: `1px solid ${C.border}`, padding: '4px 12px', fontSize: 11, color: C.textD, display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: 8 }}>Q</span> Compare Asset...
            </div>
          </div>

          {/* TradingView Chart Area */}
          <div style={{ flex: 1, position: 'relative', border: `1px solid ${C.border}`, background: '#000', overflow: 'hidden' }}>
            <LiveTradingChart 
              candles={isLive && store.priceHistory.length > 0 ? store.priceHistory : historicalCandles} 
              currentPrice={isLive ? store.currentPrice : currentPrice}
              entryPrice={initialThesis.entryPrice}
              targetPrice={initialThesis.targetPrice}
              stopLoss={initialThesis.stopLoss}
              direction={initialThesis.direction}
              isLive={isLive}
              height={500}
            />
            {/* Overlay rectangles to simulate the design's specific risk/reward fill */}
            {!isLive && (
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.15, zIndex: 1 }}>
                <div style={{ 
                  position: 'absolute', width: '100%', 
                  top: '20%', height: '30%', background: initialThesis.direction === 'LONG' ? C.red : C.green 
                }} />
                <div style={{ 
                  position: 'absolute', width: '100%', 
                  top: '50%', height: '30%', background: initialThesis.direction === 'LONG' ? C.green : C.red 
                }} />
              </div>
            )}
          </div>

          {/* Bottom Stats Row */}
          <div style={{ height: 220, display: 'flex', gap: 16 }}>
            {/* Trade Thesis */}
            <div style={{ flex: 1, border: `1px solid ${C.border}`, background: C.panel, padding: 16, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 'bold', letterSpacing: 1 }}>TRADE THESIS</span>
                <span style={{ fontSize: 10, background: initialThesis.direction === 'SHORT' ? C.redDim : 'transparent', color: initialThesis.direction === 'SHORT' ? C.red : C.textD, padding: '2px 6px' }}>BEAR CASE</span>
                <span style={{ fontSize: 10, background: initialThesis.direction === 'LONG' ? C.greenDim : 'transparent', color: initialThesis.direction === 'LONG' ? C.green : C.textD, padding: '2px 6px' }}>BULL CASE</span>
              </div>
              <div style={{ fontSize: 11, color: C.textM, lineHeight: 1.6, flex: 1, overflowY: 'auto' }}>
                {initialThesis.reasoning}
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 12, paddingTop: 12, borderTop: `1px dashed ${C.border}` }}>
                <div>
                  <div style={{ fontSize: 8, color: C.textD, letterSpacing: 1 }}>SHARPE</div>
                  <div style={{ fontSize: 12, color: C.gold, fontFamily: F_MONO, fontWeight: 'bold' }}>{initialThesis.validationMetrics?.expectedSharpe?.toFixed(2) || '1.82'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 8, color: C.textD, letterSpacing: 1 }}>VAR (95%)</div>
                  <div style={{ fontSize: 12, color: C.red, fontFamily: F_MONO, fontWeight: 'bold' }}>-2.26%</div>
                </div>
              </div>
            </div>

            {/* Agent Radar */}
            <div style={{ flex: 1, border: `1px solid ${C.border}`, background: C.panel, padding: 16, display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 12, fontWeight: 'bold', letterSpacing: 1 }}>AGENT RADAR</span>
              <div style={{ flex: 1 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid stroke={C.border} />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: C.textD, fontSize: 9 }} />
                    <Radar name="Score" dataKey="A" stroke={C.gold} fill={C.goldDim} fillOpacity={0.6} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ alignSelf: 'flex-end', fontSize: 10, border: `1px solid ${C.border}`, padding: '4px 8px' }}>
                <span style={{ color: C.textD }}>SCORE:</span> <span style={{ color: C.textH, fontFamily: F_MONO }}>64.3</span>
              </div>
            </div>

            {/* Top Signals */}
            <div style={{ flex: 1, border: `1px solid ${C.border}`, background: C.panel, padding: 16 }}>
              <span style={{ fontSize: 12, fontWeight: 'bold', letterSpacing: 1, display: 'block', marginBottom: 16 }}>TOP SIGNALS</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {topSignals.map(s => (
                  <div key={s.name} style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontSize: 9, color: C.textM, width: 60 }}>{s.name}</span>
                    <div style={{ flex: 1, height: 4, background: '#1a1a1a', position: 'relative' }}>
                      {s.z < 0 ? (
                        <div style={{ position: 'absolute', right: '50%', width: `${Math.min(50, Math.abs(s.z)*10)}%`, height: '100%', background: s.color }} />
                      ) : (
                        <div style={{ position: 'absolute', left: '50%', width: `${Math.min(50, Math.abs(s.z)*10)}%`, height: '100%', background: s.color }} />
                      )}
                    </div>
                    <span style={{ fontSize: 10, color: s.color, width: 40, textAlign: 'right', fontFamily: F_MONO }}>
                      {s.z > 0 ? '+' : ''}{s.z}z
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (Execution Panel) */}
        <div style={{ width: 400, borderLeft: `1px solid ${C.border}`, background: '#0a0a0c', padding: 24, display: 'flex', flexDirection: 'column', gap: 32 }}>
          
          {/* Position Sizing */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 'bold', letterSpacing: 1, marginBottom: 16 }}>POSITION SIZING</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 }}>
              <span style={{ fontSize: 9, color: C.textD, letterSpacing: 1 }}>ALLOCATION</span>
              <span style={{ fontSize: 16, color: C.gold, fontFamily: F_MONO, fontWeight: 'bold' }}>{allocation.toLocaleString()} SHARES</span>
            </div>
            <input 
              type="range" min={10} max={5000} step={10} 
              value={allocation} 
              onChange={e => !isLive && setAllocation(+e.target.value)}
              disabled={isLive}
              style={{ width: '100%', accentColor: C.gold, marginBottom: 8 }} 
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: C.textD, fontFamily: F_MONO, marginBottom: 24 }}>
              <span>10</span>
              <span>5,000</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div style={{ border: `1px solid ${C.border}`, padding: 12 }}>
                <div style={{ fontSize: 8, color: C.textD, letterSpacing: 1, marginBottom: 4 }}>NOTIONAL</div>
                <div style={{ fontSize: 13, fontFamily: F_MONO, fontWeight: 'bold' }}>${notional.toLocaleString()}</div>
              </div>
              <div style={{ border: `1px solid ${C.border}`, padding: 12 }}>
                <div style={{ fontSize: 8, color: C.textD, letterSpacing: 1, marginBottom: 4 }}>MARGIN REQ</div>
                <div style={{ fontSize: 13, fontFamily: F_MONO, fontWeight: 'bold' }}>${marginReq.toLocaleString()}</div>
              </div>
              <div style={{ border: `1px solid ${C.border}`, padding: 12 }}>
                <div style={{ fontSize: 8, color: C.textD, letterSpacing: 1, marginBottom: 4 }}>RISK/REWARD</div>
                <div style={{ fontSize: 13, color: C.gold, fontFamily: F_MONO, fontWeight: 'bold' }}>1 : {rr.toFixed(2)}</div>
              </div>
              <div style={{ border: `1px solid ${C.border}`, padding: 12 }}>
                <div style={{ fontSize: 8, color: C.textD, letterSpacing: 1, marginBottom: 4 }}>MAX LOSS</div>
                <div style={{ fontSize: 13, color: C.red, fontFamily: F_MONO, fontWeight: 'bold' }}>-${maxLoss.toLocaleString(undefined, {maximumFractionDigits:0})}</div>
              </div>
              <div style={{ border: `1px solid ${C.border}`, padding: 12, gridColumn: 'span 2' }}>
                <div style={{ fontSize: 8, color: C.textD, letterSpacing: 1, marginBottom: 4 }}>EXPECTED PROFIT (TARGET)</div>
                <div style={{ fontSize: 13, color: C.gold, fontFamily: F_MONO, fontWeight: 'bold' }}>+${targetProfit.toLocaleString(undefined, {maximumFractionDigits:0})}</div>
              </div>
            </div>
          </div>

          {/* AI Conviction */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 'bold', letterSpacing: 1, marginBottom: 16 }}>AI CONVICTION</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <div style={{ width: 100, height: 100, position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={gaugeData} innerRadius={35} outerRadius={45} startAngle={90} endAngle={-270} dataKey="value" stroke="none" />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 18, color: C.gold, fontFamily: F_MONO, fontWeight: 'bold' }}>{initialThesis.confidence}%</span>
                  <span style={{ fontSize: 8, color: C.textD }}>{initialThesis.direction === 'SHORT' ? 'SELL' : 'BUY'}</span>
                </div>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {['Momentum', 'Mean Rev', 'Macro', 'Flow'].map(n => (
                  <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 9, color: C.textM, width: 50 }}>{n}</span>
                    <div style={{ flex: 1, height: 4, background: '#1a1a1a' }}>
                      <div style={{ width: `${Math.random()*60+20}%`, height: '100%', background: C.goldDim }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Invalidation Triggers */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 'bold', letterSpacing: 1, marginBottom: 16 }}>INVALIDATION TRIGGERS</div>
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ flex: 2, border: `1px solid ${C.border}`, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 10, color: C.textM, display: 'flex', alignItems: 'center', gap: 6 }}><div style={{width:4,height:4,background:C.textD,borderRadius:2}}/> Price &gt; Stop (${initialThesis.stopLoss.toFixed(2)})</div>
                <div style={{ fontSize: 10, color: C.textM, display: 'flex', alignItems: 'center', gap: 6 }}><div style={{width:4,height:4,background:C.textD,borderRadius:2}}/> RSI_14D &gt; 70</div>
                <div style={{ fontSize: 10, color: C.textM, display: 'flex', alignItems: 'center', gap: 6 }}><div style={{width:4,height:4,background:C.textD,borderRadius:2}}/> VIX &lt; 12.0</div>
                <div style={{ fontSize: 10, color: C.textM, display: 'flex', alignItems: 'center', gap: 6 }}><div style={{width:4,height:4,background:C.textD,borderRadius:2}}/> Momentum Flips Bullish</div>
                <div style={{ fontSize: 10, color: C.red, display: 'flex', alignItems: 'center', gap: 6 }}><div style={{width:4,height:4,background:C.red,borderRadius:2}}/> Yield Inversion Resolves</div>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ border: `1px solid ${C.border}`, padding: 8 }}>
                  <div style={{ fontSize: 7, color: C.textD }}>LEVERAGE</div>
                  <div style={{ fontSize: 11, fontFamily: F_MONO }}>1.4x</div>
                </div>
                <div style={{ border: `1px solid ${C.border}`, padding: 8 }}>
                  <div style={{ fontSize: 7, color: C.textD }}>VAR (LIMIT)</div>
                  <div style={{ fontSize: 11, color: C.red, fontFamily: F_MONO }}>94%</div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {!isLive ? (
              <button 
                onClick={executeTrade}
                disabled={loading}
                style={{ 
                  width: '100%', padding: '16px 0', background: initialThesis.direction === 'LONG' ? C.green : C.red, 
                  color: '#fff', border: 'none', fontWeight: 'bold', letterSpacing: 2, fontSize: 12, cursor: 'pointer',
                  display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, opacity: loading ? 0.5 : 1
                }}>
                <Activity size={16} />
                {loading ? 'EXECUTING...' : `PLACE SIMULATED ${initialThesis.direction}`}
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <button 
                  onClick={() => store.closeTrade(store.currentPrice)}
                  style={{ 
                    flex: 1, padding: '16px 0', background: '#333', color: '#fff', border: 'none', 
                    fontWeight: 'bold', letterSpacing: 2, fontSize: 12, cursor: 'pointer' 
                  }}>
                  CLOSE POSITION
                </button>
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ flex: 1, padding: '10px 0', background: 'transparent', border: `1px solid ${C.border}`, color: C.textM, fontSize: 10, cursor: 'pointer' }}>SET ALERT</button>
              <button style={{ flex: 1, padding: '10px 0', background: 'transparent', border: `1px solid ${C.border}`, color: C.textM, fontSize: 10, cursor: 'pointer' }}>PAPER TRADE</button>
            </div>
          </div>

        </div>
      </div>

      {/* ─── FOOTER ─── */}
      <div style={{ height: 32, borderTop: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', padding: '0 24px', justifyContent: 'space-between', fontSize: 10, background: '#000' }}>
        <div style={{ color: isLive ? (trade?.status === 'LIVE' ? (trade.entryPrice && store.currentPrice > trade.entryPrice ? C.green : C.red) : C.gold) : C.gold, fontFamily: F_MONO }}>
          <Activity size={12} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
          P&L: {isLive && trade?.entryPrice ? (() => {
            const diff = (store.currentPrice - trade.entryPrice) * (initialThesis.direction==='LONG'?1:-1);
            return `${diff >= 0 ? '+' : ''}${(diff * trade.quantity).toFixed(2)} (${(diff/trade.entryPrice*100).toFixed(2)}%)`;
          })() : '+$0.00 (+0.00%)'}
        </div>
        <div style={{ color: C.textM }}>
          <Clock size={12} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
          SESSION: 04:12:05
        </div>
        <div style={{ color: C.textM, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>((•)) AGENTS: 6 ONLINE</span>
          <div style={{ display: 'flex', gap: 2 }}>
            {[1,2,3,4,5,6].map(i => <div key={i} style={{ width: 6, height: 6, background: C.gold }} />)}
          </div>
        </div>
        <div style={{ border: `1px solid ${C.border}`, padding: '2px 8px', color: C.textD, letterSpacing: 1 }}>
          <Monitor size={10} style={{ display: 'inline', marginRight: 4 }} /> SIMULATED
        </div>
      </div>
    </div>
  );
}

// Simple Monitor icon inline since I forgot to import it
function Monitor(props: any) {
  return <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>;
}
