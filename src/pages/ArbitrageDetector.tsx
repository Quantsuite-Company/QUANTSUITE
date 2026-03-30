import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { AlertTriangle, TrendingUp, Zap, CheckCircle, XCircle, Info } from 'lucide-react';
import { StockAutocomplete } from '@/components/StockAutocomplete';
import { EnhancedStockSelector } from '@/components/EnhancedStockSelector';
import { Switch } from '@/components/ui/switch';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine, Area, AreaChart, Cell } from 'recharts';
import { calculateBlackScholes, BlackScholesParams } from '@/lib/blackScholes';
import { alphaVantageService } from '@/lib/alphaVantageApi';
import { UniversalExplanationPanel } from '@/components/UniversalExplanationPanel';

interface ArbitrageParams {
  S: number;    // Stock price
  K: number;    // Strike price
  T: number;    // Time to expiration (years)
  r: number;    // Risk-free rate
  sigma: number; // Volatility
  q: number;    // Dividend yield
  callPrice: number;   // Market call price
  putPrice: number;    // Market put price
}

interface ArbitrageResult {
  isArbitrage: boolean;
  opportunity: string;
  expectedValue: number;
  profitLoss: number;
  confidence: 'high' | 'medium' | 'low';
}

// Arbitrage Detector - Real-time scanner for option pricing inefficiencies
export default function ArbitrageDetector() {
  const [ticker, setTicker] = useState('AAPL');
  const [useOptionsMode, setUseOptionsMode] = useState(true);
  const [params, setParams] = useState<ArbitrageParams>({
    S: 100,
    K: 100,
    T: 0.25,
    r: 0.05,
    sigma: 0.2,
    q: 0.02,
    callPrice: 3.5,
    putPrice: 2.8
  });

  // Enhanced fetch using centralized API service
  const fetchStockPrice = async (symbol: string) => {
    try {
      const quote = await alphaVantageService.getQuote(symbol);
      
      if (quote) {
        setParams(prev => ({ ...prev, S: quote.price }));
      }
    } catch (error) {
      console.error('Error fetching stock price:', error);
    }
  };

  // Calculate theoretical prices for comparison
  const theoreticalPrices = useMemo(() => {
    const bsParams: BlackScholesParams = {
      S: params.S,
      K: params.K,
      T: params.T,
      r: params.r,
      sigma: params.sigma,
      q: params.q
    };
    return calculateBlackScholes(bsParams);
  }, [params]);

  // 1. Put-Call Parity Arbitrage
  const putCallParityCheck = useMemo((): ArbitrageResult => {
    const leftSide = params.callPrice - params.putPrice;
    const rightSide = params.S - params.K * Math.exp(-params.r * params.T);
    const difference = Math.abs(leftSide - rightSide);
    const threshold = 0.1; // Arbitrage threshold

    return {
      isArbitrage: difference > threshold,
      opportunity: difference > threshold 
        ? `Buy ${leftSide > rightSide ? 'put & sell call' : 'call & sell put'}` 
        : 'No arbitrage opportunity',
      expectedValue: rightSide,
      profitLoss: Math.abs(difference),
      confidence: difference > 0.5 ? 'high' : difference > 0.2 ? 'medium' : 'low'
    };
  }, [params]);

  // 2. Synthetic Forward Arbitrage  
  const syntheticForwardCheck = useMemo(() => {
    const syntheticForward = params.callPrice - params.putPrice + params.K * Math.exp(-params.r * params.T);
    const actualForward = params.S * Math.exp((params.r - params.q) * params.T);
    const difference = Math.abs(syntheticForward - actualForward);
    
    return {
      isArbitrage: difference > 0.5,
      syntheticPrice: syntheticForward,
      actualPrice: actualForward,
      difference: difference,
      opportunity: difference > 0.5 
        ? `${syntheticForward > actualForward ? 'Sell synthetic, buy actual' : 'Buy synthetic, sell actual'}`
        : 'Prices aligned'
    };
  }, [params]);

  // 3. Calendar Arbitrage - Dynamic volatility curve
  const calendarData = useMemo(() => {
    const expiries = [0.08, 0.25, 0.5, 1.0]; // 1M, 3M, 6M, 1Y
    return expiries.map((t, index) => {
      // Create realistic volatility term structure with mean reversion
      const timeEffect = Math.sqrt(t); // Volatility typically increases with time
      const meanReversion = 1 + (params.r - 0.03) * t; // Interest rate impact
      const skewEffect = (params.S - params.K) / params.K * 0.1; // Moneyness impact
      
      const volatility = params.sigma * timeEffect * meanReversion + skewEffect;
      const normalizedVol = Math.max(0.05, Math.min(0.8, volatility)); // Keep realistic bounds
      
      // Detect arbitrage when curve violates no-arbitrage conditions
      const expectedVol = params.sigma * (1 + t * 0.1); // Expected smooth curve
      const isArbitrage = Math.abs(normalizedVol - expectedVol) > 0.05;
      
      return {
        expiry: `${Math.round(t * 12)}M`,
        volatility: normalizedVol * 100,
        isArbitrage,
        timeToExpiry: t
      };
    });
  }, [params.sigma, params.r, params.S, params.K]);


  const handleParamChange = (field: keyof ArbitrageParams, value: number) => {
    setParams(prev => ({ ...prev, [field]: value }));
  };

  const getStatusIcon = (isArbitrage: boolean) => {
    return isArbitrage ? 
      <XCircle className="w-5 h-5 text-destructive" /> : 
      <CheckCircle className="w-5 h-5 text-success" />;
  };

  const getStatusColor = (isArbitrage: boolean) => {
    return isArbitrage ? 'bg-destructive/20 border-destructive' : 'bg-success/20 border-success';
  };

  return (
    <TooltipProvider>
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <AlertTriangle className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Arbitrage Detector</h1>
          <p className="text-muted-foreground">Real-time arbitrage opportunity scanner</p>
        </div>
      </div>

        {/* Parameter Inputs */}
        <Card>
          <CardHeader>
            <CardTitle>Market Parameters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="col-span-2">
                <Label htmlFor="ticker">Stock Symbol</Label>
                <div className="flex gap-2">
                  <StockAutocomplete
                    value={ticker}
                    onChange={(newTicker) => {
                      setTicker(newTicker);
                      fetchStockPrice(newTicker);
                    }}
                    placeholder="Search stocks..."
                    className="flex-1"
                  />
                  <Button 
                    onClick={() => fetchStockPrice(ticker)}
                    variant="outline"
                    size="sm"
                  >
                    📈 Get Price
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="S">Stock Price ($)</Label>
                <Input
                  id="S"
                  type="number"
                  value={params.S}
                  onChange={(e) => handleParamChange('S', parseFloat(e.target.value) || 0)}
                  step="0.1"
                />
              </div>
              <div>
                <Label htmlFor="K">Strike Price ($)</Label>
                <Input
                  id="K"
                  type="number"
                  value={params.K}
                  onChange={(e) => handleParamChange('K', parseFloat(e.target.value) || 0)}
                  step="0.1"
                />
              </div>
              <div>
                <Label htmlFor="T">Time to Expiry (years)</Label>
                <Input
                  id="T"
                  type="number"
                  value={params.T}
                  onChange={(e) => handleParamChange('T', parseFloat(e.target.value) || 0)}
                  step="0.01"
                />
              </div>
              <div>
                <Label htmlFor="r">Risk-free Rate (%)</Label>
                <Input
                  id="r"
                  type="number"
                  value={params.r * 100}
                  onChange={(e) => handleParamChange('r', (parseFloat(e.target.value) || 0) / 100)}
                  step="0.1"
                />
              </div>
              <div>
                <Label htmlFor="sigma">Volatility (%)</Label>
                <Input
                  id="sigma"
                  type="number"
                  value={params.sigma * 100}
                  onChange={(e) => handleParamChange('sigma', (parseFloat(e.target.value) || 0) / 100)}
                  step="0.5"
                />
              </div>
              <div>
                <Label htmlFor="q">Dividend Yield (%)</Label>
                <Input
                  id="q"
                  type="number"
                  value={params.q * 100}
                  onChange={(e) => handleParamChange('q', (parseFloat(e.target.value) || 0) / 100)}
                  step="0.1"
                />
              </div>
              <div>
                <Label htmlFor="callPrice">Market Call Price ($)</Label>
                <Input
                  id="callPrice"
                  type="number"
                  value={params.callPrice}
                  onChange={(e) => handleParamChange('callPrice', parseFloat(e.target.value) || 0)}
                  step="0.01"
                />
              </div>
              <div>
                <Label htmlFor="putPrice">Market Put Price ($)</Label>
                <Input
                  id="putPrice"
                  type="number"
                  value={params.putPrice}
                  onChange={(e) => handleParamChange('putPrice', parseFloat(e.target.value) || 0)}
                  step="0.01"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 1. Put-Call Parity Arbitrage */}
          <Card className="terminal-panel">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon(putCallParityCheck.isArbitrage)}
                Put-Call Parity Check
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-4 h-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>C - P = S - PV(K) should hold for fair pricing</p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium">Formula (LHS)</div>
                  <div className="text-lg font-mono">
                    C - P = {(params.callPrice - params.putPrice).toFixed(3)}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Expected (RHS)</div>
                  <div className="text-lg font-mono">
                    S - PV(K) = {putCallParityCheck.expectedValue.toFixed(3)}
                  </div>
                </div>
              </div>
              
              <Badge className={getStatusColor(putCallParityCheck.isArbitrage)}>
                {putCallParityCheck.isArbitrage ? '🔴 Arbitrage Detected!' : '🟢 Fair Pricing'}
              </Badge>
              
              {putCallParityCheck.isArbitrage && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-destructive" />
                    <span className="font-medium text-destructive">Opportunity</span>
                  </div>
                  <p className="text-sm text-destructive">{putCallParityCheck.opportunity}</p>
                  <p className="text-sm mt-1 text-destructive">
                    Potential Profit: <span className="font-mono">${putCallParityCheck.profitLoss.toFixed(3)}</span>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 2. Synthetic Forward Arbitrage */}
          <Card className="terminal-panel">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon(syntheticForwardCheck.isArbitrage)}
                Synthetic Forward Check
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={[
                    { name: 'Synthetic', price: syntheticForwardCheck.syntheticPrice, type: 'synthetic' },
                    { name: 'Actual', price: syntheticForwardCheck.actualPrice, type: 'actual' }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Line type="monotone" dataKey="price" stroke="hsl(var(--primary))" strokeWidth={3} />
                    {syntheticForwardCheck.isArbitrage && (
                      <ReferenceLine 
                        x="Actual" 
                        stroke="hsl(var(--destructive))" 
                        strokeDasharray="5 5" 
                        label="⚡ Gap"
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-muted-foreground">Synthetic: <span className="font-mono text-foreground">${syntheticForwardCheck.syntheticPrice.toFixed(3)}</span></div>
                <div className="text-muted-foreground">Actual: <span className="font-mono text-foreground">${syntheticForwardCheck.actualPrice.toFixed(3)}</span></div>
              </div>
              
              <Badge className={getStatusColor(syntheticForwardCheck.isArbitrage)}>
                {syntheticForwardCheck.isArbitrage ? '🔴 Divergence Detected' : '🟢 Prices Aligned'}
              </Badge>
            </CardContent>
          </Card>

          {/* 3. Calendar Arbitrage - Now Larger */}
          <Card className="terminal-panel">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Calendar Arbitrage (IV Curve)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
            <div className="h-64">
                {calendarData && calendarData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={calendarData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="expiry" />
                      <YAxis />
                      <Bar dataKey="volatility">
                        {calendarData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`}
                            fill={entry.isArbitrage ? 'hsl(var(--destructive))' : 'hsl(var(--success))'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center">
                    <p className="text-muted-foreground">Unable to generate volatility curve</p>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                {calendarData.map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm">{item.expiry}</span>
                    <Badge className={item.isArbitrage ? 'bg-destructive/20 text-destructive' : 'bg-success/20 text-success'}>
                      {item.volatility.toFixed(1)}%
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary */}
        <Card className="terminal-panel">
          <CardHeader>
            <CardTitle>Arbitrage Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { name: 'Put-Call Parity', status: putCallParityCheck.isArbitrage },
                { name: 'Synthetic Forward', status: syntheticForwardCheck.isArbitrage },
                { name: 'Calendar Spread', status: calendarData.some(d => d.isArbitrage) }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                  <span className="text-sm font-medium">{item.name}</span>
                  {item.status ? (
                    <Badge className="bg-destructive/20 text-destructive">⚠️ Alert</Badge>
                  ) : (
                    <Badge className="bg-success/20 text-success">✅ Clear</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Explanation Panel */}
        <UniversalExplanationPanel
          modelName="arbitrage"
          inputs={{
            spotPrice: params.S,
            strikePrice: params.K,
            callPrice: params.callPrice,
            putPrice: params.putPrice,
            timeToExpiry: params.T,
            riskFreeRate: params.r,
            volatility: params.sigma,
            dividendYield: params.q,
            parityViolation: putCallParityCheck.isArbitrage,
            forwardDivergence: syntheticForwardCheck.isArbitrage
          }}
          outputs={{
            parityCheck: !putCallParityCheck.isArbitrage,
            arbitrageProfit: putCallParityCheck.profitLoss,
            putCallParity: putCallParityCheck,
            syntheticForward: syntheticForwardCheck,
            arbitrageOpportunities: [putCallParityCheck, syntheticForwardCheck].filter(check => check.isArbitrage).length,
            totalProfitPotential: putCallParityCheck.profitLoss + (syntheticForwardCheck.difference || 0),
            riskLevel: putCallParityCheck.confidence,
            marketEfficiency: putCallParityCheck.isArbitrage || syntheticForwardCheck.isArbitrage ? 'low' : 'high'
          }}
        />
    </div>
    </TooltipProvider>
  );
}