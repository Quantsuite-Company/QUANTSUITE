import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { GitBranch, Info, DollarSign } from "lucide-react";
import { EnhancedStockSelector } from '@/components/EnhancedStockSelector';
import { useToast } from "@/hooks/use-toast";
import { UniversalExplanationPanel } from "@/components/UniversalExplanationPanel";

interface BinomialParams {
  S: number;     // Current stock price
  K: number;     // Strike price
  T: number;     // Time to expiration
  r: number;     // Risk-free rate
  sigma: number; // Volatility
  steps: number; // Number of time steps
  isCall: boolean; // Call or Put option
}

interface TreeNode {
  price: number;
  optionValue: number;
  intrinsicValue: number;
  step: number;
  upMoves: number;
  exerciseOptimal: boolean;
}

const calculateBinomialTree = (params: BinomialParams): TreeNode[][] => {
  const { S, K, T, r, sigma, steps, isCall } = params;
  
  // CRR parameters
  const dt = T / steps;
  const u = Math.exp(sigma * Math.sqrt(dt));
  const d = 1 / u;
  const p = (Math.exp(r * dt) - d) / (u - d);
  const discount = Math.exp(-r * dt);
  
  // Initialize tree
  const tree: TreeNode[][] = [];
  
  // Forward pass - calculate stock prices
  for (let i = 0; i <= steps; i++) {
    tree[i] = [];
    for (let j = 0; j <= i; j++) {
      const stockPrice = S * Math.pow(u, j) * Math.pow(d, i - j);
      const intrinsic = isCall 
        ? Math.max(0, stockPrice - K)
        : Math.max(0, K - stockPrice);
      
      tree[i][j] = {
        price: stockPrice,
        optionValue: 0,
        intrinsicValue: intrinsic,
        step: i,
        upMoves: j,
        exerciseOptimal: false
      };
    }
  }
  
  // Backward pass - calculate option values
  // Terminal conditions
  for (let j = 0; j <= steps; j++) {
    tree[steps][j].optionValue = tree[steps][j].intrinsicValue;
    tree[steps][j].exerciseOptimal = tree[steps][j].intrinsicValue > 0;
  }
  
  // Work backwards through the tree
  for (let i = steps - 1; i >= 0; i--) {
    for (let j = 0; j <= i; j++) {
      // European value (discounted expected value)
      const europeanValue = discount * (
        p * tree[i + 1][j + 1].optionValue + 
        (1 - p) * tree[i + 1][j].optionValue
      );
      
      // American value (max of European and intrinsic)
      const intrinsicValue = tree[i][j].intrinsicValue;
      const americanValue = Math.max(europeanValue, intrinsicValue);
      
      tree[i][j].optionValue = americanValue;
      tree[i][j].exerciseOptimal = americanValue > europeanValue + 1e-10;
    }
  }
  
  return tree;
};

const TreeVisualization: React.FC<{ tree: TreeNode[][], params: BinomialParams }> = ({ tree, params }) => {
  const maxNodes = Math.min(tree.length, 8); // Limit display for readability
  
  const getNodeColors = (node: TreeNode, stepIndex: number, nodeIndex: number) => {
    const moneyness = params.S / params.K;
    const isITM = params.isCall ? node.price > params.K : node.price < params.K;
    const isDeepITM = params.isCall ? node.price > params.K * 1.1 : node.price < params.K * 0.9;
    const isOTM = !isITM;
    
    if (node.exerciseOptimal) {
      return {
        container: 'border-2 border-emerald-400 bg-gradient-to-br from-emerald-900/80 to-emerald-800/60 shadow-lg shadow-emerald-400/30 hover:shadow-emerald-400/50 backdrop-blur-sm',
        price: 'text-emerald-200 font-semibold',
        value: 'text-emerald-100 font-bold text-lg',
        intrinsic: 'text-emerald-300'
      };
    } else if (isDeepITM) {
      return {
        container: 'border-2 border-blue-400 bg-gradient-to-br from-blue-900/80 to-blue-800/60 shadow-lg shadow-blue-400/30 hover:shadow-blue-400/50 backdrop-blur-sm',
        price: 'text-blue-200',
        value: 'text-blue-100 font-bold text-lg',
        intrinsic: 'text-blue-300'
      };
    } else if (isITM) {
      return {
        container: 'border-2 border-cyan-400 bg-gradient-to-br from-cyan-900/80 to-cyan-800/60 shadow-lg shadow-cyan-400/30 hover:shadow-cyan-400/50 backdrop-blur-sm',
        price: 'text-cyan-200',
        value: 'text-cyan-100 font-bold text-lg',
        intrinsic: 'text-cyan-300'
      };
    } else if (isOTM) {
      return {
        container: 'border-2 border-amber-400 bg-gradient-to-br from-amber-900/80 to-amber-800/60 shadow-lg shadow-amber-400/30 hover:shadow-amber-400/50 backdrop-blur-sm',
        price: 'text-amber-200',
        value: 'text-amber-100 font-bold text-lg',
        intrinsic: 'text-amber-300'
      };
    } else {
      return {
        container: 'border-2 border-purple-400 bg-gradient-to-br from-purple-900/80 to-purple-800/60 shadow-lg shadow-purple-400/30 hover:shadow-purple-400/50 backdrop-blur-sm',
        price: 'text-purple-200',
        value: 'text-purple-100 font-bold text-lg',
        intrinsic: 'text-purple-300'
      };
    }
  };
  
  return (
    <div className="overflow-x-auto p-6 bg-gradient-to-br from-card via-background to-card rounded-xl border border-border">
      <div className="flex gap-8 min-w-fit">
        {tree.slice(0, maxNodes).map((column, stepIndex) => (
          <div key={stepIndex} className="flex flex-col gap-4">
            <div className="text-sm font-medium text-muted-foreground text-center mb-2 bg-muted/70 rounded-full px-3 py-1 shadow-lg border border-border">
              t = {stepIndex}
            </div>
            {column.map((node, nodeIndex) => {
              const colors = getNodeColors(node, stepIndex, nodeIndex);
              return (
                <div
                  key={`${stepIndex}-${nodeIndex}`}
                  className={`
                    relative rounded-xl p-4 min-w-[130px] text-center transition-all duration-300 transform hover:scale-105
                    ${colors.container}
                  `}
                >
                  <div className={`text-xs font-mono ${colors.price} mb-1`}>
                    S = ${node.price.toFixed(2)}
                  </div>
                  <div className={`text-lg ${colors.value} mb-1`}>
                    ${node.optionValue.toFixed(3)}
                  </div>
                  <div className={`text-xs ${colors.intrinsic}`}>
                    IV: ${node.intrinsicValue.toFixed(2)}
                  </div>
                  {node.exerciseOptimal && (
                    <Badge className="absolute -top-2 -right-2 text-xs bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg animate-pulse">
                      Exercise!
                    </Badge>
                  )}
                  
                  {/* Connection lines to next nodes */}
                  {stepIndex < maxNodes - 1 && (
                    <>
                      <div className="absolute top-1/2 -right-8 w-6 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400 transform -translate-y-1/2 shadow-sm"></div>
                      {nodeIndex < column.length - 1 && (
                        <div className="absolute top-1/2 -right-8 w-6 h-0.5 bg-gradient-to-r from-pink-400 to-blue-400 transform -translate-y-1/2 rotate-12 shadow-sm"></div>
                      )}
                      {nodeIndex > 0 && (
                        <div className="absolute top-1/2 -right-8 w-6 h-0.5 bg-gradient-to-r from-emerald-400 to-yellow-400 transform -translate-y-1/2 -rotate-12 shadow-sm"></div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      
      {tree.length > maxNodes && (
        <div className="text-center text-sm text-muted-foreground mt-6 bg-muted/50 rounded-lg px-4 py-2 inline-block border border-border">
          Showing first {maxNodes} steps of {tree.length} total steps
        </div>
      )}
    </div>
  );
};

const BinomialTree = () => {
  const [ticker, setTicker] = useState('AAPL');
  const [params, setParams] = useState<BinomialParams>({
    S: 100,      // Stock price
    K: 100,      // Strike price
    T: 0.25,     // 3 months
    r: 0.05,     // 5% risk-free rate
    sigma: 0.2,  // 20% volatility
    steps: 5,    // 5 time steps
    isCall: true
  });

  const tree = useMemo(() => calculateBinomialTree(params), [params]);
  
  const handleParamChange = (key: keyof BinomialParams, value: string | number | boolean) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const crr_u = Math.exp(params.sigma * Math.sqrt(params.T / params.steps));
  const crr_d = 1 / crr_u;
  const crr_p = (Math.exp(params.r * (params.T / params.steps)) - crr_d) / (crr_u - crr_d);

  const { toast } = useToast();

  // Fetch real stock data when ticker changes
  const fetchStockPrice = async (symbol: string) => {
    try {
      const response = await fetch(
        `https://api.twelvedata.com/quote?symbol=${symbol}&apikey=6f5594d8e0d34335b402b9ee435f117d`
      );
      const data = await response.json();
      const quote = data['Global Quote'];
      if (quote && quote['05. price']) {
        const price = parseFloat(quote['05. price']);
        setParams(prev => ({ ...prev, S: price }));
        toast({
          title: `✅ ${symbol} Price Updated`,
          description: `Current price: $${price.toFixed(2)}`,
        });
      } else {
        // Fallback to realistic stock prices
        const stockPrices: Record<string, number> = {
          'AAPL': 175, 'GOOGL': 2800, 'MSFT': 340, 'TSLA': 240, 'AMZN': 145
        };
        const price = stockPrices[symbol] || 100;
        setParams(prev => ({ ...prev, S: price }));
        toast({
          title: `📊 Using ${symbol} Demo Price`,
          description: `Simulated price: $${price.toFixed(2)}`,
        });
      }
    } catch (error) {
      console.error('Error fetching stock price:', error);
      toast({
        title: "⚠️ Using Demo Data",
        description: "Real-time data unavailable, using simulated price",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto p-6 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Binomial Tree Pricer
          </h1>
          <p className="text-muted-foreground text-lg">
            Cox-Ross-Rubinstein Model for American Options
          </p>
        </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Input Panel */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <DollarSign className="h-5 w-5" />
              Option Parameters
            </CardTitle>
          </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Select Stock</Label>
                <EnhancedStockSelector
                  ticker={ticker}
                  onTickerChange={(newTicker) => {
                    setTicker(newTicker);
                    fetchStockPrice(newTicker);
                  }}
                  onPriceUpdate={(price) => handleParamChange('S', price)}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stockPrice">Stock Price ($)</Label>
                <Input
                  id="stockPrice"
                  type="number"
                  step="0.01"
                  value={params.S}
                  onChange={(e) => handleParamChange('S', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="strikePrice">Strike Price ($)</Label>
                <Input
                  id="strikePrice" 
                  type="number"
                  step="0.01"
                  value={params.K}
                  onChange={(e) => handleParamChange('K', parseFloat(e.target.value) || 0)}
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
                  onChange={(e) => handleParamChange('T', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="volatility">Volatility (%)</Label>
                <Input
                  id="volatility"
                  type="number"
                  step="0.01"
                  value={params.sigma * 100}
                  onChange={(e) => handleParamChange('sigma', (parseFloat(e.target.value) || 0) / 100)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="riskFreeRate">Risk-Free Rate (%)</Label>
              <Input
                id="riskFreeRate"
                type="number"
                step="0.01"
                value={params.r * 100}
                onChange={(e) => handleParamChange('r', (parseFloat(e.target.value) || 0) / 100)}
              />
            </div>

            <div className="space-y-2">
              <Label>Time Steps: {params.steps}</Label>
              <Slider
                value={[params.steps]}
                onValueChange={([value]) => handleParamChange('steps', value)}
                min={2}
                max={15}
                step={1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Δt = {(params.T / params.steps).toFixed(4)} years per step
              </p>
            </div>

            <div className="space-y-2">
              <Label>Option Type</Label>
              <div className="flex gap-2">
                <Button
                  variant={params.isCall ? "default" : "outline"}
                  onClick={() => handleParamChange('isCall', true)}
                  className="flex-1"
                >
                  Call
                </Button>
                <Button
                  variant={!params.isCall ? "default" : "outline"}
                  onClick={() => handleParamChange('isCall', false)}
                  className="flex-1"
                >
                  Put
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Panel */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Info className="h-5 w-5" />
              Model Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                ${tree[0]?.[0]?.optionValue.toFixed(4) || '0.0000'}
              </div>
              <p className="text-sm text-muted-foreground">American Option Value</p>
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="font-medium">CRR Parameters</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Up Factor (u)</p>
                  <p className="font-mono">{crr_u.toFixed(4)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Down Factor (d)</p>
                  <p className="font-mono">{crr_d.toFixed(4)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Risk-Neutral Prob (p)</p>
                  <p className="font-mono">{crr_p.toFixed(4)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Time Step (Δt)</p>
                  <p className="font-mono">{(params.T / params.steps).toFixed(4)}</p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="font-medium">Exercise Analysis</h4>
              <div className="text-sm">
                {tree[0]?.[0]?.exerciseOptimal ? (
                  <Badge variant="default">Early Exercise Optimal</Badge>
                ) : (
                  <Badge variant="secondary">Hold to Maturity</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {tree[0]?.[0]?.exerciseOptimal 
                  ? "The option should be exercised early at some point"
                  : "The option should not be exercised before expiration"
                }
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Tree Legend */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <GitBranch className="h-5 w-5 text-pink-400" />
              <span className="bg-gradient-to-r from-pink-400 to-cyan-400 bg-clip-text text-transparent">
                Color Legend
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 border-2 border-emerald-400 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg shadow-lg shadow-emerald-500/30"></div>
                <span className="text-sm font-medium text-emerald-300">Optimal Exercise</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 border-2 border-blue-400 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg shadow-blue-500/30"></div>
                <span className="text-sm font-medium text-blue-300">Deep In-The-Money</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 border-2 border-cyan-400 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg shadow-lg shadow-cyan-500/30"></div>
                <span className="text-sm font-medium text-cyan-300">In-The-Money</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 border-2 border-amber-400 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg shadow-lg shadow-amber-500/30"></div>
                <span className="text-sm font-medium text-amber-300">Out-Of-The-Money</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 border-2 border-purple-400 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg shadow-purple-500/30"></div>
                <span className="text-sm font-medium text-purple-300">At-The-Money</span>
              </div>
            </div>

            <Separator />

            <div className="space-y-2 text-xs">
              <p><strong className="text-foreground">S</strong> = Stock Price</p>
              <p><strong className="text-foreground">Option Value</strong> = American Value</p>
              <p><strong className="text-foreground">IV</strong> = Intrinsic Value</p>
            </div>

            <Separator />

            <div className="text-xs text-muted-foreground space-y-1 bg-muted p-3 rounded-lg border border-border">
              <p>🎯 Each node shows stock price and option value</p>
              <p>⚡ Pulsing badges indicate early exercise</p>
              <p>🌈 Colors represent moneyness levels</p>
              <p>📊 Tree grows exponentially with time steps</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tree Visualization */}
      <Card className="bg-card border-2 border-border shadow-2xl">
        <CardHeader className="bg-gradient-to-r from-card to-muted border-b border-border">
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-6 w-6 text-primary" />
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent text-xl">
              Binomial Price Tree
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 bg-background">
          <TreeVisualization tree={tree} params={params} />
        </CardContent>
      </Card>

      {/* Explanation Panel */}
      <UniversalExplanationPanel
        modelName="Binomial"
        inputs={{
          stockPrice: params.S,
          strikePrice: params.K,
          timeToExpiry: params.T,
          volatility: params.sigma,
          steps: params.steps,
          optionType: params.isCall ? 'call' : 'put'
        }}
        outputs={{
          optionValue: tree[0]?.[0]?.optionValue || 0,
          earlyExercise: tree[0]?.[0]?.exerciseOptimal || false,
          upFactor: crr_u,
          downFactor: crr_d,
          riskNeutralProb: crr_p
        }}
      />
      </div>
    </div>
  );
};

export default BinomialTree;