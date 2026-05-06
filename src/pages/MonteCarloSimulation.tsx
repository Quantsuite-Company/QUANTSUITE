import { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ParameterInput } from '@/components/ParameterInput';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Play, BarChart3 } from 'lucide-react';
import { EnhancedStockSelector } from '@/components/EnhancedStockSelector';
import { useToast } from '@/hooks/use-toast';
import { UniversalExplanationPanel } from '@/components/UniversalExplanationPanel';

interface MonteCarloParams {
  S: number;        // Current stock price
  K: number;        // Strike price
  T: number;        // Time to expiration
  r: number;        // Risk-free rate
  sigma: number;    // Volatility
  q: number;        // Dividend yield
  numSimulations: number; // Number of Monte Carlo simulations
  numSteps: number; // Number of time steps
}

interface SimulationPath {
  prices: number[];
  finalPrice: number;
  payoff: number;
}

interface SimulationResult {
  callPrice: number;
  putPrice: number;
  paths: SimulationPath[];
  convergence: number[];
  standardError: number;
}

const MonteCarloSimulation = () => {
  const [ticker, setTicker] = useState('AAPL');
  const [params, setParams] = useState<MonteCarloParams>({
    S: 100,
    K: 100,
    T: 1,
    r: 0.05,
    sigma: 0.2,
    q: 0,
    numSimulations: 10000,
    numSteps: 50
  });

  const [isCall, setIsCall] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [showPaths, setShowPaths] = useState(true);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [showPartsList, setShowPartsList] = useState<'profitable' | 'loss' | null>(null);
  const [selectedPart, setSelectedPart] = useState<number | null>(null);
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

  const updateParam = useCallback((key: keyof MonteCarloParams, value: number) => {
    setParams(prev => ({ ...prev, [key]: value }));
  }, []);

  // Monte Carlo simulation algorithm with performance optimization
  const runSimulation = useCallback(async () => {
    setIsRunning(true);
    setSelectedPath(null); // Reset selection on new simulation
    
    try {
      const { S, K, T, r, sigma, q, numSimulations, numSteps } = params;
      
      // Limit parameters for performance
      const safeSimulations = Math.min(Math.max(1000, numSimulations), 50000);
      const safeSteps = Math.min(Math.max(10, numSteps), 252);
      
      console.log(`Running Monte Carlo with ${safeSimulations} simulations and ${safeSteps} steps...`);
      
      const dt = T / safeSteps;
      const drift = (r - q - 0.5 * sigma * sigma) * dt;
      const diffusion = sigma * Math.sqrt(dt);
      
      const paths: SimulationPath[] = [];
      const callPayoffs: number[] = [];
      const putPayoffs: number[] = [];
      const convergence: number[] = [];
      
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
      const rng = seededRandom(12345 + safeSimulations);
      
      // Generate random paths with error handling
      for (let i = 0; i < safeSimulations; i++) {
        try {
          const prices = [S];
          let currentPrice = S;
          
          // Generate path with bounds checking
          for (let j = 0; j < safeSteps; j++) {
            const u1 = rng();
            const u2 = rng();
            const z = Math.sqrt(-2 * Math.log(u1 + 1e-9)) * Math.cos(2 * Math.PI * u2);
            
            const newPrice = currentPrice * Math.exp(drift + diffusion * z);
            currentPrice = Math.max(0.01, Math.min(10000, newPrice)); // Bounds check
            prices.push(currentPrice);
          }
          
          const finalPrice = prices[prices.length - 1];
          const callPayoff = Math.max(finalPrice - K, 0);
          const putPayoff = Math.max(K - finalPrice, 0);
          
          if (isFinite(callPayoff) && isFinite(putPayoff)) {
            callPayoffs.push(callPayoff);
            putPayoffs.push(putPayoff);
            
            // Store representative paths for visualization (first 50 for performance)
            if (i < 50) {
              paths.push({
                prices: prices.filter((p, idx) => idx % Math.max(1, Math.floor(safeSteps / 50)) === 0), // Downsample for performance
                finalPrice,
                payoff: isCall ? callPayoff : putPayoff
              });
            }
          }
          
          // Track convergence every 500 simulations (reduced frequency)
          if ((i + 1) % 500 === 0 && callPayoffs.length > 0) {
            const avgCall = callPayoffs.reduce((sum, p) => sum + p, 0) / callPayoffs.length;
            const discountedCall = avgCall * Math.exp(-r * T);
            convergence.push(discountedCall);
          }
          
          // Yield control more frequently for UI updates
          if (i % 500 === 0) {
            await new Promise(resolve => setTimeout(resolve, 1));
          }
        } catch (error) {
          console.warn(`Error in simulation path ${i}:`, error);
        }
      }
      
      if (callPayoffs.length === 0) {
        throw new Error('No valid simulation paths generated');
      }
      
      // Calculate final prices
      const avgCallPayoff = callPayoffs.reduce((sum, p) => sum + p, 0) / callPayoffs.length;
      const avgPutPayoff = putPayoffs.reduce((sum, p) => sum + p, 0) / putPayoffs.length;
      
      const callPrice = avgCallPayoff * Math.exp(-r * T);
      const putPrice = avgPutPayoff * Math.exp(-r * T);
      
      // Calculate standard error
      const callVariance = callPayoffs.reduce((sum, p) => sum + Math.pow(p - avgCallPayoff, 2), 0) / Math.max(1, callPayoffs.length - 1);
      const standardError = Math.sqrt(callVariance / callPayoffs.length) * Math.exp(-r * T);
      
      console.log('Monte Carlo simulation completed');
      
      setResult({
        callPrice,
        putPrice,
        paths,
        convergence,
        standardError
      });
    } catch (error) {
      console.error('Error in Monte Carlo simulation:', error);
      // Set fallback result
      setResult({
        callPrice: 0,
        putPrice: 0,
        paths: [],
        convergence: [],
        standardError: 0
      });
    }
    
    setIsRunning(false);
  }, [params, isCall]);

  // Auto-run when parameters change
  useEffect(() => {
    const timer = setTimeout(() => {
      runSimulation();
    }, 300);
    return () => clearTimeout(timer);
  }, [params, runSimulation]);

  // Calculate visualization data with path parts separation
  const pathVisualization = useMemo(() => {
    if (!result || !showPaths) return null;
    
    const maxPrice = Math.max(...result.paths.flatMap(p => p.prices));
    const minPrice = Math.min(...result.paths.flatMap(p => p.prices));
    const priceRange = maxPrice - minPrice;
    
    // Separate profitable and loss paths
    const profitPaths = result.paths.filter(p => p.payoff > 0);
    const lossPaths = result.paths.filter(p => p.payoff <= 0);
    
    // Create parts (groups of 5 paths each)
    const createParts = (paths: SimulationPath[], pathsPerPart = 5) => {
      const parts = [];
      for (let i = 0; i < paths.length; i += pathsPerPart) {
        parts.push(paths.slice(i, i + pathsPerPart));
      }
      return parts;
    };

    const profitableParts = createParts(profitPaths);
    const lossParts = createParts(lossPaths);
    
    const createPathData = (paths: SimulationPath[], isProfit: boolean, partIndex?: number) => {
      return paths.map((path, index) => {
        const pathPoints = path.prices.map((price, step) => ({
          x: (step / (path.prices.length - 1)) * 100,
          y: ((maxPrice - price) / priceRange) * 100
        }));
        
        return { pathPoints, isProfit, index, partIndex };
      });
    };

    // Get paths to display based on selected part
    let displayPaths: any[] = [];
    
    if (showPartsList === 'profitable' && selectedPart !== null) {
      // Show only selected profitable part
      if (profitableParts[selectedPart]) {
        displayPaths = createPathData(profitableParts[selectedPart], true, selectedPart);
      }
    } else if (showPartsList === 'loss' && selectedPart !== null) {
      // Show only selected loss part  
      if (lossParts[selectedPart]) {
        displayPaths = createPathData(lossParts[selectedPart], false, selectedPart);
      }
    } else {
      // Show representative paths from both types (original behavior)
      const selectedProfitPaths = profitPaths.slice(0, 15);
      const selectedLossPaths = lossPaths.slice(0, 15);
      displayPaths = [
        ...createPathData(selectedProfitPaths, true),
        ...createPathData(selectedLossPaths, false)
      ];
    }
    
    return {
      displayPaths,
      profitableParts,
      lossParts,
      stats: {
        totalPaths: result.paths.length,
        profitPaths: profitPaths.length,
        lossPaths: lossPaths.length
      }
    };
  }, [result, showPaths, showPartsList, selectedPart]);

  return (
    <div className="relative h-screen w-full bg-[#09090b] text-white overflow-hidden font-mono">
      
      {/* BACKGROUND HERO CHART (Edge to Edge) */}
      <div className="absolute inset-0 w-full h-full">
        {pathVisualization && (
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            {pathVisualization.displayPaths.map(({ pathPoints, isProfit, index }) => {
              const pathId = `path-${index}`;
              const isSelected = selectedPath === pathId;
              const hasSelection = selectedPath !== null;
              
              return (
                <polyline
                  key={pathId}
                  points={pathPoints.map(p => `${p.x},${p.y}`).join(' ')}
                  fill="none"
                  stroke={isProfit ? '#00ff88' : '#ff4444'}
                  strokeWidth={isSelected ? "3" : "1"}
                  opacity={hasSelection && !isSelected ? "0.15" : isSelected ? "1" : "0.85"}
                  vectorEffect="non-scaling-stroke"
                  className="transition-all duration-300 cursor-pointer"
                  style={{
                    filter: isSelected 
                      ? (isProfit ? 'drop-shadow(0 0 12px #00ff88) drop-shadow(0 0 24px #00ff88)' : 'drop-shadow(0 0 12px #ff4444) drop-shadow(0 0 24px #ff4444)')
                      : 'drop-shadow(0 0 4px rgba(0,0,0,0.5))',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPath(isSelected ? null : pathId);
                  }}
                />
              );
            })}
            
            {/* Strike price line */}
            <line
              x1="0"
              y1="50"
              x2="100"
              y2="50"
              stroke="#ffaa00"
              strokeWidth="0.5"
              strokeDasharray="1,1"
              opacity="0.8"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        )}
      </div>

      {/* TOP HEADER / DATALINE */}
      <div className="absolute top-0 left-0 w-full h-12 bg-black/40 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-6 z-20">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-primary font-serif italic text-lg tracking-widest">
            <BarChart3 className="w-4 h-4" />
            MONTE_CARLO
          </div>
          <div className="h-4 w-[1px] bg-white/20"></div>
          <span className="text-xs text-white/50 tracking-widest uppercase">System Core // Active</span>
        </div>
        
        {pathVisualization && (
          <div className="flex items-center gap-6 text-xs tracking-widest">
             <div className="flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-[#00ff88] shadow-[0_0_8px_#00ff88]"></span>
               <span className="text-white/70">PROFIT: {pathVisualization.stats.profitPaths}</span>
             </div>
             <div className="flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-[#ff4444] shadow-[0_0_8px_#ff4444]"></span>
               <span className="text-white/70">LOSS: {pathVisualization.stats.lossPaths}</span>
             </div>
          </div>
        )}
      </div>

      {/* FLOATING PARAMETER HUD (Left Side) */}
      <div className="absolute top-20 left-6 w-80 bg-black/60 backdrop-blur-xl border border-white/10 rounded-xl p-5 shadow-2xl z-20 flex flex-col gap-4">
        <div className="text-xs font-bold tracking-widest text-[#ffaa00] uppercase mb-2 border-b border-white/10 pb-2">
          Simulation Parameters
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-xs">
          <ParameterInput
            id="stock-price" label="Spot (S)" value={params.S}
            onChange={(v) => updateParam('S', v)} min={1} max={500} step={1} color="param-stock"
          />
          <ParameterInput
            id="strike-price" label="Strike (K)" value={params.K}
            onChange={(v) => updateParam('K', v)} min={1} max={500} step={1} color="param-strike"
          />
          <ParameterInput
            id="time" label="Time (T)" value={params.T}
            onChange={(v) => updateParam('T', v)} min={0.01} max={5} step={0.01} color="param-time"
          />
          <ParameterInput
            id="vol" label="Vol (σ)" value={params.sigma}
            onChange={(v) => updateParam('sigma', v)} min={0.01} max={2} step={0.01} color="param-volatility"
          />
          <div className="col-span-2">
            <ParameterInput
              id="steps" label="Steps / Sims" value={params.numSteps}
              onChange={(v) => updateParam('numSteps', v)} min={10} max={252} step={1} color="param-time"
            />
          </div>
        </div>

        <Button 
          onClick={runSimulation} 
          disabled={isRunning}
          className="w-full mt-2 bg-white/5 hover:bg-white/10 border border-white/20 text-white font-serif italic tracking-widest text-xs py-5 transition-all"
        >
          {isRunning ? "PROCESSING [###.....]" : "INITIATE SEQUENCE"}
        </Button>
      </div>

      {/* FLOATING RESULTS HUD (Right Side) */}
      {result && (
        <div className="absolute top-20 right-6 w-80 bg-black/60 backdrop-blur-xl border border-white/10 rounded-xl p-5 shadow-2xl z-20 flex flex-col gap-6">
          <div className="text-xs font-bold tracking-widest text-[#00ff88] uppercase mb-2 border-b border-white/10 pb-2 flex justify-between">
            <span>Option Pricing</span>
            <span className="text-white/40">SE: ±${result.standardError.toFixed(4)}</span>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-end border-b border-white/5 pb-2">
              <span className="text-xs text-white/50 uppercase tracking-widest">Call Value</span>
              <span className="text-3xl font-light text-[#00ff88] tracking-tighter">
                ${result.callPrice.toFixed(2)}
              </span>
            </div>
            
            <div className="flex justify-between items-end border-b border-white/5 pb-2">
              <span className="text-xs text-white/50 uppercase tracking-widest">Put Value</span>
              <span className="text-3xl font-light text-[#ff4444] tracking-tighter">
                ${result.putPrice.toFixed(2)}
              </span>
            </div>
          </div>
          
          {/* Mini Convergence Plot */}
          <div className="h-24 w-full bg-white/[0.02] border border-white/5 rounded mt-2 relative">
             <svg className="w-full h-full" preserveAspectRatio="none">
                {result.convergence.length > 1 && (
                  <polyline
                    points={result.convergence.map((price, i) => 
                      `${(i / (result.convergence.length - 1)) * 100},${
                        100 - ((price - Math.min(...result.convergence)) / 
                        (Math.max(...result.convergence) - Math.min(...result.convergence))) * 100
                      }`
                    ).join(' ')}
                    fill="none"
                    stroke="#00ff88"
                    strokeWidth="1"
                    className="opacity-70"
                  />
                )}
             </svg>
             <div className="absolute top-1 left-2 text-[8px] text-white/30 uppercase tracking-widest">Convergence</div>
          </div>
        </div>
      )}

      {/* HUD OVERLAY ELEMENTS */}
      <div className="absolute bottom-6 left-6 text-[10px] text-white/30 tracking-[0.2em] font-light">
         Q_SYS.MC_SIM // ACTIVE
         <br/>
         RENDER_ENGINE: WEBGL_NATIVE
      </div>
      
      {selectedPath && (
        <div className="absolute bottom-6 right-6 px-4 py-2 bg-white/10 backdrop-blur-md border border-[#ffaa00]/50 text-[#ffaa00] text-xs tracking-widest rounded">
          PATH_ISOLATED // CLICK BACKGROUND TO RESET
        </div>
      )}

    </div>
  );
}

export default MonteCarloSimulation;