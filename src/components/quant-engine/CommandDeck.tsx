import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Zap, Activity, TrendingUp, TrendingDown, BarChart3, Sparkles, X, Plus } from 'lucide-react';
import type { AlphaId } from '@/lib/alphaCalculators';

export type AnalysisMode = 'multi-factor' | 'momentum' | 'reversion';

interface CommandDeckProps {
  onRun: (tickers: string[], mode: AnalysisMode) => void;
  isRunning: boolean;
}

const PRESETS: { label: string; tickers: string[] }[] = [
  { label: 'FAANG+', tickers: ['META', 'AAPL', 'AMZN', 'NVDA', 'GOOGL'] },
  { label: 'Magnificent 7', tickers: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA'] },
  { label: 'Chip Wars', tickers: ['NVDA', 'AMD', 'INTC', 'AVGO', 'QCOM', 'TSM'] },
  { label: 'Finance Giants', tickers: ['JPM', 'GS', 'MS', 'BAC', 'WFC'] },
];

const MODES: { id: AnalysisMode; label: string; desc: string; icon: any; alphas: string[]; gradient: string; border: string }[] = [
  {
    id: 'multi-factor', label: 'Multi-Factor Matrix', desc: 'All 6 alpha signals combined with adaptive weighting',
    icon: BarChart3, alphas: ['Momentum 21d', 'Momentum 63d', 'Mean Reversion', 'Liquidity', 'Volatility', 'RSI'],
    gradient: 'from-amber-500/20 to-orange-500/10', border: 'border-amber-500/40 hover:border-amber-400/70',
  },
  {
    id: 'momentum', label: 'Momentum Isolation', desc: 'Pure price momentum — ride the trend',
    icon: TrendingUp, alphas: ['Momentum 21d', 'Momentum 63d'],
    gradient: 'from-emerald-500/20 to-cyan-500/10', border: 'border-emerald-500/40 hover:border-emerald-400/70',
  },
  {
    id: 'reversion', label: 'Mean Reversion', desc: 'Contrarian — buy the dip, sell the rip',
    icon: TrendingDown, alphas: ['Mean Reversion', 'RSI'],
    gradient: 'from-violet-500/20 to-blue-500/10', border: 'border-violet-500/40 hover:border-violet-400/70',
  },
];

export function CommandDeck({ onRun, isRunning }: CommandDeckProps) {
  const [tickers, setTickers] = useState<string[]>(['AAPL', 'NVDA', 'MSFT', 'GOOGL', 'META', 'AMZN', 'TSLA']);
  const [inputVal, setInputVal] = useState('');
  const [mode, setMode] = useState<AnalysisMode>('multi-factor');

  const addTicker = (t: string) => {
    const ticker = t.trim().toUpperCase();
    if (ticker && !tickers.includes(ticker)) {
      setTickers([...tickers, ticker]);
    }
    setInputVal('');
  };

  const removeTicker = (t: string) => setTickers(tickers.filter(x => x !== t));

  const loadPreset = (preset: string[]) => setTickers([...preset]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTicker(inputVal);
    } else if (e.key === 'Backspace' && !inputVal && tickers.length > 0) {
      setTickers(tickers.slice(0, -1));
    }
  };

  const handleRun = () => {
    if (tickers.length > 0 && !isRunning) onRun(tickers, mode);
  };

  return (
    <div className="space-y-8">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs tracking-widest uppercase mb-4">
          <Cpu className="w-3 h-3" /> Quant Engine v3
        </div>
        <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-amber-200 to-amber-500 leading-tight">
          Multi-Factor Alpha Scanner
        </h1>
        <p className="mt-3 text-white/50 text-sm max-w-xl mx-auto leading-relaxed">
          Enter your universe of tickers, select an analysis mode, and the engine will compute cross-sectional alpha signals,
          optimize portfolio weights, and deliver institutional-grade trade recommendations.
        </p>
      </motion.div>

      {/* Ticker Input */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-3"
      >
        <label className="text-[10px] text-white/40 tracking-widest uppercase font-semibold">Target Universe</label>
        <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-white/[0.03] border border-white/10 focus-within:border-amber-500/50 transition-colors min-h-[52px]">
          <AnimatePresence mode="popLayout">
            {tickers.map(t => (
              <motion.span
                key={t}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono tracking-wider"
              >
                {t}
                <button onClick={() => removeTicker(t)} className="hover:text-white transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </motion.span>
            ))}
          </AnimatePresence>
          <input
            type="text"
            value={inputVal}
            onChange={e => setInputVal(e.target.value.toUpperCase())}
            onKeyDown={handleKeyDown}
            placeholder={tickers.length === 0 ? 'Type ticker and press Enter...' : 'Add more...'}
            className="flex-1 min-w-[120px] bg-transparent text-white text-xs font-mono tracking-wider placeholder:text-white/20 outline-none"
            disabled={isRunning}
          />
        </div>

        {/* Presets */}
        <div className="flex flex-wrap gap-2">
          {PRESETS.map(p => (
            <button
              key={p.label}
              onClick={() => loadPreset(p.tickers)}
              disabled={isRunning}
              className="px-3 py-1.5 rounded-md bg-white/[0.03] border border-white/10 text-white/50 text-[10px] tracking-widest uppercase hover:bg-white/[0.06] hover:text-white/80 hover:border-white/20 transition-all disabled:opacity-30"
            >
              {p.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Mode Selector */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-3"
      >
        <label className="text-[10px] text-white/40 tracking-widest uppercase font-semibold">Analysis Mode</label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {MODES.map(m => {
            const Icon = m.icon;
            const isActive = mode === m.id;
            return (
              <motion.button
                key={m.id}
                onClick={() => setMode(m.id)}
                disabled={isRunning}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`relative p-4 rounded-lg bg-gradient-to-br ${m.gradient} border ${m.border} text-left transition-all overflow-hidden group ${
                  isActive ? 'ring-1 ring-white/20 shadow-lg shadow-amber-500/5' : 'opacity-60 hover:opacity-90'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="mode-glow"
                    className="absolute inset-0 bg-white/[0.03] rounded-lg"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4" />
                    <span className="text-xs font-semibold tracking-wider uppercase">{m.label}</span>
                  </div>
                  <p className="text-[10px] text-white/40 mb-3">{m.desc}</p>
                  <div className="flex flex-wrap gap-1">
                    {m.alphas.map(a => (
                      <span key={a} className="px-1.5 py-0.5 rounded text-[9px] bg-white/5 text-white/30 font-mono">{a}</span>
                    ))}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Run Button */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <button
          onClick={handleRun}
          disabled={isRunning || tickers.length === 0}
          className="w-full relative py-4 rounded-lg bg-gradient-to-r from-amber-600 to-amber-500 text-black font-bold text-sm tracking-widest uppercase overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed group hover:shadow-xl hover:shadow-amber-500/20 transition-all"
        >
          {isRunning && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            />
          )}
          <span className="relative z-10 flex items-center justify-center gap-3">
            {isRunning ? (
              <>
                <Zap className="w-4 h-4 animate-pulse" />
                COMPUTING ALPHA VECTORS...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 group-hover:animate-spin" />
                INITIATE SCAN — {tickers.length} ASSET{tickers.length !== 1 ? 'S' : ''}
              </>
            )}
          </span>
        </button>
      </motion.div>
    </div>
  );
}
