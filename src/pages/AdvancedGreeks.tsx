import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RotateCcw, TrendingUp, Activity, Zap } from 'lucide-react';
import { toast } from "sonner";
import { ParameterInput } from '@/components/ParameterInput';
import { calculateAdvancedBlackScholes, BlackScholesParams, AdvancedBlackScholesResult } from '@/lib/blackScholes';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TooltipProvider } from '@/components/ui/tooltip';
import { UniversalExplanationPanel } from '@/components/UniversalExplanationPanel';
import { EnhancedStockSelector } from "@/components/EnhancedStockSelector";
import { useToast } from "@/hooks/use-toast";

const defaultParams: BlackScholesParams = {
  S: 100,
  K: 100,
  T: 0.25,
  r: 0.05,
  sigma: 0.2,
  q: 0,
};

const AdvancedGreeks = () => {
  const [ticker, setTicker] = useState('AAPL');
  const [params, setParams] = useState<BlackScholesParams>(defaultParams);
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  // Calculate advanced Greeks
  const result = useMemo(() => {
    try {
      return calculateAdvancedBlackScholes(params);
    } catch (error) {
      console.error('Calculation error:', error);
      return null;
    }
  }, [params]);

  // Generate sensitivity analysis data with error handling and performance optimization
  const sensitivityData = useMemo(() => {
    if (!result) return { spot: [], volatility: [], time: [] };

    try {
      setIsCalculating(true);
      console.log('Calculating Greeks sensitivity data...');

      const baseSpot = params.S;
      const baseVol = params.sigma;
      const baseTime = params.T;

      // Reduce calculation points for performance - 11 instead of 21
      const numPoints = 11;

      // Spot price sensitivity
      const spotRange = Array.from({ length: numPoints }, (_, i) => baseSpot * (0.8 + (i * 0.04)));
      const spotData = spotRange.map(spot => {
        try {
          const tempResult = calculateAdvancedBlackScholes({ ...params, S: spot });
          return {
            spot: Math.round(spot * 100) / 100,
            delta: isFinite(tempResult.greeks.delta.call) ? tempResult.greeks.delta.call : 0,
            gamma: isFinite(tempResult.greeks.gamma) ? tempResult.greeks.gamma : 0,
            vega: isFinite(tempResult.greeks.vega) ? tempResult.greeks.vega : 0,
            theta: isFinite(tempResult.greeks.theta.call) ? tempResult.greeks.theta.call : 0
          };
        } catch {
          return { spot: Math.round(spot * 100) / 100, delta: 0, gamma: 0, vega: 0, theta: 0 };
        }
      });

      // Volatility sensitivity
      const volRange = Array.from({ length: numPoints }, (_, i) => Math.max(0.01, baseVol * (0.5 + (i * 0.1))));
      const volData = volRange.map(sigma => {
        try {
          const tempResult = calculateAdvancedBlackScholes({ ...params, sigma });
          return {
            volatility: Math.round(sigma * 10000) / 100,
            vega: isFinite(tempResult.greeks.vega) ? tempResult.greeks.vega : 0,
            vanna: isFinite(tempResult.greeks.vanna) ? tempResult.greeks.vanna : 0,
            zomma: isFinite(tempResult.greeks.zomma) ? tempResult.greeks.zomma : 0,
            ultima: isFinite(tempResult.greeks.ultima) ? tempResult.greeks.ultima : 0
          };
        } catch {
          return { volatility: Math.round(sigma * 10000) / 100, vega: 0, vanna: 0, zomma: 0, ultima: 0 };
        }
      });

      // Time decay sensitivity
      const timeRange = Array.from({ length: numPoints }, (_, i) => Math.max(0.001, baseTime * (0.1 + (i * 0.09))));
      const timeData = timeRange.map(T => {
        try {
          const tempResult = calculateAdvancedBlackScholes({ ...params, T });
          return {
            timeToExpiry: Math.round(T * 365 * 10) / 10,
            theta: isFinite(tempResult.greeks.theta.call) ? tempResult.greeks.theta.call : 0,
            charm: isFinite(tempResult.greeks.charm.call) ? tempResult.greeks.charm.call : 0,
            color: isFinite(tempResult.greeks.color) ? tempResult.greeks.color : 0
          };
        } catch {
          return { timeToExpiry: Math.round(T * 365 * 10) / 10, theta: 0, charm: 0, color: 0 };
        }
      });

      console.log('Greeks sensitivity calculation completed');
      setIsCalculating(false);
      
      return { spot: spotData, volatility: volData, time: timeData };
    } catch (error) {
      console.error('Error calculating sensitivity data:', error);
      setIsCalculating(false);
      return { spot: [], volatility: [], time: [] };
    }
  }, [params.S, params.K, params.T, params.r, params.sigma, params.q, result]);

  // Handle parameter updates
  const updateParam = useCallback((key: keyof BlackScholesParams, value: number) => {
    setParams(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetToDefaults = useCallback(() => {
    setParams(defaultParams);
    toast.success("Parameters reset to defaults");
  }, []);

  // Load and save parameters
  useEffect(() => {
    const savedParams = localStorage.getItem('advancedGreeks_params');
    if (savedParams) {
      try {
        const parsed = JSON.parse(savedParams);
        setParams(parsed);
      } catch (error) {
        console.error('Failed to load saved parameters:', error);
      }
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem('advancedGreeks_params', JSON.stringify(params));
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [params]);

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
    },
    {
      key: 'q' as keyof BlackScholesParams,
      label: 'Dividend Yield',
      min: 0,
      max: 0.1,
      step: 0.001,
      suffix: '%',
      tooltip: 'Annual dividend yield',
      color: 'param-dividend' as const
    }
  ];

  const formatGreek = (value: number, decimals: number = 4) => {
    return isNaN(value) ? 'N/A' : value.toFixed(decimals);
  };

  const formatCurrency = (value: number) => {
    return isNaN(value) ? 'N/A' : `$${value.toFixed(2)}`;
  };

  if (!result) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-muted-foreground">Error calculating Greeks. Please check your parameters.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="relative h-screen w-full bg-[#09090b] text-white overflow-hidden font-mono flex flex-col">
        
        {/* TOP COMMAND DECK (MIXING BOARD) */}
        <div className="flex-none h-20 bg-black/60 border-b border-white/10 flex items-center justify-between px-6 z-20 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-4 border-r border-white/10 pr-6 mr-2 h-full">
             <Activity className="h-5 w-5 text-primary" />
             <div className="text-xs font-bold tracking-widest text-primary leading-tight">
               ADVANCED_GREEKS <br/>
               <span className="text-white/40 font-light">B-S OPTIONS ENGINE</span>
             </div>
          </div>
          
          <div className="flex-1 flex items-center justify-start gap-4 h-full pl-4 overflow-x-auto no-scrollbar">
            {parameterConfigs.map(config => (
              <div key={config.key} className="flex flex-col gap-1 min-w-[100px]">
                <span className="text-[10px] uppercase tracking-widest text-[#ffaa00]">{config.label}</span>
                <input
                  type="number"
                  className="bg-white/5 border border-white/10 text-white text-xs px-2 py-1.5 rounded w-full focus:outline-none focus:border-primary transition-colors font-mono"
                  value={params[config.key]}
                  onChange={(e) => updateParam(config.key, parseFloat(e.target.value) || 0)}
                  min={config.min} max={config.max} step={config.step}
                />
              </div>
            ))}
          </div>
          
          <div className="flex items-center gap-4 h-full pl-6 border-l border-white/10 shrink-0">
            <EnhancedStockSelector
              ticker={ticker}
              onTickerChange={setTicker}
              onPriceUpdate={(price) => updateParam('S', price)}
              showCompanyInfo={false}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={resetToDefaults}
              className="bg-transparent border-white/10 text-white/50 hover:bg-white/5 hover:text-white shrink-0"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* HERO VISUALIZATION & RIGHT TICKER TAPE */}
        <div className="flex-1 flex min-h-0">
        
          {/* MAIN MATRIX AREA */}
          <div className="flex-1 relative p-6 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-black to-[#09090b] flex flex-col h-full">
             {/* BACKGROUND GRID LINES */}
             <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none"></div>
             
             {/* TABS FOR CHARTS */}
             <div className="relative z-10 flex-1 flex flex-col h-full min-h-0">
               <Tabs defaultValue="sensitivity" className="flex-1 flex flex-col h-full">
                 <div className="flex justify-between items-center mb-4 shrink-0">
                   <div className="text-xs tracking-widest text-white/50 uppercase">Matrix Rendering</div>
                   <TabsList className="bg-white/5 border border-white/10">
                     <TabsTrigger value="sensitivity" className="text-xs font-mono data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Spot Sens</TabsTrigger>
                     <TabsTrigger value="volatility" className="text-xs font-mono data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Vol Surface</TabsTrigger>
                     <TabsTrigger value="time" className="text-xs font-mono data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Time Decay</TabsTrigger>
                   </TabsList>
                 </div>
                 
                 <div className="flex-1 bg-black/40 border border-white/10 rounded-xl p-4 relative backdrop-blur-sm min-h-0">
                    <TabsContent value="sensitivity" className="h-full m-0 data-[state=active]:flex flex-col">
                      <div className="flex-1 w-full min-h-0">
                        {isCalculating ? (
                          <div className="h-full flex items-center justify-center text-primary animate-pulse tracking-widest text-xs">CALCULATING_MATRIX...</div>
                        ) : sensitivityData.spot.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={sensitivityData.spot}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                              <XAxis dataKey="spot" stroke="#ffffff50" tick={{fontSize: 10, fill: '#ffffff50'}} />
                              <YAxis yAxisId="left" stroke="#00ff88" tick={{fontSize: 10, fill: '#00ff88'}} />
                              <YAxis yAxisId="right" orientation="right" stroke="#ffaa00" tick={{fontSize: 10, fill: '#ffaa00'}} />
                              <RechartsTooltip contentStyle={{backgroundColor: '#0a0a0c', border: '1px solid #ffffff20', borderRadius: '4px', fontFamily: 'monospace'}} />
                              <Line yAxisId="left" type="monotone" dataKey="delta" stroke="#00ff88" strokeWidth={2} dot={false} isAnimationActive={false} />
                              <Line yAxisId="right" type="step" dataKey="gamma" stroke="#ffaa00" strokeWidth={2} dot={false} isAnimationActive={false} />
                            </LineChart>
                          </ResponsiveContainer>
                        ) : null}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="volatility" className="h-full m-0 data-[state=active]:flex flex-col">
                      <div className="flex-1 w-full min-h-0">
                        {isCalculating ? (
                          <div className="h-full flex items-center justify-center text-primary animate-pulse tracking-widest text-xs">CALCULATING_SURFACE...</div>
                        ) : sensitivityData.volatility.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={sensitivityData.volatility}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                              <XAxis dataKey="volatility" stroke="#ffffff50" tick={{fontSize: 10, fill: '#ffffff50'}} />
                              <YAxis stroke="#ffffff50" tick={{fontSize: 10, fill: '#ffffff50'}} />
                              <RechartsTooltip contentStyle={{backgroundColor: '#0a0a0c', border: '1px solid #ffffff20', borderRadius: '4px', fontFamily: 'monospace'}} />
                              <Line type="monotone" dataKey="vega" stroke="#00d5ff" strokeWidth={2} dot={false} isAnimationActive={false} />
                              <Line type="monotone" dataKey="vanna" stroke="#ff4444" strokeWidth={2} dot={false} isAnimationActive={false} />
                            </LineChart>
                          </ResponsiveContainer>
                        ) : null}
                      </div>
                    </TabsContent>

                    <TabsContent value="time" className="h-full m-0 data-[state=active]:flex flex-col">
                      <div className="flex-1 w-full min-h-0">
                        {isCalculating ? (
                          <div className="h-full flex items-center justify-center text-primary animate-pulse tracking-widest text-xs">CALCULATING_THETA...</div>
                        ) : sensitivityData.time.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={sensitivityData.time}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                              <XAxis dataKey="timeToExpiry" stroke="#ffffff50" tick={{fontSize: 10, fill: '#ffffff50'}} />
                              <YAxis stroke="#ffffff50" tick={{fontSize: 10, fill: '#ffffff50'}} />
                              <RechartsTooltip contentStyle={{backgroundColor: '#0a0a0c', border: '1px solid #ffffff20', borderRadius: '4px', fontFamily: 'monospace'}} />
                              <Line type="monotone" dataKey="theta" stroke="#ff4444" strokeWidth={2} dot={false} isAnimationActive={false} />
                              <Line type="monotone" dataKey="charm" stroke="#ffaa00" strokeWidth={2} dot={false} isAnimationActive={false} />
                            </LineChart>
                          </ResponsiveContainer>
                        ) : null}
                      </div>
                    </TabsContent>
                 </div>
               </Tabs>
             </div>
          </div>
          
          {/* STICKY RIGHT GREEKS TICKER HUD */}
          <div className="w-80 shrink-0 border-l border-white/10 bg-black/80 backdrop-blur-xl flex flex-col h-full overflow-y-auto no-scrollbar">
             <div className="p-5 border-b border-white/10 bg-gradient-to-br from-white/5 to-transparent shrink-0">
                <div className="text-[10px] uppercase tracking-widest text-[#00ff88] mb-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse"></span>
                  Pricing Engine Output
                </div>
                <div className="flex justify-between items-baseline mb-2">
                   <span className="text-[10px] text-white/50 tracking-widest">CALL (Theo)</span>
                   <span className="text-3xl font-light tracking-tighter text-[#00ff88]">${formatCurrency(result.prices.call).replace('$','')}</span>
                </div>
                <div className="flex justify-between items-baseline mt-3 pt-3 border-t border-white/5">
                   <span className="text-[10px] text-white/50 tracking-widest">PUT (Theo)</span>
                   <span className="text-xl font-light tracking-tighter text-[#ff4444]">${formatCurrency(result.prices.put).replace('$','')}</span>
                </div>
             </div>
             
             <div className="p-5 flex-1 w-full">
                <div className="text-[10px] uppercase tracking-widest text-primary mb-4 flex items-center gap-2 border-b border-primary/20 pb-2">
                   <Zap className="w-3 h-3" /> Core Greeks
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center bg-white/[0.02] p-2 rounded">
                     <span className="text-[10px] text-white/50 tracking-widest uppercase flex items-center gap-2 w-16">Δ Delta</span>
                     <span className="text-sm font-mono text-[#00ff88]">{formatGreek(result.greeks.delta.call)}</span>
                  </div>
                  <div className="flex justify-between items-center bg-white/[0.02] p-2 rounded">
                     <span className="text-[10px] text-white/50 tracking-widest uppercase flex items-center gap-2 w-16">Γ Gamma</span>
                     <span className="text-sm font-mono text-[#ffaa00]">{formatGreek(result.greeks.gamma)}</span>
                  </div>
                  <div className="flex justify-between items-center bg-white/[0.02] p-2 rounded">
                     <span className="text-[10px] text-white/50 tracking-widest uppercase flex items-center gap-2 w-16">Θ Theta</span>
                     <span className="text-sm font-mono text-[#ff4444]">{formatGreek(result.greeks.theta.call)}</span>
                  </div>
                  <div className="flex justify-between items-center bg-white/[0.02] p-2 rounded">
                     <span className="text-[10px] text-white/50 tracking-widest uppercase flex items-center gap-2 w-16">ν Vega</span>
                     <span className="text-sm font-mono text-[#00d5ff]">{formatGreek(result.greeks.vega)}</span>
                  </div>
                  <div className="flex justify-between items-center bg-white/[0.02] p-2 rounded">
                     <span className="text-[10px] text-white/50 tracking-widest uppercase flex items-center gap-2 w-16">ρ Rho</span>
                     <span className="text-sm font-mono text-white/70">{formatGreek(result.greeks.rho.call)}</span>
                  </div>
                </div>

                <div className="text-[10px] uppercase tracking-widest text-accent mb-4 mt-8 flex items-center gap-2 border-b border-accent/20 pb-2">
                   <Activity className="w-3 h-3" /> Higher Order
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center hover:bg-white/[0.02] px-2 py-1 rounded transition-colors">
                     <span className="text-[10px] text-white/40 tracking-widest">VANNA</span>
                     <span className="text-[11px] font-mono text-white/80">{formatGreek(result.greeks.vanna)}</span>
                  </div>
                  <div className="flex justify-between items-center hover:bg-white/[0.02] px-2 py-1 rounded transition-colors">
                     <span className="text-[10px] text-white/40 tracking-widest">CHARM</span>
                     <span className="text-[11px] font-mono text-white/80">{formatGreek(result.greeks.charm.call)}</span>
                  </div>
                  <div className="flex justify-between items-center hover:bg-white/[0.02] px-2 py-1 rounded transition-colors">
                     <span className="text-[10px] text-white/40 tracking-widest">COLOR</span>
                     <span className="text-[11px] font-mono text-white/80">{formatGreek(result.greeks.color, 5)}</span>
                  </div>
                  <div className="flex justify-between items-center hover:bg-white/[0.02] px-2 py-1 rounded transition-colors">
                     <span className="text-[10px] text-white/40 tracking-widest">SPEED</span>
                     <span className="text-[11px] font-mono text-white/80">{formatGreek(result.greeks.speed, 5)}</span>
                  </div>
                  <div className="flex justify-between items-center hover:bg-white/[0.02] px-2 py-1 rounded transition-colors">
                     <span className="text-[10px] text-white/40 tracking-widest">ZOMMA</span>
                     <span className="text-[11px] font-mono text-white/80">{formatGreek(result.greeks.zomma, 5)}</span>
                  </div>
                  <div className="flex justify-between items-center hover:bg-white/[0.02] px-2 py-1 rounded transition-colors">
                     <span className="text-[10px] text-white/40 tracking-widest">ULTIMA</span>
                     <span className="text-[11px] font-mono text-white/80">{formatGreek(result.greeks.ultima, 5)}</span>
                  </div>
                </div>
             </div>
             
             {/* FOOTER SYSTEM STATUS */}
             <div className="p-4 border-t border-white/10 bg-black text-[9px] text-white/30 tracking-[0.2em] uppercase shrink-0">
                STATUS: LIVE<br/>
                MODEL: BS_ANALYTICAL_EXT<br/>
                PRECISION: HIGH
             </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default AdvancedGreeks;