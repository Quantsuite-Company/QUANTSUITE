import React from 'react';
import { useTradeStore } from '@/stores/useTradeStore';
import { computePnL } from '@/lib/LiveTradingEngine';
import { useNavigate } from 'react-router-dom';

const F = '"Times New Roman", Times, serif';
const C = { green: '#10b981', red: '#ef4444', text: '#fff', dim: '#a3a3a3', border: '#1a1a1a', bg: '#050505' };

export default function PostTradeAnalysis() {
  const trade = useTradeStore(s => s.activeTrade);
  const price = useTradeStore(s => s.currentPrice);
  const signals = useTradeStore(s => s.signalHealth);
  const conviction = useTradeStore(s => s.conviction);
  const history = useTradeStore(s => s.tradeHistory);
  const reset = useTradeStore(s => s.reset);
  const navigate = useNavigate();

  if (!trade || (trade.status !== 'POST_ANALYSIS' && trade.status !== 'TARGET_HIT' && trade.status !== 'STOP_HIT')) return null;

  const exitPrice = trade.exitPrice || price;
  const { pnl, pnlPercent } = computePnL(trade.entryPrice, exitPrice, trade.quantity, trade.direction);
  const isWin = pnl >= 0;
  const duration = Math.floor(((trade.exitTime || Date.now()) - trade.openTime) / 1000);
  const accent = isWin ? C.green : C.red;

  // Calibration: look at historical trades with similar confidence
  const confBucket = Math.floor(trade.confidence / 10) * 10;
  const similar = history.filter(h => Math.floor(h.confidence / 10) * 10 === confBucket);
  const winRate = similar.length > 0 ? (similar.filter(h => h.result === 'WIN').length / similar.length * 100) : null;

  const panelStyle = { background: C.bg, border: `1px solid ${C.border}`, borderRadius: 4, padding: 16, flex: 1 } as const;
  const labelStyle = { fontSize: 9, color: '#525252', letterSpacing: 1.5, marginBottom: 8 } as const;

  return (
    <div style={{ fontFamily: F, padding: 20 }}>
      <div style={{ fontSize: 12, letterSpacing: 3, color: C.dim, marginBottom: 16, textAlign: 'center' }}>
        POST-TRADE ANALYSIS
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        {/* TRADE SCORECARD */}
        <div style={panelStyle}>
          <div style={labelStyle}>TRADE SCORECARD</div>
          {[
            { l: 'Ticker', v: trade.ticker },
            { l: 'Direction', v: trade.direction },
            { l: 'Entry', v: `$${trade.entryPrice.toFixed(2)}` },
            { l: 'Exit', v: `$${exitPrice.toFixed(2)}` },
            { l: 'Duration', v: `${Math.floor(duration / 60)}m ${duration % 60}s` },
            { l: 'P&L', v: `${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)} (${pnlPercent >= 0 ? '+' : ''}${pnlPercent.toFixed(2)}%)` },
            { l: 'Result', v: isWin ? 'WIN' : 'LOSS' },
          ].map(r => (
            <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #111' }}>
              <span style={{ fontSize: 11, color: C.dim }}>{r.l}</span>
              <span style={{ fontSize: 11, color: r.l === 'Result' ? accent : r.l === 'P&L' ? accent : C.text, fontFamily: 'monospace', fontWeight: r.l === 'P&L' ? 700 : 400 }}>{r.v}</span>
            </div>
          ))}
        </div>

        {/* WHAT THE AI SAW */}
        <div style={panelStyle}>
          <div style={labelStyle}>WHAT THE AI SAW</div>
          {signals.length > 0 ? signals.map((s, i) => {
            const correct = (isWin && s.status === 'green') || (!isWin && s.status === 'red');
            const verdict = correct ? 'CORRECT' : s.status === 'amber' ? 'NEUTRAL' : 'WRONG';
            const vColor = verdict === 'CORRECT' ? C.green : verdict === 'WRONG' ? C.red : C.dim;
            return (
              <div key={i} style={{ padding: '6px 0', borderBottom: '1px solid #111' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: C.text }}>{s.name}</span>
                  <span style={{ fontSize: 10, color: vColor, fontWeight: 700, letterSpacing: 1 }}>{verdict}</span>
                </div>
                <div style={{ fontSize: 9, color: C.dim, marginTop: 2 }}>{s.description}</div>
              </div>
            );
          }) : (
            <div style={{ fontSize: 11, color: C.dim }}>Signal data processed during trade execution.</div>
          )}
          {!isWin && (
            <div style={{ marginTop: 12, padding: 8, background: 'rgba(239,68,68,0.05)', border: `1px solid ${C.red}22`, borderRadius: 3 }}>
              <div style={{ fontSize: 9, color: C.red, letterSpacing: 1.5, marginBottom: 4 }}>WHAT THE AI GOT WRONG</div>
              <div style={{ fontSize: 10, color: C.dim, lineHeight: 1.5 }}>
                {signals.filter(s => s.status === 'red').map(s => s.name).join(', ') || 'Price action'} diverged from thesis.
                Conviction was {conviction.toFixed(0)}% at close. {trade.strategyName || 'Strategy'} signal invalidated by market conditions.
              </div>
            </div>
          )}
        </div>

        {/* CALIBRATION */}
        <div style={panelStyle}>
          <div style={labelStyle}>CALIBRATION</div>
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{ fontSize: 10, color: C.dim }}>Trade conviction</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: C.text, fontFamily: 'monospace' }}>{trade.confidence.toFixed(0)}%</div>
          </div>
          {winRate !== null ? (
            <div style={{ textAlign: 'center', padding: '8px 0', borderTop: '1px solid #111' }}>
              <div style={{ fontSize: 10, color: C.dim }}>Historical win rate at {confBucket}-{confBucket + 10}% conviction</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: Math.abs(winRate - trade.confidence) < 15 ? C.green : C.dim, fontFamily: 'monospace', marginTop: 4 }}>
                {winRate.toFixed(0)}%
              </div>
              <div style={{ fontSize: 9, color: C.dim, marginTop: 4 }}>
                Based on {similar.length} historical trade{similar.length !== 1 ? 's' : ''}
              </div>
              <div style={{ fontSize: 9, color: Math.abs(winRate - trade.confidence) < 15 ? C.green : C.dim, marginTop: 4 }}>
                {Math.abs(winRate - trade.confidence) < 15 ? 'WELL CALIBRATED' : 'CALIBRATION DRIFT DETECTED'}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '8px 0', borderTop: '1px solid #111' }}>
              <div style={{ fontSize: 10, color: C.dim }}>Insufficient trade history for calibration.</div>
              <div style={{ fontSize: 9, color: '#525252', marginTop: 4 }}>Complete more trades to build calibration data.</div>
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 20 }}>
        <button onClick={() => { reset(); }} style={{
          padding: '12px 32px', background: 'rgba(59,130,246,0.1)', border: '1px solid #3b82f6',
          borderRadius: 4, color: '#3b82f6', fontSize: 12, fontWeight: 700, letterSpacing: 1.5, cursor: 'pointer', fontFamily: F,
        }}>
          PLACE ANOTHER TRADE
        </button>
        <button onClick={() => navigate('/portfolio-terminal')} style={{
          padding: '12px 32px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`,
          borderRadius: 4, color: C.dim, fontSize: 12, fontWeight: 700, letterSpacing: 1.5, cursor: 'pointer', fontFamily: F,
        }}>
          VIEW IN PORTFOLIO
        </button>
      </div>
    </div>
  );
}
