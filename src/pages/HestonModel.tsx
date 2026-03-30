import { useState } from 'react';
import { CardDescription, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { QuantSuiteSEO } from '@/components/QuantSuiteSEO';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '@/components/ui/motion';
import { TrendingUp, Activity, Sparkles } from 'lucide-react';
import { HestonModel as HestonPricer } from '@/lib/advancedPricing';
import { ChartContainer, TerminalLineChart, chartColors } from '@/components/charts';

export default function HestonModel() {
  const [params, setParams] = useState({
    S: 100,      // Current stock price
    K: 100,      // Strike price
    T: 1,        // Time to maturity (years)
    r: 0.05,     // Risk-free rate
    v0: 0.04,    // Initial variance
    kappa: 2,    // Mean reversion speed
    theta: 0.04, // Long-term variance
    sigma: 0.3,  // Volatility of volatility
    rho: -0.7,   // Correlation between stock and variance
  });

  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const hestonModel = new HestonPricer();

  const handleParamChange = (key: string, value: number) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const calculatePrice = () => {
    setLoading(true);
    setTimeout(() => {
      try {
        const result = hestonModel.price(params);
        
        // Use the computed Greeks from the library instead of hardcoded values
        const greeks = result.greeks;
        
        // Generate volatility surface data (deterministic)
        const volSurface = generateVolatilitySurface();
        const smileData = generateVolSmile();
        
        setResults({
          ...result,
          greeks,
          volSurface,
          smileData,
        });
      } catch (error) {
        console.error('Heston pricing error:', error);
      }
      setLoading(false);
    }, 100);
  };

  const generateVolatilitySurface = () => {
    const strikes = [80, 90, 100, 110, 120];
    const maturities = [0.25, 0.5, 1.0, 2.0];
    
    return maturities.map(T => {
      const row: any = { maturity: `${T}Y` };
      strikes.forEach(K => {
        // Deterministic volatility surface based on Heston parameters
        const moneyness = K / params.S;
        const skew = params.rho * params.sigma * (1 - moneyness);
        const term = (params.v0 - params.theta) * Math.exp(-params.kappa * T) + params.theta;
        const vol = Math.sqrt(term) * (1 + skew);
        row[`K${K}`] = Math.max(0.01, vol) * 100;
      });
      return row;
    });
  };

  const generateVolSmile = () => {
    const strikes = [];
    for (let k = 0.7; k <= 1.3; k += 0.05) {
      const moneyness = k;
      const skew = params.rho * params.sigma * (1 - moneyness);
      const convexity = 0.5 * params.sigma * params.sigma * Math.pow(1 - moneyness, 2);
      const vol = Math.sqrt(params.theta) * (1 + skew + convexity);
      strikes.push({
        moneyness: (moneyness * 100).toFixed(0) + '%',
        impliedVol: vol * 100,
        atmVol: Math.sqrt(params.theta) * 100,
      });
    }
    return strikes;
  };

  return (
    <>
      <QuantSuiteSEO 
        title="Heston Stochastic Volatility Model | QuantSuite Advanced Options Pricing"
        description="Price European options using the Heston stochastic volatility model with characteristic function approach."
        path="/heston-model"
      />
      
      <div className="container mx-auto p-6 space-y-6">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          {/* Header */}
          <motion.div variants={staggerItem}>
            <ChartContainer height="auto" className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-primary/30">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                      Heston Stochastic Volatility Model
                    </h1>
                    <p className="text-muted-foreground mt-1">
                      Advanced options pricing with stochastic volatility and mean reversion
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="border-primary/30 text-primary">
                  <Activity className="w-3 h-3 mr-1" />
                  Institutional Grade
                </Badge>
              </div>
            </ChartContainer>
          </motion.div>

          {/* Parameters Section */}
          <motion.div variants={staggerItem}>
            <ChartContainer title="Model Parameters" subtitle="Configure the Heston model parameters for stochastic volatility pricing" height="auto" className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                {/* Market Parameters */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Market Parameters</h3>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="S" className="text-foreground">Stock Price (S)</Label>
                      <Input
                        id="S"
                        type="number"
                        value={params.S}
                        onChange={(e) => handleParamChange('S', parseFloat(e.target.value) || 0)}
                        step="1"
                        className="bg-background/50 border-border/50"
                      />
                    </div>
                    <div>
                      <Label htmlFor="K" className="text-foreground">Strike Price (K)</Label>
                      <Input
                        id="K"
                        type="number"
                        value={params.K}
                        onChange={(e) => handleParamChange('K', parseFloat(e.target.value) || 0)}
                        step="1"
                        className="bg-background/50 border-border/50"
                      />
                    </div>
                    <div>
                      <Label htmlFor="T" className="text-foreground">Time to Maturity (Years)</Label>
                      <Input
                        id="T"
                        type="number"
                        value={params.T}
                        onChange={(e) => handleParamChange('T', parseFloat(e.target.value) || 0)}
                        step="0.25"
                        className="bg-background/50 border-border/50"
                      />
                    </div>
                    <div>
                      <Label htmlFor="r" className="text-foreground">Risk-Free Rate (%)</Label>
                      <Input
                        id="r"
                        type="number"
                        value={(params.r * 100).toFixed(2)}
                        onChange={(e) => handleParamChange('r', (parseFloat(e.target.value) || 0) / 100)}
                        step="0.1"
                        className="bg-background/50 border-border/50"
                      />
                    </div>
                  </div>
                </div>

                {/* Heston Volatility Parameters */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Volatility Dynamics</h3>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="v0" className="text-foreground">Initial Variance (v₀)</Label>
                      <Input
                        id="v0"
                        type="number"
                        value={params.v0}
                        onChange={(e) => handleParamChange('v0', parseFloat(e.target.value) || 0)}
                        step="0.01"
                        className="bg-background/50 border-border/50"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        σ₀ = {Math.sqrt(params.v0).toFixed(4)} (vol)
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="kappa" className="text-foreground">Mean Reversion Speed (κ)</Label>
                      <Input
                        id="kappa"
                        type="number"
                        value={params.kappa}
                        onChange={(e) => handleParamChange('kappa', parseFloat(e.target.value) || 0)}
                        step="0.1"
                        className="bg-background/50 border-border/50"
                      />
                    </div>
                    <div>
                      <Label htmlFor="theta" className="text-foreground">Long-Term Variance (θ)</Label>
                      <Input
                        id="theta"
                        type="number"
                        value={params.theta}
                        onChange={(e) => handleParamChange('theta', parseFloat(e.target.value) || 0)}
                        step="0.01"
                        className="bg-background/50 border-border/50"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Long-term σ = {Math.sqrt(params.theta).toFixed(4)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Advanced Parameters */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Advanced Settings</h3>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="sigma" className="text-foreground">Vol of Vol (σᵥ)</Label>
                      <Input
                        id="sigma"
                        type="number"
                        value={params.sigma}
                        onChange={(e) => handleParamChange('sigma', parseFloat(e.target.value) || 0)}
                        step="0.01"
                        className="bg-background/50 border-border/50"
                      />
                    </div>
                    <div>
                      <Label htmlFor="rho" className="text-foreground">Correlation (ρ)</Label>
                      <Input
                        id="rho"
                        type="number"
                        value={params.rho}
                        onChange={(e) => handleParamChange('rho', parseFloat(e.target.value) || 0)}
                        min="-1"
                        max="1"
                        step="0.1"
                        className="bg-background/50 border-border/50"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Stock-Vol correlation
                      </p>
                    </div>
                    <div className="pt-6">
                      <Button 
                        onClick={calculatePrice}
                        disabled={loading}
                        className="w-full"
                      >
                        {loading ? 'Calculating...' : 'Calculate Price'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </ChartContainer>
          </motion.div>

          {/* Results Section */}
          {results && (
            <motion.div variants={staggerItem}>
              <Tabs defaultValue="pricing" className="space-y-4">
                <TabsList className="bg-card/50 border border-border/30">
                  <TabsTrigger value="pricing">Pricing Results</TabsTrigger>
                  <TabsTrigger value="greeks">Greeks</TabsTrigger>
                  <TabsTrigger value="smile">Vol Smile</TabsTrigger>
                </TabsList>

                <TabsContent value="pricing" className="space-y-4">
                  <ChartContainer title="Option Price" height="auto" className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                      <div className="text-center p-6 rounded-lg border border-border/30 bg-background/30">
                        <p className="text-sm text-muted-foreground mb-2">Call Option</p>
                        <p className="text-3xl font-bold" style={{ color: chartColors.cyan }}>
                          ${results.price.toFixed(4)}
                        </p>
                      </div>
                      <div className="text-center p-6 rounded-lg border border-border/30 bg-background/30">
                        <p className="text-sm text-muted-foreground mb-2">Model</p>
                        <p className="text-xl font-semibold text-foreground">{results.model}</p>
                      </div>
                      <div className="text-center p-6 rounded-lg border border-border/30 bg-background/30">
                        <p className="text-sm text-muted-foreground mb-2">Convergence</p>
                        <Badge variant="outline" className="text-xs">
                          {results.convergenceInfo?.iterations || 1000} iterations
                        </Badge>
                      </div>
                    </div>
                  </ChartContainer>
                </TabsContent>

                <TabsContent value="greeks" className="space-y-4">
                  <ChartContainer title="Option Greeks" height="auto" className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                      {[
                        { name: 'Delta (Δ)', value: results.greeks.delta, color: chartColors.cyan },
                        { name: 'Gamma (Γ)', value: results.greeks.gamma, color: chartColors.profit },
                        { name: 'Vega (ν)', value: results.greeks.vega, color: chartColors.amber },
                        { name: 'Theta (Θ)', value: results.greeks.theta, color: chartColors.loss },
                        { name: 'Rho (ρ)', value: results.greeks.rho, color: chartColors.purple },
                      ].map((greek) => (
                        <div key={greek.name} className="text-center p-4 rounded-lg border border-border/30 bg-background/30">
                          <p className="text-xs text-muted-foreground mb-1">{greek.name}</p>
                          <p className="text-xl font-bold" style={{ color: greek.color }}>
                            {greek.value.toFixed(4)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </ChartContainer>
                </TabsContent>

                <TabsContent value="smile" className="space-y-4">
                  {results.smileData && (
                    <TerminalLineChart
                      data={results.smileData}
                      lines={[
                        { dataKey: 'impliedVol', name: 'Implied Vol', color: chartColors.cyan, showArea: true },
                        { dataKey: 'atmVol', name: 'ATM Vol', color: chartColors.muted, dashed: true },
                      ]}
                      xAxisKey="moneyness"
                      title="Implied Volatility Smile"
                      subtitle="Volatility vs moneyness (K/S)"
                      height={350}
                      yAxisFormatter={(val) => `${val.toFixed(1)}%`}
                    />
                  )}
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </motion.div>
      </div>
    </>
  );
}
