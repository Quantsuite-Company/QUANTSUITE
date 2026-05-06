import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTradeStore } from '@/stores/useTradeStore';

const F = '"Times New Roman", Times, serif';
const C = { green: '#10b981', red: '#ef4444', text: '#fff', dim: '#a3a3a3' };

/** STATE 1: Entering animation */
export function EnteringOverlay() {
  const trade = useTradeStore(s => s.activeTrade);
  const [phase, setPhase] = useState<'placing' | 'filled'>('placing');

  useEffect(() => {
    const t = setTimeout(() => setPhase('filled'), 1500);
    return () => clearTimeout(t);
  }, []);

  if (!trade) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F }}>
      <div style={{ textAlign: 'center' }}>
        {/* Expanding circle */}
        <motion.div
          animate={{ scale: [0.3, 2.5], opacity: [0.6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
          style={{ width: 120, height: 120, borderRadius: '50%', border: '2px solid #3b82f6', position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
        />
        <motion.div animate={{ scale: [0.5, 1] }} transition={{ duration: 0.5 }}>
          {phase === 'placing' ? (
            <div>
              <div style={{ fontSize: 14, letterSpacing: 4, color: '#3b82f6', marginBottom: 16 }}>AI PLACING ORDER</div>
              <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity }}
                style={{ width: 40, height: 2, background: '#3b82f6', margin: '0 auto', borderRadius: 1 }} />
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 12, letterSpacing: 3, color: C.dim, marginBottom: 8 }}>ORDER FILLED AT</div>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <span style={{ fontSize: 36, fontWeight: 700, color: C.text, fontFamily: 'monospace' }}>
                  ${trade.entryPrice.toFixed(2)}
                </span>
              </motion.div>
              <div style={{ fontSize: 11, color: trade.direction === 'SHORT' ? C.red : C.green, marginTop: 8, letterSpacing: 2 }}>
                {trade.direction} × {trade.quantity.toLocaleString()} SHARES
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}

/** STATE 3A: Target hit overlay */
export function TargetHitOverlay() {
  const trade = useTradeStore(s => s.activeTrade);
  const price = useTradeStore(s => s.currentPrice);
  const [showFull, setShowFull] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShowFull(false), 3000);
    return () => clearTimeout(t);
  }, []);

  if (!trade) return null;
  const pnl = trade.direction === 'LONG'
    ? (price - trade.entryPrice) * trade.quantity
    : (trade.entryPrice - price) * trade.quantity;

  if (!showFull) return (
    <motion.div initial={{ height: 200 }} animate={{ height: 48 }}
      style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 150, background: 'rgba(16,185,129,0.12)', borderBottom: `1px solid ${C.green}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F }}>
      <span style={{ fontSize: 12, color: C.green, letterSpacing: 2, fontWeight: 700 }}>
        TARGET REACHED — +${pnl.toFixed(2)} PROFIT
      </span>
    </motion.div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F }}>
      {/* Green flash */}
      <motion.div animate={{ opacity: [0, 0.3, 0] }} transition={{ duration: 0.6 }}
        style={{ position: 'absolute', inset: 0, background: C.green }} />
      {/* Particles */}
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div key={i}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{ x: (Math.random() - 0.5) * 400, y: (Math.random() - 0.5) * 400, opacity: 0, scale: 0 }}
          transition={{ duration: 1.5, delay: 0.3 + i * 0.05 }}
          style={{ position: 'absolute', width: 4, height: 4, borderRadius: '50%', background: C.green }}
        />
      ))}
      <div style={{ textAlign: 'center', position: 'relative', zIndex: 10 }}>
        <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
          <div style={{ fontSize: 16, letterSpacing: 6, color: C.green, marginBottom: 16 }}>TARGET REACHED</div>
          <div style={{ fontSize: 48, fontWeight: 700, color: C.green, fontFamily: 'monospace' }}>
            +${pnl.toFixed(2)}
          </div>
          <div style={{ fontSize: 12, color: C.dim, marginTop: 12 }}>
            {trade.ticker} {trade.direction} — Entry ${trade.entryPrice.toFixed(2)} → Exit ${price.toFixed(2)}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

/** STATE 3B: Stop hit overlay */
export function StopHitOverlay() {
  const trade = useTradeStore(s => s.activeTrade);
  const price = useTradeStore(s => s.currentPrice);
  const [showFull, setShowFull] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShowFull(false), 3000);
    return () => clearTimeout(t);
  }, []);

  if (!trade) return null;
  const pnl = trade.direction === 'LONG'
    ? (price - trade.entryPrice) * trade.quantity
    : (trade.entryPrice - price) * trade.quantity;

  if (!showFull) return (
    <motion.div initial={{ height: 200 }} animate={{ height: 48 }}
      style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 150, background: 'rgba(239,68,68,0.12)', borderBottom: `1px solid ${C.red}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F }}>
      <span style={{ fontSize: 12, color: C.red, letterSpacing: 2, fontWeight: 700 }}>
        STOP TRIGGERED — {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
      </span>
    </motion.div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F }}>
      <motion.div animate={{ opacity: [0, 0.3, 0] }} transition={{ duration: 0.6 }}
        style={{ position: 'absolute', inset: 0, background: C.red }} />
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 14, letterSpacing: 5, color: C.red, marginBottom: 16 }}>STOP TRIGGERED — POSITION CLOSED</div>
        <div style={{ fontSize: 42, fontWeight: 700, color: C.red, fontFamily: 'monospace' }}>
          ${pnl.toFixed(2)}
        </div>
        <div style={{ fontSize: 12, color: C.dim, marginTop: 12 }}>
          {trade.ticker} {trade.direction} — Entry ${trade.entryPrice.toFixed(2)} → Exit ${price.toFixed(2)}
        </div>
      </div>
    </motion.div>
  );
}
