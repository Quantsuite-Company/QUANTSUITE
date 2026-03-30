import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BlackScholesResult, BlackScholesParams } from '@/lib/blackScholes';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface ResultsPanelProps {
  result: BlackScholesResult;
  params: BlackScholesParams;
}

export const ResultsPanel: React.FC<ResultsPanelProps> = ({ result, params }) => {
  const { prices, greeks } = result;
  const { S, K } = params;
  
  const callProfit = prices.call - Math.max(S - K, 0);
  const putProfit = prices.put - Math.max(K - S, 0);
  
  const formatCurrency = (value: number) => `$${Math.abs(value).toFixed(2)}`;
  const formatPercent = (value: number) => `${(value * 100).toFixed(2)}%`;
  const formatGreek = (value: number, decimals: number = 4) => value.toFixed(decimals);

  return (
    <div className="space-y-6">
      {/* Option Prices */}
      <Card className="terminal-panel">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-primary flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Option Prices
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Call Option</span>
                <Badge variant="secondary" className="terminal-badge-success">
                  CALL
                </Badge>
              </div>
              <div className="text-2xl font-bold text-foreground value-change">
                {formatCurrency(prices.call)}
              </div>
              <div className={`text-sm ${callProfit >= 0 ? 'profit-positive' : 'profit-negative'}`}>
                Time Value: {formatCurrency(callProfit >= 0 ? callProfit : -callProfit)}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Put Option</span>
                <Badge variant="destructive" className="terminal-badge-danger">
                  PUT
                </Badge>
              </div>
              <div className="text-2xl font-bold text-foreground value-change">
                {formatCurrency(prices.put)}
              </div>
              <div className={`text-sm ${putProfit >= 0 ? 'profit-positive' : 'profit-negative'}`}>
                Time Value: {formatCurrency(putProfit >= 0 ? putProfit : -putProfit)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Greeks */}
      <Card className="terminal-panel">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-primary flex items-center gap-2">
            <TrendingDown className="w-5 h-5" />
            The Greeks
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Delta */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Delta (Δ)</span>
                <span className="text-xs text-muted-foreground">Price Sensitivity</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Call:</span>
                  <span className="ml-2 font-mono">{formatGreek(greeks.delta.call)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Put:</span>
                  <span className="ml-2 font-mono">{formatGreek(greeks.delta.put)}</span>
                </div>
              </div>
            </div>

            {/* Gamma */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Gamma (Γ)</span>
                <span className="text-xs text-muted-foreground">Delta Change</span>
              </div>
              <div className="text-sm">
                <span className="font-mono">{formatGreek(greeks.gamma)}</span>
              </div>
            </div>

            {/* Theta */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Theta (Θ)</span>
                <span className="text-xs text-muted-foreground">Time Decay</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Call:</span>
                  <span className="ml-2 font-mono">{formatGreek(greeks.theta.call)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Put:</span>
                  <span className="ml-2 font-mono">{formatGreek(greeks.theta.put)}</span>
                </div>
              </div>
            </div>

            {/* Vega */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Vega (ν)</span>
                <span className="text-xs text-muted-foreground">Vol Sensitivity</span>
              </div>
              <div className="text-sm">
                <span className="font-mono">{formatGreek(greeks.vega)}</span>
              </div>
            </div>

            {/* Rho */}
            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Rho (ρ)</span>
                <span className="text-xs text-muted-foreground">Rate Sensitivity</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Call:</span>
                  <span className="ml-2 font-mono">{formatGreek(greeks.rho.call)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Put:</span>
                  <span className="ml-2 font-mono">{formatGreek(greeks.rho.put)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};