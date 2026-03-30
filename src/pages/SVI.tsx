import React, { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter } from "recharts";
import { calculateImpliedVolatility } from "@/lib/blackScholes";
import { UniversalExplanationPanel } from "@/components/UniversalExplanationPanel";
import { EnhancedStockSelector } from '@/components/EnhancedStockSelector';
import { useToast } from "@/hooks/use-toast";

interface SVIParams {
  a: number;  // Level parameter
  b: number;  // Slope parameter
  rho: number; // Correlation parameter
  m: number;   // ATM parameter
  sigma: number; // Vol-of-vol parameter
}

interface OptionData {
  strike: number;
  callPrice: number;
  putPrice: number;
}

interface MarketData {
  strike: number;
  maturity: number;
  impliedVol: number;
}

interface CalibrationResult {
  params: SVIParams;
  rmse: number;
  iterations: number;
  converged: boolean;
}

// SVI model implementation
const calculateSVIVolatility = (k: number, params: SVIParams): number => {
  const { a, b, rho, m, sigma } = params;
  const w = a + b * (rho * (k - m) + Math.sqrt((k - m) * (k - m) + sigma * sigma));
  return Math.sqrt(Math.max(w, 0.001)); // Ensure non-negative variance
};

// Generate theoretical SVI curve
const generateSVICurve = (params: SVIParams, center: number = 0, range: number = 1): Array<{k: number, iv: number}> => {
  const points = [];
  for (let i = -50; i <= 50; i++) {
    const k = center + (i / 50) * range;
    const iv = calculateSVIVolatility(k, params);
    points.push({ k, iv });
  }
  return points;
};

// Convert option prices to implied volatilities
const calculateImpliedVolsFromOptions = (
  optionData: OptionData[], 
  spot: number, 
  rate: number, 
  maturity: number
): MarketData[] => {
  return optionData.map(option => {
    // Calculate IV from call price
    const callIV = calculateImpliedVolatility(
      option.callPrice,
      true,
      {
        S: spot,
        K: option.strike,
        T: maturity,
        r: rate,
        q: 0
      }
    );
    
    return {
      strike: option.strike,
      maturity,
      impliedVol: callIV
    };
  }).filter(data => data.impliedVol > 0); // Filter out failed calculations
};

// Advanced SVI calibration using Levenberg-Marquardt-like optimization
const calibrateSVI = (marketData: MarketData[], spotPrice: number): CalibrationResult => {
  if (marketData.length < 5) {
    throw new Error("Need at least 5 data points for calibration");
  }

  // Initial parameter guess
  let params: SVIParams = { 
    a: 0.04, 
    b: 0.4, 
    rho: -0.4, 
    m: Math.log(100 / spotPrice), // ATM log-moneyness
    sigma: 0.2 
  };

  const maxIterations = 100;
  const tolerance = 1e-8;
  let iteration = 0;
  let prevError = Infinity;

  // Objective function: sum of squared errors
  const calculateError = (testParams: SVIParams): number => {
    return marketData.reduce((sum, point) => {
      const k = Math.log(point.strike / spotPrice);
      const theoreticalVol = calculateSVIVolatility(k, testParams);
      const error = theoreticalVol - point.impliedVol;
      return sum + error * error;
    }, 0) / marketData.length; // RMSE
  };

  // Simple gradient descent with parameter constraints
  const learningRate = 0.01;
  
  for (iteration = 0; iteration < maxIterations; iteration++) {
    const currentError = calculateError(params);
    
    if (Math.abs(prevError - currentError) < tolerance) {
      break;
    }

    // Calculate numerical gradients
    const gradients: Partial<SVIParams> = {};
    const epsilon = 1e-6;
    
    Object.keys(params).forEach(key => {
      const paramKey = key as keyof SVIParams;
      const originalValue = params[paramKey];
      
      // Forward difference
      params[paramKey] = originalValue + epsilon;
      const forwardError = calculateError(params);
      
      params[paramKey] = originalValue - epsilon;
      const backwardError = calculateError(params);
      
      // Restore original value
      params[paramKey] = originalValue;
      
      // Calculate gradient
      gradients[paramKey] = (forwardError - backwardError) / (2 * epsilon);
    });

    // Update parameters with constraints
    params.a = Math.max(0.001, params.a - learningRate * (gradients.a || 0));
    params.b = Math.max(0.001, params.b - learningRate * (gradients.b || 0));
    params.rho = Math.max(-0.999, Math.min(0.999, params.rho - learningRate * (gradients.rho || 0)));
    params.m = params.m - learningRate * (gradients.m || 0);
    params.sigma = Math.max(0.001, params.sigma - learningRate * (gradients.sigma || 0));

    prevError = currentError;
  }

  const finalError = calculateError(params);
  
  return {
    params,
    rmse: Math.sqrt(finalError),
    iterations: iteration,
    converged: iteration < maxIterations
  };
};

const SVI: React.FC = () => {
  const [ticker, setTicker] = useState('AAPL');
  const [sviParams, setSviParams] = useState<SVIParams>({
    a: 0.04,
    b: 0.4,
    rho: -0.3,
    m: 0,
    sigma: 0.2
  });

  const [optionChain, setOptionChain] = useState<OptionData[]>([
    { strike: 90, callPrice: 12.5, putPrice: 1.8 },
    { strike: 95, callPrice: 8.2, putPrice: 2.9 },
    { strike: 100, callPrice: 4.8, putPrice: 4.2 },
    { strike: 105, callPrice: 2.4, putPrice: 6.8 },
    { strike: 110, callPrice: 1.1, putPrice: 10.5 }
  ]);

  const [marketConditions, setMarketConditions] = useState({
    spotPrice: 100,
    riskFreeRate: 0.05,
    maturity: 0.25
  });

  const [newOption, setNewOption] = useState<OptionData>({
    strike: 100,
    callPrice: 4.8,
    putPrice: 4.2
  });

  const [calibrationResult, setCalibrationResult] = useState<CalibrationResult | null>(null);
  const [isCalibrating, setIsCalibrating] = useState(false);

  // Convert option chain to implied volatility data
  const marketData = useMemo(() => {
    return calculateImpliedVolsFromOptions(
      optionChain, 
      marketConditions.spotPrice, 
      marketConditions.riskFreeRate, 
      marketConditions.maturity
    );
  }, [optionChain, marketConditions]);

  const sviCurve = useMemo(() => {
    const center = Math.log(100 / marketConditions.spotPrice);
    return generateSVICurve(sviParams, center, 0.5);
  }, [sviParams, marketConditions.spotPrice]);

  const marketDataForChart = useMemo(() => {
    return marketData.map(point => ({
      k: Math.log(point.strike / marketConditions.spotPrice),
      iv: point.impliedVol,
      strike: point.strike
    }));
  }, [marketData, marketConditions.spotPrice]);

  const handleAutoCalibration = async () => {
    if (marketData.length < 5) {
      alert("Need at least 5 option data points for calibration");
      return;
    }

    setIsCalibrating(true);
    try {
      // Add a small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const result = calibrateSVI(marketData, marketConditions.spotPrice);
      setCalibrationResult(result);
      setSviParams(result.params);
    } catch (error) {
      alert(`Calibration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCalibrating(false);
    }
  };

  const addOptionToChain = () => {
    setOptionChain(prev => [...prev, { ...newOption }]);
  };

  const removeOptionFromChain = (index: number) => {
    setOptionChain(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-primary mb-2 terminal-glow">
          SVI Model
        </h1>
        <p className="text-lg text-muted-foreground">
          Stochastic Volatility Inspired Model for Implied Volatility Surface
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Market Conditions */}
        <Card className="terminal-panel border-primary/30">
          <CardHeader>
            <CardTitle className="text-primary">Market Conditions</CardTitle>
            <CardDescription>
              Set the underlying market parameters for option pricing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="spotPrice">Spot Price (S₀)</Label>
                <Input
                  id="spotPrice"
                  type="number"
                  step="0.01"
                  value={marketConditions.spotPrice}
                  onChange={(e) => setMarketConditions(prev => ({ 
                    ...prev, 
                    spotPrice: parseFloat(e.target.value) || 100 
                  }))}
                  className="terminal-input"
                />
              </div>
              <div>
                <Label htmlFor="riskFreeRate">Risk-Free Rate (r)</Label>
                <Input
                  id="riskFreeRate"
                  type="number"
                  step="0.001"
                  value={marketConditions.riskFreeRate}
                  onChange={(e) => setMarketConditions(prev => ({ 
                    ...prev, 
                    riskFreeRate: parseFloat(e.target.value) || 0.05 
                  }))}
                  className="terminal-input"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="maturity">Time to Maturity (T)</Label>
                <Input
                  id="maturity"
                  type="number"
                  step="0.01"
                  value={marketConditions.maturity}
                  onChange={(e) => setMarketConditions(prev => ({ 
                    ...prev, 
                    maturity: parseFloat(e.target.value) || 0.25 
                  }))}
                  className="terminal-input"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Option Chain Input */}
        <Card className="terminal-panel border-primary/30">
          <CardHeader>
            <CardTitle className="text-primary">Option Chain Data</CardTitle>
            <CardDescription>
              Enter market option prices - IV will be calculated automatically
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label htmlFor="newStrike">Strike</Label>
                <Input
                  id="newStrike"
                  type="number"
                  value={newOption.strike}
                  onChange={(e) => setNewOption(prev => ({ 
                    ...prev, 
                    strike: parseFloat(e.target.value) || 0 
                  }))}
                  className="terminal-input"
                />
              </div>
              <div>
                <Label htmlFor="newCallPrice">Call Price</Label>
                <Input
                  id="newCallPrice"
                  type="number"
                  step="0.01"
                  value={newOption.callPrice}
                  onChange={(e) => setNewOption(prev => ({ 
                    ...prev, 
                    callPrice: parseFloat(e.target.value) || 0 
                  }))}
                  className="terminal-input"
                />
              </div>
              <div>
                <Label htmlFor="newPutPrice">Put Price</Label>
                <Input
                  id="newPutPrice"
                  type="number"
                  step="0.01"
                  value={newOption.putPrice}
                  onChange={(e) => setNewOption(prev => ({ 
                    ...prev, 
                    putPrice: parseFloat(e.target.value) || 0 
                  }))}
                  className="terminal-input"
                />
              </div>
            </div>
            <Button onClick={addOptionToChain} className="w-full">
              Add Option to Chain
            </Button>
            
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {optionChain.map((option, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-terminal-highlight rounded">
                  <span className="text-sm">
                    K:{option.strike} C:{option.callPrice.toFixed(2)} P:{option.putPrice.toFixed(2)}
                  </span>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => removeOptionFromChain(index)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
            
            <Button 
              onClick={handleAutoCalibration} 
              className="w-full terminal-glow" 
              disabled={isCalibrating || marketData.length < 5}
            >
              {isCalibrating ? "Calibrating..." : "Auto-Calibrate SVI Parameters"}
            </Button>
            
            {calibrationResult && (
              <div className="mt-4 p-3 bg-terminal-highlight rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-primary">Calibration Results</span>
                  <Badge className={calibrationResult.converged ? "terminal-badge-success" : "terminal-badge-danger"}>
                    {calibrationResult.converged ? "Converged" : "Failed"}
                  </Badge>
                </div>
                <div className="text-xs space-y-1 text-muted-foreground">
                  <div>RMSE: {calibrationResult.rmse.toFixed(6)}</div>
                  <div>Iterations: {calibrationResult.iterations}</div>
                  <div className="grid grid-cols-3 gap-2 mt-2 text-primary">
                    <div>a: {calibrationResult.params.a.toFixed(4)}</div>
                    <div>b: {calibrationResult.params.b.toFixed(4)}</div>
                    <div>ρ: {calibrationResult.params.rho.toFixed(4)}</div>
                    <div>m: {calibrationResult.params.m.toFixed(4)}</div>
                    <div>σ: {calibrationResult.params.sigma.toFixed(4)}</div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Volatility Smile Visualization */}
      <Card className="terminal-panel border-primary/30">
        <CardHeader>
          <CardTitle className="text-primary">Implied Volatility Smile</CardTitle>
          <CardDescription>
            SVI model calibration to market-derived implied volatilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            {sviCurve && sviCurve.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sviCurve}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--primary) / 0.2)" />
                  <XAxis 
                    dataKey="k" 
                    stroke="hsl(var(--primary))"
                    label={{ value: 'Log-moneyness (k)', position: 'insideBottom', offset: -5, fill: 'hsl(var(--primary))' }}
                  />
                  <YAxis 
                    stroke="hsl(var(--primary))"
                    label={{ value: 'Implied Volatility', angle: -90, position: 'insideLeft', fill: 'hsl(var(--primary))' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--terminal-bg))', 
                      border: '1px solid hsl(var(--primary))',
                      borderRadius: '8px',
                      color: 'hsl(var(--primary))'
                    }}
                    formatter={(value: number, name: string) => [
                      `${(value * 100).toFixed(2)}%`, 
                      name === 'iv' ? 'Implied Vol' : name
                    ]}
                    labelFormatter={(k: number) => `Log-moneyness: ${k.toFixed(3)}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="iv" 
                    stroke="hsl(var(--accent))"
                    strokeWidth={3}
                    dot={false}
                    name="SVI Model"
                    connectNulls={false}
                    style={{
                      filter: "drop-shadow(0 0 8px hsl(var(--accent)))",
                    }}
                  />
                  {marketDataForChart.slice(0, 20).map((point, index) => (
                    <Scatter
                      key={index}
                      data={[point]}
                      fill="hsl(var(--destructive))"
                      stroke="hsl(var(--destructive))"
                      strokeWidth={2}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-96 flex items-center justify-center">
                <p className="text-muted-foreground">No volatility curve data available</p>
              </div>
            )}
          </div>
          
          <div className="mt-4 flex justify-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-0.5 bg-accent"></div>
              <span className="text-muted-foreground">SVI Model</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-destructive"></div>
              <span className="text-muted-foreground">Market Data (Derived IV)</span>
            </div>
          </div>
          
          {marketData.length > 0 && (
            <div className="mt-4 p-3 bg-terminal-highlight rounded-lg">
              <h4 className="text-sm font-semibold text-primary mb-2">Derived Implied Volatilities</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                {marketData.map((point, index) => (
                  <div key={index} className="text-muted-foreground">
                    K{point.strike}: {(point.impliedVol * 100).toFixed(2)}%
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Model Information */}
      <Card className="terminal-panel border-primary/30">
        <CardHeader>
          <CardTitle className="text-primary">Automated SVI Calibration</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="workflow" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="workflow">Workflow</TabsTrigger>
              <TabsTrigger value="optimization">Optimization</TabsTrigger>
              <TabsTrigger value="parameters">Parameters</TabsTrigger>
              <TabsTrigger value="applications">Applications</TabsTrigger>
            </TabsList>
            
            <TabsContent value="workflow" className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Badge className="terminal-badge-success">1</Badge>
                  <div>
                    <h4 className="font-semibold text-primary">Option Chain Input</h4>
                    <p className="text-sm text-muted-foreground">Enter market option prices (calls/puts) with strikes and market conditions</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Badge className="terminal-badge-success">2</Badge>
                  <div>
                    <h4 className="font-semibold text-primary">IV Conversion</h4>
                    <p className="text-sm text-muted-foreground">Black-Scholes inversion converts option prices to implied volatilities</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Badge className="terminal-badge-success">3</Badge>
                  <div>
                    <h4 className="font-semibold text-primary">Parameter Estimation</h4>
                    <p className="text-sm text-muted-foreground">Gradient descent optimization fits SVI parameters to minimize RMSE</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Badge className="terminal-badge-success">4</Badge>
                  <div>
                    <h4 className="font-semibold text-primary">Quality Assessment</h4>
                    <p className="text-sm text-muted-foreground">System reports calibration quality and convergence status</p>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="optimization" className="space-y-4">
              <p className="text-muted-foreground">
                The system uses constrained gradient descent to minimize the objective function:
              </p>
              <div className="bg-terminal-highlight p-3 rounded-lg font-mono text-sm text-primary">
                min Σ (IV_market(k) - IV_SVI(k))²
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-primary">Constraints Applied:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• b &gt; 0 (positive slope parameter)</li>
                  <li>• |ρ| &lt; 1 (correlation bounds)</li>
                  <li>• σ &gt; 0 (positive vol-of-vol)</li>
                  <li>• a &gt; 0 (positive level parameter)</li>
                </ul>
              </div>
            </TabsContent>
            
            <TabsContent value="parameters" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-primary">a (Level)</h4>
                  <p className="text-sm text-muted-foreground">Controls the overall level of implied variance. Automatically calibrated to match market IV levels.</p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-primary">b (Slope)</h4>
                  <p className="text-sm text-muted-foreground">Controls the slope of the volatility smile. Optimized to capture skew direction.</p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-primary">ρ (Correlation)</h4>
                  <p className="text-sm text-muted-foreground">Controls asymmetry. Negative values for equity-like skews, positive for commodity smiles.</p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-primary">m (ATM)</h4>
                  <p className="text-sm text-muted-foreground">ATM log-moneyness. Automatically centered based on current spot price.</p>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <h4 className="font-semibold text-primary">σ (Vol-of-Vol)</h4>
                  <p className="text-sm text-muted-foreground">Controls smile curvature. Calibrated to match market volatility smile shape.</p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="applications" className="space-y-4">
              <ul className="space-y-2 text-muted-foreground">
                <li>• <strong className="text-primary">Automated Trading Systems:</strong> Real-time calibration for algorithmic volatility strategies</li>
                <li>• <strong className="text-primary">Risk Management:</strong> Accurate Greeks and scenario analysis across the volatility surface</li>
                <li>• <strong className="text-primary">Exotic Pricing:</strong> Model-consistent pricing of path-dependent and barrier options</li>
                <li>• <strong className="text-primary">Market Making:</strong> Dynamic hedging based on live volatility surface updates</li>
                <li>• <strong className="text-primary">Portfolio Optimization:</strong> Volatility-adjusted position sizing and correlation analysis</li>
              </ul>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Explanation Panel */}
      <UniversalExplanationPanel
        modelName="SVI"
        inputs={{
          optionsData: optionChain.length,
          spotPrice: marketConditions.spotPrice,
          maturity: marketConditions.maturity,
          calibrationPoints: marketData.length
        }}
        outputs={{
          sviParams: sviParams,
          calibrationResult: calibrationResult,
          marketData: marketData,
          rmse: calibrationResult?.rmse || 0
        }}
        className="terminal-panel border-primary/30"
      />
    </div>
  );
};

export default SVI;