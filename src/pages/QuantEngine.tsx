import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, ArrowLeft } from 'lucide-react';
import {
  AVAILABLE_ALPHAS, type AlphaId, zscore, calculateMomentum,
  calculateMeanReversion, calculateLiquidity, calculateVolatility, calculateRSI
} from '@/lib/alphaCalculators';
import {
  combineSignals, sizePositions, type SignalScore,
  type PortfolioWeights, type RiskConstraints, calculatePortfolioMetrics
} from '@/lib/portfolioOptimizer';
import { validatePriceData, cleanPriceData, calculateQualityScore, type DataQualityReport } from '@/lib/dataValidator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

import { CommandDeck, type AnalysisMode } from '@/components/quant-engine/CommandDeck';
import { AlphaRadar } from '@/components/quant-engine/AlphaRadar';
import { HeatMatrix } from '@/components/quant-engine/HeatMatrix';
import { PositionBook } from '@/components/quant-engine/PositionBook';
import { NLPReport } from '@/components/quant-engine/NLPReport';
import { RiskDials } from '@/components/quant-engine/RiskDials';
import { AllocationTree } from '@/components/quant-engine/AllocationTree';

async function fetchRealStockData(tickers: string[], period: string = '1y') {
  try {
    const { data, error } = await supabase.functions.invoke('fetch-stock-data', {
      body: { tickers, period },
    });
    if (error) throw error;
    return data.stockData;
  } catch (error) {
    console.error('Failed to fetch stock data:', error);
    throw error;
  }
}

const MODE_ALPHAS: Record<AnalysisMode, Set<AlphaId>> = {
  'multi-factor': new Set(['momentum21', 'momentum63', 'meanReversion', 'liquidity', 'volatility', 'rsi']),
  'momentum': new Set(['momentum21', 'momentum63']),
  'reversion': new Set(['meanReversion', 'rsi']),
};

const MODE_LABELS: Record<AnalysisMode, string> = {
  'multi-factor': 'MULTI-FACTOR ALPHA MATRIX',
  'momentum': 'MOMENTUM ISOLATION',
  'reversion': 'MEAN REVERSION',
};

interface EngineResults {
  signalScores: SignalScore[];
  portfolioWeights: { weights: PortfolioWeights; expectedVolatility: number; totalLeverage: number; netExposure: number };
  alphaScoresRaw: { [ticker: string]: { [alphaId: string]: number } };
  selectedAlphaIds: AlphaId[];
  analysisMode: string;
  validCount: number;
  timestamp: string;
  concentration: number;
}

export default function QuantEngine() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<EngineResults | null>(null);

  const runEngine = async (tickers: string[], mode: AnalysisMode) => {
    setIsRunning(true);
    setResults(null);

    const selectedAlphas = MODE_ALPHAS[mode];
    const analysisMode = MODE_LABELS[mode];

    try {
      toast.info('Initiating data stream protocol...');
      const tickerData = await fetchRealStockData(tickers, '1y');

      const validTickers: string[] = [];

      for (const ticker of tickers) {
        if (tickerData[ticker] && tickerData[ticker].length > 0) {
          const report = validatePriceData(ticker, tickerData[ticker]);
          let cleanData = tickerData[ticker];
          if (!report.isValid) {
            cleanData = cleanPriceData(tickerData[ticker], report);
          }
          if (calculateQualityScore(report) >= 30) {
            validTickers.push(ticker);
            tickerData[ticker] = cleanData;
          }
        }
      }

      if (validTickers.length === 0) throw new Error('Zero datasets passed quality control. Analysis aborted.');

      toast.info('Computing alpha vectors...');

      const volatilities: { [ticker: string]: number } = {};
      for (const ticker of validTickers) {
        const prices = tickerData[ticker];
        const returns = [];
        for (let i = 1; i < prices.length; i++) {
          returns.push((prices[i].close - prices[i - 1].close) / prices[i - 1].close);
        }
        const mean = returns.reduce((sum: number, r: number) => sum + r, 0) / returns.length;
        const variance = returns.reduce((sum: number, r: number) => sum + Math.pow(r - mean, 2), 0) / returns.length;
        volatilities[ticker] = Math.sqrt(variance * 252);
      }

      const alphaScores: { [ticker: string]: { [alphaId: string]: number } } = {};

      for (const ticker of validTickers) {
        const data = tickerData[ticker];
        alphaScores[ticker] = {};
        if (selectedAlphas.has('momentum21')) alphaScores[ticker]['momentum21'] = calculateMomentum(data, 21);
        if (selectedAlphas.has('momentum63')) alphaScores[ticker]['momentum63'] = calculateMomentum(data, 63);
        if (selectedAlphas.has('meanReversion')) alphaScores[ticker]['meanReversion'] = calculateMeanReversion(data, 5, 60);
        if (selectedAlphas.has('liquidity')) alphaScores[ticker]['liquidity'] = calculateLiquidity(data, 21);
        if (selectedAlphas.has('volatility')) alphaScores[ticker]['volatility'] = calculateVolatility(data, 21);
        if (selectedAlphas.has('rsi')) alphaScores[ticker]['rsi'] = calculateRSI(data, 14);
      }

      const alphaIds = Array.from(selectedAlphas);
      for (const alphaId of alphaIds) {
        const values = validTickers.map(t => alphaScores[t][alphaId] || 0);
        const zscored = zscore(values);
        validTickers.forEach((t, i) => { alphaScores[t][alphaId] = zscored[i]; });
      }

      const mockAlphaWeights: { [alphaId: string]: number } = {};
      alphaIds.forEach(id => { mockAlphaWeights[id] = 1 / alphaIds.length; });

      const signalScores = combineSignals(alphaScores, mockAlphaWeights);

      const constraints: RiskConstraints = { targetVolatility: 0.15, maxPerAsset: 0.25, maxTotalLeverage: 1.0 };
      let finalWeights = sizePositions(signalScores, volatilities, constraints);

      if (Object.keys(finalWeights).length === 0 && validTickers.length > 0) {
        const equalWeight = 1 / validTickers.length;
        finalWeights = validTickers.reduce((acc, ticker) => { acc[ticker] = equalWeight; return acc; }, {} as { [ticker: string]: number });
      }

      const finalWeightValues = Object.values(finalWeights);
      const totalLeverage = finalWeightValues.reduce((sum, w) => sum + Math.abs(w), 0);
      const netExposure = finalWeightValues.reduce((sum, w) => sum + w, 0);
      const expectedVolatility = Math.sqrt(
        Object.entries(finalWeights).reduce((sum, [ticker, weight]) => sum + Math.pow(weight * (volatilities[ticker] || 0.2), 2), 0)
      );

      const metrics = calculatePortfolioMetrics(finalWeights);

      setResults({
        signalScores: signalScores.sort((a, b) => b.score - a.score),
        portfolioWeights: { weights: finalWeights, totalLeverage, netExposure, expectedVolatility },
        alphaScoresRaw: alphaScores,
        selectedAlphaIds: alphaIds,
        analysisMode,
        validCount: validTickers.length,
        timestamp: new Date().toISOString(),
        concentration: metrics.concentration,
      });

      toast.success('Optimization sequence complete.');
    } catch (error: any) {
      toast.error(error.message || 'Engine Failure.');
    } finally {
      setIsRunning(false);
    }
  };

  // Transform data for sub-components
  const radarData = results ? results.signalScores.map(s => ({
    ticker: s.ticker,
    signals: results.alphaScoresRaw[s.ticker] || {},
  })) : [];

  const heatData = results ? results.signalScores.map(s => ({
    ticker: s.ticker,
    signals: results.alphaScoresRaw[s.ticker] || {},
    compositeScore: s.score,
  })) : [];

  const positionData = results ? results.signalScores.map(s => ({
    ticker: s.ticker,
    score: s.score,
    weight: results.portfolioWeights.weights[s.ticker] || 0,
    signals: results.alphaScoresRaw[s.ticker] || {},
  })) : [];

  const treeData = results ? results.signalScores.map(s => ({
    ticker: s.ticker,
    weight: results.portfolioWeights.weights[s.ticker] || 0,
    score: s.score,
  })) : [];

  return (
    <div className="relative min-h-screen w-full bg-[#07070a] text-white font-mono selection:bg-amber-500/30">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-amber-500/[0.03] rounded-full filter blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-violet-500/[0.03] rounded-full filter blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      <div className="relative z-10">
        <AnimatePresence mode="wait">
          {!results ? (
            /* ============ STANDBY STATE ============ */
            <motion.div
              key="standby"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-3xl mx-auto px-6 py-16"
            >
              <CommandDeck onRun={runEngine} isRunning={isRunning} />
            </motion.div>
          ) : (
            /* ============ RESULTS STATE ============ */
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="max-w-[1600px] mx-auto px-6 py-6"
            >
              {/* Top Bar */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setResults(null)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/5 border border-white/10 text-white/50 text-xs tracking-widest hover:bg-white/10 hover:text-white/80 transition-all"
                  >
                    <ArrowLeft className="w-3 h-3" /> NEW SCAN
                  </button>
                  <div>
                    <h2 className="text-lg tracking-[0.3em] font-light text-amber-400">{results.analysisMode}</h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] text-white/40 tracking-widest">
                        {results.validCount} ASSETS • {new Date(results.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Metrics Ribbon */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {[
                  { label: 'EXP VOLATILITY', val: `${(results.portfolioWeights.expectedVolatility * 100).toFixed(1)}%`, color: results.portfolioWeights.expectedVolatility > 0.3 ? 'text-rose-400' : results.portfolioWeights.expectedVolatility > 0.15 ? 'text-amber-400' : 'text-emerald-400' },
                  { label: 'NET EXPOSURE', val: `${(results.portfolioWeights.netExposure * 100).toFixed(1)}%`, color: results.portfolioWeights.netExposure > 0 ? 'text-emerald-400' : 'text-rose-400' },
                  { label: 'GROSS LEVERAGE', val: `${(results.portfolioWeights.totalLeverage * 100).toFixed(1)}%`, color: 'text-blue-400' },
                  { label: 'POSITIONS', val: results.validCount.toString(), color: 'text-white/60' },
                ].map((m, i) => (
                  <motion.div
                    key={m.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-4 hover:bg-white/[0.05] transition-colors"
                  >
                    <span className="text-[9px] text-white/30 tracking-widest uppercase block mb-1">{m.label}</span>
                    <span className={`text-2xl font-light ${m.color}`}>{m.val}</span>
                  </motion.div>
                ))}
              </div>

              {/* Row 1: Alpha Radar + Heatmap — full width, generous height */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
                <div className="min-h-[420px]">
                  <AlphaRadar data={radarData} alphaIds={results.selectedAlphaIds} />
                </div>
                <div className="min-h-[420px]">
                  <HeatMatrix data={heatData} alphaIds={results.selectedAlphaIds} />
                </div>
              </div>

              {/* Row 2: Risk Dials + Capital Allocation — full width */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
                <RiskDials
                  expectedVol={results.portfolioWeights.expectedVolatility}
                  netExposure={results.portfolioWeights.netExposure}
                  grossLeverage={results.portfolioWeights.totalLeverage}
                  concentration={results.concentration}
                />
                <div className="min-h-[320px]">
                  <AllocationTree data={treeData} />
                </div>
              </div>

              {/* Position Book */}
              <div className="mb-6">
                <PositionBook data={positionData} />
              </div>

              {/* NLP Intelligence Report */}
              <NLPReport data={results} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
