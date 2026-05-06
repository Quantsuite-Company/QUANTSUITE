import React, { useState, useEffect } from 'react';
import { useTradeStore } from '@/stores/useTradeStore';
import { computePnL, computeRiskReward, computeDistances } from '@/lib/LiveTradingEngine';

const F = '"Times New Roman", Times, serif';
const C = { green: '#10b981', red: '#ef4444', warn: '#f59e0b', blue: '#3b82f6', text: '#fff', dim: '#a3a3a3', bg: '#050505', border: '#1a1a1a' };

function ConvictionGauge({ value }: { value: number }) {
  const zone = value < 30 ? C.red : value < 60 ? C.warn : C.green;
  return (
    <div style={{ position: 'relative', width: '100%', height: 180 }}>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 180, background: '#0a0a0c', borderRadius: 4, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${value}%`, background: `linear-gradient(to top, ${zone}22, ${zone}44)`, borderTop: `2px solid ${zone}`, transition: 'height 0.5s ease' }} />
        {[30, 60].map(t => (
          <div key={t} style={{ position: 'absolute', bottom: `${t}%`, left: 0, right: 0, borderTop: '1px dashed #333', height: 0 }}>
            <span style={{ position: 'absolute', right: 4, top: -10, fontSize: 8, color: '#525252' }}>{t}%</span>
          </div>
        ))}
      </div>
      <div style={{ position: 'absolute', left: '50%', bottom: `${value}%`, transform: 'translate(-50%, 50%)', fontSize: 18, fontWeight: 700, color: zone, fontFamily: 'monospace', textShadow: `0 0 10px ${zone}55` }}>
        {value.toFixed(0)}%
      </div>
      {value < 30 && (
        <div style={{ position: 'absolute', bottom: -26, left: 0, right: 0, textAlign: 'center', fontSize: 8, color: C.warn, letterSpacing: 1, animation: 'pulse 2s infinite' }}>
          ⚠ CONVICTION WEAKENING
        </div>
      )}
    </div>
  );
}

export default function TradeRightPanel() {
  const trade = useTradeStore(s => s.activeTrade);
  const price = useTradeStore(s => s.currentPrice);
  const conviction = useTradeStore(s => s.conviction);
  const signals = useTradeStore(s => s.signalHealth);
  const closeTrade = useTradeStore(s => s.closeTrade);
  const addToPosition = useTradeStore(s => s.addToPosition);
  const setTradeState = useTradeStore(s => s.setTradeState);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!trade) return;
    const iv = setInterval(() => setElapsed(Math.floor((Date.now() - trade.openTime) / 1000)), 1000);
    return () => clearInterval(iv);
  }, [trade?.openTime]);

  if (!trade || trade.status === 'IDLE' || trade.status === 'ENTERING') return null;

  const { pnl, pnlPercent } = computePnL(trade.entryPrice, price, trade.quantity, trade.direction);
  const rr = computeRiskReward(trade.entryPrice, price, trade.targetPrice, trade.stopLoss, trade.direction);
  const { distTarget } = computeDistances(price, trade.targetPrice, trade.stopLoss);
  const isProfitable = pnl >= 0;
  const pnlColor = isProfitable ? C.green : C.red;

  const handleClose = () => {
    closeTrade(price, isProfitable ? 'WIN' : 'LOSS');
    setTimeout(() => setTradeState('POST_ANALYSIS'), 3000);
  };
  const handleAdd = () => addToPosition(Math.floor(trade.quantity * 0.25));

  const sectionStyle = { background: C.bg, border: `1px solid ${C.border}`, borderRadius: 4, padding: '14px 16px', marginBottom: 8 };
  const labelStyle = { fontSize: 9, color: '#525252', letterSpacing: 1.5, marginBottom: 6 } as const;

  return (
    <div style={{ width: 260, flexShrink: 0, fontFamily: F, display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* SECTION 1: LIVE P&L */}
      <div style={{ ...sectionStyle, textAlign: 'center' }}>
        <div style={labelStyle}>UNREALIZED P&L</div>
        <div style={{ fontSize: 32, fontWeight: 700, color: pnlColor, fontFamily: 'monospace', textShadow: `0 0 15px ${pnlColor}33`, lineHeight: 1 }}>
          {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}
        </div>
        <div style={{ fontSize: 13, color: pnlColor, fontFamily: 'monospace', marginTop: 4 }}>
          {pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
        </div>
      </div>

      {/* SECTION 2: TRADE STATS */}
      <div style={sectionStyle}>
        <div style={labelStyle}>TRADE STATISTICS</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { l: 'Duration', v: `${Math.floor(elapsed / 60)}m ${elapsed % 60}s` },
            { l: 'Shares', v: trade.quantity.toLocaleString() },
            { l: 'R/R Live', v: `${rr.toFixed(2)}x` },
            { l: 'To Target', v: `$${distTarget.toFixed(2)}` },
          ].map(s => (
            <div key={s.l}>
              <div style={{ fontSize: 8, color: '#525252', letterSpacing: 1 }}>{s.l.toUpperCase()}</div>
              <div style={{ fontSize: 13, color: C.text, fontFamily: 'monospace' }}>{s.v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: CONVICTION GAUGE */}
      <div style={sectionStyle}>
        <div style={labelStyle}>AI CONVICTION</div>
        <ConvictionGauge value={conviction} />
      </div>

      {/* SECTION 4: SIGNAL HEALTH */}
      <div style={sectionStyle}>
        <div style={labelStyle}>SIGNAL HEALTH</div>
        {signals.length === 0 ? (
          <div style={{ fontSize: 11, color: '#525252' }}>Computing signals...</div>
        ) : signals.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: i < signals.length - 1 ? '1px solid #111' : 'none' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.status === 'green' ? C.green : s.status === 'amber' ? C.warn : C.red, boxShadow: `0 0 4px ${s.status === 'green' ? C.green : s.status === 'amber' ? C.warn : C.red}55` }} />
            <div style={{ flex: 1, fontSize: 11, color: C.dim }}>{s.name}</div>
            <div style={{ fontSize: 11, color: C.text, fontFamily: 'monospace' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* SECTION 5: CONTROLS */}
      <div style={sectionStyle}>
        <div style={labelStyle}>EMERGENCY CONTROLS</div>
        <button onClick={handleClose} style={{
          width: '100%', padding: '10px 0', background: 'rgba(239,68,68,0.12)', border: `1px solid ${C.red}`,
          borderRadius: 3, color: C.red, fontSize: 11, fontWeight: 700, letterSpacing: 1.5, cursor: 'pointer', fontFamily: F, marginBottom: 6,
        }}>
          CLOSE NOW — TAKE P&L
        </button>
        <button onClick={handleAdd} style={{
          width: '100%', padding: '10px 0', background: 'rgba(59,130,246,0.08)', border: `1px solid ${C.border}`,
          borderRadius: 3, color: C.blue, fontSize: 11, fontWeight: 700, letterSpacing: 1.5, cursor: 'pointer', fontFamily: F,
        }}>
          ADD TO POSITION (+25%)
        </button>
      </div>
    </div>
  );
}
