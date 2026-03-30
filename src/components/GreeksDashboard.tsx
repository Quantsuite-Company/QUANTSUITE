import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { StrategyMetrics } from '@/lib/payoffCalculator';
import { TrendUp, TrendDown, Activity, Flash, DollarCircle } from 'iconsax-react';

interface GreeksDashboardProps {
  metrics: StrategyMetrics;
}

export const GreeksDashboard = ({ metrics }: GreeksDashboardProps) => {
  const formatGreek = (value: number, decimals: number = 3) => {
    return value.toFixed(decimals);
  };

  const getProgressValue = (value: number, max: number = 1) => {
    return Math.min(Math.abs(value / max) * 100, 100);
  };

  const getGreekColor = (value: number) => {
    if (value > 0) return 'text-success';
    if (value < 0) return 'text-destructive';
    return 'text-muted-foreground';
  };

  const getGreekDescription = (greek: string, value: number) => {
    switch (greek) {
      case 'delta':
        if (value > 0) return 'Profits from price increase';
        if (value < 0) return 'Profits from price decrease';
        return 'No directional exposure';
      case 'gamma':
        return 'Rate of change in delta';
      case 'theta':
        if (value < 0) return 'Loses value daily';
        if (value > 0) return 'Gains value daily';
        return 'No time decay';
      case 'vega':
        if (value > 0) return 'Profits from volatility increase';
        if (value < 0) return 'Profits from volatility decrease';
        return 'No volatility exposure';
      case 'rho':
        if (value > 0) return 'Profits from rate increase';
        if (value < 0) return 'Profits from rate decrease';
        return 'No interest rate exposure';
      default:
        return '';
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Greeks Dashboard</h2>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Delta */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendUp size={20} variant="Bold" className="text-primary" />
              <span className="font-medium">Delta (Δ)</span>
            </div>
            <span className={`text-lg font-bold ${getGreekColor(metrics.netDelta)}`}>
              {formatGreek(metrics.netDelta)}
            </span>
          </div>
          <Progress 
            value={getProgressValue(metrics.netDelta)} 
            className="h-2"
          />
          <p className="text-xs text-muted-foreground">
            {getGreekDescription('delta', metrics.netDelta)}
          </p>
        </div>

        {/* Gamma */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              <span className="font-medium">Gamma (Γ)</span>
            </div>
            <span className={`text-lg font-bold ${getGreekColor(metrics.netGamma)}`}>
              {formatGreek(metrics.netGamma, 4)}
            </span>
          </div>
          <Progress 
            value={getProgressValue(metrics.netGamma, 0.1)} 
            className="h-2"
          />
          <p className="text-xs text-muted-foreground">
            {getGreekDescription('gamma', metrics.netGamma)}
          </p>
        </div>

        {/* Theta */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendDown size={20} variant="Bold" className="text-primary" />
              <span className="font-medium">Theta (Θ)</span>
            </div>
            <span className={`text-lg font-bold ${getGreekColor(metrics.netTheta)}`}>
              {formatGreek(metrics.netTheta)}
            </span>
          </div>
          <Progress 
            value={getProgressValue(metrics.netTheta)} 
            className="h-2"
          />
          <p className="text-xs text-muted-foreground">
            {getGreekDescription('theta', metrics.netTheta)} ({metrics.netTheta > 0 ? '+' : ''}{formatGreek(metrics.netTheta, 2)}/day)
          </p>
        </div>

        {/* Vega */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flash size={20} variant="Bold" className="text-primary" />
              <span className="font-medium">Vega (ν)</span>
            </div>
            <span className={`text-lg font-bold ${getGreekColor(metrics.netVega)}`}>
              {formatGreek(metrics.netVega)}
            </span>
          </div>
          <Progress 
            value={getProgressValue(metrics.netVega, 10)} 
            className="h-2"
          />
          <p className="text-xs text-muted-foreground">
            {getGreekDescription('vega', metrics.netVega)}
          </p>
        </div>

        {/* Rho */}
        <div className="space-y-2 md:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarCircle size={20} variant="Bold" className="text-primary" />
              <span className="font-medium">Rho (ρ)</span>
            </div>
            <span className={`text-lg font-bold ${getGreekColor(metrics.netRho)}`}>
              {formatGreek(metrics.netRho)}
            </span>
          </div>
          <Progress 
            value={getProgressValue(metrics.netRho, 5)} 
            className="h-2"
          />
          <p className="text-xs text-muted-foreground">
            {getGreekDescription('rho', metrics.netRho)}
          </p>
        </div>
      </div>

      <div className="mt-6 p-4 bg-muted rounded-lg">
        <h3 className="font-medium mb-2">Greeks Interpretation</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• <strong>Delta</strong>: Position moves ₹{Math.abs(metrics.netDelta).toFixed(2)} for every ₹1 move in underlying</li>
          <li>• <strong>Gamma</strong>: Delta changes by {Math.abs(metrics.netGamma).toFixed(4)} for ₹1 move</li>
          <li>• <strong>Theta</strong>: Position {metrics.netTheta < 0 ? 'loses' : 'gains'} ₹{Math.abs(metrics.netTheta).toFixed(2)} per day</li>
          <li>• <strong>Vega</strong>: Position changes ₹{Math.abs(metrics.netVega).toFixed(2)} for 1% volatility change</li>
        </ul>
      </div>
    </Card>
  );
};
