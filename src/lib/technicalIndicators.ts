// Technical Indicators Library
// Comprehensive collection of indicators for technical analysis

export interface IndicatorResult {
  value: number;
  signal?: 'buy' | 'sell' | 'neutral';
}

/**
 * Calculate Simple Moving Average (SMA)
 */
export const calculateSMA = (data: number[], period: number): number[] => {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(NaN);
    } else {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / period);
    }
  }
  return result;
};

/**
 * Calculate Exponential Moving Average (EMA)
 */
export const calculateEMA = (data: number[], period: number): number[] => {
  const result: number[] = [];
  const multiplier = 2 / (period + 1);
  
  // Start with SMA for first value
  let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(NaN);
    } else if (i === period - 1) {
      result.push(ema);
    } else {
      ema = (data[i] - ema) * multiplier + ema;
      result.push(ema);
    }
  }
  return result;
};

/**
 * Calculate Relative Strength Index (RSI)
 */
export const calculateRSI = (data: number[], period: number = 14): number[] => {
  const result: number[] = [];
  const changes: number[] = [];
  
  for (let i = 1; i < data.length; i++) {
    changes.push(data[i] - data[i - 1]);
  }
  
  for (let i = 0; i < data.length; i++) {
    if (i < period) {
      result.push(NaN);
    } else {
      const recentChanges = changes.slice(i - period, i);
      const gains = recentChanges.filter(c => c > 0);
      const losses = recentChanges.filter(c => c < 0).map(c => Math.abs(c));
      
      const avgGain = gains.length > 0 ? gains.reduce((a, b) => a + b, 0) / period : 0;
      const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / period : 0;
      
      if (avgLoss === 0) {
        result.push(100);
      } else {
        const rs = avgGain / avgLoss;
        const rsi = 100 - (100 / (1 + rs));
        result.push(rsi);
      }
    }
  }
  return result;
};

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 */
export const calculateMACD = (data: number[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9) => {
  const fastEMA = calculateEMA(data, fastPeriod);
  const slowEMA = calculateEMA(data, slowPeriod);
  
  const macdLine = fastEMA.map((fast, i) => fast - slowEMA[i]);
  const signalLine = calculateEMA(macdLine.filter(v => !isNaN(v)), signalPeriod);
  
  // Pad signal line with NaNs to match length
  const paddedSignal = [...Array(macdLine.length - signalLine.length).fill(NaN), ...signalLine];
  
  const histogram = macdLine.map((macd, i) => macd - (paddedSignal[i] || 0));
  
  return { macdLine, signalLine: paddedSignal, histogram };
};

/**
 * Calculate Bollinger Bands
 */
export const calculateBollingerBands = (data: number[], period: number = 20, stdDev: number = 2) => {
  const sma = calculateSMA(data, period);
  const upper: number[] = [];
  const lower: number[] = [];
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      upper.push(NaN);
      lower.push(NaN);
    } else {
      const slice = data.slice(i - period + 1, i + 1);
      const mean = sma[i];
      const variance = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period;
      const std = Math.sqrt(variance);
      
      upper.push(mean + stdDev * std);
      lower.push(mean - stdDev * std);
    }
  }
  
  return { upper, middle: sma, lower };
};

/**
 * Calculate Stochastic Oscillator
 */
export const calculateStochastic = (highs: number[], lows: number[], closes: number[], kPeriod: number = 14, dPeriod: number = 3) => {
  const kValues: number[] = [];
  
  for (let i = 0; i < closes.length; i++) {
    if (i < kPeriod - 1) {
      kValues.push(NaN);
    } else {
      const periodHighs = highs.slice(i - kPeriod + 1, i + 1);
      const periodLows = lows.slice(i - kPeriod + 1, i + 1);
      const highestHigh = Math.max(...periodHighs);
      const lowestLow = Math.min(...periodLows);
      
      const k = ((closes[i] - lowestLow) / (highestHigh - lowestLow)) * 100;
      kValues.push(k);
    }
  }
  
  const dValues = calculateSMA(kValues.filter(v => !isNaN(v)), dPeriod);
  const paddedD = [...Array(kValues.length - dValues.length).fill(NaN), ...dValues];
  
  return { k: kValues, d: paddedD };
};

/**
 * Calculate Average True Range (ATR)
 */
export const calculateATR = (highs: number[], lows: number[], closes: number[], period: number = 14): number[] => {
  const trueRanges: number[] = [];
  
  for (let i = 1; i < closes.length; i++) {
    const tr = Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    );
    trueRanges.push(tr);
  }
  
  const atr = calculateEMA(trueRanges, period);
  return [NaN, ...atr]; // Pad first value
};

/**
 * Calculate Average Directional Index (ADX)
 */
export const calculateADX = (highs: number[], lows: number[], closes: number[], period: number = 14): number[] => {
  const adx: number[] = [];
  const plusDM: number[] = [];
  const minusDM: number[] = [];
  
  // Calculate directional movements
  for (let i = 1; i < highs.length; i++) {
    const upMove = highs[i] - highs[i - 1];
    const downMove = lows[i - 1] - lows[i];
    
    plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0);
  }
  
  const atr = calculateATR(highs, lows, closes, period).slice(1);
  const plusDI = plusDM.map((dm, i) => (dm / atr[i]) * 100);
  const minusDI = minusDM.map((dm, i) => (dm / atr[i]) * 100);
  
  // Calculate DX
  const dx = plusDI.map((plus, i) => {
    const sum = plus + minusDI[i];
    return sum === 0 ? 0 : (Math.abs(plus - minusDI[i]) / sum) * 100;
  });
  
  // ADX is smoothed DX
  const adxValues = calculateEMA(dx, period);
  return [NaN, ...adxValues];
};

/**
 * Calculate On-Balance Volume (OBV)
 */
export const calculateOBV = (closes: number[], volumes: number[]): number[] => {
  const obv: number[] = [volumes[0]];
  
  for (let i = 1; i < closes.length; i++) {
    if (closes[i] > closes[i - 1]) {
      obv.push(obv[i - 1] + volumes[i]);
    } else if (closes[i] < closes[i - 1]) {
      obv.push(obv[i - 1] - volumes[i]);
    } else {
      obv.push(obv[i - 1]);
    }
  }
  
  return obv;
};

/**
 * Calculate Williams %R
 */
export const calculateWilliamsR = (highs: number[], lows: number[], closes: number[], period: number = 14): number[] => {
  const result: number[] = [];
  
  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) {
      result.push(NaN);
    } else {
      const periodHighs = highs.slice(i - period + 1, i + 1);
      const periodLows = lows.slice(i - period + 1, i + 1);
      const highestHigh = Math.max(...periodHighs);
      const lowestLow = Math.min(...periodLows);
      
      const wr = ((highestHigh - closes[i]) / (highestHigh - lowestLow)) * -100;
      result.push(wr);
    }
  }
  
  return result;
};

/**
 * Calculate Commodity Channel Index (CCI)
 */
export const calculateCCI = (highs: number[], lows: number[], closes: number[], period: number = 20): number[] => {
  const result: number[] = [];
  const typicalPrices = highs.map((h, i) => (h + lows[i] + closes[i]) / 3);
  
  for (let i = 0; i < typicalPrices.length; i++) {
    if (i < period - 1) {
      result.push(NaN);
    } else {
      const slice = typicalPrices.slice(i - period + 1, i + 1);
      const sma = slice.reduce((a, b) => a + b, 0) / period;
      const meanDeviation = slice.reduce((sum, val) => sum + Math.abs(val - sma), 0) / period;
      
      const cci = (typicalPrices[i] - sma) / (0.015 * meanDeviation);
      result.push(cci);
    }
  }
  
  return result;
};

/**
 * Calculate Momentum
 */
export const calculateMomentum = (data: number[], period: number = 10): number[] => {
  const result: number[] = [];
  
  for (let i = 0; i < data.length; i++) {
    if (i < period) {
      result.push(NaN);
    } else {
      result.push(data[i] - data[i - period]);
    }
  }
  
  return result;
};

/**
 * Calculate Rate of Change (ROC)
 */
export const calculateROC = (data: number[], period: number = 12): number[] => {
  const result: number[] = [];
  
  for (let i = 0; i < data.length; i++) {
    if (i < period) {
      result.push(NaN);
    } else {
      const roc = ((data[i] - data[i - period]) / data[i - period]) * 100;
      result.push(roc);
    }
  }
  
  return result;
};

/**
 * Generate trading signal from RSI
 */
export const getRSISignal = (rsi: number): 'buy' | 'sell' | 'neutral' => {
  if (rsi < 30) return 'buy';
  if (rsi > 70) return 'sell';
  return 'neutral';
};

/**
 * Generate trading signal from MACD
 */
export const getMACDSignal = (macd: number, signal: number): 'buy' | 'sell' | 'neutral' => {
  if (macd > signal) return 'buy';
  if (macd < signal) return 'sell';
  return 'neutral';
};

/**
 * Generate trading signal from Stochastic
 */
export const getStochasticSignal = (k: number, d: number): 'buy' | 'sell' | 'neutral' => {
  if (k < 20 && k > d) return 'buy';
  if (k > 80 && k < d) return 'sell';
  return 'neutral';
};
