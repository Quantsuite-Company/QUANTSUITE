import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Shield, Zap, AlertTriangle, Check, X, RefreshCw,
  TrendingUp, TrendingDown, Clock, Target, Code2,
  ChevronDown, ChevronUp, Play, Brain, BarChart3
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { runBacktest, type BacktestConfig, type BacktestResult } from '@/lib/backtestEngine';

// ============================================================
// TYPE DEFINITIONS
// ============================================================
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

interface StrategyReportProps {
  strategy: GeneratedStrategy;
  config: { maxPositionSize: number; stopLoss: number; takeProfit: number };
  onReset: () => void;
  modelSource: string;
  originalPrompt: string;
}

// ============================================================
// HELPER COMPONENTS
// ============================================================
function RiskGauge({ label, value, maxVal, format, color }: {
  label: string; value: number; maxVal: number; format: (v: number) => string; color: [string, string];
}) {
  const ratio = Math.min(Math.abs(value) / maxVal, 1);
  const size = 110;
  const strokeWidth = 8;
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const arcLength = circumference * 0.75;
  const dashOffset = arcLength * (1 - ratio);
  const gradId = `rg-${label.replace(/\s/g, '')}`;

  return (
    <div className="flex flex-col items-center">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-24 h-24">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color[0]} />
            <stop offset="100%" stopColor={color[1]} />
          </linearGradient>
        </defs>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth}
          strokeLinecap="round" strokeDasharray={`${arcLength} ${circumference}`} transform={`rotate(135 ${size/2} ${size/2})`} />
        <motion.circle cx={size/2} cy={size/2} r={r} fill="none" stroke={`url(#${gradId})`} strokeWidth={strokeWidth}
          strokeLinecap="round" strokeDasharray={`${arcLength} ${circumference}`}
          initial={{ strokeDashoffset: arcLength }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          transform={`rotate(135 ${size/2} ${size/2})`}
          style={{ filter: `drop-shadow(0 0 6px ${color[0]}40)` }}
        />
        <text x={size/2} y={size/2-2} textAnchor="middle" dominantBaseline="middle" className="text-sm font-bold font-mono fill-white">
          {format(value)}
        </text>
      </svg>
      <span className="text-[9px] text-white/40 tracking-widest uppercase mt-1">{label}</span>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export function StrategyReport({ strategy, config, onReset, modelSource, originalPrompt }: StrategyReportProps) {
  const { strategy: strat, explanation, backtest_config, metrics_expected, validation, code } = strategy;
  const [showCode, setShowCode] = useState(false);
  const [backtestResult, setBtResult] = useState<BacktestResult | null>(null);
  const [isBacktesting, setIsBacktesting] = useState(false);
  const [btSymbol, setBtSymbol] = useState(backtest_config?.suggested_symbols?.[0] || 'AAPL');
  const { toast } = useToast();

  const riskParams = strat?.risk_parameters || {};

  const handleRunBacktest = async () => {
    setIsBacktesting(true);
    try {
      // Fetch stock data for the backtest
      const { data: stockData, error } = await supabase.functions.invoke('fetch-stock-data', {
        body: { tickers: [btSymbol], period: '2y' }
      });
      if (error) throw error;

      const priceData = stockData?.stockData?.[btSymbol];
      if (!priceData || priceData.length < 30) throw new Error('Insufficient price data');

      const prices = priceData.map((d: any) => d.close);

      const btConfig: BacktestConfig = {
        strategyName: strat?.name || 'Custom Strategy',
        entrySignal: strat?.philosophy?.toLowerCase().includes('momentum') ? 'MOMENTUM'
          : strat?.philosophy?.toLowerCase().includes('reversion') ? 'MEAN_REVERSION'
          : strat?.philosophy?.toLowerCase().includes('breakout') ? 'BREAKOUT'
          : 'MOMENTUM',
        positionSize: (riskParams.max_position_pct || config.maxPositionSize) / 100,
        stopLoss: (riskParams.stop_loss_pct || config.stopLoss) / 100,
        takeProfit: (riskParams.take_profit_pct || config.takeProfit) / 100,
        lookbackPeriod: 14,
        holdingPeriod: 10,
      };

      const result = runBacktest(prices, btConfig);
      setBtResult(result);
      toast({
        title: 'Backtest Complete',
        description: `Return: ${result.totalReturn.toFixed(1)}% | Sharpe: ${result.sharpeRatio.toFixed(2)}`,
      });
    } catch (err: any) {
      toast({ title: 'Backtest Failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsBacktesting(false);
    }
  };

  // NLP Explainer — pure logic summary
  const nlpSummary = useMemo(() => {
    const s = strat;
    if (!s) return '';
    const entryCount = s.entry_rules?.length || 0;
    const exitCount = s.exit_rules?.length || 0;
    const rr = riskParams.risk_reward_ratio || 'N/A';

    let text = `**${s.name}** is a ${s.timeframe || 'daily'} strategy `;
    text += `designed for ${s.market_conditions || 'general market conditions'}. `;
    text += `It uses ${entryCount} entry rule${entryCount !== 1 ? 's' : ''} and ${exitCount} exit rule${exitCount !== 1 ? 's' : ''} `;
    text += `with a risk/reward ratio of ${rr}. `;

    if (s.philosophy) text += `\n\n**Core thesis**: ${s.philosophy} `;

    if (explanation?.edge) text += `\n\n**The edge**: ${explanation.edge} `;
    if (explanation?.when_it_works) text += `\n\n**Sweet spot**: ${explanation.when_it_works} `;
    if (explanation?.when_it_fails) text += `\n\n**Failure mode**: ${explanation.when_it_fails} `;

    if (metrics_expected) {
      text += `\n\n**Expected performance**: `;
      if (metrics_expected.target_sharpe) text += `Sharpe ${metrics_expected.target_sharpe}, `;
      if (metrics_expected.target_win_rate) text += `Win Rate ${metrics_expected.target_win_rate}, `;
      if (metrics_expected.expected_cagr) text += `CAGR ${metrics_expected.expected_cagr}.`;
    }

    return text;
  }, [strat, explanation, metrics_expected, riskParams]);

  // Parse bold markers from NLP summary
  const renderBoldText = (text: string) => {
    return text.split('\n\n').map((block, i) => {
      const parts = block.split(/\*\*(.*?)\*\*/g);
      return (
        <p key={i} className={i > 0 ? 'mt-3' : ''}>
          {parts.map((part, k) =>
            k % 2 === 1
              ? <span key={k} className="text-white font-semibold">{part}</span>
              : <span key={k}>{part}</span>
          )}
        </p>
      );
    });
  };

  return (
    <motion.div
      key="report"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="min-h-screen w-full bg-[#07070a] text-white font-mono selection:bg-indigo-500/30 relative"
    >
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-500/[0.03] rounded-full filter blur-[120px]" />
        <div className="absolute bottom-0 right-1/3 w-[400px] h-[400px] bg-violet-500/[0.03] rounded-full filter blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      <div className="relative z-10 max-w-[1600px] mx-auto px-6 py-6 space-y-6">
        {/* ===== HEADER ===== */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onReset}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/5 border border-white/10 text-white/50 text-xs tracking-widest hover:bg-white/10 hover:text-white/80 transition-all">
              <ArrowLeft className="w-3 h-3" /> NEW STRATEGY
            </button>
            <div>
              <h2 className="text-xl tracking-wide font-semibold text-white">{strat?.name || 'Strategy Generated'}</h2>
              <div className="flex items-center gap-3 mt-1">
                {validation?.safe ? (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                    <Check className="w-3 h-3" /> SAFE
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">
                    <AlertTriangle className="w-3 h-3" /> REVIEW
                  </span>
                )}
                <span className="text-[10px] text-white/30 tracking-widest uppercase">
                  MODEL: {modelSource === 'qwen35' ? 'QWEN 3.5-35B' : 'GEMINI FLASH'} • {new Date().toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ===== ROW 1: Strategy DNA + Risk Gauges ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Strategy DNA */}
          <div className="bg-white/[0.02] border border-white/10 rounded-lg p-5">
            <div className="text-[10px] text-white/40 tracking-widest uppercase mb-4 font-semibold flex items-center gap-2">
              <Brain className="w-3.5 h-3.5" /> Strategy DNA
            </div>

            {strat?.philosophy && (
              <p className="text-sm text-indigo-300/80 mb-4 italic border-l-2 border-indigo-500/40 pl-3">
                "{strat.philosophy}"
              </p>
            )}

            <div className="grid grid-cols-3 gap-3 mb-5">
              {strat?.timeframe && (
                <div className="bg-white/[0.03] rounded p-2.5">
                  <span className="text-[8px] text-white/30 uppercase tracking-widest block mb-1">Timeframe</span>
                  <span className="text-xs text-white/70">{strat.timeframe}</span>
                </div>
              )}
              {strat?.market_conditions && (
                <div className="bg-white/[0.03] rounded p-2.5">
                  <span className="text-[8px] text-white/30 uppercase tracking-widest block mb-1">Best Regime</span>
                  <span className="text-xs text-white/70">{strat.market_conditions}</span>
                </div>
              )}
              {strat?.asset_classes && (
                <div className="bg-white/[0.03] rounded p-2.5">
                  <span className="text-[8px] text-white/30 uppercase tracking-widest block mb-1">Assets</span>
                  <span className="text-xs text-white/70">{strat.asset_classes.join(', ')}</span>
                </div>
              )}
            </div>

            {/* Entry / Exit Rules */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[9px] text-emerald-400 tracking-widest uppercase mb-2 font-semibold flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Entry Rules
                </div>
                <div className="space-y-2">
                  {strat?.entry_rules?.map((rule, i) => (
                    <motion.div key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="text-[11px] text-white/60 pl-3 border-l border-emerald-500/30 leading-relaxed"
                    >
                      {rule}
                    </motion.div>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[9px] text-rose-400 tracking-widest uppercase mb-2 font-semibold flex items-center gap-1">
                  <TrendingDown className="w-3 h-3" /> Exit Rules
                </div>
                <div className="space-y-2">
                  {strat?.exit_rules?.map((rule, i) => (
                    <motion.div key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 + 0.3 }}
                      className="text-[11px] text-white/60 pl-3 border-l border-rose-500/30 leading-relaxed"
                    >
                      {rule}
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Risk Gauges */}
          <div className="bg-white/[0.02] border border-white/10 rounded-lg p-5">
            <div className="text-[10px] text-white/40 tracking-widest uppercase mb-4 font-semibold flex items-center gap-2">
              <Shield className="w-3.5 h-3.5" /> Risk Profile
            </div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <RiskGauge label="Max Position" value={riskParams.max_position_pct || config.maxPositionSize} maxVal={50}
                format={v => `${v}%`} color={['#6366f1', '#8b5cf6']} />
              <RiskGauge label="Stop Loss" value={riskParams.stop_loss_pct || config.stopLoss} maxVal={30}
                format={v => `${v}%`} color={['#ef4444', '#f97316']} />
              <RiskGauge label="Take Profit" value={riskParams.take_profit_pct || config.takeProfit} maxVal={100}
                format={v => `${v}%`} color={['#10b981', '#34d399']} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <RiskGauge label="Max DD" value={riskParams.max_drawdown_pct || 20} maxVal={50}
                format={v => `${v}%`} color={['#f59e0b', '#fbbf24']} />
              <RiskGauge label="Max Positions" value={riskParams.max_open_positions || 5} maxVal={20}
                format={v => `${v}`} color={['#3b82f6', '#6366f1']} />
              <div className="flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-indigo-400 font-mono">{riskParams.risk_reward_ratio || '1:3'}</span>
                <span className="text-[9px] text-white/40 tracking-widest uppercase mt-1">R:R RATIO</span>
              </div>
            </div>
          </div>
        </div>

        {/* ===== ROW 2: Expected Metrics ===== */}
        {metrics_expected && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'TARGET SHARPE', val: metrics_expected.target_sharpe, color: 'text-indigo-400' },
              { label: 'WIN RATE', val: metrics_expected.target_win_rate, color: 'text-emerald-400' },
              { label: 'MAX DRAWDOWN', val: metrics_expected.expected_max_drawdown, color: 'text-amber-400' },
              { label: 'EXPECTED CAGR', val: metrics_expected.expected_cagr, color: 'text-cyan-400' },
            ].map((m, i) => (
              <motion.div key={m.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-4">
                <span className="text-[9px] text-white/30 tracking-widest uppercase block mb-1">{m.label}</span>
                <span className={`text-2xl font-light font-mono ${m.color}`}>{m.val || 'N/A'}</span>
              </motion.div>
            ))}
          </div>
        )}

        {/* ===== ROW 3: Edge Analysis ===== */}
        {explanation && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {explanation.edge && (
              <div className="bg-emerald-500/[0.05] border border-emerald-500/20 rounded-lg p-4">
                <div className="text-[9px] text-emerald-400 tracking-widest uppercase mb-2 font-semibold flex items-center gap-1">
                  <Zap className="w-3 h-3" /> THE EDGE
                </div>
                <p className="text-[11px] text-white/60 leading-relaxed">{explanation.edge}</p>
              </div>
            )}
            {explanation.when_it_works && (
              <div className="bg-blue-500/[0.05] border border-blue-500/20 rounded-lg p-4">
                <div className="text-[9px] text-blue-400 tracking-widest uppercase mb-2 font-semibold flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> WHEN IT WORKS
                </div>
                <p className="text-[11px] text-white/60 leading-relaxed">{explanation.when_it_works}</p>
              </div>
            )}
            {explanation.when_it_fails && (
              <div className="bg-rose-500/[0.05] border border-rose-500/20 rounded-lg p-4">
                <div className="text-[9px] text-rose-400 tracking-widest uppercase mb-2 font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> WHEN IT FAILS
                </div>
                <p className="text-[11px] text-white/60 leading-relaxed">{explanation.when_it_fails}</p>
              </div>
            )}
          </div>
        )}

        {/* Key Risks + Improvements */}
        {(explanation?.key_risks || explanation?.improvements) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {explanation.key_risks && explanation.key_risks.length > 0 && (
              <div className="bg-white/[0.02] border border-white/10 rounded-lg p-4">
                <div className="text-[9px] text-amber-400 tracking-widest uppercase mb-3 font-semibold">⚠ KEY RISKS</div>
                <div className="space-y-2">
                  {explanation.key_risks.map((risk, i) => (
                    <div key={i} className="text-[11px] text-white/50 flex items-start gap-2">
                      <span className="text-amber-400 mt-0.5">•</span> {risk}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {explanation.improvements && explanation.improvements.length > 0 && (
              <div className="bg-white/[0.02] border border-white/10 rounded-lg p-4">
                <div className="text-[9px] text-cyan-400 tracking-widest uppercase mb-3 font-semibold">🔧 IMPROVEMENTS</div>
                <div className="space-y-2">
                  {explanation.improvements.map((imp, i) => (
                    <div key={i} className="text-[11px] text-white/50 flex items-start gap-2">
                      <span className="text-cyan-400 mt-0.5">•</span> {imp}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===== ROW 4: Code Block ===== */}
        {code && (
          <div className="bg-white/[0.02] border border-white/10 rounded-lg overflow-hidden">
            <button onClick={() => setShowCode(!showCode)}
              className="w-full px-5 py-3 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors">
              <span className="text-[10px] text-white/40 tracking-widest uppercase font-semibold flex items-center gap-2">
                <Code2 className="w-3.5 h-3.5" /> Generated Python Code
              </span>
              {showCode ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
            </button>
            {showCode && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}>
                <pre className="p-5 text-[11px] text-indigo-300/80 leading-relaxed overflow-x-auto border-t border-white/5 bg-black/40">
                  <code>{code}</code>
                </pre>
              </motion.div>
            )}
          </div>
        )}

        {/* ===== ROW 5: Backtest Console ===== */}
        <div className="bg-white/[0.02] border border-white/10 rounded-lg p-5">
          <div className="text-[10px] text-white/40 tracking-widest uppercase mb-4 font-semibold flex items-center gap-2">
            <BarChart3 className="w-3.5 h-3.5" /> Backtest Console
          </div>

          <div className="flex flex-wrap items-end gap-4 mb-4">
            <div className="space-y-1.5">
              <label className="text-[9px] text-white/30 tracking-widest uppercase">Symbol</label>
              <div className="flex gap-2">
                {(backtest_config?.suggested_symbols || ['AAPL', 'MSFT', 'GOOGL', 'NVDA']).map(sym => (
                  <button key={sym} onClick={() => setBtSymbol(sym)}
                    className={`px-3 py-1.5 rounded text-[10px] tracking-wider border transition-all ${
                      btSymbol === sym
                        ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                        : 'bg-white/[0.03] border-white/10 text-white/40 hover:text-white/60'
                    }`}>
                    {sym}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={handleRunBacktest} disabled={isBacktesting}
              className="px-6 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] tracking-widest uppercase font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 transition-colors">
              {isBacktesting ? (
                <><RefreshCw className="w-3 h-3 animate-spin" /> RUNNING...</>
              ) : (
                <><Play className="w-3 h-3" /> RUN BACKTEST ON {btSymbol}</>
              )}
            </button>
          </div>

          {/* Backtest Results */}
          {backtestResult && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 mt-6">
              {/* Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {[
                  { label: 'TOTAL RETURN', val: `${backtestResult.totalReturn > 0 ? '+' : ''}${backtestResult.totalReturn.toFixed(1)}%`, color: backtestResult.totalReturn > 0 ? 'text-emerald-400' : 'text-rose-400' },
                  { label: 'SHARPE RATIO', val: backtestResult.sharpeRatio.toFixed(2), color: backtestResult.sharpeRatio > 1 ? 'text-emerald-400' : 'text-amber-400' },
                  { label: 'MAX DRAWDOWN', val: `${backtestResult.maxDrawdown.toFixed(1)}%`, color: 'text-rose-400' },
                  { label: 'WIN RATE', val: `${backtestResult.winRate.toFixed(0)}%`, color: backtestResult.winRate > 50 ? 'text-emerald-400' : 'text-amber-400' },
                  { label: 'TOTAL TRADES', val: `${backtestResult.totalTrades}`, color: 'text-white/60' },
                  { label: 'PROFIT FACTOR', val: backtestResult.profitFactor.toFixed(2), color: backtestResult.profitFactor > 1.5 ? 'text-emerald-400' : 'text-amber-400' },
                ].map(m => (
                  <div key={m.label} className="bg-white/[0.03] border border-white/[0.06] rounded p-3 text-center">
                    <span className="text-[8px] text-white/25 tracking-widest uppercase block mb-1">{m.label}</span>
                    <span className={`text-lg font-mono font-bold ${m.color}`}>{m.val}</span>
                  </div>
                ))}
              </div>

              {/* Equity Curve */}
              <div className="bg-black/30 border border-white/[0.06] rounded-lg p-4">
                <div className="text-[9px] text-white/30 tracking-widest uppercase mb-3">Equity Curve</div>
                <div className="h-[250px] flex items-end gap-[2px]">
                  {backtestResult.equityCurve.map((point, i) => {
                    const maxEq = Math.max(...backtestResult.equityCurve.map(p => p.equity));
                    const minEq = Math.min(...backtestResult.equityCurve.map(p => p.equity));
                    const range = maxEq - minEq || 1;
                    const height = ((point.equity - minEq) / range) * 230;
                    const isPositive = point.equity >= (backtestResult.equityCurve[0]?.equity || 100);

                    return (
                      <motion.div
                        key={i}
                        initial={{ height: 0 }}
                        animate={{ height: `${height}px` }}
                        transition={{ delay: i * 0.003, duration: 0.3 }}
                        className={`flex-1 rounded-t-[1px] ${isPositive ? 'bg-emerald-500/40' : 'bg-rose-500/40'}`}
                        style={{ minWidth: '2px' }}
                        title={`Day ${point.day}: $${point.equity.toFixed(0)}`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Monthly Returns Heatmap */}
              {backtestResult.monthlyReturns && backtestResult.monthlyReturns.length > 0 && (
                <div className="bg-black/30 border border-white/[0.06] rounded-lg p-4">
                  <div className="text-[9px] text-white/30 tracking-widest uppercase mb-3">Monthly Returns Heatmap</div>
                  <div className="flex flex-wrap gap-1">
                    {backtestResult.monthlyReturns.map((mr, i) => {
                      const val = mr.return;
                      const intensity = Math.min(Math.abs(val) / 10, 1);
                      const bg = val > 0
                        ? `rgba(16,185,129,${0.15 + intensity * 0.5})`
                        : `rgba(239,68,68,${0.15 + intensity * 0.5})`;
                      return (
                        <div key={i} className="w-12 h-10 rounded flex flex-col items-center justify-center"
                          style={{ backgroundColor: bg }}
                          title={`${mr.month}: ${val > 0 ? '+' : ''}${val.toFixed(1)}%`}>
                          <span className="text-[7px] text-white/40">{mr.month}</span>
                          <span className="text-[9px] font-mono text-white/80 font-bold">
                            {val > 0 ? '+' : ''}{val.toFixed(1)}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* ===== ROW 6: NLP Explainer ===== */}
        <div className="bg-white/[0.02] border border-white/10 rounded-lg overflow-hidden">
          <div className="px-5 py-3 bg-gradient-to-r from-indigo-500/10 to-transparent border-b border-white/5 flex items-center gap-3">
            <Brain className="w-4 h-4 text-indigo-400" />
            <span className="text-[10px] text-indigo-400 tracking-widest uppercase font-bold">
              Intelligence Report — Plain English Summary
            </span>
          </div>
          <div className="p-5 text-sm leading-7 text-white/60">
            {renderBoldText(nlpSummary)}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
