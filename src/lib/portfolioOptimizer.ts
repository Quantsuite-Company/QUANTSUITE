/**
 * Portfolio Construction & Risk Management
 * RenTech-style: risk parity, volatility targeting, strict constraints
 */

export interface PortfolioWeights {
  [ticker: string]: number;
}

export interface RiskConstraints {
  targetVolatility: number;
  maxPerAsset: number;
  maxTotalLeverage: number;
}

export interface SignalScore {
  ticker: string;
  score: number;
  signals: { [alphaId: string]: number };
}

/**
 * Combine multiple alpha signals into a single score
 * Using adaptive IC-weighted approach
 */
export function combineSignals(
  alphaScores: { [ticker: string]: { [alphaId: string]: number } },
  alphaWeights?: { [alphaId: string]: number }
): SignalScore[] {
  const results: SignalScore[] = [];
  
  for (const [ticker, signals] of Object.entries(alphaScores)) {
    let score = 0;
    let totalWeight = 0;
    
    for (const [alphaId, value] of Object.entries(signals)) {
      const weight = alphaWeights?.[alphaId] ?? 1.0;
      score += value * weight;
      totalWeight += weight;
    }
    
    score = totalWeight > 0 ? score / totalWeight : 0;
    
    results.push({ ticker, score, signals });
  }
  
  return results.sort((a, b) => b.score - a.score);
}

/**
 * Size positions based on volatility and constraints
 * Volatility parity approach
 */
export function sizePositions(
  signalScores: SignalScore[],
  volatilities: { [ticker: string]: number },
  constraints: RiskConstraints
): PortfolioWeights {
  const weights: PortfolioWeights = {};
  
  // Filter to positive signals only
  const positiveSignals = signalScores.filter(s => s.score > 0);
  
  if (positiveSignals.length === 0) {
    return weights;
  }
  
  // Calculate inverse volatility weights
  const invVolWeights: { [ticker: string]: number } = {};
  let totalInvVol = 0;
  
  for (const signal of positiveSignals) {
    const vol = volatilities[signal.ticker] || 0.01;
    const invVol = 1 / vol;
    invVolWeights[signal.ticker] = invVol * Math.abs(signal.score);
    totalInvVol += invVol * Math.abs(signal.score);
  }
  
  // Normalize to sum to 1
  for (const ticker of Object.keys(invVolWeights)) {
    let weight = invVolWeights[ticker] / totalInvVol;
    
    // Apply max per-asset constraint
    weight = Math.min(weight, constraints.maxPerAsset);
    
    weights[ticker] = weight;
  }
  
  // Normalize again after applying constraints
  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
  
  if (totalWeight > 0) {
    for (const ticker of Object.keys(weights)) {
      weights[ticker] = weights[ticker] / totalWeight;
      
      // Apply total leverage constraint
      weights[ticker] = Math.min(
        weights[ticker],
        constraints.maxTotalLeverage / Object.keys(weights).length
      );
    }
  }
  
  // Final normalization
  const finalTotal = Object.values(weights).reduce((sum, w) => sum + w, 0);
  if (finalTotal > 0) {
    for (const ticker of Object.keys(weights)) {
      weights[ticker] = weights[ticker] / finalTotal;
    }
  }
  
  return weights;
}

/**
 * Calculate portfolio metrics
 */
export function calculatePortfolioMetrics(weights: PortfolioWeights): {
  concentration: number;
  diversification: number;
  numPositions: number;
} {
  const values = Object.values(weights).filter(w => w > 0);
  const numPositions = values.length;
  
  // Herfindahl index (concentration)
  const concentration = values.reduce((sum, w) => sum + w * w, 0);
  
  // Diversification = 1 / concentration
  const diversification = numPositions > 0 ? 1 / concentration : 0;
  
  return {
    concentration,
    diversification,
    numPositions,
  };
}

/**
 * Estimate transaction costs
 */
export function estimateTransactionCosts(
  currentWeights: PortfolioWeights,
  targetWeights: PortfolioWeights,
  feeRate: number = 0.0005,
  slippageRate: number = 0.0005
): number {
  let totalCost = 0;
  
  const allTickers = new Set([
    ...Object.keys(currentWeights),
    ...Object.keys(targetWeights),
  ]);
  
  for (const ticker of allTickers) {
    const current = currentWeights[ticker] || 0;
    const target = targetWeights[ticker] || 0;
    const trade = Math.abs(target - current);
    
    totalCost += trade * (feeRate + slippageRate);
  }
  
  return totalCost;
}
