import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Shield, Zap, AlertTriangle, Check, X, RefreshCw,
  TrendingUp, TrendingDown, Clock, Target, Code2,
  ChevronDown, ChevronUp, Play, Brain, BarChart3, FileText
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { runBacktest, type BacktestConfig, type BacktestResult } from '@/lib/backtestEngine';
import { Highlight } from "prism-react-renderer";
import { format as formatDt } from "date-fns";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import WalkForwardBacktest from '@/pages/WalkForwardBacktest';

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
  const size = 120;
  const strokeWidth = 12;
  const r = (size - strokeWidth) / 2 - 4;
  const circumference = 2 * Math.PI * r;
  const arcLength = circumference * 0.75;
  const dashOffset = arcLength * (1 - ratio);
  const gradId = `rg-${label.replace(/\s/g, '')}`;

  return (
    <div className="flex flex-col items-center justify-center p-2">
      <div className="relative w-28 h-28 flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent rounded-full shadow-[inset_0_4px_20px_rgba(0,0,0,0.5)]" />
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full absolute drop-shadow-2xl">
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={color[0]} />
              <stop offset="100%" stopColor={color[1]} />
            </linearGradient>
            <filter id={`glow-${gradId}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth={strokeWidth}
            strokeLinecap="round" strokeDasharray={`${arcLength} ${circumference}`} transform={`rotate(135 ${size/2} ${size/2})`} />
          <motion.circle cx={size/2} cy={size/2} r={r} fill="none" stroke={`url(#${gradId})`} strokeWidth={strokeWidth}
            strokeLinecap="round" strokeDasharray={`${arcLength} ${circumference}`}
            initial={{ strokeDashoffset: arcLength }}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
            transform={`rotate(135 ${size/2} ${size/2})`}
            filter={`url(#glow-${gradId})`}
          />
        </svg>
        <span className="relative z-10 text-lg font-bold font-mono tracking-tight text-white drop-shadow-lg">
          {format(value)}
        </span>
      </div>
      <span className="text-[10px] font-bold text-white/50 tracking-[0.2em] uppercase mt-3">{label}</span>
    </div>
  );
}

// ============================================================
// RETAIL TRANSLATION ENGINE (Wolf of Wall Street Persona)
// ============================================================
function getRetailSummary(result: BacktestResult) {
  const isLoss = result.totalReturn < 0;
  const isDangerous = result.maxDrawdown > 20;
  const isGodTier = result.sharpeRatio > 2;

  let text = "Okay listen up, kid. Here is what these numbers actually mean. ";
  
  if (isLoss) {
    text += `First off, you bleed money on this setup. A ${result.totalReturn.toFixed(1)}% drop means you are giving your capital away to guys like me. `;
  } else {
    text += `We pulled a nice ${result.totalReturn.toFixed(1)}% total return. In Wall Street terms, that means the strategy actually hunts and prints cash. `;
  }

  if (isGodTier) {
    text += `The Sharpe Ratio is pushing ${result.sharpeRatio.toFixed(2)}. Anything over 1.0 means you're getting paid nicely for the risk you're taking, but over 2.0? That is heavy hedge-fund territory. You're barely sweating for every dollar you make. `;
  } else if (result.sharpeRatio > 0.5) {
    text += `A Sharpe of ${result.sharpeRatio.toFixed(2)} means we are making money, but you're taking standard market bumps to get there. `;
  } else {
    text += `Your Sharpe ratio is a miserable ${result.sharpeRatio.toFixed(2)}. You are taking on way too much stress for the pennies you're picking up in front of the steamroller. `;
  }

  if (isDangerous) {
    text += `Now let's talk about the gut-punch: your Max Drawdown. At one point, your account bled out -${result.maxDrawdown.toFixed(1)}%. That is brutal. Most retail guys throw up and sell the bottom when they see their account drop 20%. You need a stomach of iron to run this, or you need to tighten those stop-losses immediately. `;
  } else {
    text += `The best part? Your Max Drawdown was only -${result.maxDrawdown.toFixed(1)}%. That's the maximum pain you felt from peak to trough. Very comfortable ride, meaning you can actually sleep at night running this algo. `;
  }

  text += `We hit a win rate of ${result.winRate.toFixed(0)}%. You don't need a 90% win rate to be rich, you just need your average wins (+${result.avgWin.toFixed(1)}%) to completely bury your average losses (${result.avgLoss.toFixed(1)}%). Proceed with caution, and don't over-leverage.`;

  return text;
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

  // NLP Explainer — Aggressive PM Tone
  const nlpSummary = useMemo(() => {
    const s = strat;
    if (!s) return '';
    const rr = riskParams.risk_reward_ratio || 'N/A';

    let text = `Listen up. We are deploying **${s.name}** across the board. This is a ${s.timeframe || 'daily'} timeframe execution designed strictly for ${s.market_conditions || 'current market environments'}. The logic here is absolute: we operate on ${s.entry_rules?.length || 0} entry triggers and ${s.exit_rules?.length || 0} hard exits to secure a non negotiable risk reward profile of ${rr}. `;

    if (s.philosophy) text += `\n\n**The Thesis:** ${s.philosophy} `;
    
    if (explanation?.edge) text += `\n\n**Where we get our edge:** We exploit this aggressively. ${explanation.edge} `;
    if (explanation?.when_it_works) text += `\n\n**Capitalization Targets:** This prints money specifically ${explanation.when_it_works.replace(/^(when |during |in )/i, "during ")} `;
    if (explanation?.when_it_fails) text += `\n\n**Where we bleed:** We cut our losses immediately if ${explanation.when_it_fails} `;

    if (metrics_expected) {
      text += `\n\n**Performance Mandate:** `;
      if (metrics_expected.target_sharpe) text += `We demand a Sharpe ratio holding above ${metrics_expected.target_sharpe}. `;
      if (metrics_expected.expected_cagr) text += `CAGR targets are locked at ${metrics_expected.expected_cagr}. `;
      text += `If it deviates from these metrics, the algo is permanently suspended.`;
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
                  QUANT_ENGINE V3 • ALGO_SYNTHESIS
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
              <div className="flex flex-col items-center justify-center bg-white/[0.01] rounded-xl border border-white/5 shadow-[inset_0_4px_20px_rgba(0,0,0,0.2)]">
                <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-indigo-400 to-violet-600 font-mono drop-shadow-2xl">{riskParams.risk_reward_ratio || '1:3'}</span>
                <span className="text-[10px] font-bold text-white/50 tracking-[0.2em] uppercase mt-2">R:R RATIO</span>
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
                <Code2 className="w-3.5 h-3.5" /> 
                {(() => {
                  const lang = code.includes('include') ? 'C++' : code.includes('fn ') ? 'Rust' : 'Python';
                  return `Generated ${lang} Protocol`;
                })()}
              </span>
              {showCode ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
            </button>
            {showCode && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}>
                {/* @ts-ignore */}
                <Highlight code={code} language={code.includes('include') ? 'cpp' : code.includes('fn ') ? 'rust' : 'python'}>
                  {({ className, style, tokens, getLineProps, getTokenProps }: any) => (
                    <pre className={`${className} p-6 text-[13px] font-medium leading-relaxed overflow-x-auto border-t border-white/10 shadow-inner custom-scrollbar selection:bg-indigo-500/30`} style={style}>
                      {tokens.map((line, i) => (
                        <div key={i} {...getLineProps({ line })} className="table-row">
                          <span className="table-cell text-right select-none opacity-30 pr-5 tracking-tighter w-8">{i + 1}</span>
                          <span className="table-cell">
                            {line.map((token, key) => (
                              <span key={key} {...getTokenProps({ token })} />
                            ))}
                          </span>
                        </div>
                      ))}
                    </pre>
                  )}
                </Highlight>
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
              <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-5 shadow-2xl relative overflow-hidden">
                <div className="text-[10px] text-white/50 tracking-[0.2em] uppercase mb-4 flex items-center justify-between z-10 relative">
                  <span>Institutional Equity Curve</span>
                  <span className="text-emerald-400 font-mono tracking-normal">TRUE PNL MODEL</span>
                </div>
                <div className="h-[280px] w-full z-10 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={backtestResult.equityCurve} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="eqGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.5} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="benchGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="day" stroke="rgba(255,255,255,0.2)" fontSize={10} tickFormatter={(val) => `D${val}`} minTickGap={30} />
                      <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} domain={['dataMin - 1000', 'dataMax + 1000']} tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px', fontFamily: 'monospace', backdropFilter: 'blur(8px)' }}
                        itemStyle={{ color: '#10b981' }}
                        labelStyle={{ color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}
                        formatter={(val: number) => [`$${val.toFixed(2)}`, 'Equity']}
                        labelFormatter={(label) => `Day ${label}`}
                      />
                      <Area type="monotone" dataKey="benchmark" stroke="#6366f1" strokeOpacity={0.4} strokeWidth={1} fillOpacity={1} fill="url(#benchGradient)" />
                      <Area type="monotone" dataKey="equity" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#eqGradient)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Monthly Returns Heatmap */}
              {backtestResult.monthlyReturns && backtestResult.monthlyReturns.length > 0 && (
                <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-5 shadow-2xl relative">
                  <div className="text-[10px] text-white/50 tracking-[0.2em] uppercase mb-4">Monthly Returns Distribution</div>
                  <div className="flex flex-wrap gap-2">
                    {backtestResult.monthlyReturns.map((mr, i) => {
                      const val = mr.return;
                      const abs = Math.abs(val);
                      
                      // Institutional graded heat index
                      const heatColor = val > 0 
                        ? `rgba(16, 185, 129, ${0.1 + (abs / 20)})` 
                        : `rgba(225, 29, 72, ${0.1 + (abs / 20)})`;
                      const borderColor = val > 0 
                        ? `rgba(16, 185, 129, ${0.3 + (abs / 10)})` 
                        : `rgba(225, 29, 72, ${0.3 + (abs / 10)})`;
                      const textColor = val > 0 ? '#34d399' : '#fb7185';
                      
                      return (
                        <div key={i} className="w-14 h-12 rounded flex flex-col items-center justify-center border transition-all hover:scale-105 cursor-default"
                          style={{ backgroundColor: heatColor, borderColor: borderColor }}
                          title={`${mr.month} Execution: ${val > 0 ? '+' : ''}${val.toFixed(2)}%`}>
                          <span className="text-[8px] text-white/60 tracking-widest">{mr.month}</span>
                          <span className="text-[10px] font-mono font-bold" style={{ color: textColor }}>
                            {val > 0 ? '+' : ''}{val.toFixed(1)}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Retail Translation & Drawdown Profile */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
                {/* Retail Translation */}
                <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-5 shadow-2xl relative h-full flex flex-col">
                  <div className="text-[10px] text-white/50 tracking-[0.2em] uppercase mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    Plain English Retail Translation
                  </div>
                  <div className="flex-1 text-[13px] font-sans leading-relaxed text-[#ddd] p-5 bg-[#111] rounded-lg border border-white/5 border-l-4 border-l-amber-500 shadow-inner flex flex-col justify-center">
                    <p className="italic">"{getRetailSummary(backtestResult)}"</p>
                  </div>
                </div>
                
                {/* Drawdown Profile */}
                <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-5 shadow-2xl relative h-full">
                  <div className="text-[10px] text-white/50 tracking-[0.2em] uppercase mb-4 flex items-center gap-2">
                    <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
                    Historical Drawdown Profile
                  </div>
                  <div className="h-[200px] w-full mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={(() => {
                        let peak = 0;
                        return backtestResult.equityCurve.map(p => {
                          if (p.equity > peak) peak = p.equity;
                          let dd = peak > 0 ? ((p.equity - peak) / peak) * 100 : 0;
                          return { day: p.day, drawdown: -Math.abs(dd) };
                        });
                      })()} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="day" stroke="rgba(255,255,255,0.2)" fontSize={9} tickFormatter={(val) => `D${val}`} minTickGap={30} />
                        <YAxis stroke="rgba(255,255,255,0.2)" fontSize={9} tickFormatter={(val) => `${val.toFixed(0)}%`} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: '#e11d48', borderRadius: '8px', fontSize: '11px', fontFamily: 'monospace' }}
                          itemStyle={{ color: '#fb7185' }}
                          labelStyle={{ color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}
                          formatter={(val: number) => [`${val.toFixed(2)}%`, 'Max DD']}
                          labelFormatter={(label) => `Day ${label}`}
                        />
                        <Bar dataKey="drawdown" fill="#e11d48" radius={[0, 0, 2, 2]} maxBarSize={15} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

            </motion.div>
          )}
        </div>

        {/* ===== MAX DRAWDOWN STRUCTURAL WARN ===== */}
        {backtestResult && backtestResult.maxDrawdown > 20 && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} 
            className="mt-6 bg-red-950/40 border border-red-500/30 p-4 rounded-md flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5 animate-pulse" />
            <div>
              <h4 className="text-red-400 text-sm font-bold tracking-widest uppercase mb-1">High Structural Drawdown Warning</h4>
              <p className="text-red-300/80 text-xs leading-relaxed font-mono">
                This algorithm exhibits a historical maximum drawdown of <span className="text-red-400 font-bold">{backtestResult.maxDrawdown.toFixed(1)}%</span>. 
                Deploying this structural logic live is <span className="font-bold underline">EXTREMELY DANGEROUS</span>. 
                Suggest applying tighter stop-losses or volume-based execution confirmation.
              </p>
            </div>
          </motion.div>
        )}

        {/* ===== ROW 5.5: WALK-FORWARD TRUTH MACHINE ===== */}
        <div className="mt-8 border border-white/10 rounded-xl overflow-hidden shadow-2xl relative">
          <WalkForwardBacktest initialThesis={originalPrompt || strat?.philosophy} />
        </div>

        {/* ===== ROW 6: NLP Explainer (Newspaper Format - Dark Mode) ===== */}
        <div className="w-full bg-[#0a0a0a] text-[#f8f7f3] p-8 md:p-12 border-t-[12px] border-[#1e1e1e] shadow-2xl relative overflow-hidden mt-8 rounded-sm ring-1 ring-white/5">
          <div className="border-b-4 border-double border-white/20 pb-6 mb-8 text-center">
            <div className="text-xs font-bold uppercase tracking-[0.3em] text-[#888] mb-3 font-sans">
              Quantitative Intelligence Division • Market Wrap
            </div>
            <h2 className="text-3xl lg:text-5xl font-extrabold font-serif tracking-tight leading-tight mb-2 uppercase text-white shadow-black drop-shadow-md" style={{ fontVariant: 'small-caps' }}>
              {strat?.name || 'Structural Market Report'}
            </h2>
            <div className="flex flex-wrap justify-center items-center gap-4 text-xs font-serif text-[#999] mt-4 uppercase tracking-widest border-t border-b border-white/10 py-2">
              <span>Vol. XLVII No. {new Date().getDate()}</span>
              <span className="hidden md:inline">•</span>
              <span>{formatDt(new Date(), 'EEEE, MMMM do, yyyy')}</span>
              <span className="hidden md:inline">•</span>
              <span>Proprietary Desk</span>
            </div>
          </div>
          <div className="md:columns-2 lg:columns-3 gap-8 text-[15px] leading-relaxed font-serif text-justify text-[#ccc] selection:bg-[#f8f7f3] selection:text-[#0a0a0a]" style={{ columnRule: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="float-left text-7xl font-extrabold leading-[0.8] mr-4 mt-2 font-serif text-white">
              {nlpSummary.charAt(0)}
            </div>
            {renderBoldText(nlpSummary.substring(1))}
            
            <div className="mt-8 mb-6 p-6 bg-[#111111] text-[#ddd] border-l-4 border-emerald-500 font-sans break-inside-avoid shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-5 pointer-events-none">
                <Target className="w-20 h-20" />
              </div>
              <h4 className="text-[10px] uppercase tracking-[0.2em] text-emerald-400 mb-4 font-bold border-b border-white/10 pb-2 flex items-center gap-2">
                <Zap className="w-3 h-3" /> Execution Protocol
              </h4>
              <div className="text-sm space-y-3 relative z-10">
                <div className="flex justify-between items-center pb-1 border-b border-white/5">
                  <span className="text-white/40 text-xs">Target Market:</span> 
                  <strong className="font-mono text-white text-xs">{strat?.market_conditions || 'Aggregate'}</strong>
                </div>
                <div className="flex justify-between items-center pb-1 border-b border-white/5">
                  <span className="text-white/40 text-xs">Time Structure:</span> 
                  <strong className="font-mono text-emerald-400 text-xs">{strat?.timeframe || 'Real-time'}</strong>
                </div>
                <div className="flex justify-between items-center pb-1 border-b border-white/5">
                  <span className="text-white/40 text-xs">Asset Universe:</span> 
                  <strong className="font-mono text-white text-xs">{strat?.asset_classes?.[0] || 'Equities'}</strong>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-8 border-t border-white/10 pt-5 flex justify-between items-center opacity-50 font-serif text-[10px] px-2 text-[#888]">
            <span>© {new Date().getFullYear()} QUANTSCRIPT Intelligence</span>
            <span className="tracking-widest uppercase">Uncensored Algorithmic Execution Protocol</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
