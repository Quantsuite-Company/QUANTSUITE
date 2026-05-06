import React, { useState, useEffect, useRef } from 'react';
import { useTradeStore } from '@/stores/useTradeStore';
import { computePnL, computeDistances } from '@/lib/LiveTradingEngine';

const F = '"Times New Roman", Times, serif';

function FlashNumber({ value, format, prefix = '', suffix = '' }: { value: number; format: (v: number) => string; prefix?: string; suffix?: string }) {
  const [flash, setFlash] = useState<'green' | 'red' | null>(null);
  const prevRef = useRef(value);

  useEffect(() => {
    if (prevRef.current !== value) {
      setFlash(value > prevRef.current ? 'green' : 'red');
      prevRef.current = value;
      const t = setTimeout(() => setFlash(null), 400);
      return () => clearTimeout(t);
    }
  }, [value]);

  const color = flash === 'green' ? '#10b981' : flash === 'red' ? '#ef4444' : value >= 0 ? '#10b981' : '#ef4444';
  const glow = flash ? `0 0 8px ${flash === 'green' ? 'rgba(16,185,129,0.5)' : 'rgba(239,68,68,0.5)'}` : 'none';

  return (
    <span style={{ color, fontFamily: 'monospace', fontWeight: 700, fontSize: 15, textShadow: glow, transition: 'all 0.3s' }}>
      {prefix}{format(value)}{suffix}
    </span>
  );
}

export default function TradeScoreboard() {
  const trade = useTradeStore(s => s.activeTrade);
  const currentPrice = useTradeStore(s => s.currentPrice);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!trade) return;
    const iv = setInterval(() => setElapsed(Math.floor((Date.now() - trade.openTime) / 1000)), 1000);
    return () => clearInterval(iv);
  }, [trade?.openTime]);

  if (!trade || trade.status === 'IDLE' || trade.status === 'ENTERING') return null;

  const { pnl, pnlPercent } = computePnL(trade.entryPrice, currentPrice, trade.quantity, trade.direction);
  const { distTarget, distTargetPct, distStop, distStopPct } = computeDistances(currentPrice, trade.targetPrice, trade.stopLoss);

  const cells = [
    { label: 'CURRENT PRICE', value: currentPrice, fmt: (v: number) => `$${v.toFixed(2)}`, pfx: '' },
    { label: 'UNREALIZED P&L', value: pnl, fmt: (v: number) => `${v >= 0 ? '+' : ''}$${v.toFixed(2)}`, pfx: '' },
    { label: 'P&L %', value: pnlPercent, fmt: (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`, pfx: '' },
    { label: 'DIST. TO TARGET', value: distTarget, fmt: (v: number) => `$${v.toFixed(2)} (${distTargetPct.toFixed(1)}%)`, pfx: '' },
    { label: 'DIST. TO STOP', value: distStop, fmt: (v: number) => `$${v.toFixed(2)} (${distStopPct.toFixed(1)}%)`, pfx: '' },
    { label: 'TRADE DURATION', value: elapsed, fmt: (v: number) => `${Math.floor(v/60)}m ${v%60}s`, pfx: '' },
  ];

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 1,
      background: '#1a1a1a', border: '1px solid #1a1a1a', fontFamily: F,
    }}>
      {cells.map(c => (
        <div key={c.label} style={{ background: '#050505', padding: '12px 14px', textAlign: 'center' }}>
          <div style={{ fontSize: 9, color: '#525252', letterSpacing: 1.5, marginBottom: 4 }}>{c.label}</div>
          <FlashNumber value={c.value} format={c.fmt} />
        </div>
      ))}
    </div>
  );
}
