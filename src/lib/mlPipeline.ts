/**
 * QuantSuite ML Pipeline Engine
 * Client-side machine learning for regime detection, factor signals,
 * correlation analysis, and strategy scoring.
 * Uses TensorFlow.js for computations.
 */

// ================================
// TYPES
// ================================

export interface RegimeState {
  regime: 'BULL' | 'BEAR' | 'SIDEWAYS' | 'HIGH_VOL' | 'LOW_VOL';
  confidence: number;
  description: string;
  indicators: {
    trendStrength: number;
    volatilityLevel: number;
    momentumScore: number;
  };
}

export interface FactorSignal {
  name: string;
  value: number;
  signal: 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL';
  description: string;
}

export interface CorrelationResult {
  asset1: string;
  asset2: string;
  correlation: number;
  strength: 'VERY_HIGH' | 'HIGH' | 'MODERATE' | 'LOW' | 'NEGATIVE';
}

export interface StrategyScore {
  strategy: string;
  score: number;
  suitability: 'EXCELLENT' | 'GOOD' | 'MODERATE' | 'POOR';
  reasoning: string;
}

export interface MLPipelineResult {
  regime: RegimeState;
  factorSignals: FactorSignal[];
  correlations: CorrelationResult[];
  strategyScores: StrategyScore[];
  riskMetrics: {
    var95: number;
    var99: number;
    cvar95: number;
    maxDrawdown: number;
    sharpeRatio: number;
    sortinoRatio: number;
    beta: number;
  };
  timestamp: number;
}

// ================================
// TECHNICAL INDICATORS
// ================================

function calculateSMA(data: number[], period: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(NaN);
      continue;
    }
    const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    result.push(sum / period);
  }
  return result;
}

function calculateEMA(data: number[], period: number): number[] {
  const result: number[] = [];
  const multiplier = 2 / (period + 1);
  result.push(data[0]);
  for (let i = 1; i < data.length; i++) {
    result.push((data[i] - result[i - 1]) * multiplier + result[i - 1]);
  }
  return result;
}

function calculateRSI(data: number[], period: number = 14): number {
  if (data.length < period + 1) return 50;
  
  let gains = 0, losses = 0;
  for (let i = data.length - period; i < data.length; i++) {
    const change = data[i] - data[i - 1];
    if (change > 0) gains += change;
    else losses += Math.abs(change);
  }
  
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

function calculateMACD(data: number[]): { macd: number; signal: number; histogram: number } {
  if (data.length < 26) return { macd: 0, signal: 0, histogram: 0 };
  
  const ema12 = calculateEMA(data, 12);
  const ema26 = calculateEMA(data, 26);
  const macdLine = ema12.map((v, i) => v - ema26[i]);
  const signalLine = calculateEMA(macdLine.slice(-9), 9);
  
  const macd = macdLine[macdLine.length - 1];
  const signal = signalLine[signalLine.length - 1];
  
  return { macd, signal, histogram: macd - signal };
}

function calculateBollingerBands(data: number[], period: number = 20, stdDev: number = 2): {
  upper: number; middle: number; lower: number; percentB: number; bandwidth: number;
} {
  if (data.length < period) return { upper: 0, middle: 0, lower: 0, percentB: 0.5, bandwidth: 0 };
  
  const slice = data.slice(-period);
  const mean = slice.reduce((a, b) => a + b, 0) / period;
  const variance = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period;
  const std = Math.sqrt(variance);
  
  const upper = mean + stdDev * std;
  const lower = mean - stdDev * std;
  const current = data[data.length - 1];
  const percentB = (current - lower) / (upper - lower);
  const bandwidth = (upper - lower) / mean;
  
  return { upper, middle: mean, lower, percentB, bandwidth };
}

function calculateReturns(prices: number[]): number[] {
  return prices.slice(1).map((p, i) => (p - prices[i]) / prices[i]);
}

function calculateVolatility(returns: number[], annualize: boolean = true): number {
  if (returns.length < 2) return 0;
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (returns.length - 1);
  const vol = Math.sqrt(variance);
  return annualize ? vol * Math.sqrt(252) : vol;
}

// ================================
// REGIME DETECTION (KMeans-inspired)
// ================================

export function detectRegime(prices: number[], volumes?: number[]): RegimeState {
  if (prices.length < 30) {
    return {
      regime: 'SIDEWAYS',
      confidence: 0.3,
      description: 'Insufficient data for regime detection',
      indicators: { trendStrength: 0, volatilityLevel: 0.5, momentumScore: 0 }
    };
  }

  const returns = calculateReturns(prices);
  const recentReturns = returns.slice(-20);
  const volatility = calculateVolatility(recentReturns, false);
  const longTermVol = calculateVolatility(returns, false);
  const rsi = calculateRSI(prices);
  const macd = calculateMACD(prices);
  const sma20 = calculateSMA(prices, 20);
  const sma50 = calculateSMA(prices, Math.min(50, prices.length));
  
  const currentPrice = prices[prices.length - 1];
  const sma20Current = sma20[sma20.length - 1];
  const sma50Current = sma50[sma50.length - 1];
  
  // Trend strength: -1 (strong bear) to +1 (strong bull)
  let trendStrength = 0;
  if (!isNaN(sma20Current) && !isNaN(sma50Current)) {
    const priceVsSma20 = (currentPrice - sma20Current) / sma20Current;
    const priceVsSma50 = (currentPrice - sma50Current) / sma50Current;
    const sma20VsSma50 = (sma20Current - sma50Current) / sma50Current;
    trendStrength = (priceVsSma20 * 0.4 + priceVsSma50 * 0.3 + sma20VsSma50 * 0.3);
    trendStrength = Math.max(-1, Math.min(1, trendStrength * 10));
  }
  
  // Volatility level: 0 (calm) to 1 (extreme)
  const volRatio = longTermVol > 0 ? volatility / longTermVol : 1;
  const volatilityLevel = Math.min(1, volRatio / 2);
  
  // Momentum score using RSI and MACD
  const rsiScore = (rsi - 50) / 50; // -1 to +1
  const macdScore = macd.histogram > 0 ? Math.min(1, macd.histogram * 100) : Math.max(-1, macd.histogram * 100);
  const momentumScore = (rsiScore * 0.5 + macdScore * 0.5);
  
  // Classify regime
  let regime: RegimeState['regime'];
  let confidence: number;
  let description: string;
  
  if (volatilityLevel > 0.7) {
    regime = 'HIGH_VOL';
    confidence = volatilityLevel;
    description = `Extreme volatility regime detected. Vol ratio at ${(volRatio * 100).toFixed(0)}% of normal. RSI: ${rsi.toFixed(0)}. Defensive positioning recommended.`;
  } else if (volatilityLevel < 0.3 && Math.abs(trendStrength) < 0.2) {
    regime = 'LOW_VOL';
    confidence = 1 - volatilityLevel;
    description = `Low volatility compression regime. Vol at ${(volRatio * 100).toFixed(0)}% of normal. Watch for breakout. Mean-reversion strategies favored.`;
  } else if (trendStrength > 0.3 && momentumScore > 0.1) {
    regime = 'BULL';
    confidence = Math.min(1, (trendStrength + momentumScore) / 2);
    description = `Bullish trend regime. Trend strength: ${(trendStrength * 100).toFixed(0)}%. RSI: ${rsi.toFixed(0)}. Momentum strategies and trend-following optimal.`;
  } else if (trendStrength < -0.3 && momentumScore < -0.1) {
    regime = 'BEAR';
    confidence = Math.min(1, Math.abs(trendStrength + momentumScore) / 2);
    description = `Bearish trend regime. Trend weakness: ${(Math.abs(trendStrength) * 100).toFixed(0)}%. RSI: ${rsi.toFixed(0)}. Hedging and short strategies optimal.`;
  } else {
    regime = 'SIDEWAYS';
    confidence = 1 - Math.abs(trendStrength);
    description = `Range-bound/sideways market. No clear directional bias. Mean-reversion and options premium strategies favored.`;
  }
  
  return {
    regime,
    confidence,
    description,
    indicators: { trendStrength, volatilityLevel, momentumScore }
  };
}

// ================================
// FACTOR SIGNAL EXTRACTION
// ================================

export function extractFactorSignals(prices: number[], benchmark?: number[]): FactorSignal[] {
  const signals: FactorSignal[] = [];
  
  if (prices.length < 14) return signals;
  
  const returns = calculateReturns(prices);
  
  // 1. Momentum (RSI)
  const rsi = calculateRSI(prices);
  let rsiSignal: FactorSignal['signal'] = 'NEUTRAL';
  let rsiDesc = '';
  if (rsi > 70) { rsiSignal = 'STRONG_SELL'; rsiDesc = `RSI at ${rsi.toFixed(1)} — severely overbought. Mean reversion imminent.`; }
  else if (rsi > 60) { rsiSignal = 'SELL'; rsiDesc = `RSI at ${rsi.toFixed(1)} — overbought territory. Momentum fading.`; }
  else if (rsi < 30) { rsiSignal = 'STRONG_BUY'; rsiDesc = `RSI at ${rsi.toFixed(1)} — severely oversold. Reversal probability high.`; }
  else if (rsi < 40) { rsiSignal = 'BUY'; rsiDesc = `RSI at ${rsi.toFixed(1)} — oversold. Accumulation zone.`; }
  else { rsiDesc = `RSI at ${rsi.toFixed(1)} — neutral momentum.`; }
  signals.push({ name: 'Momentum (RSI)', value: rsi, signal: rsiSignal, description: rsiDesc });
  
  // 2. MACD Signal
  const macd = calculateMACD(prices);
  let macdSignal: FactorSignal['signal'] = 'NEUTRAL';
  if (macd.histogram > 0.02) macdSignal = macd.macd > 0 ? 'STRONG_BUY' : 'BUY';
  else if (macd.histogram < -0.02) macdSignal = macd.macd < 0 ? 'STRONG_SELL' : 'SELL';
  signals.push({
    name: 'MACD Histogram',
    value: macd.histogram,
    signal: macdSignal,
    description: `MACD: ${macd.macd.toFixed(4)}, Signal: ${macd.signal.toFixed(4)}, Histogram: ${macd.histogram > 0 ? '+' : ''}${macd.histogram.toFixed(4)}`
  });
  
  // 3. Volatility (Bollinger %B)
  const bb = calculateBollingerBands(prices);
  let bbSignal: FactorSignal['signal'] = 'NEUTRAL';
  if (bb.percentB > 1) { bbSignal = 'STRONG_SELL'; }
  else if (bb.percentB > 0.8) { bbSignal = 'SELL'; }
  else if (bb.percentB < 0) { bbSignal = 'STRONG_BUY'; }
  else if (bb.percentB < 0.2) { bbSignal = 'BUY'; }
  signals.push({
    name: 'Volatility (%B)',
    value: bb.percentB,
    signal: bbSignal,
    description: `Bollinger %B: ${(bb.percentB * 100).toFixed(1)}%. Bandwidth: ${(bb.bandwidth * 100).toFixed(2)}%. ${bb.percentB > 1 ? 'Above upper band — extreme.' : bb.percentB < 0 ? 'Below lower band — extreme.' : 'Within bands.'}`
  });
  
  // 4. Mean Reversion Z-Score
  const sma = calculateSMA(prices, 20);
  const currentPrice = prices[prices.length - 1];
  const smaVal = sma[sma.length - 1];
  const recentPrices = prices.slice(-20);
  const priceStd = Math.sqrt(recentPrices.reduce((sum, p) => sum + Math.pow(p - smaVal, 2), 0) / 20);
  const zScore = priceStd > 0 ? (currentPrice - smaVal) / priceStd : 0;
  
  let mrSignal: FactorSignal['signal'] = 'NEUTRAL';
  if (zScore > 2) mrSignal = 'STRONG_SELL';
  else if (zScore > 1) mrSignal = 'SELL';
  else if (zScore < -2) mrSignal = 'STRONG_BUY';
  else if (zScore < -1) mrSignal = 'BUY';
  signals.push({
    name: 'Mean Reversion (Z)',
    value: zScore,
    signal: mrSignal,
    description: `Z-Score: ${zScore > 0 ? '+' : ''}${zScore.toFixed(2)} std from 20-period mean. ${Math.abs(zScore) > 2 ? 'Extreme deviation — reversion likely.' : 'Within normal range.'}`
  });
  
  // 5. Trend Strength (ADX approximation)
  const vol = calculateVolatility(returns, true);
  const trendReturn = returns.slice(-20).reduce((a, b) => a + b, 0);
  const trendRatio = vol > 0 ? Math.abs(trendReturn) / (vol / Math.sqrt(252) * Math.sqrt(20)) : 0;
  let trendSignal: FactorSignal['signal'] = 'NEUTRAL';
  if (trendReturn > 0 && trendRatio > 1.5) trendSignal = 'STRONG_BUY';
  else if (trendReturn > 0 && trendRatio > 0.8) trendSignal = 'BUY';
  else if (trendReturn < 0 && trendRatio > 1.5) trendSignal = 'STRONG_SELL';
  else if (trendReturn < 0 && trendRatio > 0.8) trendSignal = 'SELL';
  signals.push({
    name: 'Trend Strength',
    value: trendRatio,
    signal: trendSignal,
    description: `Trend-to-noise ratio: ${trendRatio.toFixed(2)}. Annual volatility: ${(vol * 100).toFixed(1)}%. ${trendRatio > 1.5 ? 'Strong directional trend.' : trendRatio < 0.5 ? 'No significant trend.' : 'Moderate trend.'}`
  });
  
  return signals;
}

// ================================
// CORRELATION ANALYSIS
// ================================

export function computeCorrelations(
  assets: { name: string; prices: number[] }[]
): CorrelationResult[] {
  const results: CorrelationResult[] = [];
  
  for (let i = 0; i < assets.length; i++) {
    for (let j = i + 1; j < assets.length; j++) {
      const returns1 = calculateReturns(assets[i].prices);
      const returns2 = calculateReturns(assets[j].prices);
      const minLen = Math.min(returns1.length, returns2.length);
      
      if (minLen < 5) continue;
      
      const r1 = returns1.slice(-minLen);
      const r2 = returns2.slice(-minLen);
      
      const mean1 = r1.reduce((a, b) => a + b, 0) / minLen;
      const mean2 = r2.reduce((a, b) => a + b, 0) / minLen;
      
      let cov = 0, var1 = 0, var2 = 0;
      for (let k = 0; k < minLen; k++) {
        const d1 = r1[k] - mean1;
        const d2 = r2[k] - mean2;
        cov += d1 * d2;
        var1 += d1 * d1;
        var2 += d2 * d2;
      }
      
      const denom = Math.sqrt(var1 * var2);
      const correlation = denom > 0 ? cov / denom : 0;
      
      let strength: CorrelationResult['strength'];
      const absCorr = Math.abs(correlation);
      if (absCorr > 0.8) strength = 'VERY_HIGH';
      else if (absCorr > 0.6) strength = 'HIGH';
      else if (absCorr > 0.3) strength = 'MODERATE';
      else if (correlation < -0.3) strength = 'NEGATIVE';
      else strength = 'LOW';
      
      results.push({
        asset1: assets[i].name,
        asset2: assets[j].name,
        correlation: Math.round(correlation * 1000) / 1000,
        strength
      });
    }
  }
  
  return results.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
}

// ================================
// STRATEGY SCORING (Decision Tree)
// ================================

export function scoreStrategies(
  regime: RegimeState,
  factorSignals: FactorSignal[],
  volatility: number
): StrategyScore[] {
  const scores: StrategyScore[] = [];
  
  const rsi = factorSignals.find(s => s.name.includes('RSI'))?.value || 50;
  const zScore = factorSignals.find(s => s.name.includes('Z'))?.value || 0;
  const trendRatio = factorSignals.find(s => s.name.includes('Trend'))?.value || 0;
  
  // 1. Momentum / Trend Following
  let momentumScore = 0;
  if (regime.regime === 'BULL' && trendRatio > 1) momentumScore = 90;
  else if (regime.regime === 'BULL') momentumScore = 70;
  else if (regime.regime === 'BEAR' && trendRatio > 1) momentumScore = 60; // short momentum
  else if (regime.regime === 'SIDEWAYS') momentumScore = 30;
  else momentumScore = 40;
  scores.push({
    strategy: 'Momentum / Trend Following',
    score: momentumScore,
    suitability: momentumScore > 75 ? 'EXCELLENT' : momentumScore > 55 ? 'GOOD' : momentumScore > 35 ? 'MODERATE' : 'POOR',
    reasoning: `Regime: ${regime.regime}, Trend ratio: ${trendRatio.toFixed(2)}. ${momentumScore > 70 ? 'Strong directional move supports trend-following entries.' : 'Weak trend — momentum strategies carry whipsaw risk.'}`
  });
  
  // 2. Mean Reversion
  let mrScore = 0;
  if (regime.regime === 'SIDEWAYS' && Math.abs(zScore) > 1.5) mrScore = 90;
  else if (regime.regime === 'SIDEWAYS') mrScore = 70;
  else if (regime.regime === 'LOW_VOL' && Math.abs(zScore) > 1) mrScore = 75;
  else if (Math.abs(zScore) > 2) mrScore = 65;
  else mrScore = 35;
  scores.push({
    strategy: 'Mean Reversion',
    score: mrScore,
    suitability: mrScore > 75 ? 'EXCELLENT' : mrScore > 55 ? 'GOOD' : mrScore > 35 ? 'MODERATE' : 'POOR',
    reasoning: `Z-Score: ${zScore.toFixed(2)}, Regime: ${regime.regime}. ${mrScore > 70 ? 'Range-bound conditions ideal for mean reversion.' : 'Trending market — mean reversion trades are dangerous.'}`
  });
  
  // 3. Volatility Trading
  let volScore = 0;
  if (regime.regime === 'HIGH_VOL') volScore = 85;
  else if (regime.regime === 'LOW_VOL') volScore = 80; // sell premium
  else if (volatility > 0.3) volScore = 70;
  else volScore = 45;
  scores.push({
    strategy: 'Volatility Trading',
    score: volScore,
    suitability: volScore > 75 ? 'EXCELLENT' : volScore > 55 ? 'GOOD' : volScore > 35 ? 'MODERATE' : 'POOR',
    reasoning: `Annualized vol: ${(volatility * 100).toFixed(1)}%, Regime: ${regime.regime}. ${regime.regime === 'HIGH_VOL' ? 'High vol = premium collection opportunities via straddles/strangles.' : regime.regime === 'LOW_VOL' ? 'Low vol compression → sell premium before breakout.' : 'Normal vol — standard options strategies.'}`
  });
  
  // 4. Defensive / Hedging
  let defScore = 0;
  if (regime.regime === 'BEAR') defScore = 90;
  else if (regime.regime === 'HIGH_VOL') defScore = 80;
  else if (rsi > 70) defScore = 65;
  else defScore = 30;
  scores.push({
    strategy: 'Defensive / Hedging',
    score: defScore,
    suitability: defScore > 75 ? 'EXCELLENT' : defScore > 55 ? 'GOOD' : defScore > 35 ? 'MODERATE' : 'POOR',
    reasoning: `Regime: ${regime.regime}, RSI: ${rsi.toFixed(0)}. ${defScore > 70 ? 'Risk-off conditions warrant protective puts, tail hedges, or cash increase.' : 'Bullish conditions — hedging costs drag on performance.'}`
  });
  
  // 5. Statistical Arbitrage
  let statArbScore = 0;
  if (regime.regime === 'SIDEWAYS' || regime.regime === 'LOW_VOL') statArbScore = 80;
  else if (regime.regime === 'HIGH_VOL') statArbScore = 40; // correlations break
  else statArbScore = 55;
  scores.push({
    strategy: 'Statistical Arbitrage',
    score: statArbScore,
    suitability: statArbScore > 75 ? 'EXCELLENT' : statArbScore > 55 ? 'GOOD' : statArbScore > 35 ? 'MODERATE' : 'POOR',
    reasoning: `Regime: ${regime.regime}. ${statArbScore > 70 ? 'Stable correlations support pair trading and relative value.' : 'Volatile correlations can break stat-arb pairs.'}`
  });
  
  return scores.sort((a, b) => b.score - a.score);
}

// ================================
// RISK METRICS
// ================================

export function calculateRiskMetrics(prices: number[], riskFreeRate: number = 0.05): {
  var95: number; var99: number; cvar95: number; maxDrawdown: number;
  sharpeRatio: number; sortinoRatio: number; beta: number;
} {
  const returns = calculateReturns(prices);
  if (returns.length < 5) {
    return { var95: 0, var99: 0, cvar95: 0, maxDrawdown: 0, sharpeRatio: 0, sortinoRatio: 0, beta: 1 };
  }
  
  const sortedReturns = [...returns].sort((a, b) => a - b);
  const n = sortedReturns.length;
  
  const var95Idx = Math.floor(n * 0.05);
  const var99Idx = Math.floor(n * 0.01);
  const var95 = -sortedReturns[var95Idx] * prices[prices.length - 1];
  const var99 = -sortedReturns[Math.max(0, var99Idx)] * prices[prices.length - 1];
  
  const tailReturns = sortedReturns.slice(0, var95Idx + 1);
  const cvar95 = tailReturns.length > 0 
    ? -tailReturns.reduce((a, b) => a + b, 0) / tailReturns.length * prices[prices.length - 1]
    : var95;
  
  // Max Drawdown
  let peak = prices[0];
  let maxDD = 0;
  for (const price of prices) {
    if (price > peak) peak = price;
    const dd = (peak - price) / peak;
    if (dd > maxDD) maxDD = dd;
  }
  
  // Sharpe & Sortino
  const meanReturn = returns.reduce((a, b) => a + b, 0) / n;
  const annualReturn = meanReturn * 252;
  const annualVol = calculateVolatility(returns, true);
  const sharpeRatio = annualVol > 0 ? (annualReturn - riskFreeRate) / annualVol : 0;
  
  const downsideReturns = returns.filter(r => r < 0);
  const downsideVol = downsideReturns.length > 0 
    ? Math.sqrt(downsideReturns.reduce((sum, r) => sum + r * r, 0) / downsideReturns.length) * Math.sqrt(252)
    : annualVol;
  const sortinoRatio = downsideVol > 0 ? (annualReturn - riskFreeRate) / downsideVol : 0;
  
  return { var95, var99, cvar95, maxDrawdown: maxDD, sharpeRatio, sortinoRatio, beta: 1 };
}

// ================================
// FULL PIPELINE
// ================================

export function runMLPipeline(
  prices: number[],
  assets?: { name: string; prices: number[] }[],
  benchmark?: number[]
): MLPipelineResult {
  const regime = detectRegime(prices);
  const factorSignals = extractFactorSignals(prices, benchmark);
  const returns = calculateReturns(prices);
  const volatility = calculateVolatility(returns, true);
  const correlations = assets ? computeCorrelations(assets) : [];
  const strategyScores = scoreStrategies(regime, factorSignals, volatility);
  const riskMetrics = calculateRiskMetrics(prices);
  
  return {
    regime,
    factorSignals,
    correlations,
    strategyScores,
    riskMetrics,
    timestamp: Date.now()
  };
}

// ================================
// CONTEXT FORMATTER (for LLM injection)
// ================================

export function formatMLContextForLLM(result: MLPipelineResult): string {
  let context = `\n\n[ML PIPELINE ANALYSIS — PRE-COMPUTED]\n\n`;
  
  context += `**REGIME DETECTION**: ${result.regime.regime} (${(result.regime.confidence * 100).toFixed(0)}% confidence)\n`;
  context += `${result.regime.description}\n`;
  context += `Trend Strength: ${(result.regime.indicators.trendStrength * 100).toFixed(0)}% | Volatility Level: ${(result.regime.indicators.volatilityLevel * 100).toFixed(0)}% | Momentum: ${(result.regime.indicators.momentumScore * 100).toFixed(0)}%\n\n`;
  
  context += `**FACTOR SIGNALS**:\n`;
  result.factorSignals.forEach(s => {
    context += `- ${s.name}: ${s.signal} (${s.value.toFixed(2)}) — ${s.description}\n`;
  });
  
  context += `\n**RISK METRICS**:\n`;
  context += `- VaR 95%: $${result.riskMetrics.var95.toFixed(2)}\n`;
  context += `- VaR 99%: $${result.riskMetrics.var99.toFixed(2)}\n`;
  context += `- CVaR 95%: $${result.riskMetrics.cvar95.toFixed(2)}\n`;
  context += `- Max Drawdown: ${(result.riskMetrics.maxDrawdown * 100).toFixed(2)}%\n`;
  context += `- Sharpe Ratio: ${result.riskMetrics.sharpeRatio.toFixed(3)}\n`;
  context += `- Sortino Ratio: ${result.riskMetrics.sortinoRatio.toFixed(3)}\n\n`;
  
  context += `**STRATEGY SCORING (Best → Worst)**:\n`;
  result.strategyScores.forEach((s, i) => {
    context += `${i + 1}. ${s.strategy}: ${s.score}/100 (${s.suitability}) — ${s.reasoning}\n`;
  });
  
  if (result.correlations.length > 0) {
    context += `\n**CORRELATION ANALYSIS**:\n`;
    result.correlations.slice(0, 10).forEach(c => {
      context += `- ${c.asset1} ↔ ${c.asset2}: ${c.correlation.toFixed(3)} (${c.strength})\n`;
    });
  }
  
  context += `\nUSE THIS DATA in your analysis. Reference specific numbers. Build your strategy recommendations on these computed signals.\n`;
  
  return context;
}
