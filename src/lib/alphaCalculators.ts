/**
 * Alpha Signal Calculators
 * RenTech-style: many small, orthogonal signals
 */

export interface AlphaResult {
  ticker: string;
  value: number;
  zscore: number;
}

/**
 * Z-score normalization (cross-sectional)
 */
export function zscore(values: number[]): number[] {
  const validValues = values.filter(v => !isNaN(v) && isFinite(v));
  if (validValues.length === 0) return values.map(() => 0);
  
  const mean = validValues.reduce((sum, v) => sum + v, 0) / validValues.length;
  const variance = validValues.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / validValues.length;
  const std = Math.sqrt(variance);
  
  if (std === 0) return values.map(() => 0);
  
  return values.map(v => isNaN(v) || !isFinite(v) ? 0 : (v - mean) / std);
}

/**
 * Momentum Alpha: Price momentum over window
 */
export function calculateMomentum(
  prices: { date: string; close: number }[],
  window: number = 21
): number {
  if (prices.length < window + 1) return 0;
  
  const startPrice = prices[prices.length - window - 1].close;
  const endPrice = prices[prices.length - 1].close;
  
  return (endPrice - startPrice) / startPrice;
}

/**
 * Mean Reversion Alpha: Deviation from long-term average
 */
export function calculateMeanReversion(
  prices: { date: string; close: number }[],
  shortWindow: number = 5,
  longWindow: number = 60
): number {
  if (prices.length < longWindow) return 0;
  
  const recentPrices = prices.slice(-shortWindow);
  const longPrices = prices.slice(-longWindow);
  
  const shortAvg = recentPrices.reduce((sum, p) => sum + p.close, 0) / shortWindow;
  const longAvg = longPrices.reduce((sum, p) => sum + p.close, 0) / longWindow;
  
  // Negative = buy dips (mean reversion)
  return -(shortAvg - longAvg) / longAvg;
}

/**
 * Liquidity Alpha: Average volume (higher = more liquid)
 */
export function calculateLiquidity(
  volumes: { date: string; volume: number }[],
  window: number = 21
): number {
  if (volumes.length < window) return 0;
  
  const recentVolumes = volumes.slice(-window);
  const avgVolume = recentVolumes.reduce((sum, v) => sum + v.volume, 0) / window;
  
  return Math.log1p(avgVolume);
}

/**
 * Volatility Alpha: Recent volatility (lower = more stable)
 */
export function calculateVolatility(
  prices: { date: string; close: number }[],
  window: number = 21
): number {
  if (prices.length < window + 1) return 0;
  
  const returns: number[] = [];
  for (let i = prices.length - window; i < prices.length; i++) {
    const ret = (prices[i].close - prices[i - 1].close) / prices[i - 1].close;
    returns.push(ret);
  }
  
  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
  
  return -Math.sqrt(variance); // Negative because lower vol is better
}

/**
 * RSI-based Mean Reversion
 */
export function calculateRSI(
  prices: { date: string; close: number }[],
  period: number = 14
): number {
  if (prices.length < period + 1) return 50;
  
  const changes: number[] = [];
  for (let i = prices.length - period; i < prices.length; i++) {
    changes.push(prices[i].close - prices[i - 1].close);
  }
  
  const gains = changes.map(c => c > 0 ? c : 0);
  const losses = changes.map(c => c < 0 ? -c : 0);
  
  const avgGain = gains.reduce((sum, g) => sum + g, 0) / period;
  const avgLoss = losses.reduce((sum, l) => sum + l, 0) / period;
  
  if (avgLoss === 0) return 100;
  
  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));
  
  // Convert to signal: oversold (buy) = positive, overbought (sell) = negative
  return (50 - rsi) / 50;
}

export const AVAILABLE_ALPHAS = [
  { id: 'momentum21', name: 'Price Momentum (3 weeks)', description: 'Stocks going up tend to keep going up' },
  { id: 'momentum63', name: 'Price Momentum (3 months)', description: 'Medium-term price trends' },
  { id: 'meanReversion', name: 'Mean Reversion', description: 'Buy dips, sell peaks' },
  { id: 'liquidity', name: 'Liquidity Score', description: 'Prefer actively traded stocks' },
  { id: 'volatility', name: 'Low Volatility', description: 'Prefer stable stocks' },
  { id: 'rsi', name: 'RSI Mean Reversion', description: 'Overbought/oversold signals' },
] as const;

export type AlphaId = typeof AVAILABLE_ALPHAS[number]['id'];
