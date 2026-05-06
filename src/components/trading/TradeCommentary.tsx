import React, { useEffect, useState } from 'react';
import { useTradeStore } from '@/stores/useTradeStore';

const F = '"Times New Roman", Times, serif';

export default function TradeCommentary() {
  const commentary = useTradeStore(s => s.commentary);
  const markDisplayed = useTradeStore(s => s.markCommentaryDisplayed);
  const trade = useTradeStore(s => s.activeTrade);
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (!trade || trade.status !== 'LIVE' || commentary.length === 0) return;
    // Show first entry immediately
    if (visibleCount === 0) {
      setVisibleCount(1);
      markDisplayed(0);
    }
    // Show subsequent entries every 30 seconds
    const iv = setInterval(() => {
      setVisibleCount(prev => {
        const next = Math.min(prev + 1, commentary.length);
        if (next > prev) markDisplayed(next - 1);
        return next;
      });
    }, 30000);
    return () => clearInterval(iv);
  }, [trade?.status, commentary.length]);

  if (!trade || trade.status !== 'LIVE' || commentary.length === 0) return null;

  const visible = commentary.slice(0, visibleCount);

  return (
    <div style={{
      width: 240, flexShrink: 0, fontFamily: F, padding: '8px 0',
      borderRight: '1px solid #1a1a1a', overflowY: 'auto', maxHeight: '100%',
    }}>
      <div style={{ fontSize: 9, color: '#525252', letterSpacing: 1.5, padding: '0 12px 8px', borderBottom: '1px solid #111' }}>
        AI DESK COMMENTARY
      </div>
      {visible.map((entry, i) => (
        <div key={i} style={{
          padding: '8px 12px', borderBottom: '1px solid #0a0a0a',
          animation: i === visibleCount - 1 ? 'fadeIn 0.6s ease' : undefined,
          opacity: i === visibleCount - 1 ? 1 : 0.7,
        }}>
          <div style={{ fontSize: 10, color: '#a3a3a3', lineHeight: 1.5, fontFamily: F }}>
            {entry.text}
          </div>
        </div>
      ))}
      {visibleCount < commentary.length && (
        <div style={{ padding: '8px 12px', fontSize: 9, color: '#333' }}>
          <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#333', marginRight: 6, animation: 'pulse 1.5s infinite' }} />
          Next update in {30 - ((Date.now() - (trade?.openTime || 0)) / 1000 % 30).toFixed(0)}s
        </div>
      )}
    </div>
  );
}
