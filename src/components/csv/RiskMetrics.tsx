import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ShieldTick, Warning2, Chart } from 'iconsax-react';
import { RiskMetrics as RiskMetricsType, EquityVsOptions } from '@/lib/portfolioCalculator';
import { getConcentrationCommentary } from '@/lib/insightRules';
import { IconWrapper } from '@/components/icons/IconWrapper';

interface RiskMetricsProps {
  riskMetrics: RiskMetricsType;
  equityVsOptions: EquityVsOptions;
}

export function RiskMetrics({ riskMetrics, equityVsOptions }: RiskMetricsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercent = (value: number) => value.toFixed(1) + '%';

  const concentrationLevel = 
    riskMetrics.concentrationIndex < 0.15 ? 'Low' :
    riskMetrics.concentrationIndex < 0.25 ? 'Medium' : 'High';

  const concentrationColor = 
    riskMetrics.concentrationIndex < 0.15 ? 'text-green-500' :
    riskMetrics.concentrationIndex < 0.25 ? 'text-yellow-500' : 'text-red-500';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <IconWrapper 
          icon={<ShieldTick variant="Bulk" />}
          variant="gradient"
          size="lg"
          color="info"
        />
        <h2 className="text-2xl font-bold">Risk & Concentration Analysis</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <IconWrapper 
                  icon={<Chart variant="Bulk" />}
                  variant="gradient"
                  size="lg"
                  color="info"
                />
                Equity vs Options
              </CardTitle>
            </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Equity Positions</span>
                <span className="text-sm text-muted-foreground">{equityVsOptions.equity.count} positions</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Capital: {formatCurrency(equityVsOptions.equity.capital)}</span>
                  <span className={equityVsOptions.equity.pnl >= 0 ? 'text-green-500' : 'text-red-500'}>
                    {formatCurrency(equityVsOptions.equity.pnl)}
                  </span>
                </div>
                <Progress 
                  value={Math.min(Math.abs(equityVsOptions.equity.returnPercent), 100)} 
                  className={equityVsOptions.equity.pnl >= 0 ? '' : '[&>div]:bg-red-500'}
                />
                <p className="text-xs text-muted-foreground">
                  Return: {formatPercent(equityVsOptions.equity.returnPercent)}
                </p>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Options Positions</span>
                <span className="text-sm text-muted-foreground">{equityVsOptions.options.count} contracts</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Capital: {formatCurrency(equityVsOptions.options.capital)}</span>
                  <span className={equityVsOptions.options.pnl >= 0 ? 'text-green-500' : 'text-red-500'}>
                    {formatCurrency(equityVsOptions.options.pnl)}
                  </span>
                </div>
                <Progress 
                  value={Math.min(Math.abs(equityVsOptions.options.returnPercent), 100)} 
                  className={equityVsOptions.options.pnl >= 0 ? '[&>div]:bg-purple-500' : '[&>div]:bg-red-500'}
                />
                <p className="text-xs text-muted-foreground">
                  Return: {formatPercent(equityVsOptions.options.returnPercent)}
                </p>
              </div>
            </div>

            {equityVsOptions.options.pnl > equityVsOptions.equity.pnl && (
              <Badge variant="outline" className="w-full justify-center bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center gap-1.5 border-purple-500/30">
                <Chart variant="Bold" size={14} className="text-purple-500" />
                Options outperforming equities
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <IconWrapper 
                  icon={<Warning2 variant="Bulk" />}
                  variant="gradient"
                  size="lg"
                  color="warning"
                />
                Concentration Risk
              </CardTitle>
            </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Herfindahl Index</span>
                <Badge variant="outline" className={concentrationColor}>
                  {concentrationLevel} Risk
                </Badge>
              </div>
              <Progress value={riskMetrics.concentrationIndex * 100} />
              <p className="text-xs text-muted-foreground mt-2">
                {getConcentrationCommentary(riskMetrics.concentrationIndex, riskMetrics.top3Percent)}
              </p>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Largest Position</span>
                <span className="text-sm font-semibold">
                  {formatPercent(riskMetrics.largestPositionPercent)}
                </span>
              </div>
              <Progress value={riskMetrics.largestPositionPercent} />
              <p className="text-xs text-muted-foreground mt-1">
                {formatCurrency(riskMetrics.largestPosition)} in single position
              </p>
              {riskMetrics.largestPositionPercent > 30 && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1.5">
                  <Warning2 variant="Bold" size={12} />
                  High concentration - Consider rebalancing
                </p>
              )}
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Top 3 Positions</span>
                <span className="text-sm font-semibold">
                  {formatPercent(riskMetrics.top3Percent)}
                </span>
              </div>
              <Progress value={riskMetrics.top3Percent} />
              {riskMetrics.top3Percent > 60 && (
                <p className="text-xs text-yellow-500 mt-1 flex items-center gap-1.5">
                  <Chart variant="Bold" size={12} />
                  Top-heavy portfolio - Diversification recommended
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
