/**
 * Walk-Forward Backtesting
 * Out-of-sample validation with rolling train/test windows
 */

import { runBacktest, BacktestConfig, BacktestResult } from './simpleBacktester';
import { combineSignals, sizePositions, SignalScore, RiskConstraints } from './portfolioOptimizer';
import { calculateAlphaMetrics, calculateAdaptiveWeights, AlphaHistory } from './alphaMetrics';
import type { AlphaId } from './alphaCalculators';

export interface WalkForwardConfig {
  trainDays: number; // Training window size
  testDays: number; // Test window size
  retrainFrequency: number; // Days between retraining
  backtestConfig: BacktestConfig;
  riskConstraints: RiskConstraints;
}

export interface WalkForwardWindow {
  trainStart: string;
  trainEnd: string;
  testStart: string;
  testEnd: string;
  alphaWeights: { [alphaId: string]: number };
  metrics: {
    [alphaId: string]: {
      ic: number;
      icSharpe: number;
      isHealthy: boolean;
    };
  };
}

export interface WalkForwardResult {
  windows: WalkForwardWindow[];
  aggregatedBacktest: BacktestResult;
  outOfSampleMetrics: {
    totalReturn: number;
    annualizedReturn: number;
    sharpeRatio: number;
    maxDrawdown: number;
    calmarRatio: number;
    avgAlphaIC: { [alphaId: string]: number };
  };
}

/**
 * Run walk-forward backtest
 * Trains on historical data, tests on future data, rolls forward
 */
export function runWalkForwardBacktest(
  allDates: string[],
  alphaScoresByDate: {
    [date: string]: {
      [alphaId: string]: {
        [ticker: string]: number;
      };
    };
  },
  pricesByDate: { [date: string]: { [ticker: string]: number } },
  volatilitiesByDate: { [date: string]: { [ticker: string]: number } },
  config: WalkForwardConfig
): WalkForwardResult {
  const sortedDates = [...allDates].sort();
  const windows: WalkForwardWindow[] = [];
  const portfolioWeightsByDate: { [date: string]: { [ticker: string]: number } } = {};
  
  // Iterate through time with rolling windows
  for (
    let i = config.trainDays;
    i < sortedDates.length - config.testDays;
    i += config.retrainFrequency
  ) {
    const trainStart = sortedDates[Math.max(0, i - config.trainDays)];
    const trainEnd = sortedDates[i - 1];
    const testStart = sortedDates[i];
    const testEnd = sortedDates[Math.min(i + config.testDays - 1, sortedDates.length - 1)];
    
    // Build training history for IC calculation
    const trainHistory: { [alphaId: string]: AlphaHistory[] } = {};
    
    for (let t = Math.max(0, i - config.trainDays); t < i - 1; t++) {
      const date = sortedDates[t];
      const nextDate = sortedDates[t + 1];
      
      const alphas = alphaScoresByDate[date];
      const nextPrices = pricesByDate[nextDate];
      const currentPrices = pricesByDate[date];
      
      if (!alphas || !nextPrices || !currentPrices) continue;
      
      // Calculate returns
      const returns: { [ticker: string]: number } = {};
      for (const ticker of Object.keys(nextPrices)) {
        if (ticker in currentPrices && currentPrices[ticker] > 0) {
          returns[ticker] = (nextPrices[ticker] - currentPrices[ticker]) / currentPrices[ticker];
        }
      }
      
      // Store history for each alpha
      for (const alphaId of Object.keys(alphas)) {
        if (!(alphaId in trainHistory)) {
          trainHistory[alphaId] = [];
        }
        trainHistory[alphaId].push({
          date,
          signals: alphas[alphaId],
          returns,
        });
      }
    }
    
    // Calculate IC metrics for each alpha on training data
    const metricsMap = new Map<string, any>();
    
    for (const [alphaId, history] of Object.entries(trainHistory)) {
      const metrics = calculateAlphaMetrics(history, alphaId);
      metricsMap.set(alphaId, metrics);
    }
    
    // Calculate adaptive weights based on training performance
    const alphaWeights = calculateAdaptiveWeights(metricsMap);
    
    // Store window info
    const windowMetrics: any = {};
    for (const [alphaId, metrics] of metricsMap.entries()) {
      windowMetrics[alphaId] = {
        ic: metrics.ic,
        icSharpe: metrics.icSharpe,
        isHealthy: metrics.isHealthy,
      };
    }
    
    windows.push({
      trainStart,
      trainEnd,
      testStart,
      testEnd,
      alphaWeights,
      metrics: windowMetrics,
    });
    
    // Generate portfolio weights for test period using learned weights
    for (let t = i; t <= Math.min(i + config.testDays - 1, sortedDates.length - 1); t++) {
      const date = sortedDates[t];
      const alphas = alphaScoresByDate[date];
      const volatilities = volatilitiesByDate[date];
      
      if (!alphas || !volatilities) continue;
      
      // Combine alpha signals using adaptive weights
      const combinedSignals = combineSignalsWithWeights(alphas, alphaWeights);
      
      // Size positions
      const weights = sizePositions(combinedSignals, volatilities, config.riskConstraints);
      
      portfolioWeightsByDate[date] = weights;
    }
  }
  
  // Run backtest on entire out-of-sample period
  const aggregatedBacktest = runBacktest(
    portfolioWeightsByDate,
    pricesByDate,
    config.backtestConfig
  );
  
  // Calculate average IC per alpha across all windows
  const avgAlphaIC: { [alphaId: string]: number } = {};
  const icCounts: { [alphaId: string]: number } = {};
  
  for (const window of windows) {
    for (const [alphaId, metrics] of Object.entries(window.metrics)) {
      if (!(alphaId in avgAlphaIC)) {
        avgAlphaIC[alphaId] = 0;
        icCounts[alphaId] = 0;
      }
      avgAlphaIC[alphaId] += metrics.ic;
      icCounts[alphaId]++;
    }
  }
  
  for (const alphaId of Object.keys(avgAlphaIC)) {
    avgAlphaIC[alphaId] = avgAlphaIC[alphaId] / icCounts[alphaId];
  }
  
  return {
    windows,
    aggregatedBacktest,
    outOfSampleMetrics: {
      totalReturn: aggregatedBacktest.metrics.totalReturn,
      annualizedReturn: aggregatedBacktest.metrics.annualizedReturn,
      sharpeRatio: aggregatedBacktest.metrics.sharpeRatio,
      maxDrawdown: aggregatedBacktest.metrics.maxDrawdown,
      calmarRatio: aggregatedBacktest.metrics.calmarRatio,
      avgAlphaIC,
    },
  };
}

/**
 * Combine signals with custom weights
 */
function combineSignalsWithWeights(
  alphaScores: {
    [alphaId: string]: {
      [ticker: string]: number;
    };
  },
  alphaWeights: { [alphaId: string]: number }
): SignalScore[] {
  const tickerScores = new Map<string, { score: number; signals: { [alphaId: string]: number } }>();
  
  // Aggregate across alphas
  for (const [alphaId, signals] of Object.entries(alphaScores)) {
    const weight = alphaWeights[alphaId] || 0;
    
    for (const [ticker, value] of Object.entries(signals)) {
      if (!tickerScores.has(ticker)) {
        tickerScores.set(ticker, { score: 0, signals: {} });
      }
      
      const entry = tickerScores.get(ticker)!;
      entry.score += value * weight;
      entry.signals[alphaId] = value;
    }
  }
  
  // Convert to array
  const results: SignalScore[] = [];
  for (const [ticker, data] of tickerScores.entries()) {
    results.push({
      ticker,
      score: data.score,
      signals: data.signals,
    });
  }
  
  return results.sort((a, b) => b.score - a.score);
}
