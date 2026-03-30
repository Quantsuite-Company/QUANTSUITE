import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, TrendingUp, TrendingDown, Activity, Target, Zap, BarChart3, Info, HelpCircle } from 'lucide-react';
import { toast } from "sonner";
import { ParameterInput } from '@/components/ParameterInput';
import { EnhancedStockSelector } from '@/components/EnhancedStockSelector';
import { calculateBlackScholes, calculateAdvancedBlackScholes, BlackScholesParams } from '@/lib/blackScholes';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, ScatterChart, Scatter } from 'recharts';
import { UniversalExplanationPanel } from '@/components/UniversalExplanationPanel';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const defaultParams: BlackScholesParams = {
  S: 100,
  K: 100,
  T: 0.25,
  r: 0.05,
  sigma: 0.2,
  q: 0,
};

interface ScenarioResult {
  scenario: string;
  probability: number;
  optionPrice: number;
  pnl: number;
  percentChange: number;
  risk: 'Low' | 'Medium' | 'High' | 'Extreme';
  description?: string;
  pnlImpact?: string;
  keyFactors?: string[];
}

interface StressTestConfig {
  spotShocks: number[];
  volShocks: number[];
  rateShocks: number[];
  timeDecay: number[];
}

const AdvancedScenarioAnalysis = () => {
  const [params, setParams] = useState<BlackScholesParams>(defaultParams);
  const [selectedScenario, setSelectedScenario] = useState<string>('stress-test');
  const [confidence, setConfidence] = useState(95);
  const [optionType, setOptionType] = useState<'call' | 'put'>('call');
  const [ticker, setTicker] = useState('AAPL');
  const [selectedBlackSwan, setSelectedBlackSwan] = useState<string | null>(null);

  // Base option price for P&L calculations
  const baseResult = useMemo(() => calculateBlackScholes(params), [params]);
  const basePrice = optionType === 'call' ? baseResult.prices.call : baseResult.prices.put;

  // Black Swan Events with Enhanced Descriptions
  const blackSwanEvents = {
    '2008 Financial Crisis': {
      spotShock: -0.45,
      volShock: 2.5,
      probability: 0.1,
      description: "Global financial system collapse triggered by subprime mortgage crisis. Banks failed, credit markets froze.",
      pnlImpact: "Massive losses for call options, huge gains for put options. Volatility skyrocketed 300-500%.",
      keyFactors: ["Credit default swaps", "Lehman Brothers collapse", "Government bailouts"]
    },
    'Flash Crash (2010)': {
      spotShock: -0.09,
      volShock: 0.8,
      probability: 0.05,
      description: "Algorithmic trading caused 9% market drop in minutes. High-frequency trading went haywire.",
      pnlImpact: "Short-term options experienced extreme gamma effects. Intraday volatility spiked briefly.",
      keyFactors: ["Algorithm malfunction", "Liquidity crisis", "Circuit breakers triggered"]
    },
    'COVID Crash (2020)': {
      spotShock: -0.35,
      volShock: 3.0,
      probability: 0.1,
      description: "Pandemic lockdowns triggered fastest bear market in history. Global economy shutdown.",
      pnlImpact: "Put options gained 1000%+, call options lost 80-90%. VIX hit historic highs above 80.",
      keyFactors: ["Global lockdowns", "Supply chain disruption", "Central bank intervention"]
    },
    'Brexit Vote': {
      spotShock: -0.12,
      volShock: 0.6,
      probability: 0.2,
      description: "Unexpected Brexit vote result shocked global markets. Currency and bond markets in chaos.",
      pnlImpact: "European options saw massive volatility spikes. Currency hedged positions helped some portfolios.",
      keyFactors: ["Political uncertainty", "Currency devaluation", "Trade disruption"]
    },
    'Rate Hike Shock': {
      spotShock: -0.08,
      rateShock: 0.02,
      volShock: 0.4,
      probability: 0.3,
      description: "Unexpected aggressive rate hikes by central banks to combat inflation. Markets unprepared.",
      pnlImpact: "Growth stocks hit hardest, tech options lost value. Interest rate sensitive sectors collapsed.",
      keyFactors: ["Inflation surge", "Central bank policy", "Bond market turmoil"]
    },
    'Earnings Miss': {
      spotShock: -0.15,
      volShock: -0.6,
      probability: 5.0,
      description: "Major earnings disappointment from key market leaders. Revenue and guidance cuts.",
      pnlImpact: "Individual stock options see immediate 20-50% price gaps. Sector contagion possible.",
      keyFactors: ["Revenue shortfall", "Guidance reduction", "Market expectations"]
    },
    'Sector Rotation': {
      spotShock: -0.20,
      volShock: 0.2,
      probability: 2.0,
      description: "Massive shift in investor preference from growth to value stocks. Style rotation.",
      pnlImpact: "Growth options lose premium, value options gain. Relative performance diverges sharply.",
      keyFactors: ["Interest rate changes", "Economic cycle shift", "Valuation concerns"]
    }
  };

  // Stress Test Scenarios with performance optimization
  const stressTestResults = useMemo(() => {
    try {
      console.log('Calculating stress test scenarios...');
      const scenarios: ScenarioResult[] = [];
      // Reduce calculation complexity - fewer shocks for performance
      const shocks = [-0.3, -0.15, -0.05, 0, 0.05, 0.15, 0.3]; // Reduced from 9 to 7
      const volShocks = [-0.5, -0.2, 0, 0.2, 0.5]; // Reduced from 7 to 5

      shocks.forEach((spotShock) => {
        volShocks.forEach((volShock) => {
          try {
            const newS = params.S * (1 + spotShock);
            const newSigma = Math.max(0.01, Math.min(2.0, params.sigma * (1 + volShock)));
            const newParams = { ...params, S: newS, sigma: newSigma };
            
            const result = calculateBlackScholes(newParams);
            const newPrice = optionType === 'call' ? result.prices.call : result.prices.put;
            
            if (!isFinite(newPrice) || newPrice < 0) return;
            
            const pnl = newPrice - basePrice;
            const percentChange = basePrice > 0 ? (pnl / basePrice) * 100 : 0;
            
            // Assign risk levels
            let risk: 'Low' | 'Medium' | 'High' | 'Extreme' = 'Low';
            if (Math.abs(percentChange) > 100) risk = 'Extreme';
            else if (Math.abs(percentChange) > 50) risk = 'High';
            else if (Math.abs(percentChange) > 20) risk = 'Medium';

            // Simplified probability (normal-ish distribution around current)
            const spotProb = Math.exp(-Math.pow(spotShock * 2, 2));
            const volProb = Math.exp(-Math.pow(volShock, 2));
            const probability = (spotProb * volProb) / 10; // Normalize

            scenarios.push({
              scenario: `Spot ${spotShock >= 0 ? '+' : ''}${(spotShock * 100).toFixed(0)}%, Vol ${volShock >= 0 ? '+' : ''}${(volShock * 100).toFixed(0)}%`,
              probability: probability * 100,
              optionPrice: newPrice,
              pnl,
              percentChange,
              risk
            });
          } catch (error) {
            console.warn('Error in scenario calculation:', error);
          }
        });
      });

      console.log('Stress test calculation completed');
      return scenarios.sort((a, b) => b.probability - a.probability).slice(0, 50); // Limit results
    } catch (error) {
      console.error('Error calculating stress test scenarios:', error);
      return [];
    }
  }, [params.S, params.K, params.T, params.r, params.sigma, params.q, basePrice, optionType]);

  // Black Swan Results with Enhanced Data
  const blackSwanResults = useMemo(() => {
    return Object.entries(blackSwanEvents).map(([name, event]) => {
      const newS = params.S * (1 + event.spotShock);
      const newSigma = Math.max(0.01, params.sigma * (1 + event.volShock));
      const newR = params.r + ((event as any).rateShock || 0);
      const newParams = { ...params, S: newS, sigma: newSigma, r: newR };
      
      const result = calculateBlackScholes(newParams);
      const newPrice = optionType === 'call' ? result.prices.call : result.prices.put;
      const pnl = newPrice - basePrice;
      const percentChange = (pnl / basePrice) * 100;

      return {
        scenario: name,
        probability: event.probability,
        optionPrice: newPrice,
        pnl,
        percentChange,
        risk: 'Extreme' as const,
        description: event.description,
        pnlImpact: event.pnlImpact,
        keyFactors: event.keyFactors
      };
    });
  }, [params, basePrice, optionType]);

  // Monte Carlo Value at Risk with performance optimization
  const varResults = useMemo(() => {
    try {
      console.log('Running Monte Carlo VaR analysis...');
      // Reduce simulations for performance
      const numSimulations = Math.min(5000, 10000); // Reduced from 10000
      const returns: number[] = [];
      
      // Seeded PRNG for reproducible Monte Carlo paths
      const seededRandom = (seed: number) => {
        let t = seed;
        return function() {
          t += 0x6D2B79F5;
          t = Math.imul(t ^ t >>> 15, t | 1);
          t ^= t + Math.imul(t ^ t >>> 7, t | 61);
          return ((t ^ t >>> 14) >>> 0) / 4294967296;
        }
      };
      const rng = seededRandom(12345);
      
      for (let i = 0; i < numSimulations; i++) {
        try {
          // Generate random market moves (normal distribution)
          const spotReturn = (rng() - 0.5) * 2 * 0.15; // ±15% range
          const volReturn = (rng() - 0.5) * 2 * 0.3; // ±30% vol change
          
          const newS = Math.max(0.01, params.S * (1 + spotReturn));
          const newSigma = Math.max(0.01, Math.min(2.0, params.sigma * (1 + volReturn)));
          const newParams = { ...params, S: newS, sigma: newSigma };
          
          const result = calculateBlackScholes(newParams);
          const newPrice = optionType === 'call' ? result.prices.call : result.prices.put;
          
          if (isFinite(newPrice) && newPrice >= 0 && basePrice > 0) {
            const returnPct = ((newPrice - basePrice) / basePrice) * 100;
            if (isFinite(returnPct)) {
              returns.push(returnPct);
            }
          }
        } catch (error) {
          console.warn('Error in VaR simulation step:', error);
        }
      }
      
      if (returns.length === 0) {
        return {
          var95: 0,
          var99: 0,
          expectedShortfall95: 0,
          distribution: []
        };
      }
      
      returns.sort((a, b) => a - b);
      
      const var95 = returns[Math.floor(returns.length * 0.05)] || 0;
      const var99 = returns[Math.floor(returns.length * 0.01)] || 0;
      const shortfallSlice = returns.slice(0, Math.floor(returns.length * 0.05));
      const expectedShortfall95 = shortfallSlice.length > 0 ? 
        shortfallSlice.reduce((sum, ret) => sum + ret, 0) / shortfallSlice.length : 0;
      
      console.log('VaR calculation completed');
      
      return {
        var95,
        var99,
        expectedShortfall95,
        distribution: returns.slice(0, 1000).map((ret, idx) => ({ index: idx, return: ret })) // Limit chart data
      };
    } catch (error) {
      console.error('Error calculating VaR:', error);
      return {
        var95: 0,
        var99: 0,
        expectedShortfall95: 0,
        distribution: []
      };
    }
  }, [params.S, params.K, params.T, params.r, params.sigma, params.q, basePrice, optionType]);

  // Time Decay Analysis
  const timeDecayAnalysis = useMemo(() => {
    const days = Array.from({ length: 30 }, (_, i) => i);
    return days.map(day => {
      const timeLeft = Math.max(0.001, params.T - (day / 365));
      const newParams = { ...params, T: timeLeft };
      const result = calculateBlackScholes(newParams);
      const price = optionType === 'call' ? result.prices.call : result.prices.put;
      const theta = optionType === 'call' ? result.greeks.theta.call : result.greeks.theta.put;
      
      return {
        day,
        price,
        pnl: price - basePrice,
        theta,
        timeLeft: timeLeft * 365
      };
    });
  }, [params, basePrice, optionType]);

  const updateParam = useCallback((key: keyof BlackScholesParams, value: number) => {
    setParams(prev => ({ ...prev, [key]: value }));
  }, []);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'text-green-600 bg-green-50';
      case 'Medium': return 'text-yellow-600 bg-yellow-50';
      case 'High': return 'text-orange-600 bg-orange-50';
      case 'Extreme': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;
  const formatPercent = (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;

  const parameterConfigs = [
    {
      key: 'S' as keyof BlackScholesParams,
      label: 'Current Stock Price',
      min: 1,
      max: 500,
      step: 0.01,
      suffix: '$',
      tooltip: 'Current market price of the underlying asset',
      color: 'param-stock' as const
    },
    {
      key: 'K' as keyof BlackScholesParams,
      label: 'Strike Price',
      min: 1,
      max: 500,
      step: 0.01,
      suffix: '$',
      tooltip: 'Exercise price of the option',
      color: 'param-strike' as const
    },
    {
      key: 'T' as keyof BlackScholesParams,
      label: 'Time to Expiration',
      min: 0.01,
      max: 2,
      step: 0.01,
      suffix: ' years',
      tooltip: 'Time remaining until option expiration',
      color: 'param-time' as const
    },
    {
      key: 'r' as keyof BlackScholesParams,
      label: 'Risk-Free Rate',
      min: 0,
      max: 0.2,
      step: 0.001,
      suffix: '%',
      tooltip: 'Annual risk-free interest rate',
      color: 'param-rate' as const
    },
    {
      key: 'sigma' as keyof BlackScholesParams,
      label: 'Volatility',
      min: 0.01,
      max: 1,
      step: 0.001,
      suffix: '%',
      tooltip: 'Annual volatility of the underlying asset',
      color: 'param-volatility' as const
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <Card className="border-l-4 border-l-red-500">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-red-500" />
                Advanced Scenario Analysis
              </CardTitle>
              <p className="text-muted-foreground mt-2">
                Stress testing, sensitivity analysis, and what-if scenarios for comprehensive risk assessment
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant={optionType === 'call' ? 'default' : 'outline'}
                onClick={() => setOptionType('call')}
              >
                Call Option
              </Button>
              <Button 
                variant={optionType === 'put' ? 'default' : 'outline'}
                onClick={() => setOptionType('put')}
              >
                Put Option
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Enhanced Stock Selector and Parameters */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EnhancedStockSelector
          ticker={ticker}
          onTickerChange={setTicker}
          onPriceUpdate={(price) => updateParam('S', price)}
          showCompanyInfo={true}
        />

        <Card>
          <CardHeader>
            <CardTitle>Option Parameters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {parameterConfigs.slice(1).map((config) => (
                <ParameterInput
                  key={config.key}
                  label={config.label}
                  value={params[config.key]}
                  onChange={(value) => updateParam(config.key, value)}
                  min={config.min}
                  max={config.max}
                  step={config.step}
                  suffix={config.suffix}
                  tooltip={config.tooltip}
                  color={config.color}
                  id={config.key}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Base Position Info */}
      <Card>
        <CardContent className="p-4">
          <h4 className="font-semibold mb-3">Base Position Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Stock:</span>
              <p className="font-medium">{ticker} @ ${params.S.toFixed(2)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Option Type:</span>
              <p className="font-medium">{optionType.toUpperCase()}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Current Price:</span>
              <p className="font-medium">{formatCurrency(basePrice)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Moneyness:</span>
              <p className="font-medium">
                {params.S > params.K ? 'ITM' : params.S < params.K ? 'OTM' : 'ATM'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Tabs */}
      <Tabs defaultValue="stress-test" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="stress-test">Stress Tests</TabsTrigger>
          <TabsTrigger value="black-swan">Black Swan</TabsTrigger>
          <TabsTrigger value="var-analysis">VaR Analysis</TabsTrigger>
          <TabsTrigger value="time-decay">Time Decay</TabsTrigger>
        </TabsList>

        {/* Stress Test Tab */}
        <TabsContent value="stress-test" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Worst Case Scenarios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stressTestResults.slice(0, 8).map((scenario, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{scenario.scenario}</p>
                        <p className="text-xs text-muted-foreground">
                          Probability: {scenario.probability.toFixed(1)}%
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${scenario.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPercent(scenario.percentChange)}
                        </p>
                        <Badge className={getRiskColor(scenario.risk)} variant="outline">
                          {scenario.risk}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Stress Test Heatmap</CardTitle>
              </CardHeader>
              <CardContent>
                {stressTestResults.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <ScatterChart data={stressTestResults.slice(0, 30)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="probability" name="Probability" />
                      <YAxis dataKey="percentChange" name="P&L %" />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload[0]) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-card p-3 border border-border rounded shadow-lg text-foreground">
                                <p className="font-medium">{data.scenario}</p>
                                <p>P&L: {formatPercent(data.percentChange)}</p>
                                <p>Probability: {data.probability.toFixed(1)}%</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Scatter dataKey="percentChange" fill="hsl(var(--primary))" />
                    </ScatterChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center">
                    <p className="text-muted-foreground">Unable to generate stress test data</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Black Swan Tab with Interactive Cards */}
        <TabsContent value="black-swan" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Historical Black Swan Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {blackSwanResults.map((scenario, index) => (
                    <Dialog key={index}>
                      <DialogTrigger asChild>
                        <div className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                          <div className="flex-1">
                            <p className="text-sm font-medium flex items-center gap-2">
                              {scenario.scenario}
                              <HelpCircle className="h-3 w-3 text-muted-foreground" />
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Historical Probability: {scenario.probability.toFixed(1)}%
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-medium ${scenario.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatPercent(scenario.percentChange)}
                            </p>
                            <Badge className={getRiskColor(scenario.risk)} variant="outline">
                              {scenario.risk}
                            </Badge>
                          </div>
                        </div>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                            {scenario.scenario}
                          </DialogTitle>
                          <DialogDescription>
                            Historical analysis and P&L impact assessment
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-semibold mb-2">What Happened</h4>
                            <p className="text-sm text-muted-foreground">{scenario.description}</p>
                          </div>
                          
                          <div>
                            <h4 className="font-semibold mb-2">P&L Impact on Your Position</h4>
                            <div className="bg-muted/50 p-3 rounded-lg">
                              <p className="text-sm mb-2">{scenario.pnlImpact}</p>
                              <div className="grid grid-cols-2 gap-4 text-xs">
                                <div>
                                  <span className="text-muted-foreground">Your P&L:</span>
                                  <p className={`font-medium ${scenario.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {formatCurrency(scenario.pnl)} ({formatPercent(scenario.percentChange)})
                                  </p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">New Option Price:</span>
                                  <p className="font-medium">{formatCurrency(scenario.optionPrice)}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-semibold mb-2">Key Factors</h4>
                            <div className="flex flex-wrap gap-2">
                              {scenario.keyFactors?.map((factor, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {factor}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg">
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                              <div>
                                <h5 className="text-sm font-medium text-amber-400">Risk Assessment</h5>
                                <p className="text-xs text-amber-300/80 mt-1">
                                  While past events don't predict future outcomes, understanding historical impacts 
                                  helps in risk management and position sizing for similar scenarios.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Impact Visualization</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={blackSwanResults}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="scenario" 
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      fontSize={10}
                    />
                    <YAxis />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload[0]) {
                          return (
                            <div className="bg-card p-3 border border-border rounded shadow-lg text-foreground">
                              <p className="font-medium">{label}</p>
                              <p>P&L Impact: {formatPercent(payload[0].value as number)}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="percentChange" fill="hsl(var(--destructive))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* VaR Analysis Tab */}
        <TabsContent value="var-analysis" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Value at Risk Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 border rounded-lg">
                      <p className="text-sm text-muted-foreground">95% VaR (1 day)</p>
                      <p className="text-2xl font-bold text-red-600">{formatPercent(varResults.var95)}</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="text-sm text-muted-foreground">99% VaR (1 day)</p>
                      <p className="text-2xl font-bold text-red-700">{formatPercent(varResults.var99)}</p>
                    </div>
                  </div>
                  
                  <div className="p-3 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Expected Shortfall (95%)</p>
                    <p className="text-xl font-bold text-red-800">{formatPercent(varResults.expectedShortfall95)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Average loss beyond the VaR threshold
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Return Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={varResults.distribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="index" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="return" stroke="hsl(var(--primary))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Time Decay Tab */}
        <TabsContent value="time-decay" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5" />
                Time Decay Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={timeDecayAnalysis}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-card p-3 border border-border rounded shadow-lg text-foreground">
                            <p className="font-medium">Day {label}</p>
                            <p>Option Price: {formatCurrency(payload[0].value as number)}</p>
                            <p>P&L: {formatCurrency(payload[1].value as number)}</p>
                            <p>Theta: {(payload[2].value as number).toFixed(4)}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line type="monotone" dataKey="price" stroke="hsl(var(--primary))" name="Option Price" />
                  <Line type="monotone" dataKey="pnl" stroke="hsl(var(--destructive))" name="P&L" />
                  <Line type="monotone" dataKey="theta" stroke="hsl(var(--secondary))" name="Theta" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Universal Explanation Panel */}
      <UniversalExplanationPanel 
        modelName="ScenarioAnalysis"
        inputs={params}
        outputs={{
          scenarioCount: stressTestResults.length,
          bestCase: Math.max(...stressTestResults.map(s => s.optionPrice)),
          worstCase: Math.min(...stressTestResults.map(s => s.optionPrice))
        }}
      />
    </div>
  );
};

export default AdvancedScenarioAnalysis;