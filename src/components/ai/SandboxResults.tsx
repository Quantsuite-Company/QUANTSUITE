import { motion } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown, Target, Shield, Activity, Award } from 'lucide-react';
import type { BacktestResult } from '@/lib/backtestEngine';

interface SandboxResultsProps {
  result: BacktestResult;
  theme?: 'athena' | 'market' | 'strategy';
}

const themeColors = {
  athena: { primary: '#38bdf8', accent: '#0ea5e9', positive: '#34d399', negative: '#f87171', bg: 'from-sky-500/10 via-blue-500/5 to-cyan-500/10', border: 'border-sky-500/30' },
  market: { primary: '#34d399', accent: '#10b981', positive: '#34d399', negative: '#f87171', bg: 'from-emerald-500/10 via-green-500/5 to-teal-500/10', border: 'border-emerald-500/30' },
  strategy: { primary: '#22d3ee', accent: '#06b6d4', positive: '#34d399', negative: '#f87171', bg: 'from-cyan-500/10 via-teal-500/5 to-blue-500/10', border: 'border-cyan-500/30' },
};

export function SandboxResults({ result, theme = 'strategy' }: SandboxResultsProps) {
  const colors = themeColors[theme];
  const isProfit = result.totalReturn > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`my-8 rounded-2xl bg-gradient-to-br ${colors.bg} border ${colors.border} overflow-hidden`}
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-white/5">
            <Target className="w-5 h-5" style={{ color: colors.primary }} />
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: colors.primary }}>
              Sandbox Backtest: {result.strategyName}
            </h3>
            <p className="text-xs text-muted-foreground">{result.totalTrades} trades simulated</p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-bold ${isProfit ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
          {isProfit ? '+' : ''}{result.totalReturn}%
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/5">
        {[
          { label: 'Sharpe Ratio', value: result.sharpeRatio.toFixed(2), icon: Award, good: result.sharpeRatio > 1 },
          { label: 'Max Drawdown', value: `-${result.maxDrawdown}%`, icon: Shield, good: result.maxDrawdown < 15 },
          { label: 'Win Rate', value: `${result.winRate}%`, icon: TrendingUp, good: result.winRate > 55 },
          { label: 'Profit Factor', value: result.profitFactor.toFixed(2), icon: Activity, good: result.profitFactor > 1.5 },
        ].map((m, i) => (
          <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.1 }} className="p-4 bg-card/20">
            <div className="flex items-center gap-2 mb-1">
              <m.icon className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{m.label}</span>
            </div>
            <span className={`font-mono text-lg font-bold ${m.good ? 'text-emerald-400' : 'text-rose-400'}`}>{m.value}</span>
          </motion.div>
        ))}
      </div>

      {/* Equity Curve */}
      <div className="px-6 py-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Equity Curve vs Benchmark</p>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={result.equityCurve}>
            <defs>
              <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors.primary} stopOpacity={0.3} />
                <stop offset="95%" stopColor={colors.primary} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="day" stroke="#666" fontSize={10} tickLine={false} />
            <YAxis stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ backgroundColor: 'rgba(15,20,30,0.95)', border: `1px solid ${colors.primary}40`, borderRadius: 8, fontSize: 12 }} />
            <Area type="monotone" dataKey="equity" stroke={colors.primary} strokeWidth={2} fill="url(#eqGrad)" name="Strategy" />
            <Line type="monotone" dataKey="benchmark" stroke="#666" strokeWidth={1} strokeDasharray="5 5" dot={false} name="Benchmark" />
            <ReferenceLine y={100000} stroke="#444" strokeDasharray="3 3" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly Returns */}
      {result.monthlyReturns.length > 0 && (
        <div className="px-6 py-4 border-t border-white/5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Monthly Returns</p>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={result.monthlyReturns}>
              <XAxis dataKey="month" stroke="#666" fontSize={10} tickLine={false} />
              <YAxis stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: 'rgba(15,20,30,0.95)', border: `1px solid ${colors.primary}40`, borderRadius: 8, fontSize: 12 }} />
              <ReferenceLine y={0} stroke="#555" />
              <Bar dataKey="return" radius={[3, 3, 0, 0]} fill={colors.primary}
                // Color bars based on positive/negative
                shape={(props: any) => {
                  const fill = props.return >= 0 ? colors.positive : colors.negative;
                  return <rect {...props} fill={fill} />;
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Footer metrics */}
      <div className="px-6 py-3 border-t border-white/5 flex items-center gap-6 text-xs text-muted-foreground">
        <span>Avg Win: <span className="text-emerald-400 font-mono">+{result.avgWin}%</span></span>
        <span>Avg Loss: <span className="text-rose-400 font-mono">{result.avgLoss}%</span></span>
        <span>Avg Hold: <span className="font-mono text-foreground">{result.avgHoldingPeriod}d</span></span>
        <span>Annual: <span className={`font-mono ${result.annualizedReturn > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{result.annualizedReturn > 0 ? '+' : ''}{result.annualizedReturn}%</span></span>
      </div>
    </motion.div>
  );
}

export default SandboxResults;
