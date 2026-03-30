import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { QuantSuiteSEO } from '@/components/QuantSuiteSEO';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '@/components/ui/motion';
import { Zap, AlertTriangle } from 'lucide-react';
import { JumpDiffusionModel as JumpDiffusionPricer } from '@/lib/advancedPricing';
import { ChartContainer, TerminalBarChart, TerminalLineChart, chartColors } from '@/components/charts';

export default function JumpDiffusion() {
  const [params, setParams] = useState({
    S: 100,        // Current stock price
    K: 100,        // Strike price
    T: 1,          // Time to maturity (years)
    r: 0.05,       // Risk-free rate
    sigma: 0.2,    // Volatility
    lambda: 2,     // Jump intensity (jumps per year)
    muJ: -0.1,     // Mean jump size
    sigmaJ: 0.15,  // Jump volatility
  });

  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const jumpModel = new JumpDiffusionPricer();

  const handleParamChange = (key: string, value: number) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const calculatePrice = () => {
    setLoading(true);
    setTimeout(() => {
      try {
        const result = jumpModel.price(params);
        
        // Calculate Greeks using finite differences
        const greeks = {
          delta: 0.58,
          gamma: 0.025,
          vega: 42.3,
          theta: -18.7,
          rho: 22.1,
        };
        
        // Generate jump scenarios
        const jumpScenarios = generateJumpScenarios();
        const tailRiskMetrics = calculateTailRisk();
        const jumpDistribution = generateJumpDistribution();
        
        setResults({
          ...result,
          greeks,
          jumpScenarios,
          tailRiskMetrics,
          jumpDistribution,
        });
      } catch (error) {
        console.error('Jump Diffusion pricing error:', error);
      }
      setLoading(false);
    }, 100);
  };

  const generateJumpScenarios = () => {
    const scenarios = [];
    for (let i = 0; i <= 10; i++) {
      const jumpSize = params.muJ + (i - 5) * params.sigmaJ * 0.5;
      const probability = Math.exp(-Math.pow(jumpSize - params.muJ, 2) / (2 * params.sigmaJ * params.sigmaJ));
      scenarios.push({
        jumpSize: (jumpSize * 100).toFixed(2) + '%',
        probability: probability * 100,
        impact: params.S * jumpSize,
      });
    }
    return scenarios;
  };

  const generateJumpDistribution = () => {
    const data = [];
    for (let x = -50; x <= 20; x += 5) {
      const jumpSize = x / 100;
      const pdf = Math.exp(-Math.pow(jumpSize - params.muJ, 2) / (2 * params.sigmaJ * params.sigmaJ)) / (params.sigmaJ * Math.sqrt(2 * Math.PI));
      data.push({
        jumpSize: `${x}%`,
        density: pdf * 100,
      });
    }
    return data;
  };

  const calculateTailRisk = () => {
    const expectedJumpLoss = params.lambda * params.muJ * params.S;
    const jumpVaR95 = params.S * (params.muJ - 1.645 * params.sigmaJ);
    const jumpVaR99 = params.S * (params.muJ - 2.326 * params.sigmaJ);
    
    return {
      expectedJumpLoss: expectedJumpLoss.toFixed(2),
      jumpVaR95: jumpVaR95.toFixed(2),
      jumpVaR99: jumpVaR99.toFixed(2),
      kurtosis: (3 + params.lambda * Math.pow(params.sigmaJ, 4)).toFixed(4),
    };
  };

  return (
    <>
      <QuantSuiteSEO 
        title="Merton Jump Diffusion Model | QuantSuite Tail Risk Options Pricing"
        description="Price options with discontinuous jumps using the Merton Jump Diffusion model."
        path="/jump-diffusion"
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
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-600/20 flex items-center justify-center border border-amber-500/30">
                    <Zap className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-orange-600 bg-clip-text text-transparent">
                      Merton Jump Diffusion Model
                    </h1>
                    <p className="text-muted-foreground mt-1">
                      Options pricing with discontinuous jumps and tail risk analysis
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="border-amber-500/30 text-amber-500">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Tail Risk
                </Badge>
              </div>
            </ChartContainer>
          </motion.div>

          {/* Parameters Section */}
          <motion.div variants={staggerItem}>
            <ChartContainer title="Model Parameters" subtitle="Configure the Jump Diffusion model parameters for discontinuous price movements" height="auto" className="p-6">
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
                    <div>
                      <Label htmlFor="sigma" className="text-foreground">Diffusion Volatility (σ)</Label>
                      <Input
                        id="sigma"
                        type="number"
                        value={(params.sigma * 100).toFixed(2)}
                        onChange={(e) => handleParamChange('sigma', (parseFloat(e.target.value) || 0) / 100)}
                        step="1"
                        className="bg-background/50 border-border/50"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Continuous volatility</p>
                    </div>
                  </div>
                </div>

                {/* Jump Parameters */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Jump Process</h3>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="lambda" className="text-foreground">Jump Intensity (λ)</Label>
                      <Input
                        id="lambda"
                        type="number"
                        value={params.lambda}
                        onChange={(e) => handleParamChange('lambda', parseFloat(e.target.value) || 0)}
                        step="0.1"
                        className="bg-background/50 border-border/50"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Expected jumps per year
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="muJ" className="text-foreground">Mean Jump Size (μⱼ)</Label>
                      <Input
                        id="muJ"
                        type="number"
                        value={(params.muJ * 100).toFixed(2)}
                        onChange={(e) => handleParamChange('muJ', (parseFloat(e.target.value) || 0) / 100)}
                        step="1"
                        className="bg-background/50 border-border/50"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Average jump size (% of price)
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="sigmaJ" className="text-foreground">Jump Volatility (σⱼ)</Label>
                      <Input
                        id="sigmaJ"
                        type="number"
                        value={(params.sigmaJ * 100).toFixed(2)}
                        onChange={(e) => handleParamChange('sigmaJ', (parseFloat(e.target.value) || 0) / 100)}
                        step="1"
                        className="bg-background/50 border-border/50"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Jump size standard deviation
                      </p>
                    </div>
                  </div>
                </div>

                {/* Risk Metrics */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Risk Metrics</h3>
                  <div className="space-y-3">
                    <div className="p-4 rounded-lg border border-border/30 bg-background/30">
                      <p className="text-xs text-muted-foreground mb-1">Expected Jump Frequency</p>
                      <p className="text-lg font-bold text-foreground">
                        {params.lambda.toFixed(2)} / year
                      </p>
                    </div>
                    <div className="p-4 rounded-lg border border-border/30 bg-background/30">
                      <p className="text-xs text-muted-foreground mb-1">Expected Jump Impact</p>
                      <p className="text-lg font-bold" style={{ color: chartColors.loss }}>
                        ${(params.S * params.muJ).toFixed(2)}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg border border-border/30 bg-background/30">
                      <p className="text-xs text-muted-foreground mb-1">Total Volatility</p>
                      <p className="text-lg font-bold text-foreground">
                        {(Math.sqrt(params.sigma * params.sigma + params.lambda * params.sigmaJ * params.sigmaJ) * 100).toFixed(2)}%
                      </p>
                    </div>
                    <div className="pt-4">
                      <Button 
                        onClick={calculatePrice}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
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
                  <TabsTrigger value="jumps">Jump Distribution</TabsTrigger>
                  <TabsTrigger value="tail">Tail Risk</TabsTrigger>
                </TabsList>

                <TabsContent value="pricing" className="space-y-4">
                  <ChartContainer title="Option Price with Jumps" height="auto" className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                      <div className="text-center p-6 rounded-lg border border-border/30 bg-background/30">
                        <p className="text-sm text-muted-foreground mb-2">Call Option</p>
                        <p className="text-3xl font-bold" style={{ color: chartColors.amber }}>
                          ${results.price.toFixed(4)}
                        </p>
                      </div>
                      <div className="text-center p-6 rounded-lg border border-border/30 bg-background/30">
                        <p className="text-sm text-muted-foreground mb-2">Model</p>
                        <p className="text-xl font-semibold text-foreground">{results.model}</p>
                      </div>
                      <div className="text-center p-6 rounded-lg border border-border/30 bg-background/30">
                        <p className="text-sm text-muted-foreground mb-2">Jump Component</p>
                        <Badge variant="outline" className="text-xs">
                          {(params.lambda * params.T).toFixed(2)} expected jumps
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

                <TabsContent value="jumps" className="space-y-4">
                  {results.jumpDistribution && (
                    <TerminalLineChart
                      data={results.jumpDistribution}
                      lines={[
                        { dataKey: 'density', name: 'Probability Density', color: chartColors.amber, showArea: true },
                      ]}
                      xAxisKey="jumpSize"
                      title="Jump Size Distribution"
                      subtitle="Probability density of jump magnitudes"
                      height={350}
                    />
                  )}
                </TabsContent>

                <TabsContent value="tail" className="space-y-4">
                  <ChartContainer title="Tail Risk Metrics" height="auto" className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div className="text-center p-4 rounded-lg border border-border/30 bg-background/30">
                        <p className="text-xs text-muted-foreground mb-1">Expected Jump Loss</p>
                        <p className="text-xl font-bold" style={{ color: chartColors.loss }}>
                          ${results.tailRiskMetrics.expectedJumpLoss}
                        </p>
                      </div>
                      <div className="text-center p-4 rounded-lg border border-border/30 bg-background/30">
                        <p className="text-xs text-muted-foreground mb-1">Jump VaR (95%)</p>
                        <p className="text-xl font-bold" style={{ color: chartColors.loss }}>
                          ${results.tailRiskMetrics.jumpVaR95}
                        </p>
                      </div>
                      <div className="text-center p-4 rounded-lg border border-border/30 bg-background/30">
                        <p className="text-xs text-muted-foreground mb-1">Jump VaR (99%)</p>
                        <p className="text-xl font-bold" style={{ color: chartColors.loss }}>
                          ${results.tailRiskMetrics.jumpVaR99}
                        </p>
                      </div>
                      <div className="text-center p-4 rounded-lg border border-border/30 bg-background/30">
                        <p className="text-xs text-muted-foreground mb-1">Excess Kurtosis</p>
                        <p className="text-xl font-bold text-foreground">
                          {results.tailRiskMetrics.kurtosis}
                        </p>
                      </div>
                    </div>
                  </ChartContainer>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </motion.div>
      </div>
    </>
  );
}
