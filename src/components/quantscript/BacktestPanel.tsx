import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Activity, Target, AlertCircle } from 'lucide-react';

interface BacktestPanelProps {
  data?: {
    metrics: any;
    equityCurve: any[];
    trades: any[];
    monthlyReturns?: any[];
  };
  isLoading?: boolean;
  symbol?: string;
  startDate?: string;
  endDate?: string;
}

export const BacktestPanel = ({ data, isLoading, symbol, startDate, endDate }: BacktestPanelProps) => {
  // Only display real backtest data - no fallback
  const equityCurve = data?.equityCurve || [];

  const metrics = data?.metrics || {
    totalReturn: 0,
    sharpeRatio: 0,
    maxDrawdown: 0,
    winRate: 0,
    totalTrades: 0,
    profitFactor: 0,
  };

  const monthlyReturns = data?.monthlyReturns || [];

  return (
    <Card className="p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-slate-700">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-br from-success to-success/60 rounded-lg">
          <Activity className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-success via-accent to-success bg-clip-text text-transparent">
            Backtest Results
          </h2>
          <p className="text-sm text-muted-foreground">
            {data ? `${symbol} | ${startDate} to ${endDate}` : 'Historical simulation with realistic slippage & costs'}
          </p>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <span className="ml-3 text-muted-foreground">Running backtest...</span>
        </div>
      )}
      
      {!isLoading && (
        <>
          {/* Warning for zero trades */}
          {data && data.metrics.totalTrades === 0 && (
            <div className="mb-6 p-5 bg-destructive/10 border-2 border-destructive/30 rounded-xl flex items-start gap-4 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="h-6 w-6 text-destructive shrink-0 mt-1" />
              <div>
                <p className="font-bold text-destructive text-lg mb-2">No Trades Generated</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The strategy conditions were too strict for this time period and symbol. Try:
                  <span className="block mt-2 ml-4">
                    • Adjusting RSI thresholds (make them more lenient)<br/>
                    • Using a different date range with more volatility<br/>
                    • Testing on a more liquid stock (e.g., TCS.NS, INFY.NS)
                  </span>
                </p>
              </div>
            </div>
          )}
          
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            <MetricCard
              label="Total Return"
              value={`${parseFloat(metrics.totalReturn || 0).toFixed(1)}%`}
              icon={<TrendingUp className="h-4 w-4" />}
              positive={parseFloat(metrics.totalReturn || 0) > 0}
            />
            <MetricCard
              label="Sharpe Ratio"
              value={parseFloat(metrics.sharpeRatio || 0).toFixed(2)}
              icon={<Activity className="h-4 w-4" />}
              positive={parseFloat(metrics.sharpeRatio || 0) > 1}
            />
            <MetricCard
              label="Sortino Ratio"
              value={parseFloat(metrics.sortinoRatio || 0).toFixed(2)}
              icon={<Activity className="h-4 w-4" />}
              positive={parseFloat(metrics.sortinoRatio || 0) > 1}
            />
            <MetricCard
              label="Max Drawdown"
              value={`${parseFloat(metrics.maxDrawdown || 0).toFixed(1)}%`}
              icon={<TrendingDown className="h-4 w-4" />}
              positive={false}
            />
            <MetricCard
              label="Win Rate"
              value={`${parseFloat(metrics.winRate || 0).toFixed(1)}%`}
              icon={<Target className="h-4 w-4" />}
              positive={parseFloat(metrics.winRate || 0) > 50}
            />
            <MetricCard
              label="Total Trades"
              value={String(metrics.totalTrades || 0)}
              icon={<Activity className="h-4 w-4" />}
              positive={true}
            />
          </div>
          
          {/* Additional Metrics Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <MetricCard
              label="Profit Factor"
              value={parseFloat(metrics.profitFactor || 0).toFixed(2)}
              icon={<Target className="h-4 w-4" />}
              positive={parseFloat(metrics.profitFactor || 0) > 1}
            />
            <MetricCard
              label="Expectancy"
              value={`₹${parseFloat(metrics.expectancy || 0).toFixed(0)}`}
              icon={<TrendingUp className="h-4 w-4" />}
              positive={parseFloat(metrics.expectancy || 0) > 0}
            />
            <MetricCard
              label="Avg Win"
              value={`₹${parseFloat(metrics.avgWin || 0).toFixed(0)}`}
              icon={<TrendingUp className="h-4 w-4" />}
              positive={true}
            />
            <MetricCard
              label="Avg Loss"
              value={`₹${parseFloat(metrics.avgLoss || 0).toFixed(0)}`}
              icon={<TrendingDown className="h-4 w-4" />}
              positive={false}
            />
          </div>
        </>
      )}

      {/* Equity Curve */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Equity Curve vs Benchmark
        </h3>
        <div className="bg-slate-950/50 rounded-lg p-4 border border-slate-700">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={equityCurve}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" opacity={0.3} />
              <XAxis 
                dataKey="day" 
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="equity"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
                name="Strategy"
              />
              <Line
                type="monotone"
                dataKey="benchmark"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={2}
                dot={false}
                strokeDasharray="5 5"
                name="Benchmark"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Returns */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Activity className="h-5 w-5 text-accent" />
          Monthly Returns Distribution
        </h3>
        <div className="bg-slate-950/50 rounded-lg p-4 border border-slate-700">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthlyReturns}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" opacity={0.3} />
              <XAxis 
                dataKey="month" 
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `${value.toFixed(0)}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Area
                type="monotone"
                dataKey="return"
                stroke="hsl(var(--accent))"
                fill="hsl(var(--accent))"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {!isLoading && data?.trades && data.trades.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Recent Trades
          </h3>
          <div className="bg-slate-950/50 rounded-lg border border-slate-700 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-700">
                <tr>
                  <th className="text-left p-3 text-muted-foreground">Entry</th>
                  <th className="text-left p-3 text-muted-foreground">Exit</th>
                  <th className="text-left p-3 text-muted-foreground">Type</th>
                  <th className="text-right p-3 text-muted-foreground">Entry ₹</th>
                  <th className="text-right p-3 text-muted-foreground">Exit ₹</th>
                  <th className="text-right p-3 text-muted-foreground">P&L</th>
                  <th className="text-right p-3 text-muted-foreground">Hold</th>
                  <th className="text-left p-3 text-muted-foreground">Exit Reason</th>
                  <th className="text-right p-3 text-muted-foreground">Costs</th>
                </tr>
              </thead>
              <tbody>
                {data.trades.slice(-10).reverse().map((trade: any, idx: number) => (
                  <tr key={idx} className="border-b border-slate-700/50 last:border-0 hover:bg-slate-800/50">
                    <td className="p-3 text-muted-foreground text-xs">{trade.entryDate}</td>
                    <td className="p-3 text-muted-foreground text-xs">{trade.exitDate}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        parseFloat(trade.pnl) > 0 ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
                      }`}>
                        {parseFloat(trade.pnl) > 0 ? 'WIN' : 'LOSS'}
                      </span>
                    </td>
                    <td className="p-3 text-right text-foreground">₹{trade.entryPrice}</td>
                    <td className="p-3 text-right text-foreground">₹{trade.exitPrice}</td>
                    <td className={`p-3 text-right font-semibold ${
                      parseFloat(trade.pnl) > 0 ? 'text-success' : 'text-destructive'
                    }`}>
                      ₹{trade.pnl} ({trade.pnlPercent}%)
                    </td>
                    <td className="p-3 text-right text-muted-foreground text-xs">{trade.holdingPeriod}d</td>
                    <td className="p-3 text-muted-foreground text-xs">{trade.exitReason}</td>
                    <td className="p-3 text-right text-muted-foreground text-xs">₹{trade.costs}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!isLoading && data?.metrics && (
        <div className="grid md:grid-cols-3 gap-4">
          <StatCard label="Winning Trades" value={String(data.metrics.winningTrades || 0)} positive />
          <StatCard label="Losing Trades" value={String(data.metrics.losingTrades || 0)} negative />
          <StatCard 
            label="Total P&L" 
            value={`₹${((parseFloat(String(data.metrics.totalProfit || 0)) - parseFloat(String(data.metrics.totalLoss || 0)))).toFixed(2)}`} 
          />
        </div>
      )}

      {!isLoading && !data && (
        <div className="mt-6 p-4 bg-warning/5 border border-warning/20 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-warning mb-1">
              No Backtest Data
            </p>
            <p className="text-muted-foreground">
              Run a backtest to see real historical results. Past performance does not guarantee future results. Paper trading required before live deployment.
            </p>
          </div>
        </div>
      )}
      {!isLoading && data && (
        <div className="mt-6 p-4 bg-success/5 border border-success/20 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-success shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-success mb-1">
              Real Backtest Results
            </p>
            <p className="text-muted-foreground">
              These are real historical results. Past performance does not guarantee future results. Slippage and transaction costs are estimated. Paper trading required before live deployment.
            </p>
          </div>
        </div>
      )}
    </Card>
  );
};

const MetricCard = ({ 
  label, 
  value, 
  icon, 
  positive 
}: { 
  label: string; 
  value: string; 
  icon: React.ReactNode; 
  positive: boolean;
}) => (
  <div className={`group relative p-5 rounded-xl border-2 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${
    positive 
      ? 'bg-gradient-to-br from-success/10 via-success/5 to-transparent border-success/30 hover:border-success/50' 
      : 'bg-gradient-to-br from-destructive/10 via-destructive/5 to-transparent border-destructive/30 hover:border-destructive/50'
  }`}>
    <div className="flex items-center justify-between mb-2">
      <span className={`p-2 rounded-lg transition-transform group-hover:scale-110 ${
        positive ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
      }`}>
        {icon}
      </span>
    </div>
    <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
      {label}
    </div>
    <div className={`text-2xl font-black tracking-tight ${
      positive ? 'text-success' : 'text-destructive'
    }`}>
      {value}
    </div>
  </div>
);

const StatCard = ({ 
  label, 
  value, 
  positive, 
  negative 
}: { 
  label: string; 
  value: string | number; 
  positive?: boolean; 
  negative?: boolean;
}) => (
  <div className="p-5 bg-gradient-to-br from-slate-900/80 to-slate-950 rounded-xl border-2 border-slate-700/50 hover:border-slate-600 transition-all hover:shadow-xl">
    <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{label}</div>
    <div className={`text-3xl font-black tracking-tight ${
      positive ? 'text-success' : negative ? 'text-destructive' : 'text-foreground'
    }`}>
      {value}
    </div>
  </div>
);
