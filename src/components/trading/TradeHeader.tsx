import React, { useState, useEffect } from 'react';
import { useTradeStore } from '@/stores/useTradeStore';

const F = '"Times New Roman", Times, serif';
const C = { bg: '#000', border: '#1a1a1a', text: '#fff', dim: '#a3a3a3', blue: '#3b82f6', green: '#10b981', red: '#ef4444', warn: '#f59e0b' };

export default function TradeHeader() {
  const trade = useTradeStore(s => s.activeTrade);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!trade || trade.status === 'IDLE') return;
    const iv = setInterval(() => {
      setElapsed(Math.floor((Date.now() - trade.openTime) / 1000));
    }, 1000);
    return () => clearInterval(iv);
  }, [trade?.openTime, trade?.status]);

  if (!trade || trade.status === 'IDLE') return null;

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const isShort = trade.direction === 'SHORT';

  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 100, background: '#050505',
      borderBottom: `1px solid ${C.border}`, padding: '10px 20px',
      display: 'flex', alignItems: 'center', gap: 24, fontFamily: F,
    }}>
      {/* Ticker */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 22, fontWeight: 700, color: C.text, letterSpacing: 1 }}>{trade.ticker}</span>
        <span style={{
          padding: '3px 10px', borderRadius: 3, fontSize: 11, fontWeight: 700, letterSpacing: 1,
          background: isShort ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
          color: isShort ? C.red : C.green, border: `1px solid ${isShort ? C.red : C.green}`,
        }}>{trade.direction}</span>
      </div>

      {/* Price levels */}
      {[
        { label: 'ENTRY', value: trade.entryPrice, color: C.blue },
        { label: 'TARGET', value: trade.targetPrice, color: C.green },
        { label: 'STOP', value: trade.stopLoss, color: C.red },
      ].map(p => (
        <div key={p.label} style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 9, color: C.dim, letterSpacing: 1.5 }}>{p.label}</div>
          <div style={{ fontSize: 14, color: p.color, fontWeight: 600, fontFamily: 'monospace' }}>
            ${p.value.toFixed(2)}
          </div>
        </div>
      ))}

      {/* Confidence */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 9, color: C.dim, letterSpacing: 1.5 }}>CONVICTION</div>
        <div style={{ fontSize: 14, color: C.warn, fontWeight: 600 }}>{trade.confidence.toFixed(0)}%</div>
      </div>

      {/* Timer */}
      <div style={{ textAlign: 'center', marginLeft: 'auto' }}>
        <div style={{ fontSize: 9, color: C.dim, letterSpacing: 1.5 }}>DURATION</div>
        <div style={{ fontSize: 16, color: C.text, fontWeight: 600, fontFamily: 'monospace' }}>{fmt(elapsed)}</div>
      </div>

      {/* Paper trade label */}
      <div style={{
        fontSize: 9, color: C.dim, opacity: 0.4, letterSpacing: 1.5,
        position: 'absolute', right: 20, top: 4,
      }}>
        PAPER TRADE — NO REAL ORDERS PLACED
      </div>
    </div>
  );
}
