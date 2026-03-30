/**
 * Web Worker for Alpha Signal Calculations
 * Offloads heavy computation from main thread
 */

interface PriceData {
  date: string;
  close: number;
  volume: number;
}

interface AlphaCalculationRequest {
  type: 'momentum' | 'mean_reversion' | 'volatility' | 'rsi' | 'all';
  prices: PriceData[];
  period?: number;
}

interface AlphaCalculationResult {
  type: string;
  value: number;
  zscore: number;
}

// Momentum calculation
function calculateMomentum(prices: PriceData[], period: number = 21): number {
  if (prices.length < period) return 0;
  
  const recentPrices = prices.slice(-period);
  const startPrice = recentPrices[0].close;
  const endPrice = recentPrices[recentPrices.length - 1].close;
  
  return (endPrice - startPrice) / startPrice;
}

// Mean reversion calculation
function calculateMeanReversion(
  prices: PriceData[],
  shortWindow: number = 5,
  longWindow: number = 60
): number {
  if (prices.length < longWindow) return 0;

  const shortPrices = prices.slice(-shortWindow);
  const longPrices = prices.slice(-longWindow);

  const shortAvg = shortPrices.reduce((sum, p) => sum + p.close, 0) / shortWindow;
  const longAvg = longPrices.reduce((sum, p) => sum + p.close, 0) / longWindow;

  // Negative when price is above long-term average (sell signal)
  return (longAvg - shortAvg) / longAvg;
}

// Volatility calculation
function calculateVolatility(prices: PriceData[], window: number = 21): number {
  if (prices.length < window) return 0;

  const recentPrices = prices.slice(-window);
  const returns = [];

  for (let i = 1; i < recentPrices.length; i++) {
    const ret = Math.log(recentPrices[i].close / recentPrices[i - 1].close);
    returns.push(ret);
  }

  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + (r - mean) ** 2, 0) / returns.length;
  const volatility = Math.sqrt(variance);

  // Return negative volatility (prefer low vol stocks)
  return -volatility;
}

// RSI calculation
function calculateRSI(prices: PriceData[], period: number = 14): number {
  if (prices.length < period + 1) return 0;

  const recentPrices = prices.slice(-(period + 1));
  const changes = [];

  for (let i = 1; i < recentPrices.length; i++) {
    changes.push(recentPrices[i].close - recentPrices[i - 1].close);
  }

  const gains = changes.map(c => (c > 0 ? c : 0));
  const losses = changes.map(c => (c < 0 ? -c : 0));

  const avgGain = gains.reduce((sum, g) => sum + g, 0) / period;
  const avgLoss = losses.reduce((sum, l) => sum + l, 0) / period;

  if (avgLoss === 0) return 0;

  const rs = avgGain / avgLoss;
  const rsi = 100 - 100 / (1 + rs);

  // Mean reversion signal: buy when oversold, sell when overbought
  if (rsi < 30) return (30 - rsi) / 30; // Positive signal
  if (rsi > 70) return (70 - rsi) / 30; // Negative signal
  return 0;
}

// Z-score normalization
function calculateZScore(value: number, values: number[]): number {
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  const stdDev = Math.sqrt(variance);
  
  if (stdDev === 0) return 0;
  return (value - mean) / stdDev;
}

// Message handler
self.onmessage = (e: MessageEvent<AlphaCalculationRequest>) => {
  const { type, prices, period = 21 } = e.data;

  const results: AlphaCalculationResult[] = [];

  if (type === 'momentum' || type === 'all') {
    const value = calculateMomentum(prices, period);
    results.push({
      type: 'momentum',
      value,
      zscore: 0, // Will be normalized cross-sectionally
    });
  }

  if (type === 'mean_reversion' || type === 'all') {
    const value = calculateMeanReversion(prices);
    results.push({
      type: 'mean_reversion',
      value,
      zscore: 0,
    });
  }

  if (type === 'volatility' || type === 'all') {
    const value = calculateVolatility(prices, period);
    results.push({
      type: 'volatility',
      value,
      zscore: 0,
    });
  }

  if (type === 'rsi' || type === 'all') {
    const value = calculateRSI(prices);
    results.push({
      type: 'rsi',
      value,
      zscore: 0,
    });
  }

  self.postMessage(results);
};

// Export type for TypeScript
export {};
