import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, TrendingUp } from "lucide-react";
import { BlackScholesParams, calculateBlackScholes } from '@/lib/blackScholes';
import { UniversalExplanationPanel } from "@/components/UniversalExplanationPanel";

// Enhanced implied volatility calculation using Brent's method
const calculateImpliedVolatilityBrent = (
  marketPrice: number,
  isCall: boolean,
  params: Omit<BlackScholesParams, 'sigma'>,
  maxIterations: number = 100,
  tolerance: number = 1e-6
): number => {
  const objectiveFunction = (vol: number): number => {
    const result = calculateBlackScholes({ ...params, sigma: vol });
    const theoreticalPrice = isCall ? result.prices.call : result.prices.put;
    return theoreticalPrice - marketPrice;
  };

  // Initial bounds for volatility search
  let a = 0.001; // Lower bound (0.1%)
  let b = 5.0;   // Upper bound (500%)
  
  let fa = objectiveFunction(a);
  let fb = objectiveFunction(b);
  
  // Ensure we have a valid bracket
  if (fa * fb > 0) {
    // Try to find a valid bracket by expanding search
    for (let i = 0; i < 20; i++) {
      a = Math.max(0.001, a - 0.5);
      b = b + 0.5;
      fa = objectiveFunction(a);
      fb = objectiveFunction(b);
      if (fa * fb <= 0) break;
    }
    
    if (fa * fb > 0) {
      throw new Error('Unable to bracket the root. Market price may be invalid.');
    }
  }

  // Brent's method implementation
  let c = a;
  let fc = fa;
  let d = b - a;
  let e = d;

  for (let iter = 0; iter < maxIterations; iter++) {
    if (Math.abs(fc) < Math.abs(fb)) {
      a = b; b = c; c = a;
      fa = fb; fb = fc; fc = fa;
    }

    const tol = 2 * tolerance * Math.abs(b) + tolerance;
    const m = 0.5 * (c - b);

    if (Math.abs(m) <= tol || Math.abs(fb) <= tolerance) {
      return b; // Converged
    }

    let p, q, r, s;
    if (Math.abs(e) >= tol && Math.abs(fa) > Math.abs(fb)) {
      if (a === c) {
        // Linear interpolation
        s = fb / fa;
        p = 2 * m * s;
        q = 1 - s;
      } else {
        // Quadratic interpolation
        q = fa / fc;
        r = fb / fc;
        s = fb / fa;
        p = s * (2 * m * q * (q - r) - (b - a) * (r - 1));
        q = (q - 1) * (r - 1) * (s - 1);
      }

      if (p > 0) q = -q;
      else p = -p;

      if (2 * p < Math.min(3 * m * q - Math.abs(tol * q), Math.abs(e * q))) {
        e = d;
        d = p / q;
      } else {
        d = m;
        e = d;
      }
    } else {
      d = m;
      e = d;
    }

    a = b;
    fa = fb;
    b += Math.abs(d) > tol ? d : (m > 0 ? tol : -tol);
    fb = objectiveFunction(b);

    if (fb * fc > 0) {
      c = a;
      fc = fa;
      d = b - a;
      e = d;
    }
  }

  throw new Error('Maximum iterations reached. Solution may not have converged.');
};

const WildVolatilitySolver = () => {
  const [params, setParams] = useState<Omit<BlackScholesParams, 'sigma'>>({
    S: 100,     // Stock price
    K: 100,     // Strike price
    T: 0.25,    // Time to expiration (3 months)
    r: 0.05,    // Risk-free rate (5%)
    q: 0.02,    // Dividend yield (2%)
  });
  
  const [marketPrice, setMarketPrice] = useState<number>(5.0);
  const [isCall, setIsCall] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const impliedVolatility = useMemo(() => {
    if (marketPrice <= 0) {
      setError('Market price must be positive');
      return null;
    }

    // Basic arbitrage checks
    const intrinsicValue = isCall 
      ? Math.max(0, params.S - params.K * Math.exp(-params.r * params.T))
      : Math.max(0, params.K * Math.exp(-params.r * params.T) - params.S);
    
    if (marketPrice < intrinsicValue) {
      setError('Market price below intrinsic value - arbitrage opportunity exists');
      return null;
    }

    try {
      setError('');
      const iv = calculateImpliedVolatilityBrent(marketPrice, isCall, params);
      return iv;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Calculation error');
      return null;
    }
  }, [marketPrice, isCall, params]);

  const handleParamChange = (key: keyof Omit<BlackScholesParams, 'sigma'>, value: string) => {
    const numValue = parseFloat(value) || 0;
    setParams(prev => ({ ...prev, [key]: numValue }));
  };

  // Calculate theoretical prices at current IV for comparison
  const theoreticalPrices = useMemo(() => {
    if (!impliedVolatility) return null;
    return calculateBlackScholes({ ...params, sigma: impliedVolatility });
  }, [impliedVolatility, params]);

  const moneyness = params.S / params.K;
  const timeToExpiry = params.T * 365;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Wild Volatility Solver
        </h1>
        <p className="text-muted-foreground text-lg">
          Reverse-engineer market implied volatility from option prices
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Market Data Input
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="marketPrice">Market Option Price</Label>
                <Input
                  id="marketPrice"
                  type="number"
                  step="0.01"
                  value={marketPrice}
                  onChange={(e) => setMarketPrice(parseFloat(e.target.value) || 0)}
                  placeholder="5.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Option Type</Label>
                <div className="flex gap-2">
                  <Button
                    variant={isCall ? "default" : "outline"}
                    onClick={() => setIsCall(true)}
                    className="flex-1"
                  >
                    Call
                  </Button>
                  <Button
                    variant={!isCall ? "default" : "outline"}
                    onClick={() => setIsCall(false)}
                    className="flex-1"
                  >
                    Put
                  </Button>
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stockPrice">Stock Price ($)</Label>
                <Input
                  id="stockPrice"
                  type="number"
                  step="0.01"
                  value={params.S}
                  onChange={(e) => handleParamChange('S', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="strikePrice">Strike Price ($)</Label>
                <Input
                  id="strikePrice"
                  type="number"
                  step="0.01"
                  value={params.K}
                  onChange={(e) => handleParamChange('K', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="timeToExpiry">Time to Expiry (years)</Label>
                <Input
                  id="timeToExpiry"
                  type="number"
                  step="0.01"
                  value={params.T}
                  onChange={(e) => handleParamChange('T', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">≈ {timeToExpiry.toFixed(0)} days</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="riskFreeRate">Risk-Free Rate (%)</Label>
                <Input
                  id="riskFreeRate"
                  type="number"
                  step="0.01"
                  value={params.r * 100}
                  onChange={(e) => handleParamChange('r', ((parseFloat(e.target.value) || 0) / 100).toString())}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dividendYield">Dividend Yield (%)</Label>
              <Input
                id="dividendYield"
                type="number"
                step="0.01"
                value={params.q * 100}
                onChange={(e) => handleParamChange('q', ((parseFloat(e.target.value) || 0) / 100).toString())}
              />
            </div>
          </CardContent>
        </Card>

        {/* Results Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Implied Volatility Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {impliedVolatility !== null && (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">
                    {(impliedVolatility * 100).toFixed(2)}%
                  </div>
                  <p className="text-sm text-muted-foreground">Implied Volatility</p>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Moneyness (S/K)</p>
                    <p className="font-medium">{moneyness.toFixed(4)}</p>
                    <Badge variant={moneyness > 1 ? "default" : moneyness < 1 ? "destructive" : "secondary"} className="text-xs mt-1">
                      {moneyness > 1.02 ? "ITM" : moneyness < 0.98 ? "OTM" : "ATM"}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Vol Type</p>
                    <Badge variant={impliedVolatility > 0.3 ? "destructive" : impliedVolatility > 0.2 ? "secondary" : "default"}>
                      {impliedVolatility > 0.4 ? "Extreme" : impliedVolatility > 0.3 ? "High" : impliedVolatility > 0.2 ? "Moderate" : "Low"}
                    </Badge>
                  </div>
                </div>

                {theoreticalPrices && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Theoretical Verification</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Theoretical Call</p>
                        <p className="font-mono">${theoreticalPrices.prices.call.toFixed(4)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Theoretical Put</p>
                        <p className="font-mono">${theoreticalPrices.prices.put.toFixed(4)}</p>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Using calculated IV of {(impliedVolatility * 100).toFixed(2)}%
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Explanation Panel */}
      <UniversalExplanationPanel
        modelName="VolatilityForecasting"
        inputs={{
          marketPrice: marketPrice,
          spotPrice: params.S,
          strikePrice: params.K,
          timeToExpiry: params.T,
          optionType: isCall ? 'call' : 'put'
        }}
        outputs={{
          impliedVolatility: impliedVolatility || 0,
          moneyness: params.S / params.K,
          theoreticalPrices: theoreticalPrices?.prices,
          volatilityType: impliedVolatility ? (impliedVolatility > 0.4 ? 'Extreme' : impliedVolatility > 0.3 ? 'High' : impliedVolatility > 0.2 ? 'Moderate' : 'Low') : 'Unknown'
        }}
      />
    </div>
  );
};

export default WildVolatilitySolver;