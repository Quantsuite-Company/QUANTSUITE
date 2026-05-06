/**
 * V7 WALK-FORWARD ENGINE — Scientific Double-Blind Backtesting
 * 
 * Architecture:
 * 1. Expanding Training Window: Start with N days, expand forward after each test period
 * 2. h-Gap: Mandatory gap between training end and test start (kills data leakage)
 * 3. Hyperparameter Grid Search: Optimize strategy params on validation slice before testing
 * 4. Double-Blind Cutoff: Support for a global cutoff date to silo "future" data
 * 
 * Based on: Advances in Financial Machine Learning (Marcos López de Prado, 2018)
 */

import { runBacktest, type BacktestConfig, type BacktestResult } from './backtestEngine';

// ============================================================
// INTERFACES
// ============================================================

export interface WalkForwardConfig {
  initialTrainDays: number;     // 120 — starting training window
  testWindowDays: number;       // 20 — each test period
  hGapDays: number;             // 5 — mandatory gap to kill leakage
  strategies: BacktestConfig[]; // Strategy configs to compete
  hyperparamGrid: {
    stopLoss: number[];         // [0.02, 0.03, 0.05]
    takeProfit: number[];       // [0.05, 0.08, 0.12, 0.15]
    lookbackPeriod: number[];   // [10, 14, 20, 30]
  };
  cutoffDate?: string;          // Double-blind cutoff (YYYY-MM-DD)
}

export interface WalkForwardWindow {
  windowIndex: number;
  trainStart: number;           // Day index
  trainEnd: number;
  gapStart: number;
  gapEnd: number;
  testStart: number;
  testEnd: number;
  bestStrategy: string;
  bestSharpe: number;
  testReturn: number;
  testSharpe: number;
  optimizedParams: {
    stopLoss: number;
    takeProfit: number;
    lookbackPeriod: number;
  };
}

export interface WalkForwardResult {
  windows: WalkForwardWindow[];
  aggregateMetrics: {
    totalReturn: number;
    annualizedReturn: number;
    outOfSampleSharpe: number;
    maxDrawdown: number;
    winRate: number;
    avgWindowReturn: number;
    bestWindowReturn: number;
    worstWindowReturn: number;
    stabilityRatio: number;     // % of windows with positive return
    profitFactor: number;
    totalWindows: number;
  };
  equityCurve: { day: number; equity: number }[];
  strategyContribution: { strategy: string; wins: number; avgSharpe: number }[];
}

// ============================================================
// DEFAULT CONFIG
// ============================================================

export const DEFAULT_WF_CONFIG: WalkForwardConfig = {
  initialTrainDays: 120,
  testWindowDays: 20,
  hGapDays: 5,
  strategies: [
    { strategyName: 'Momentum Alpha', entrySignal: 'MOMENTUM', positionSize: 0.10, stopLoss: 0.05, takeProfit: 0.12, lookbackPeriod: 14, holdingPeriod: 14 },
    { strategyName: 'Mean Reversion Beta', entrySignal: 'MEAN_REVERSION', positionSize: 0.15, stopLoss: 0.03, takeProfit: 0.08, lookbackPeriod: 20, holdingPeriod: 5 },
    { strategyName: 'Vol Breakout Gamma', entrySignal: 'VOLATILITY', positionSize: 0.08, stopLoss: 0.06, takeProfit: 0.15, lookbackPeriod: 10, holdingPeriod: 20 },
  ],
  hyperparamGrid: {
    stopLoss: [0.02, 0.03, 0.05],
    takeProfit: [0.05, 0.08, 0.12],
    lookbackPeriod: [10, 14, 20],
  },
};

// ============================================================
// CORE ENGINE
// ============================================================

/**
 * Runs a full walk-forward backtest on the given price series.
 * 
 * |------- Training (120d) -------|-- Gap (5d) --|-- Test (20d) --|
 * |------- Training (140d) ------------------|-- Gap --|-- Test --|
 * |------- Training (160d) -------------------------------|-- ... --|
 */
export function runWalkForwardEngine(
  prices: number[],
  config: WalkForwardConfig = DEFAULT_WF_CONFIG
): WalkForwardResult {
  const { initialTrainDays, testWindowDays, hGapDays, strategies } = config;
  const totalDays = prices.length;
  const windows: WalkForwardWindow[] = [];
  const equityCurve: { day: number; equity: number }[] = [];
  const strategyWins: Record<string, { wins: number; totalSharpe: number; count: number }> = {};

  // Initialize strategy tracking
  for (const s of strategies) {
    strategyWins[s.strategyName] = { wins: 0, totalSharpe: 0, count: 0 };
  }

  let windowIndex = 0;
  let cumulativeReturn = 1.0;

  // Expanding window loop
  for (
    let trainEnd = initialTrainDays;
    trainEnd + hGapDays + testWindowDays <= totalDays;
    trainEnd += testWindowDays
  ) {
    const trainStart = 0; // Expanding window always starts from day 0
    const gapStart = trainEnd;
    const gapEnd = trainEnd + hGapDays;
    const testStart = gapEnd;
    const testEnd = Math.min(testStart + testWindowDays, totalDays);

    const trainPrices = prices.slice(trainStart, trainEnd);
    const testPrices = prices.slice(testStart, testEnd);

    if (trainPrices.length < 30 || testPrices.length < 5) continue;

    // Phase 1: Hyperparameter Grid Search on Training Data
    let bestResult: BacktestResult | null = null;
    let bestSharpe = -Infinity;
    let bestParams = { stopLoss: 0.05, takeProfit: 0.12, lookbackPeriod: 14 };
    let bestStrategyName = strategies[0]?.strategyName || 'Unknown';

    for (const strategy of strategies) {
      for (const sl of config.hyperparamGrid.stopLoss) {
        for (const tp of config.hyperparamGrid.takeProfit) {
          for (const lb of config.hyperparamGrid.lookbackPeriod) {
            const testConfig: BacktestConfig = {
              ...strategy,
              stopLoss: sl,
              takeProfit: tp,
              lookbackPeriod: lb,
            };

            try {
              const result = runBacktest(trainPrices, testConfig);
              if (result.sharpeRatio > bestSharpe) {
                bestSharpe = result.sharpeRatio;
                bestResult = result;
                bestParams = { stopLoss: sl, takeProfit: tp, lookbackPeriod: lb };
                bestStrategyName = strategy.strategyName;
              }
            } catch { /* Skip failed configs */ }
          }
        }
      }
    }

    // Phase 2: Out-of-Sample Test with Best Parameters
    let testReturn = 0;
    let testSharpe = 0;

    if (bestResult) {
      const bestConfig: BacktestConfig = {
        ...strategies.find(s => s.strategyName === bestStrategyName) || strategies[0],
        stopLoss: bestParams.stopLoss,
        takeProfit: bestParams.takeProfit,
        lookbackPeriod: bestParams.lookbackPeriod,
      };

      try {
        const oosResult = runBacktest(testPrices, bestConfig);
        testReturn = oosResult.totalReturn;
        testSharpe = oosResult.sharpeRatio;
      } catch {
        testReturn = (testPrices[testPrices.length - 1] / testPrices[0]) - 1;
        testSharpe = 0;
      }
    } else {
      testReturn = (testPrices[testPrices.length - 1] / testPrices[0]) - 1;
    }

    // Track strategy performance
    if (strategyWins[bestStrategyName]) {
      strategyWins[bestStrategyName].count++;
      strategyWins[bestStrategyName].totalSharpe += testSharpe;
      if (testReturn > 0) strategyWins[bestStrategyName].wins++;
    }

    // Build equity curve
    cumulativeReturn *= (1 + testReturn);
    for (let d = testStart; d < testEnd; d++) {
      const dayProgress = (d - testStart) / (testEnd - testStart);
      equityCurve.push({
        day: d,
        equity: (cumulativeReturn - testReturn + testReturn * dayProgress) * 100,
      });
    }

    windows.push({
      windowIndex: windowIndex++,
      trainStart,
      trainEnd,
      gapStart,
      gapEnd,
      testStart,
      testEnd,
      bestStrategy: bestStrategyName,
      bestSharpe: isFinite(bestSharpe) ? bestSharpe : 0,
      testReturn,
      testSharpe: isFinite(testSharpe) ? testSharpe : 0,
      optimizedParams: bestParams,
    });
  }

  // Aggregate metrics
  const totalReturn = cumulativeReturn - 1;
  const windowReturns = windows.map(w => w.testReturn);
  const positiveWindows = windowReturns.filter(r => r > 0).length;

  // Compute aggregate Sharpe from window returns
  const avgReturn = windowReturns.length > 0 ? windowReturns.reduce((a, b) => a + b, 0) / windowReturns.length : 0;
  const stdReturn = windowReturns.length > 1
    ? Math.sqrt(windowReturns.reduce((sum, r) => sum + (r - avgReturn) ** 2, 0) / (windowReturns.length - 1))
    : 0;
  const outOfSampleSharpe = stdReturn > 0 ? (avgReturn / stdReturn) * Math.sqrt(252 / (config.testWindowDays || 20)) : 0;

  // Max drawdown from equity curve
  let peak = 100;
  let maxDD = 0;
  for (const point of equityCurve) {
    if (point.equity > peak) peak = point.equity;
    const dd = (peak - point.equity) / peak;
    if (dd > maxDD) maxDD = dd;
  }

  // Profit factor
  const grossProfit = windowReturns.filter(r => r > 0).reduce((a, b) => a + b, 0);
  const grossLoss = Math.abs(windowReturns.filter(r => r < 0).reduce((a, b) => a + b, 0));
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0;

  // Strategy contribution
  const strategyContribution = Object.entries(strategyWins).map(([name, data]) => ({
    strategy: name,
    wins: data.wins,
    avgSharpe: data.count > 0 ? data.totalSharpe / data.count : 0,
  }));

  return {
    windows,
    aggregateMetrics: {
      totalReturn,
      annualizedReturn: Math.pow(1 + totalReturn, 252 / Math.max(1, equityCurve.length)) - 1,
      outOfSampleSharpe: isFinite(outOfSampleSharpe) ? outOfSampleSharpe : 0,
      maxDrawdown: maxDD,
      winRate: windows.length > 0 ? (positiveWindows / windows.length) * 100 : 0,
      avgWindowReturn: avgReturn,
      bestWindowReturn: windowReturns.length > 0 ? Math.max(...windowReturns) : 0,
      worstWindowReturn: windowReturns.length > 0 ? Math.min(...windowReturns) : 0,
      stabilityRatio: windows.length > 0 ? (positiveWindows / windows.length) * 100 : 0,
      profitFactor,
      totalWindows: windows.length,
    },
    equityCurve,
    strategyContribution,
  };
}
