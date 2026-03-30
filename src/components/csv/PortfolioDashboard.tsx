import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Target, Wallet, DollarSign, Percent } from 'lucide-react';
import { PortfolioMetrics } from '@/lib/portfolioCalculator';
import { getWinRateCommentary, getProfitFactorCommentary, getReturnCommentary } from '@/lib/insightRules';

interface PortfolioDashboardProps {
  metrics: PortfolioMetrics;
  currency?: '₹' | '$';
  /**
   * Whether this portfolio has real P&L data (CSV from broker) or is a fresh allocation
   * from Portfolio Builder where P&L is inherently zero.
   */
  hasRealPnL?: boolean;
}

export const PortfolioDashboard = ({ metrics, currency = '₹', hasRealPnL = true }: PortfolioDashboardProps) => {
  const formatCurrency = (value: number) => {
    if (currency === '$') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    } else {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    }
  };

  const formatPercent = (value: number) => {
    return value.toFixed(2) + '%';
  };

  const isFreshAllocation = !hasRealPnL || (
    metrics.totalPnL === 0 &&
    metrics.winningTrades === 0 &&
    metrics.losingTrades === 0
  );

  const dashboardCards = [
    {
      title: 'Total P&L',
      value: formatCurrency(metrics.totalPnL),
      icon: metrics.totalPnL >= 0 ? TrendingUp : TrendingDown,
      color: isFreshAllocation
        ? 'text-muted-foreground'
        : metrics.totalPnL >= 0
          ? 'text-green-500'
          : 'text-red-500',
      bgColor: isFreshAllocation
        ? 'bg-muted/10'
        : metrics.totalPnL >= 0
          ? 'bg-green-500/10'
          : 'bg-red-500/10',
      subtitle: isFreshAllocation
        ? 'Fresh allocation – no realized P&L yet'
        : `${metrics.winningTrades}W / ${metrics.losingTrades}L`
    },
    {
      title: 'Win Rate',
      value: hasRealPnL ? formatPercent(metrics.winRate) : 'N/A',
      icon: Target,
      color: hasRealPnL
        ? metrics.winRate >= 60
          ? 'text-green-500'
          : metrics.winRate >= 50
            ? 'text-yellow-500'
            : 'text-red-500'
        : 'text-muted-foreground',
      bgColor: hasRealPnL
        ? metrics.winRate >= 60
          ? 'bg-green-500/10'
          : metrics.winRate >= 50
            ? 'bg-yellow-500/10'
            : 'bg-red-500/10'
        : 'bg-muted/10',
      subtitle: hasRealPnL
        ? getWinRateCommentary(metrics.winRate)
        : 'Win rate unavailable without closed trades'
    },
    {
      title: 'Profit Factor',
      value: hasRealPnL
        ? metrics.profitFactor === Infinity
          ? '∞'
          : metrics.profitFactor.toFixed(2)
        : 'N/A',
      icon: DollarSign,
      color: hasRealPnL
        ? metrics.profitFactor >= 2
          ? 'text-green-500'
          : metrics.profitFactor >= 1
            ? 'text-yellow-500'
            : 'text-red-500'
        : 'text-muted-foreground',
      bgColor: hasRealPnL
        ? metrics.profitFactor >= 2
          ? 'bg-green-500/10'
          : metrics.profitFactor >= 1
            ? 'bg-yellow-500/10'
            : 'bg-red-500/10'
        : 'bg-muted/10',
      subtitle: hasRealPnL
        ? getProfitFactorCommentary(metrics.profitFactor)
        : 'Requires realized profits and losses'
    },
    {
      title: 'Capital Deployed',
      value: formatCurrency(metrics.capitalDeployed),
      icon: Wallet,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      subtitle: `Current: ${formatCurrency(metrics.currentValue)}`
    },
    {
      title: 'Return %',
      value: formatPercent(metrics.returnPercent),
      icon: Percent,
      color: metrics.returnPercent >= 10
        ? 'text-green-500'
        : metrics.returnPercent >= 0
          ? 'text-yellow-500'
          : 'text-red-500',
      bgColor: metrics.returnPercent >= 10
        ? 'bg-green-500/10'
        : metrics.returnPercent >= 0
          ? 'bg-yellow-500/10'
          : 'bg-red-500/10',
      subtitle: getReturnCommentary(metrics.returnPercent)
    },
    {
      title: 'Avg Win / Loss',
      value: hasRealPnL
        ? `${formatCurrency(metrics.avgWin)} / ${formatCurrency(metrics.avgLoss)}`
        : 'N/A',
      icon: TrendingUp,
      color: hasRealPnL
        ? metrics.avgWin > metrics.avgLoss
          ? 'text-green-500'
          : 'text-red-500'
        : 'text-muted-foreground',
      bgColor: hasRealPnL
        ? metrics.avgWin > metrics.avgLoss
          ? 'bg-green-500/10'
          : 'bg-red-500/10'
        : 'bg-muted/10',
      subtitle: hasRealPnL
        ? metrics.avgWin > metrics.avgLoss * 2
          ? '🎯 Excellent R:R'
          : 'Need improvement'
        : 'Average win/loss requires realized P&L'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Portfolio Health Dashboard</h2>
          <p className="text-muted-foreground mt-1">
            Analyzing {metrics.totalTrades} positions with pure logic
          </p>
        </div>
        <Badge
          variant={isFreshAllocation ? 'secondary' : metrics.totalPnL >= 0 ? 'default' : 'destructive'}
          className="text-lg px-4 py-2"
        >
          {isFreshAllocation
            ? '🧱 New Allocation'
            : metrics.totalPnL >= 0
              ? '📈 Profitable'
              : '📉 In Loss'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dashboardCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${card.bgColor}`}>
                    <Icon className={`w-5 h-5 ${card.color}`} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold mb-1 ${card.color}`}>
                  {card.value}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {card.subtitle}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
