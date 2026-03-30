import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, ArrowLeft, Sparkles, Zap,
  TrendingUp, TrendingDown, AlertTriangle, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

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
  validation?: {
    safe: boolean;
    message: string;
  };
}

interface StrategyAwakeningProps {
  strategy: GeneratedStrategy;
  onBacktest: (symbol: string, startDate: string, endDate: string) => void;
  onReset: () => void;
  isBacktesting: boolean;
  backtestData: any;
  config: {
    maxPositionSize: number;
    stopLoss: number;
    takeProfit: number;
  };
}

export function StrategyAwakening({ 
  strategy, 
  onBacktest, 
  onReset, 
  isBacktesting, 
  backtestData,
}: StrategyAwakeningProps) {
  const { strategy: strat, explanation, backtest_config, metrics_expected, validation } = strategy;
  
  const [backtestSymbol, setBacktestSymbol] = useState(backtest_config?.suggested_symbols?.[0] || 'AAPL');
  const [startDate, setStartDate] = useState('2020-01-01');
  const [endDate, setEndDate] = useState('2024-01-01');

  const handleRunBacktest = () => {
    onBacktest(backtestSymbol, startDate, endDate);
  };

  // Determine strategy type for theming
  const isMomentum = strat.philosophy?.toLowerCase().includes('momentum') || 
                     strat.name?.toLowerCase().includes('momentum') ||
                     strat.name?.toLowerCase().includes('breakout');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-foreground relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-0 left-1/3 w-[500px] h-[500px] ${isMomentum ? 'bg-amber-500/10' : 'bg-cyan-500/10'} rounded-full filter blur-[150px]`} />
        <div className={`absolute bottom-0 right-1/3 w-[400px] h-[400px] ${isMomentum ? 'bg-orange-500/10' : 'bg-blue-500/10'} rounded-full filter blur-[150px]`} />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-6 py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className={`w-4 h-4 ${isMomentum ? 'text-amber-400' : 'text-cyan-400'}`} />
            <span className={`text-sm font-medium ${isMomentum ? 'text-amber-400' : 'text-cyan-400'}`}>Strategy Awakened</span>
            {validation?.safe && (
              <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
                <Check className="w-3 h-3" /> Verified Safe
              </span>
            )}
          </div>
          <h1 className={`text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${isMomentum ? 'from-amber-400 to-orange-500' : 'from-cyan-400 to-blue-500'}`}>
            {strat.name}
          </h1>
        </motion.div>

        {/* Philosophy - Lead paragraph */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-lg text-foreground/90 leading-relaxed mb-6"
        >
          {strat.philosophy}
        </motion.p>

        {/* Market Conditions */}
        {strat.market_conditions && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-base text-foreground/80 mb-6"
          >
            <span className="text-muted-foreground">Market Conditions:</span> {strat.market_conditions}
          </motion.p>
        )}

        {/* Entry Rules - Prose style */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <h3 className="text-sm font-medium text-emerald-400 uppercase tracking-wider mb-3">Entry Conditions</h3>
          <div className="space-y-2">
            {strat.entry_rules.map((rule, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + idx * 0.05 }}
                className="flex items-start gap-3 text-foreground/85"
              >
                <TrendingUp className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>{rule}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Exit Rules - Prose style */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <h3 className="text-sm font-medium text-rose-400 uppercase tracking-wider mb-3">Exit Conditions</h3>
          <div className="space-y-2">
            {strat.exit_rules.map((rule, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 + idx * 0.05 }}
                className="flex items-start gap-3 text-foreground/85"
              >
                <TrendingDown className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
                <span>{rule}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Risk Parameters - Inline metrics */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8 p-4 rounded-lg bg-slate-900/50 border border-white/10"
        >
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Risk Management</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {strat.risk_parameters.stop_loss_pct && (
              <div>
                <span className="text-xs text-muted-foreground block">Stop Loss</span>
                <span className="font-mono text-lg text-rose-400">{strat.risk_parameters.stop_loss_pct}%</span>
              </div>
            )}
            {strat.risk_parameters.take_profit_pct && (
              <div>
                <span className="text-xs text-muted-foreground block">Take Profit</span>
                <span className="font-mono text-lg text-emerald-400">{strat.risk_parameters.take_profit_pct}%</span>
              </div>
            )}
            {strat.risk_parameters.max_position_pct && (
              <div>
                <span className="text-xs text-muted-foreground block">Max Position</span>
                <span className="font-mono text-lg text-foreground">{strat.risk_parameters.max_position_pct}%</span>
              </div>
            )}
            {strat.risk_parameters.risk_reward_ratio && (
              <div>
                <span className="text-xs text-muted-foreground block">Risk:Reward</span>
                <span className="font-mono text-lg text-foreground">{strat.risk_parameters.risk_reward_ratio}</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Expected Metrics */}
        {metrics_expected && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="mb-8"
          >
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Expected Performance</h3>
            <div className="flex flex-wrap gap-3">
              {metrics_expected.target_sharpe && (
                <span className="px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-sm">
                  Sharpe: {metrics_expected.target_sharpe}
                </span>
              )}
              {metrics_expected.target_win_rate && (
                <span className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">
                  Win Rate: {metrics_expected.target_win_rate}
                </span>
              )}
              {metrics_expected.expected_max_drawdown && (
                <span className="px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm">
                  Max DD: {metrics_expected.expected_max_drawdown}
                </span>
              )}
              {metrics_expected.expected_cagr && (
                <span className="px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm">
                  CAGR: {metrics_expected.expected_cagr}
                </span>
              )}
            </div>
          </motion.div>
        )}

        {/* Edge Explanation */}
        {explanation?.edge && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-6"
          >
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">The Edge</h3>
            <p className="text-foreground/85">{explanation.edge}</p>
          </motion.div>
        )}

        {/* Risks */}
        {explanation?.key_risks && explanation.key_risks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="mb-8 p-4 rounded-lg bg-rose-500/5 border border-rose-500/20"
          >
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <h3 className="text-sm font-medium text-rose-400">Key Risks</h3>
            </div>
            <ul className="space-y-1 text-foreground/80 text-sm">
              {explanation.key_risks.map((risk, idx) => (
                <li key={idx}>• {risk}</li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Backtest Results */}
        {backtestData && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Backtest Results</h3>
            
            {/* Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div>
                <span className="text-xs text-muted-foreground block">Total Return</span>
                <span className={`font-mono text-xl ${backtestData.metrics?.totalReturn >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {backtestData.metrics?.totalReturn >= 0 ? '+' : ''}{backtestData.metrics?.totalReturn?.toFixed(2)}%
                </span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Sharpe Ratio</span>
                <span className="font-mono text-xl text-foreground">{backtestData.metrics?.sharpeRatio?.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Max Drawdown</span>
                <span className="font-mono text-xl text-rose-400">{backtestData.metrics?.maxDrawdown?.toFixed(2)}%</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Win Rate</span>
                <span className="font-mono text-xl text-foreground">{backtestData.metrics?.winRate?.toFixed(1)}%</span>
              </div>
            </div>

            {/* Equity Curve */}
            {backtestData.equityCurve && (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={backtestData.equityCurve}>
                  <defs>
                    <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Area type="monotone" dataKey="equity" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#equityGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </motion.div>
        )}

        {/* Backtest Controls */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-8 p-4 rounded-lg bg-slate-900/50 border border-white/10"
        >
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Run Backtest</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Symbol</label>
              <select
                value={backtestSymbol}
                onChange={(e) => setBacktestSymbol(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg bg-slate-800/50 border border-white/10 text-foreground"
              >
                {(backtest_config?.suggested_symbols || ['AAPL', 'RELIANCE.NS', 'TCS.NS']).map(sym => (
                  <option key={sym} value={sym}>{sym}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-slate-800/50 border-white/10 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-slate-800/50 border-white/10 text-sm"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleRunBacktest}
                disabled={isBacktesting}
                className={`w-full bg-gradient-to-r ${isMomentum ? 'from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600' : 'from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600'} text-white`}
              >
                {isBacktesting ? (
                  <span className="flex items-center gap-2">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                      <Zap className="w-4 h-4" />
                    </motion.div>
                    Running...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Play className="w-4 h-4" /> Run Backtest
                  </span>
                )}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="pt-6 border-t border-white/10"
        >
          <button
            onClick={onReset}
            className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Create another strategy
          </button>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground/50"
        >
          <Zap className="w-3 h-3" />
          <span>QuantSuite • First-ever NL-to-Backtest Engine</span>
        </motion.div>
      </div>
    </div>
  );
}

export default StrategyAwakening;
