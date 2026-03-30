/**
 * Alpha Performance Metrics
 * Track Information Coefficient (IC), signal decay, and alpha health
 */

export interface AlphaMetrics {
  alphaId: string;
  ic: number; // Information Coefficient
  icStd: number; // IC standard deviation
  icSharpe: number; // IC / IC_std
  halfLife: number; // Signal decay half-life in days
  isHealthy: boolean; // Whether alpha is performing
}

export interface AlphaHistory {
  date: string;
  signals: { [ticker: string]: number };
  returns: { [ticker: string]: number };
}

/**
 * Calculate Information Coefficient (IC)
 * Correlation between predicted signals and realized returns
 */
export function calculateIC(
  signals: { [ticker: string]: number },
  returns: { [ticker: string]: number }
): number {
  const tickers = Object.keys(signals).filter(t => t in returns);
  
  if (tickers.length < 2) return 0;
  
  const signalValues = tickers.map(t => signals[t]);
  const returnValues = tickers.map(t => returns[t]);
  
  return spearmanCorrelation(signalValues, returnValues);
}

/**
 * Spearman rank correlation (more robust than Pearson)
 */
function spearmanCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length < 2) return 0;
  
  const n = x.length;
  
  // Convert to ranks
  const xRanks = getRanks(x);
  const yRanks = getRanks(y);
  
  // Calculate Pearson on ranks
  const xMean = xRanks.reduce((a, b) => a + b, 0) / n;
  const yMean = yRanks.reduce((a, b) => a + b, 0) / n;
  
  let num = 0;
  let xDenom = 0;
  let yDenom = 0;
  
  for (let i = 0; i < n; i++) {
    const xDiff = xRanks[i] - xMean;
    const yDiff = yRanks[i] - yMean;
    num += xDiff * yDiff;
    xDenom += xDiff * xDiff;
    yDenom += yDiff * yDiff;
  }
  
  if (xDenom === 0 || yDenom === 0) return 0;
  
  return num / Math.sqrt(xDenom * yDenom);
}

/**
 * Convert values to ranks
 */
function getRanks(values: number[]): number[] {
  const indexed = values.map((val, idx) => ({ val, idx }));
  indexed.sort((a, b) => a.val - b.val);
  
  const ranks = new Array(values.length);
  for (let i = 0; i < indexed.length; i++) {
    ranks[indexed[i].idx] = i + 1;
  }
  
  return ranks;
}

/**
 * Calculate rolling IC metrics for an alpha
 */
export function calculateAlphaMetrics(
  history: AlphaHistory[],
  alphaId: string,
  window: number = 60
): AlphaMetrics {
  if (history.length < 2) {
    return {
      alphaId,
      ic: 0,
      icStd: 0,
      icSharpe: 0,
      halfLife: 0,
      isHealthy: false,
    };
  }
  
  // Calculate IC for each period
  const icValues: number[] = [];
  
  for (let i = 1; i < history.length; i++) {
    const signals = history[i - 1].signals;
    const returns = history[i].returns;
    
    const ic = calculateIC(signals, returns);
    if (!isNaN(ic) && isFinite(ic)) {
      icValues.push(ic);
    }
  }
  
  // Take only recent window
  const recentICs = icValues.slice(-window);
  
  if (recentICs.length === 0) {
    return {
      alphaId,
      ic: 0,
      icStd: 0,
      icSharpe: 0,
      halfLife: 0,
      isHealthy: false,
    };
  }
  
  // Calculate statistics
  const meanIC = recentICs.reduce((a, b) => a + b, 0) / recentICs.length;
  const variance = recentICs.reduce((sum, ic) => sum + Math.pow(ic - meanIC, 2), 0) / recentICs.length;
  const stdIC = Math.sqrt(variance);
  const icSharpe = stdIC > 0 ? meanIC / stdIC : 0;
  
  // Calculate half-life (signal decay)
  const halfLife = calculateSignalHalfLife(recentICs);
  
  // Alpha is healthy if IC is positive and significant
  const isHealthy = meanIC > 0 && Math.abs(icSharpe) > 0.5;
  
  return {
    alphaId,
    ic: meanIC,
    icStd: stdIC,
    icSharpe,
    halfLife,
    isHealthy,
  };
}

/**
 * Calculate signal half-life (how fast signal decays)
 * Using autocorrelation approach
 */
function calculateSignalHalfLife(icValues: number[]): number {
  if (icValues.length < 10) return 1;
  
  // Calculate lag-1 autocorrelation
  let sumXY = 0;
  let sumX2 = 0;
  
  for (let i = 0; i < icValues.length - 1; i++) {
    sumXY += icValues[i] * icValues[i + 1];
    sumX2 += icValues[i] * icValues[i];
  }
  
  const autocorr = sumX2 > 0 ? sumXY / sumX2 : 0;
  
  // Half-life = -log(0.5) / log(autocorr)
  if (autocorr > 0 && autocorr < 1) {
    return -Math.log(0.5) / Math.log(autocorr);
  }
  
  return 1; // Default to 1 day
}

/**
 * Calculate adaptive weights based on IC performance
 */
export function calculateAdaptiveWeights(
  metricsMap: Map<string, AlphaMetrics>
): { [alphaId: string]: number } {
  const weights: { [alphaId: string]: number } = {};
  
  if (metricsMap.size === 0) return weights;
  
  // Use IC Sharpe ratio as weight (only positive values)
  let totalWeight = 0;
  
  for (const [alphaId, metrics] of metricsMap.entries()) {
    // Weight = IC * sqrt(|IC_Sharpe|) if healthy, else 0
    const weight = metrics.isHealthy 
      ? Math.max(0, metrics.ic * Math.sqrt(Math.abs(metrics.icSharpe)))
      : 0;
    
    weights[alphaId] = weight;
    totalWeight += weight;
  }
  
  // Normalize to sum to 1
  if (totalWeight > 0) {
    for (const alphaId of Object.keys(weights)) {
      weights[alphaId] = weights[alphaId] / totalWeight;
    }
  } else {
    // Fallback to equal weights if all alphas are unhealthy
    const equalWeight = 1 / metricsMap.size;
    for (const alphaId of metricsMap.keys()) {
      weights[alphaId] = equalWeight;
    }
  }
  
  return weights;
}
