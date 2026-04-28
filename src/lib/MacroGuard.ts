/**
 * V7 MACRO-GUARD — Black Swan Risk Gate
 * 
 * Functions:
 * 1. Fat-Tail Monte Carlo: Simulates 10k paths using Student-T distribution
 * 2. CVaR Reject Gate: Identifies extreme tail risks and drops the thesis
 * 3. Cross-Thesis Correlation: Prevents overallocation to highly correlated bets
 */

export interface BlackSwanRiskProfile {
  passed: boolean;
  var95: number;
  cvar95: number;
  maxDrawdownExtreme: number;   // 5th percentile outcome
  correlationPenalty: number;   // % reduction in Kelly sizing if correlated
  rejectionReason?: string;
}

// Generates random variable from Student-T distribution for fat tails
function randomStudentT(df: number = 3): number {
  let u1 = Math.random(), u2 = Math.random();
  let z0 = Math.sqrt(-2.0 * Math.log(u1 + 1e-9)) * Math.cos(2.0 * Math.PI * u2);
  let v = 0;
  
  // Ensure 'v' is never exactly zero to prevent division by zero (resulting in Infinity/-Infinity CVaR)
  while (v === 0) {
    for (let i = 0; i < Math.floor(df); i++) {
      let u = Math.random() * 2 - 1, v2 = Math.random() * 2 - 1;
      let s = u * u + v2 * v2;
      if (s > 0 && s <= 1) {
        let x = u * Math.sqrt(-2 * Math.log(s) / s);
        v += x * x;
      }
    }
    if (v === 0) v = 0.00001; // Failsafe
  }
  return z0 / Math.sqrt(v / df);
}

export function evaluateBlackSwanGate(
  prices: number[],
  historicalVols: number[],
  existingThesesPrices: Record<string, number[]> = {}
): BlackSwanRiskProfile {
  if (prices.length < 30) {
    return { passed: false, var95: 0, cvar95: 0, maxDrawdownExtreme: 0, correlationPenalty: 1, rejectionReason: "Insufficient data for stress test." };
  }

  // 1. Compute Historical Returns
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
  }
  const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const vol = Math.sqrt(returns.reduce((sum, r) => sum + (r - meanReturn) ** 2, 0) / returns.length);

  // 2. 10,000 Iteration Fat-Tail Monte Carlo
  const ITERATIONS = 10000;
  const DAYS_AHEAD = 60;
  let simulatedMaxDrawdowns: number[] = [];
  let terminalReturns: number[] = [];

  for (let i = 0; i < ITERATIONS; i++) {
    let p = prices[prices.length - 1];
    let peak = p;
    let maxDD = 0;
    
    for (let d = 0; d < DAYS_AHEAD; d++) {
      // Use Student-T (df=3) for fat-tails instead of normal distribution
      const shock = randomStudentT(3) * vol;
      p = p * (1 + meanReturn + shock);
      if (p > peak) peak = p;
      const dd = (peak - p) / peak;
      if (dd > maxDD) maxDD = dd;
    }
    
    simulatedMaxDrawdowns.push(maxDD);
    terminalReturns.push((p / prices[prices.length - 1]) - 1);
  }

  // Sort outcomes to find VaR and CVaR
  terminalReturns.sort((a, b) => a - b);
  simulatedMaxDrawdowns.sort((a, b) => b - a); // Highest DD first

  const var95Idx = Math.floor(ITERATIONS * 0.05); // Bottom 5%
  const var95 = terminalReturns[var95Idx];
  const cvar95 = terminalReturns.slice(0, var95Idx).reduce((a, b) => a + b, 0) / Math.max(1, var95Idx);
  const maxDrawdownExtreme = simulatedMaxDrawdowns[Math.floor(ITERATIONS * 0.05)]; 

  // Aggressive CVaR Rejection Criterion (>15% daily tail loss or extreme 45% overall DD)
  // Non-conservative risk limits adapted for high-alpha hedge fund behavior
  if (Math.abs(cvar95) > 0.15 || maxDrawdownExtreme > 0.45) {
    return {
      passed: false,
      var95,
      cvar95,
      maxDrawdownExtreme,
      correlationPenalty: 0,
      rejectionReason: `Black Swan Gate failed: Expected Shortfall (CVaR) is ${(cvar95 * 100).toFixed(2)}% (limit 15%). Extreme 5th percentile drawdown hit ${(maxDrawdownExtreme * 100).toFixed(2)}% (limit 45%).`
    };
  }

  // 3. Correlation Penalty
  let correlationPenalty = 1.0;
  if (Object.keys(existingThesesPrices).length > 0) {
    let maxCorr = 0;
    const basePrices = prices.slice(-60);
    
    for (const ticker in existingThesesPrices) {
      const otherPrices = existingThesesPrices[ticker].slice(-60);
      const n = Math.min(basePrices.length, otherPrices.length);
      if (n < 30) continue;

      let bRet = [], oRet = [];
      for(let i=1; i<n; i++) {
        bRet.push((basePrices[i] - basePrices[i-1])/basePrices[i-1]);
        oRet.push((otherPrices[i] - otherPrices[i-1])/otherPrices[i-1]);
      }
      
      const bMean = bRet.reduce((a,b)=>a+b,0)/bRet.length;
      const oMean = oRet.reduce((a,b)=>a+b,0)/oRet.length;
      
      let cov = 0, bVar = 0, oVar = 0;
      for(let i=0; i<bRet.length; i++){
        const bD = bRet[i] - bMean;
        const oD = oRet[i] - oMean;
        cov += bD * oD;
        bVar += bD * bD;
        oVar += oD * oD;
      }
      const corr = cov / (Math.sqrt(bVar) * Math.sqrt(oVar));
      if (Math.abs(corr) > maxCorr) maxCorr = Math.abs(corr);
    }

    if (maxCorr > 0.7) correlationPenalty = 0.5;
    else if (maxCorr > 0.5) correlationPenalty = 0.8;
  }

  return {
    passed: true,
    var95,
    cvar95,
    maxDrawdownExtreme,
    correlationPenalty
  };
}
