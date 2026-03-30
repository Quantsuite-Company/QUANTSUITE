import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lamp, Cup, Warning2, DirectboxDefault, Danger, DollarCircle } from 'iconsax-react';
import { InsightCategory } from '@/lib/insightRules';
import { estimateCosts } from '@/lib/portfolioCalculator';
import { Position } from '@/lib/csvParser';
import { IconWrapper } from '@/components/icons/IconWrapper';
import { iconConfig } from '@/lib/iconConfig';

interface InsightsEngineProps {
  insights: InsightCategory;
  positions: Position[];
}

export function InsightsEngine({ insights, positions }: InsightsEngineProps) {
  const costs = estimateCosts(positions);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const totalPnL = positions.reduce((sum, p) => sum + p.pnl, 0);
  const netPnL = totalPnL - costs.total;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <IconWrapper 
          icon={<Lamp variant="Bulk" />}
          variant="gradient"
          size="lg"
          color="warning"
        />
        <h2 className="text-2xl font-bold">Logic-Based Insights</h2>
        <Badge variant="outline" className="ml-auto">100% Pure Logic</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {insights.trophies.length > 0 && (
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <IconWrapper 
                  icon={<Cup variant="Bulk" />}
                  {...iconConfig.insights.achievement}
                />
                Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {insights.trophies.map((trophy, index) => (
                  <div key={index} className="flex items-start gap-2 p-2 rounded bg-green-500/5">
                    <span className="text-sm">{trophy}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {insights.warnings.length > 0 && (
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <IconWrapper 
                  icon={<Warning2 variant="Bulk" />}
                  {...iconConfig.insights.warning}
                />
                Risk Warnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {insights.warnings.map((warning, index) => (
                  <div key={index} className="flex items-start gap-2 p-2 rounded bg-yellow-500/5">
                    <span className="text-sm">{warning}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {insights.recommendations.length > 0 && (
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <IconWrapper 
                  icon={<DirectboxDefault variant="Bulk" />}
                  {...iconConfig.insights.recommendation}
                />
                Actionable Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {insights.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start gap-2 p-2 rounded bg-blue-500/5">
                    <span className="text-sm">{rec}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {insights.roasts.length > 0 && (
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <IconWrapper 
                  icon={<Danger variant="Bulk" />}
                  {...iconConfig.insights.realityCheck}
                />
                Reality Check
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {insights.roasts.map((roast, index) => (
                  <div key={index} className="flex items-start gap-2 p-2 rounded bg-red-500/5">
                    <span className="text-sm">{roast}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <IconWrapper 
              icon={<DollarCircle variant="Bulk" />}
              variant="gradient"
              size="lg"
              color="success"
            />
            Cost & Tax Estimation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Estimated STT (Buy + Sell)</p>
              <p className="text-2xl font-bold text-red-500">{formatCurrency(costs.stt)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Estimated Brokerage</p>
              <p className="text-2xl font-bold text-red-500">{formatCurrency(costs.brokerage)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Net P&L (After Costs)</p>
              <p className={`text-2xl font-bold ${netPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {formatCurrency(netPnL)}
              </p>
            </div>
          </div>
          <div className="mt-4 p-3 rounded bg-muted/50">
            <p className="text-xs text-muted-foreground">
              <strong>Note:</strong> Estimates based on typical broker charges. Actual costs may vary. 
              Options trades show premium-based STT. STCG tax at 15% would be approximately {formatCurrency(netPnL * 0.15)} if applicable.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
