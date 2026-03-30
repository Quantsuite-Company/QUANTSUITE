import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Cpu, ArrowUp, ArrowDown, Minus, TickCircle } from 'iconsax-react';
import { ImageIcon, MonitorIcon, Sparkles, TrendingUp, Zap, BarChart3 } from 'lucide-react';
import { AVAILABLE_ALPHAS, type AlphaId, zscore, calculateMomentum, calculateMeanReversion, calculateLiquidity, calculateVolatility, calculateRSI } from '@/lib/alphaCalculators';
import { combineSignals, sizePositions, type SignalScore, type PortfolioWeights, type RiskConstraints } from '@/lib/portfolioOptimizer';
import { validatePriceData, cleanPriceData, calculateQualityScore, type DataQualityReport } from '@/lib/dataValidator';
import { calculateAdaptiveWeights, calculateAlphaMetrics, type AlphaMetrics, type AlphaHistory } from '@/lib/alphaMetrics';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import AIToolWrapper from '@/components/ai/AIToolWrapper';
import { motion } from 'framer-motion';
import { 
  PremiumProseParser, 
  InlineChart,
  InlineTickerTable,
  FollowUpInput 
} from '@/components/ai/PremiumProseParser';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Orange/Amber themed colors for Quant Engine
const COLORS = ['hsl(35 95% 55%)', 'hsl(40 90% 50%)', 'hsl(25 85% 55%)', 'hsl(45 80% 50%)', 'hsl(30 95% 60%)', 'hsl(50 85% 55%)'];

async function fetchRealStockData(tickers: string[], period: string = '1y') {
  try {
    const { data, error } = await supabase.functions.invoke('fetch-stock-data', {
      body: { tickers, period },
    });

    if (error) {
      console.error('Error fetching stock data:', error);
      throw error;
    }

    return data.stockData;
  } catch (error) {
    console.error('Failed to fetch stock data:', error);
    throw error;
  }
}

export default function QuantEngine() {
  const [isRunning, setIsRunning] = useState(false);
  const [showResponse, setShowResponse] = useState(false);
  const [results, setResults] = useState<{
    signalScores: SignalScore[];
    portfolioWeights: {
      weights: PortfolioWeights;
      expectedVolatility: number;
      totalLeverage: number;
      netExposure: number;
    };
    timestamp: string;
    dataQuality?: { [ticker: string]: DataQualityReport };
    alphaMetrics?: { [alphaId: string]: AlphaMetrics };
    alphaWeights?: { [alphaId: string]: number };
    analysisMode?: string;
  } | null>(null);

  const commandSuggestions = [
    { 
      icon: <ImageIcon className="w-4 h-4" />, 
      label: "Analyze Stocks", 
      description: "Run multi-signal analysis", 
      prefix: "/analyze AAPL,MSFT,GOOG" 
    },
    { 
      icon: <TrendingUp className="w-4 h-4" />, 
      label: "Momentum", 
      description: "Momentum-based signals", 
      prefix: "/momentum" 
    },
    { 
      icon: <MonitorIcon className="w-4 h-4" />, 
      label: "Mean Reversion", 
      description: "Mean reversion signals", 
      prefix: "/reversion" 
    },
    { 
      icon: <Sparkles className="w-4 h-4" />, 
      label: "Optimize", 
      description: "Portfolio optimization", 
      prefix: "/optimize" 
    },
  ];

  const handleSendMessage = async (input: string) => {
    if (!input.trim()) return;

    // Parse commands and determine analysis mode
    let tickers = 'AAPL,MSFT,GOOG,TSLA';
    let selectedAlphas: Set<AlphaId>;
    let analysisMode = 'multi-factor';
    
    // Check for command prefixes
    if (input.startsWith('/momentum')) {
      // Momentum-only analysis: focuses on price trends
      selectedAlphas = new Set<AlphaId>(['momentum21', 'momentum63']);
      analysisMode = 'momentum';
      // Extract tickers after command
      const tickerPart = input.replace(/^\/momentum\s*/i, '').trim();
      if (tickerPart) tickers = tickerPart;
    } else if (input.startsWith('/reversion')) {
      // Mean reversion analysis: RSI oversold/overbought + price deviation
      selectedAlphas = new Set<AlphaId>(['meanReversion', 'rsi']);
      analysisMode = 'mean-reversion';
      const tickerPart = input.replace(/^\/reversion\s*/i, '').trim();
      if (tickerPart) tickers = tickerPart;
    } else if (input.startsWith('/optimize')) {
      // Full portfolio optimization with all signals
      selectedAlphas = new Set<AlphaId>(['momentum21', 'meanReversion', 'liquidity', 'volatility', 'rsi']);
      analysisMode = 'optimization';
      const tickerPart = input.replace(/^\/optimize\s*/i, '').trim();
      if (tickerPart) tickers = tickerPart;
    } else if (input.startsWith('/analyze')) {
      // Full multi-factor analysis
      selectedAlphas = new Set<AlphaId>(['momentum21', 'momentum63', 'meanReversion', 'liquidity']);
      analysisMode = 'multi-factor';
      const tickerPart = input.replace(/^\/analyze\s*/i, '').trim();
      if (tickerPart) tickers = tickerPart;
    } else {
      // Default: parse tickers from input
      selectedAlphas = new Set<AlphaId>(['momentum21', 'meanReversion', 'liquidity']);
      const tickerMatch = input.match(/(?:analyze|quote|data)\s+([A-Z,\s]+)/i);
      if (tickerMatch) {
        tickers = tickerMatch[1].trim();
      } else if (input.includes(',') || /^[A-Z]{1,5}$/i.test(input.trim())) {
        tickers = input.toUpperCase();
      }
    }

    const targetVol = 2;
    const maxPerAsset = 10;

    setIsRunning(true);
    toast.info('Fetching real market data from Yahoo Finance...');
    
    try {
      const tickerList = tickers.split(',').map(t => t.trim().toUpperCase()).filter(t => t.length > 0);
      
      if (tickerList.length === 0) {
        toast.error('Please enter at least one ticker');
        setIsRunning(false);
        return;
      }
      
      const tickerData = await fetchRealStockData(tickerList, '1y');
      
      toast.info('Validating data quality...');
      const dataQuality: { [ticker: string]: DataQualityReport } = {};
      
      for (const ticker of tickerList) {
        if (tickerData[ticker] && tickerData[ticker].length > 0) {
          const report = validatePriceData(ticker, tickerData[ticker]);
          dataQuality[ticker] = report;
          
          if (!report.isValid) {
            tickerData[ticker] = cleanPriceData(tickerData[ticker], report);
            const qualityScore = calculateQualityScore(report);
            
            if (qualityScore < 50) {
              toast.warning(`${ticker}: Low quality data (score: ${qualityScore.toFixed(0)})`);
            }
          }
        }
      }
      
      const validTickers = tickerList.filter(ticker => {
        const data = tickerData[ticker];
        const report = dataQuality[ticker];
        return data && data.length > 0 && report && calculateQualityScore(report) >= 30;
      });
      
      if (validTickers.length === 0) {
        toast.error('No valid data returned. Check your ticker symbols.');
        setIsRunning(false);
        return;
      }
      
      toast.info('Calculating signals and tracking alpha performance...');
      
      const volatilities: { [ticker: string]: number } = {};
      const allDates: Set<string> = new Set();
      
      for (const ticker of validTickers) {
        const prices = tickerData[ticker];
        prices.forEach((p: any) => allDates.add(p.date));
        
        const returns: number[] = [];
        for (let i = 1; i < prices.length; i++) {
          returns.push((prices[i].close - prices[i - 1].close) / prices[i - 1].close);
        }
        const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
        const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
        volatilities[ticker] = Math.sqrt(variance * 252);
      }
      
      const sortedDates = Array.from(allDates).sort();
      
      const alphaScores: { [ticker: string]: { [alphaId: string]: number } } = {};
      
      for (const ticker of validTickers) {
        const data = tickerData[ticker];
        alphaScores[ticker] = {};
          
        if (selectedAlphas.has('momentum21')) {
          alphaScores[ticker]['momentum21'] = calculateMomentum(data, 21);
        }
        if (selectedAlphas.has('momentum63')) {
          alphaScores[ticker]['momentum63'] = calculateMomentum(data, 63);
        }
        if (selectedAlphas.has('meanReversion')) {
          alphaScores[ticker]['meanReversion'] = calculateMeanReversion(data, 5, 60);
        }
        if (selectedAlphas.has('liquidity')) {
          alphaScores[ticker]['liquidity'] = calculateLiquidity(data, 21);
        }
        if (selectedAlphas.has('volatility')) {
          alphaScores[ticker]['volatility'] = calculateVolatility(data, 21);
        }
        if (selectedAlphas.has('rsi')) {
          alphaScores[ticker]['rsi'] = calculateRSI(data, 14);
        }
      }
      
      const alphaIds = Array.from(selectedAlphas);
      for (const alphaId of alphaIds) {
        const values = validTickers.map(t => alphaScores[t][alphaId] || 0);
        const zscored = zscore(values);
        validTickers.forEach((t, i) => {
          alphaScores[t][alphaId] = zscored[i];
        });
      }
      
      const alphaHistory: { [alphaId: string]: AlphaHistory[] } = {};
      const lookbackDays = Math.min(60, sortedDates.length - 1);
      
      for (let i = sortedDates.length - lookbackDays - 1; i < sortedDates.length - 1; i++) {
        const date = sortedDates[i];
        const nextDate = sortedDates[i + 1];
        
        const dailySignals: { [alphaId: string]: { [ticker: string]: number } } = {};
        
        for (const ticker of validTickers) {
          const prices = tickerData[ticker];
          const dateIndex = prices.findIndex((p: any) => p.date === date);
          
          if (dateIndex < 0 || dateIndex >= prices.length - 1) continue;
          
          const historicalPrices = prices.slice(0, dateIndex + 1);
          
          for (const alphaId of alphaIds) {
            if (!dailySignals[alphaId]) dailySignals[alphaId] = {};
            
            if (alphaId === 'momentum21') {
              dailySignals[alphaId][ticker] = calculateMomentum(historicalPrices, 21);
            } else if (alphaId === 'momentum63') {
              dailySignals[alphaId][ticker] = calculateMomentum(historicalPrices, 63);
            } else if (alphaId === 'meanReversion') {
              dailySignals[alphaId][ticker] = calculateMeanReversion(historicalPrices, 5, 60);
            } else if (alphaId === 'liquidity') {
              dailySignals[alphaId][ticker] = calculateLiquidity(historicalPrices, 21);
            } else if (alphaId === 'volatility') {
              dailySignals[alphaId][ticker] = calculateVolatility(historicalPrices, 21);
            } else if (alphaId === 'rsi') {
              dailySignals[alphaId][ticker] = calculateRSI(historicalPrices, 14);
            }
          }
        }
        
        const returns: { [ticker: string]: number } = {};
        for (const ticker of validTickers) {
          const prices = tickerData[ticker];
          const currentIndex = prices.findIndex((p: any) => p.date === date);
          const nextIndex = prices.findIndex((p: any) => p.date === nextDate);
          
          if (currentIndex >= 0 && nextIndex >= 0 && prices[currentIndex].close > 0) {
            returns[ticker] = (prices[nextIndex].close - prices[currentIndex].close) / prices[currentIndex].close;
          }
        }
        
        for (const alphaId of alphaIds) {
          if (dailySignals[alphaId]) {
            if (!alphaHistory[alphaId]) alphaHistory[alphaId] = [];
            alphaHistory[alphaId].push({
              date,
              signals: dailySignals[alphaId],
              returns,
            });
          }
        }
      }
      
      const alphaMetrics: { [alphaId: string]: AlphaMetrics } = {};
      const metricsMap = new Map<string, AlphaMetrics>();
      
      for (const alphaId of alphaIds) {
        if (alphaHistory[alphaId]) {
          const metrics = calculateAlphaMetrics(alphaHistory[alphaId], alphaId);
          alphaMetrics[alphaId] = metrics;
          metricsMap.set(alphaId, metrics);
        }
      }
      
      const alphaWeights = calculateAdaptiveWeights(metricsMap);
      
      toast.info('Using IC-weighted alpha combination...');
      
      const signalScores = combineSignals(alphaScores, alphaWeights);
      
      const constraints: RiskConstraints = {
        targetVolatility: targetVol / 100,
        maxPerAsset: maxPerAsset / 100,
        maxTotalLeverage: 1.0,
      };
      
      const rawWeights = sizePositions(signalScores, volatilities, constraints);
      
      // Calculate portfolio metrics from the raw weights
      const weightValues = Object.values(rawWeights);
      const hasWeights = weightValues.length > 0;
      
      // Handle edge case: if no weights (e.g., single stock with negative signal),
      // create equal-weight portfolio for all valid tickers
      let finalWeights = rawWeights;
      if (!hasWeights && validTickers.length > 0) {
        const equalWeight = 1 / validTickers.length;
        finalWeights = validTickers.reduce((acc, ticker) => {
          acc[ticker] = equalWeight;
          return acc;
        }, {} as { [ticker: string]: number });
      }
      
      const finalWeightValues = Object.values(finalWeights);
      const totalLeverage = finalWeightValues.length > 0 
        ? finalWeightValues.reduce((sum, w) => sum + Math.abs(w), 0) 
        : 1;
      const netExposure = finalWeightValues.length > 0 
        ? finalWeightValues.reduce((sum, w) => sum + w, 0) 
        : 1;
      const expectedVolatility = finalWeightValues.length > 0 
        ? Math.sqrt(
            Object.entries(finalWeights).reduce((sum, [ticker, weight]) => {
              return sum + Math.pow(weight * (volatilities[ticker] || 0.2), 2);
            }, 0)
          )
        : 0.2; // Default 20% volatility
      
      const portfolioWeights = {
        weights: finalWeights,
        totalLeverage: totalLeverage || 1,
        netExposure: netExposure || 1,
        expectedVolatility: expectedVolatility || 0.2,
      };
      
      setResults({
        signalScores,
        portfolioWeights,
        timestamp: new Date().toISOString(),
        dataQuality,
        alphaMetrics,
        alphaWeights,
        analysisMode,
      });
      
      setShowResponse(true);
      toast.success(`✅ Analysis complete! Analyzed ${validTickers.length} stocks.`);
    } catch (error: any) {
      console.error('Analysis error:', error);
      toast.error(`Failed: ${error.message || 'Check console for details'}`);
    } finally {
      setIsRunning(false);
    }
  };

  // Prepare chart data for the premium prose parser
  const alphaWeightsData = results?.alphaWeights ? 
    Object.entries(results.alphaWeights).map(([name, value]) => ({ 
      name, 
      value: (value as number) * 100 
    })) : [];

  const portfolioWeightsData = results?.portfolioWeights?.weights ?
    Object.entries(results.portfolioWeights.weights)
      .filter(([_, v]) => Math.abs(v as number) > 0.001)
      .map(([name, value]) => ({ 
        name, 
        value: Math.abs(value as number) * 100 
      })) : [];

  // Prepare ticker table from signal scores
  const signalTickers = results?.signalScores?.slice(0, 8).map(s => ({
    symbol: s.ticker,
    change: s.score * 100,
    action: s.score > 0.5 ? 'buy' as const : s.score < -0.5 ? 'sell' as const : 'hold' as const
  })) || [];

  const responseContent = results ? (
    <div className="space-y-6">
      {/* Portfolio Metrics Summary */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-yellow-500/10 border border-amber-500/20 overflow-x-auto"
      >
        <div className="flex items-center gap-8 min-w-max">
          <div className="text-center">
            <span className="text-xs text-muted-foreground block">Expected Volatility</span>
            <span className="font-mono text-lg text-amber-400">{(results.portfolioWeights.expectedVolatility * 100).toFixed(2)}%</span>
          </div>
          <div className="text-center">
            <span className="text-xs text-muted-foreground block">Total Leverage</span>
            <span className="font-mono text-lg text-orange-400">{(results.portfolioWeights.totalLeverage * 100).toFixed(1)}%</span>
          </div>
          <div className="text-center">
            <span className="text-xs text-muted-foreground block">Net Exposure</span>
            <span className={`font-mono text-lg ${results.portfolioWeights.netExposure > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {(results.portfolioWeights.netExposure * 100).toFixed(1)}%
            </span>
          </div>
          <div className="text-center">
            <span className="text-xs text-muted-foreground block">Stocks Analyzed</span>
            <span className="font-mono text-lg text-yellow-400">{results.signalScores.length}</span>
          </div>
        </div>
      </motion.div>

      {/* Analysis Summary Prose */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-foreground/90 leading-relaxed space-y-4"
      >
        <p className="text-base">
          I've completed a <span className="text-amber-400 font-semibold">{results.analysisMode}</span> analysis across <span className="text-amber-400 font-mono">{results.signalScores.length}</span> securities. 
          The portfolio optimization targets <span className="text-amber-400 font-mono">{(results.portfolioWeights.expectedVolatility * 100).toFixed(1)}%</span> annualized volatility 
          with a net exposure of <span className={results.portfolioWeights.netExposure > 0 ? 'text-emerald-400' : 'text-rose-400'}>
            {(results.portfolioWeights.netExposure * 100).toFixed(1)}%
          </span>.
        </p>
        
        {results.alphaWeights && (
          <p className="text-base">
            The signal combination uses IC-weighted alpha blending, automatically adjusting factor exposures based on recent predictive power. 
            The most influential factors are highlighted below:
          </p>
        )}
      </motion.div>

      {/* Alpha Weights Chart */}
      {alphaWeightsData.length > 0 && (
        <InlineChart 
          data={alphaWeightsData}
          type="bar"
          theme="quant"
          title="Alpha Signal Weights (IC-Weighted)"
          dataKey="value"
          nameKey="name"
          height={160}
        />
      )}

      {/* Portfolio Weights Pie */}
      {portfolioWeightsData.length > 0 && (
        <InlineChart 
          data={portfolioWeightsData}
          type="pie"
          theme="quant"
          title="Recommended Portfolio Allocation"
          dataKey="value"
          nameKey="name"
          height={220}
        />
      )}

      {/* Signal Scores Table */}
      {signalTickers.length > 0 && (
        <InlineTickerTable 
          tickers={signalTickers}
          title="Signal Scores & Actions"
          showAction={true}
          theme="quant"
        />
      )}

      {/* Detailed Signal Scores Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="my-6 overflow-hidden rounded-lg border border-amber-500/20 bg-card/20"
      >
        <div className="px-4 py-2 border-b border-amber-500/20 bg-gradient-to-r from-amber-500/10 to-orange-500/10">
          <span className="text-xs font-medium text-amber-400 uppercase tracking-wider">Detailed Signal Analysis</span>
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/30">
                <TableHead className="text-muted-foreground text-xs">Ticker</TableHead>
                <TableHead className="text-muted-foreground text-xs">Score</TableHead>
                <TableHead className="text-muted-foreground text-xs">Signal</TableHead>
                <TableHead className="text-muted-foreground text-xs">Weight</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.signalScores.slice(0, 12).map((signalScore) => (
                <TableRow key={signalScore.ticker} className="border-border/20">
                  <TableCell className="font-mono font-bold text-amber-400 py-2">{signalScore.ticker}</TableCell>
                  <TableCell className={`py-2 font-mono ${signalScore.score > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {signalScore.score.toFixed(3)}
                  </TableCell>
                  <TableCell className="py-2">
                    {signalScore.score > 0.5 ? (
                      <Badge variant="default" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                        <ArrowUp size={10} className="mr-1" /> Long
                      </Badge>
                    ) : signalScore.score < -0.5 ? (
                      <Badge variant="destructive" className="bg-rose-500/20 text-rose-400 border-rose-500/30 text-xs">
                        <ArrowDown size={10} className="mr-1" /> Short
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-muted/50 text-muted-foreground text-xs">
                        <Minus size={10} className="mr-1" /> Neutral
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="py-2 font-mono text-foreground">
                    {results.portfolioWeights.weights[signalScore.ticker] 
                      ? `${(results.portfolioWeights.weights[signalScore.ticker] * 100).toFixed(1)}%`
                      : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </motion.div>

      {/* Follow-up Input */}
      <FollowUpInput 
        onSend={(msg) => handleSendMessage(msg)}
        isLoading={isRunning}
        placeholder="Continue the analysis or try /momentum, /reversion..."
        theme="quant"
      />
    </div>
  ) : null;

  // Determine badge label based on analysis mode
  const getBadgeLabel = () => {
    if (!results?.analysisMode) return 'Analysis Complete';
    switch (results.analysisMode) {
      case 'momentum': return 'Momentum Analysis';
      case 'mean-reversion': return 'Mean Reversion Analysis';
      case 'optimization': return 'Portfolio Optimization';
      case 'multi-factor': return 'Multi-Factor Analysis';
      default: return 'Analysis Complete';
    }
  };

  return (
    <div className="relative h-screen w-full bg-[#09090b] text-white overflow-hidden font-mono flex flex-col selection:bg-amber-500/30">
      {/* TOP NAVIGATION COMMAND DECK */}
      <div className="flex-none bg-black/80 border-b border-amber-500/20 px-6 py-4 z-20 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 border-r border-white/10 pr-6 mr-2">
             <div className="p-2 bg-amber-500/10 rounded border border-amber-500/30">
               <Zap className="h-5 w-5 text-amber-500" />
             </div>
             <div className="text-[11px] font-bold tracking-widest text-amber-500 leading-tight uppercase">
               Sys_Core.Quant_Engine <br/>
               <span className="text-white/40 font-light">Multi-Factor Alpha Array</span>
             </div>
          </div>
          
          <div className="flex-1 flex flex-col justify-center">
             <div className="relative w-full max-w-3xl flex items-center gap-4">
               <div className="text-[10px] text-amber-500/70 tracking-widest font-bold uppercase shrink-0">
                 Input_Sequence {'>'}
               </div>
               <div className="relative flex-1">
                 <input
                   type="text"
                   disabled={isRunning}
                   placeholder="TARGET_TICKERS (e.g. AAPL,MSFT) OR COMMANDS (/momentum, /optimize)"
                   className="w-full bg-white/5 border border-amber-500/30 text-amber-500 placeholder:text-amber-500/30 text-xs px-4 py-2.5 rounded focus:outline-none focus:border-amber-400 focus:bg-amber-500/10 transition-colors font-mono tracking-widest uppercase"
                   onKeyDown={(e) => {
                     if (e.key === 'Enter') {
                        handleSendMessage(e.currentTarget.value);
                        e.currentTarget.value = '';
                     }
                   }}
                 />
                 {isRunning && (
                   <div className="absolute right-3 top-1/2 -translate-y-1/2">
                     <div className="w-3.5 h-3.5 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin"></div>
                   </div>
                 )}
               </div>
             </div>
          </div>
        </div>
        
        {/* COMMAND SUGGESTIONS QUICK-CHIPS */}
        <div className="flex gap-2 mt-3 pl-[280px]">
           {commandSuggestions.map((cmd, i) => (
             <button 
               key={i} 
               onClick={() => handleSendMessage(cmd.prefix)}
               disabled={isRunning}
               className="text-[9px] bg-black border border-white/10 text-white/50 px-2.5 py-1 rounded hover:bg-amber-500/20 hover:text-amber-400 hover:border-amber-500/50 transition-all font-mono uppercase tracking-[0.2em] flex items-center gap-1.5 disabled:opacity-50"
             >
               {cmd.prefix}
             </button>
           ))}
        </div>
      </div>
      
      {/* MAIN CONTENT AREA - MATRIX HERO */}
      <div className="flex-1 overflow-y-auto no-scrollbar relative bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/10 via-[#09090b] to-[#09090b]">
         {/* BACKGROUND GRID LINES */}
         <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none"></div>

         <div className="relative z-10 p-8 max-w-6xl mx-auto min-h-full flex flex-col">
           {!results && !isRunning && (
             <div className="flex-1 flex flex-col items-center justify-center opacity-30 my-auto">
               <Cpu size={80} className="text-amber-500 mb-6 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
               <div className="text-xl font-light tracking-[0.3em] uppercase text-amber-500">System Standby</div>
               <div className="text-[10px] tracking-[0.2em] mt-2 text-white/50 uppercase">Awaiting Alpha Input Sequence</div>
             </div>
           )}
           {isRunning && !results && (
             <div className="flex-1 flex flex-col items-center justify-center my-auto">
               <div className="w-16 h-16 border-2 border-amber-500/20 border-t-amber-500/80 rounded-full animate-spin mb-6"></div>
               <div className="text-[10px] font-mono tracking-[0.3em] uppercase text-amber-500 animate-pulse">Calculating Matrix Alpha Arrays...</div>
             </div>
           )}
           {results && (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
               <div className="mb-6 flex justify-between items-end border-b border-amber-500/20 pb-4">
                  <div>
                    <div className="text-amber-500 text-[10px] tracking-[0.3em] uppercase mb-1">{getBadgeLabel()}</div>
                    <div className="text-xl tracking-widest uppercase font-light">Signal Matrix Complete</div>
                  </div>
                  <div className="text-right">
                    <div className="text-white/40 text-[10px] tracking-widest uppercase mb-1">Execution Time</div>
                    <div className="text-xs tracking-widest">{new Date(results.timestamp).toLocaleTimeString()}</div>
                  </div>
               </div>
               {responseContent}
             </div>
           )}
         </div>
      </div>
    </div>
  );
}
