import { PulsePanel } from '../PulseGrid';
import { useState } from 'react';

interface PanelExpandProps {
  panelId?: string;
  onExpand?: (id: string) => void;
  expanded?: boolean;
  onClose?: () => void;
}

export function BTCRegimePanel(props: PanelExpandProps) {
  const [showAll, setShowAll] = useState(false);

  const assets = [
    { sym: 'BTC', name: 'Bitcoin', signal: 'BUY', bullish: 5, total: 7, liq: 'NORMAL', liqPct: '+1.9%', net: 'COOLING', netPct: '-4.2%' },
    { sym: 'ETH', name: 'Ethereum', signal: 'BUY', bullish: 4, total: 7, liq: 'STRONG', liqPct: '+3.2%', net: 'GROWING', netPct: '+2.1%' },
    { sym: 'SOL', name: 'Solana', signal: 'STRONG BUY', bullish: 6, total: 7, liq: 'STRONG', liqPct: '+5.8%', net: 'SURGING', netPct: '+12.4%' },
    { sym: 'XRP', name: 'Ripple', signal: 'HOLD', bullish: 3, total: 7, liq: 'NORMAL', liqPct: '+0.5%', net: 'STABLE', netPct: '+0.3%' },
    { sym: 'ADA', name: 'Cardano', signal: 'HOLD', bullish: 3, total: 7, liq: 'WEAK', liqPct: '-1.1%', net: 'COOLING', netPct: '-2.8%' },
    { sym: 'DOT', name: 'Polkadot', signal: 'SELL', bullish: 2, total: 7, liq: 'WEAK', liqPct: '-3.4%', net: 'DECLINING', netPct: '-6.1%' },
    { sym: 'AVAX', name: 'Avalanche', signal: 'BUY', bullish: 4, total: 7, liq: 'NORMAL', liqPct: '+1.2%', net: 'GROWING', netPct: '+3.5%' },
    { sym: 'LINK', name: 'Chainlink', signal: 'BUY', bullish: 5, total: 7, liq: 'STRONG', liqPct: '+2.8%', net: 'GROWING', netPct: '+4.2%' },
    { sym: 'MATIC', name: 'Polygon', signal: 'HOLD', bullish: 3, total: 7, liq: 'NORMAL', liqPct: '+0.2%', net: 'STABLE', netPct: '-0.5%' },
    { sym: 'NEAR', name: 'Near', signal: 'BUY', bullish: 4, total: 7, liq: 'NORMAL', liqPct: '+1.5%', net: 'GROWING', netPct: '+3.8%' },
  ];

  const visibleAssets = (showAll || props.expanded) ? assets : assets.slice(0, 1);

  const signalColor = (s: string) => s.includes('BUY') ? '#22c55e' : s === 'HOLD' ? '#eab308' : '#ef4444';

  return (
    <PulsePanel title="Crypto Regime" category="CRYPTO" {...props}
      analysis="BTC at 5/7 bullish signals with NORMAL liquidity signals a continuation of the current uptrend, but the COOLING network activity (-4.2% active addresses) is a yellow flag — historically, price rallies without corresponding network growth fade within 2-3 weeks. SOL is the standout with 6/7 bullish and SURGING network activity (+12.4%) — this is where the smart money is rotating. ETH's GROWING network supports the narrative but lacks the explosive momentum of SOL. DOT at 2/7 with DECLINING network is a clear avoid. Strategy: overweight SOL and LINK, maintain BTC and ETH core positions, avoid DOT and trim ADA. Watch BTC network activity — if it flips positive, the rally extends another leg.">
      <div className="flex-1 flex flex-col gap-3 justify-between h-full">
        {visibleAssets.map(a => (
          <div key={a.sym} className="border rounded-lg p-2.5" style={{ borderColor: `${signalColor(a.signal)}20`, backgroundColor: `${signalColor(a.signal)}05` }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-amber-950 flex items-center justify-center text-[7px] font-bold">{a.sym.charAt(0)}</span>
                <span className="text-xs font-bold text-slate-200">{a.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold" style={{ color: signalColor(a.signal) }}>{a.signal}</span>
                <span className="text-[9px] font-mono text-slate-500">{a.bullish}/{a.total}</span>
              </div>
            </div>
            {(props.expanded || showAll) && (
              <div className="grid grid-cols-2 gap-2 mt-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-500">Liquidity</span>
                  <span className="text-[9px] font-mono font-bold text-positive">{a.liq}</span>
                  <span className="text-[9px] font-mono text-positive">{a.liqPct}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-500">Network</span>
                  <span className={`text-[9px] font-mono font-bold ${a.netPct.startsWith('+') ? 'text-positive' : 'text-negative'}`}>{a.net}</span>
                  <span className={`text-[9px] font-mono ${a.netPct.startsWith('+') ? 'text-positive' : 'text-negative'}`}>{a.netPct}</span>
                </div>
              </div>
            )}
          </div>
        ))}

        {!props.expanded && !showAll && assets.length > 1 && (
          <button onClick={(e) => { e.stopPropagation(); setShowAll(true); }} className="text-[10px] font-mono text-purple-400 hover:text-purple-300 transition-colors text-center py-1">
            Show All {assets.length} Assets ▼
          </button>
        )}
        {!props.expanded && showAll && (
          <button onClick={(e) => { e.stopPropagation(); setShowAll(false); }} className="text-[10px] font-mono text-slate-500 hover:text-slate-300 transition-colors text-center py-1">
            Collapse ▲
          </button>
        )}
      </div>
    </PulsePanel>
  );
}

export function CryptoSectorsPanel(props: PanelExpandProps) {
  const [activeSector, setActiveSector] = useState<string | null>(null);

  const sectors = [
    { n: 'Layer 1', p: '+1.33%', up: true, tokens: ['BTC', 'ETH', 'SOL', 'ADA', 'AVAX'] },
    { n: 'DeFi', p: '+1.46%', up: true, tokens: ['UNI', 'AAVE', 'MKR', 'CRV', 'LDO'] },
    { n: 'Layer 2', p: '-0.45%', up: false, tokens: ['MATIC', 'ARB', 'OP', 'STRK', 'ZK'] },
    { n: 'AI', p: '+0.78%', up: true, tokens: ['TAO', 'RNDR', 'FET', 'AGIX', 'AKT'] },
    { n: 'Memes', p: '+0.71%', up: true, tokens: ['DOGE', 'SHIB', 'PEPE', 'WIF', 'BONK'] },
    { n: 'Gaming', p: '-0.18%', up: false, tokens: ['AXS', 'SAND', 'IMX', 'GALA', 'ILV'] },
    { n: 'Privacy', p: '-0.05%', up: false, tokens: ['XMR', 'ZEC', 'DASH', 'SCRT', 'ROSE'] },
    { n: 'Infra', p: '+0.62%', up: true, tokens: ['LINK', 'GRT', 'FIL', 'AR', 'THETA'] },
  ];

  return (
    <PulsePanel title="Crypto Sectors" category="CRYPTO" {...props}
      analysis="DeFi leads at +1.46% — this typically signals on-chain activity picking up and DEX volume increasing. Layer 1 close behind at +1.33% confirms the broader crypto market is healthy. AI tokens at +0.78% continue their multi-month outperformance thesis. The concerning signal is Layer 2 at -0.45% — when L2s underperform L1s, it suggests liquidity is concentrating on mainchains rather than scaling solutions. Gaming at -0.18% remains in a structural downtrend since the play-to-earn bubble burst. Tactical allocation: overweight DeFi and AI, market-weight L1, underweight L2 and Gaming. Memes at +0.71% are noise — position only for short-term momentum plays with tight stops.">
      <div className="flex flex-col gap-2">
        <div className={`grid ${props.expanded ? 'grid-cols-4' : 'grid-cols-3'} gap-2 py-1 flex-1 items-center content-center`}>
          {sectors.map(s => (
            <div key={s.n} 
              className={`flex flex-col items-center justify-center p-2 bg-bg-elevated/40 border rounded cursor-pointer hover:border-white/10 transition-all ${activeSector === s.n ? 'border-purple-500/40 bg-purple-500/5' : 'border-white/5'}`}
              onClick={(e) => { e.stopPropagation(); setActiveSector(activeSector === s.n ? null : s.n); }}>
              <span className="text-[9px] font-mono text-slate-400 truncate w-full text-center mb-1">{s.n}</span>
              <span className={`text-[11px] font-bold ${s.up ? 'text-positive' : 'text-negative'}`}>{s.p}</span>
            </div>
          ))}
        </div>
        {/* Drill-down */}
        {activeSector && (
          <div className="bg-bg-elevated/30 border border-purple-500/10 rounded-lg p-2 mt-1">
            <span className="text-[9px] font-mono text-purple-400 uppercase tracking-widest">{activeSector} Constituents</span>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {sectors.find(s => s.n === activeSector)?.tokens.map(t => (
                <span key={t} className="text-[10px] font-mono text-slate-300 bg-bg-elevated/40 px-2 py-0.5 rounded border border-white/5">{t}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </PulsePanel>
  );
}

export function DefiTokensPanel({ title, tokens, ...props }: { title: string; tokens: any[] } & PanelExpandProps) {
  const [showAll, setShowAll] = useState(false);
  const visibleTokens = (showAll || props.expanded) ? tokens : tokens.slice(0, 5);

  return (
    <PulsePanel title={title} category="CRYPTO" {...props}
      analysis={`${title} universe showing ${tokens.length} tracked assets. The sector is exhibiting mixed signals with both gainers and losers present. Focus on tokens with positive daily AND weekly momentum — dual-timeframe alignment reduces false signals by 40%. Declining tokens with negative weekly momentum should be avoided for new entries. Use the expanded view to identify rotation opportunities: tokens transitioning from negative weekly to positive daily often signal accumulation by larger wallets.`}>
      <div className="flex-1 flex flex-col h-full">
        <div className="flex-1 overflow-y-auto space-y-1 mt-1 pr-1">
          {visibleTokens.map(t => (
            <div key={t.sym} className="flex items-center justify-between p-2 hover:bg-white/[0.02] rounded cursor-pointer transition-colors border border-transparent hover:border-white/5 group">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors">{t.name}</span>
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">{t.sym}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs font-mono font-bold text-slate-300">${t.price}</span>
                <div className="flex gap-1 text-[9px] font-mono mt-0.5">
                  <span className={t.p1d.startsWith('+') ? 'text-positive' : 'text-negative'}>{t.p1d}d</span>
                  <span className={t.p1w.startsWith('+') ? 'text-positive' : 'text-negative'}>{t.p1w}w</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        {!props.expanded && !showAll && tokens.length > 5 && (
          <button onClick={(e) => { e.stopPropagation(); setShowAll(true); }} className="text-[10px] font-mono text-purple-400 hover:text-purple-300 transition-colors text-center py-2 mt-1 border-t border-white/5">
            Show All {tokens.length} Tokens ▼
          </button>
        )}
        {!props.expanded && showAll && (
          <button onClick={(e) => { e.stopPropagation(); setShowAll(false); }} className="text-[10px] font-mono text-slate-500 hover:text-slate-300 transition-colors text-center py-2 mt-1 border-t border-white/5">
            Collapse ▲
          </button>
        )}
      </div>
    </PulsePanel>
  );
}
