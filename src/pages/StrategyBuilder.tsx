import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Zap, Play, RefreshCw, Target, AlertTriangle, Brain,
  TrendingUp, BarChart3, Cpu, ArrowRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import {
  STRATEGY_TEMPLATES, buildRAGContext, classifyStrategyQuery,
  type StrategyTemplate
} from '@/lib/strategyKnowledgeBase';
import { StrategyReport } from '@/components/quantscript/StrategyReport';

interface StrategyConfig {
  universe: string;
  frequency: string;
  maxPositionSize: number;
  stopLoss: number;
  takeProfit: number;
}

interface GeneratedStrategy {
  strategy: {
    name: string;
    philosophy: string;
    market_conditions?: string;
    timeframe?: string;
    asset_classes?: string[];
    entry_rules: string[];
    exit_rules: string[];
    risk_parameters: {
      max_position_pct?: number;
      stop_loss_pct?: number;
      take_profit_pct?: number;
      max_drawdown_pct?: number;
      risk_reward_ratio?: string;
      max_open_positions?: number;
    };
  };
  code?: string;
  explanation?: {
    edge?: string;
    when_it_works?: string;
    when_it_fails?: string;
    key_risks?: string[];
    improvements?: string[];
  };
  backtest_config?: {
    suggested_symbols?: string[];
    suggested_period?: string;
    initial_capital?: number;
    slippage_bps?: number;
    commission_bps?: number;
  };
  metrics_expected?: {
    target_sharpe?: string;
    target_win_rate?: string;
    expected_max_drawdown?: string;
    expected_cagr?: string;
  };
  validation?: { safe: boolean; message: string };
  raw_output?: string;
}

type ViewState = 'compose' | 'generating' | 'report';

const UNIVERSES = ['NYSE', 'NASDAQ', 'NSE', 'BSE', 'GLOBAL'];
const FREQUENCIES = ['1min', '5min', '15min', '1h', '4h', 'daily', 'weekly'];

export default function StrategyBuilder() {
  const [viewState, setViewState] = useState<ViewState>('compose');
  const [prompt, setPrompt] = useState('');
  const [config, setConfig] = useState<StrategyConfig>({
    universe: 'NYSE', frequency: 'daily',
    maxPositionSize: 10, stopLoss: 5, takeProfit: 15,
  });
  const [generatedStrategy, setGeneratedStrategy] = useState<GeneratedStrategy | null>(null);
  const [modelSource, setModelSource] = useState<string>('');
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({ title: "Describe your strategy", variant: "destructive" });
      return;
    }
    setViewState('generating');

    try {
      // Build RAG context
      const ragContext = buildRAGContext(prompt);

      // Call the new Qwen edge function
      const { data, error } = await supabase.functions.invoke('quantscript-generate', {
        body: { prompt, action: 'generate', config, ragContext },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Failed to generate strategy');

      setGeneratedStrategy(data.result);
      setModelSource(data.source || 'unknown');
      setViewState('report');

      toast({
        title: "Strategy Forged ⚡",
        description: data.result.validation?.safe
          ? `${data.result.strategy?.name || 'Strategy'} passed safety checks`
          : "Strategy generated — review recommended",
      });
    } catch (error: any) {
      console.error('Generation error:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate strategy.",
        variant: "destructive",
      });
      setViewState('compose');
    }
  };

  const resetToCompose = () => {
    setViewState('compose');
    setGeneratedStrategy(null);
    setModelSource('');
  };

  // ============================================================
  // PHASE 1: COMPOSE — Natural Language Input
  // ============================================================
  const renderCompose = () => (
    <motion.div
      key="compose"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -20 }}
      className="min-h-screen w-full bg-[#07070a] text-white font-mono selection:bg-indigo-500/30 relative"
    >
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-indigo-500/[0.04] rounded-full filter blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-violet-500/[0.03] rounded-full filter blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-[10px] tracking-[0.3em] uppercase mb-5">
            <Cpu className="w-3 h-3" /> QuantScript • Qwen3.5-35B Engine
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-indigo-500 leading-tight mb-3">
            Describe Your Edge
          </h1>
          <p className="text-white/40 text-sm max-w-xl mx-auto leading-relaxed">
            Type your trading strategy in plain English. The Architect will transform it into
            institutional-grade code with entry/exit rules, risk management, and backtestable Python.
          </p>
        </motion.div>

        {/* Textarea */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder={"Describe your strategy idea...\n\nExamples:\n• Buy when 14-day RSI drops below 30 and price is below 50-day SMA  \n• Momentum breakout on 52-week highs with 2x volume confirmation\n• Sell iron condors on SPY when IV rank > 50%"}
            rows={7}
            spellCheck={false}
            className="w-full bg-white/[0.03] border border-white/10 rounded-lg p-5 text-[13px] text-white placeholder:text-white/15 resize-none focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all font-mono leading-relaxed"
          />
          <div className="flex justify-between items-center mt-2 text-[10px] text-white/25 tracking-widest">
            <span>{prompt.length} CHARS</span>
            <span>STRATEGY TYPE: <span className="text-indigo-400 uppercase">{classifyStrategyQuery(prompt)}</span></span>
          </div>
        </motion.div>

        {/* Config Bar */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6"
        >
          {/* Universe */}
          <div className="space-y-1.5">
            <label className="text-[9px] text-white/30 tracking-widest uppercase">Universe</label>
            <select
              value={config.universe}
              onChange={e => setConfig({ ...config, universe: e.target.value })}
              className="w-full bg-white/[0.03] border border-white/10 rounded-md px-3 py-2 text-[11px] text-indigo-300 focus:outline-none focus:border-indigo-500/50"
            >
              {UNIVERSES.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>

          {/* Frequency */}
          <div className="space-y-1.5">
            <label className="text-[9px] text-white/30 tracking-widest uppercase">Frequency</label>
            <select
              value={config.frequency}
              onChange={e => setConfig({ ...config, frequency: e.target.value })}
              className="w-full bg-white/[0.03] border border-white/10 rounded-md px-3 py-2 text-[11px] text-indigo-300 focus:outline-none focus:border-indigo-500/50"
            >
              {FREQUENCIES.map(f => <option key={f} value={f}>{f.toUpperCase()}</option>)}
            </select>
          </div>

          {/* Position Size */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[9px] text-white/30 tracking-widest uppercase">
              <label>Max Position</label><span className="text-indigo-400">{config.maxPositionSize}%</span>
            </div>
            <input type="range" min={1} max={50} value={config.maxPositionSize}
              onChange={e => setConfig({ ...config, maxPositionSize: +e.target.value })}
              className="w-full accent-indigo-500 h-1 bg-white/10 rounded-full appearance-none"
            />
          </div>

          {/* Stop Loss */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[9px] text-white/30 tracking-widest uppercase">
              <label>Stop Loss</label><span className="text-rose-400">{config.stopLoss}%</span>
            </div>
            <input type="range" min={1} max={30} value={config.stopLoss}
              onChange={e => setConfig({ ...config, stopLoss: +e.target.value })}
              className="w-full accent-rose-500 h-1 bg-white/10 rounded-full appearance-none"
            />
          </div>

          {/* Take Profit */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[9px] text-white/30 tracking-widest uppercase">
              <label>Take Profit</label><span className="text-emerald-400">{config.takeProfit}%</span>
            </div>
            <input type="range" min={1} max={100} value={config.takeProfit}
              onChange={e => setConfig({ ...config, takeProfit: +e.target.value })}
              className="w-full accent-emerald-500 h-1 bg-white/10 rounded-full appearance-none"
            />
          </div>
        </motion.div>

        {/* Generate Button */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-10"
        >
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim()}
            className="w-full py-4 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-sm tracking-widest uppercase overflow-hidden disabled:opacity-30 disabled:cursor-not-allowed group hover:shadow-xl hover:shadow-indigo-500/20 transition-all relative"
          >
            <span className="relative z-10 flex items-center justify-center gap-3">
              <Sparkles className="w-4 h-4 group-hover:animate-spin" />
              GENERATE STRATEGY
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </button>
        </motion.div>

        {/* Template Cards */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="text-[10px] text-white/30 tracking-widest uppercase mb-4 font-semibold">
            Strategy Templates — Click to Load
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {STRATEGY_TEMPLATES.slice(0, 6).map((t, i) => (
              <motion.button
                key={t.label}
                onClick={() => setPrompt(t.prompt)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.06] text-left hover:bg-white/[0.04] hover:border-indigo-500/30 transition-all group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{t.icon}</span>
                  <span className="text-[11px] text-indigo-300 tracking-wider uppercase font-semibold">{t.label}</span>
                </div>
                <p className="text-[10px] text-white/35 leading-relaxed line-clamp-2 group-hover:text-white/55 transition-colors">
                  {t.description}
                </p>
                <div className="flex items-center gap-3 mt-3">
                  <span className={cn(
                    "text-[8px] tracking-widest uppercase px-1.5 py-0.5 rounded border",
                    t.difficulty === 'beginner' && 'text-emerald-400/70 border-emerald-500/20',
                    t.difficulty === 'intermediate' && 'text-amber-400/70 border-amber-500/20',
                    t.difficulty === 'advanced' && 'text-rose-400/70 border-rose-500/20',
                  )}>{t.difficulty}</span>
                  <span className="text-[8px] text-white/20 tracking-widest">SHARPE: {t.expectedSharpe}</span>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );

  // ============================================================
  // PHASE 2: GENERATING — Cinematic Terminal
  // ============================================================
  const renderGenerating = () => (
    <motion.div
      key="generating"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen w-full flex flex-col bg-[#050505] text-white font-mono items-center justify-center relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.1)_0%,transparent_50%)]" />

      <div className="w-full max-w-3xl border border-indigo-500/30 bg-black/80 backdrop-blur shadow-[0_0_60px_rgba(99,102,241,0.15)] rounded-lg overflow-hidden z-10 flex flex-col h-[400px]">
        <div className="h-9 flex-none bg-indigo-950/50 border-b border-indigo-500/30 flex items-center px-4">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
          </div>
          <div className="mx-auto text-[10px] text-indigo-400 tracking-[0.2em] uppercase">
            quantscript://the_architect — qwen3.5-35b
          </div>
        </div>

        <div className="flex-1 p-6 font-mono text-xs overflow-hidden relative">
          <div className="space-y-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-white/50">
              <span className="text-emerald-400">&gt;</span> Initializing Qwen3.5-35B engine... <span className="text-emerald-400">[OK]</span>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="text-white/50">
              <span className="text-emerald-400">&gt;</span> Loading RAG pipeline &amp; strategy knowledge base...
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0 }} className="text-white/50">
              <span className="text-emerald-400">&gt;</span> Strategy type classified: <span className="text-indigo-400 uppercase">{classifyStrategyQuery(prompt)}</span>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }} className="text-indigo-400/80 ml-4 border-l border-indigo-500/30 pl-4 py-2">
              Injecting few-shot examples...<br />
              Building context with risk bounds: MaxPos {config.maxPositionSize}% | SL {config.stopLoss}% | TP {config.takeProfit}%<br />
              Routing to THE ARCHITECT (uncensored)...
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.2 }} className="text-white/50">
              <span className="text-amber-400">&gt;</span> Generating strategy + Python code <span className="text-indigo-400 animate-pulse">█</span>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3.0 }} className="text-white/30 text-[10px]">
              &gt; Validating code safety... checking for banned imports...<br />
              &gt; Running risk parameter bounds check...
            </motion.div>
          </div>

          <motion.div
            className="absolute bottom-6 right-6"
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          >
            <RefreshCw size={20} className="text-indigo-500/30" />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <AnimatePresence mode="wait">
      {viewState === 'compose' && renderCompose()}
      {viewState === 'generating' && renderGenerating()}
      {viewState === 'report' && generatedStrategy && (
        <StrategyReport
          strategy={generatedStrategy}
          config={config}
          onReset={resetToCompose}
          modelSource={modelSource}
          originalPrompt={prompt}
        />
      )}
    </AnimatePresence>
  );
}
