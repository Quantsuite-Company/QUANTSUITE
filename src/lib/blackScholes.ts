// Black-Scholes Option Pricing Model Implementation

export interface BlackScholesParams {
  S: number;  // Current stock price
  K: number;  // Strike price
  T: number;  // Time to expiration (in years)
  r: number;  // Risk-free rate (as decimal, e.g., 0.05 for 5%)
  sigma: number; // Volatility (as decimal, e.g., 0.2 for 20%)
  q?: number; // Dividend yield (as decimal, default 0)
}

export interface OptionPrices {
  call: number;
  put: number;
}

export interface Greeks {
  delta: { call: number; put: number };
  gamma: number;
  theta: { call: number; put: number };
  vega: number;
  rho: { call: number; put: number };
}

export interface AdvancedGreeks extends Greeks {
  charm: { call: number; put: number }; // Delta decay over time
  color: number; // Gamma decay over time
  speed: number; // Rate of change of gamma
  zomma: number; // Rate of change of gamma with volatility
  ultima: number; // Rate of change of vega with volatility
  vanna: number; // Rate of change of delta with volatility
}

export interface BlackScholesResult {
  prices: OptionPrices;
  greeks: Greeks;
}

export interface AdvancedBlackScholesResult {
  prices: OptionPrices;
  greeks: AdvancedGreeks;
}

// Standard normal cumulative distribution function
function normCDF(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2.0);
  
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  
  return 0.5 * (1.0 + sign * y);
}

// Standard normal probability density function
function normPDF(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

// Calculate d1 and d2 parameters
function calculateD1D2(params: BlackScholesParams): { d1: number; d2: number } {
  const { S, K, T, r, sigma, q = 0 } = params;
  
  const d1 = (Math.log(S / K) + (r - q + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);
  
  return { d1, d2 };
}

// Main Black-Scholes pricing function
export function calculateBlackScholes(params: BlackScholesParams): BlackScholesResult {
  const { S, K, T, r, sigma, q = 0 } = params;
  
  // Handle edge cases
  if (T <= 0) {
    const callValue = Math.max(S - K, 0);
    const putValue = Math.max(K - S, 0);
    return {
      prices: { call: callValue, put: putValue },
      greeks: {
        delta: { call: S > K ? 1 : 0, put: S > K ? 0 : -1 },
        gamma: 0,
        theta: { call: 0, put: 0 },
        vega: 0,
        rho: { call: 0, put: 0 }
      }
    };
  }
  
  if (sigma <= 0) {
    const discountedStrike = K * Math.exp(-r * T);
    const callValue = Math.max(S - discountedStrike, 0);
    const putValue = Math.max(discountedStrike - S, 0);
    return {
      prices: { call: callValue, put: putValue },
      greeks: {
        delta: { call: S > discountedStrike ? 1 : 0, put: S > discountedStrike ? 0 : -1 },
        gamma: 0,
        theta: { call: 0, put: 0 },
        vega: 0,
        rho: { call: 0, put: 0 }
      }
    };
  }
  
  const { d1, d2 } = calculateD1D2(params);
  
  // Calculate option prices
  const Nd1 = normCDF(d1);
  const Nd2 = normCDF(d2);
  const NegD1 = normCDF(-d1);
  const NegD2 = normCDF(-d2);
  
  const callPrice = S * Math.exp(-q * T) * Nd1 - K * Math.exp(-r * T) * Nd2;
  const putPrice = K * Math.exp(-r * T) * NegD2 - S * Math.exp(-q * T) * NegD1;
  
  // Calculate Greeks
  const phi_d1 = normPDF(d1);
  const sqrtT = Math.sqrt(T);
  
  // Delta
  const callDelta = Math.exp(-q * T) * Nd1;
  const putDelta = Math.exp(-q * T) * (Nd1 - 1);
  
  // Gamma
  const gamma = (Math.exp(-q * T) * phi_d1) / (S * sigma * sqrtT);
  
  // Theta (per day)
  const callTheta = (
    -(S * phi_d1 * sigma * Math.exp(-q * T)) / (2 * sqrtT) -
    r * K * Math.exp(-r * T) * Nd2 +
    q * S * Math.exp(-q * T) * Nd1
  ) / 365;
  
  const putTheta = (
    -(S * phi_d1 * sigma * Math.exp(-q * T)) / (2 * sqrtT) +
    r * K * Math.exp(-r * T) * NegD2 -
    q * S * Math.exp(-q * T) * NegD1
  ) / 365;
  
  // Vega (per 1% volatility change)
  const vega = (S * Math.exp(-q * T) * phi_d1 * sqrtT) / 100;
  
  // Rho (per 1% interest rate change)
  const callRho = (K * T * Math.exp(-r * T) * Nd2) / 100;
  const putRho = (-K * T * Math.exp(-r * T) * NegD2) / 100;
  
  return {
    prices: { call: callPrice, put: putPrice },
    greeks: {
      delta: { call: callDelta, put: putDelta },
      gamma,
      theta: { call: callTheta, put: putTheta },
      vega,
      rho: { call: callRho, put: putRho }
    }
  };
}

// Implied volatility calculation using Newton-Raphson method
export function calculateImpliedVolatility(
  marketPrice: number,
  isCall: boolean,
  params: Omit<BlackScholesParams, 'sigma'>,
  maxIterations: number = 100,
  tolerance: number = 0.0001
): number {
  let sigma = 0.2; // Initial guess
  
  for (let i = 0; i < maxIterations; i++) {
    const fullParams = { ...params, sigma };
    const result = calculateBlackScholes(fullParams);
    const theoreticalPrice = isCall ? result.prices.call : result.prices.put;
    const vega = result.greeks.vega;
    
    const priceDiff = theoreticalPrice - marketPrice;
    
    if (Math.abs(priceDiff) < tolerance) {
      return sigma;
    }
    
    if (Math.abs(vega) < tolerance) {
      break; // Avoid division by zero
    }
    
    sigma = sigma - (priceDiff / (vega * 100)); // vega is per 1%, so multiply by 100
    
    // Keep sigma within reasonable bounds
    sigma = Math.max(0.001, Math.min(5, sigma));
  }
  
  return sigma;
}

// Generate explanations for beginners
export function generateExplanation(params: BlackScholesParams, result: BlackScholesResult): string {
  const { S, K, T } = params;
  const { call, put } = result.prices;
  const isITM = S > K;
  
  let explanation = `Based on current conditions:\n\n`;
  
  if (isITM) {
    explanation += `📈 The CALL option is "in-the-money" because the stock price ($${S.toFixed(2)}) is above the strike price ($${K.toFixed(2)}). `;
    explanation += `This call option has intrinsic value of $${(S - K).toFixed(2)} and is worth $${call.toFixed(2)} total.\n\n`;
    explanation += `📉 The PUT option is "out-of-the-money" and has no intrinsic value, but still worth $${put.toFixed(2)} due to time value.`;
  } else {
    explanation += `📉 The PUT option is "in-the-money" because the stock price ($${S.toFixed(2)}) is below the strike price ($${K.toFixed(2)}). `;
    explanation += `This put option has intrinsic value of $${(K - S).toFixed(2)} and is worth $${put.toFixed(2)} total.\n\n`;
    explanation += `📈 The CALL option is "out-of-the-money" and has no intrinsic value, but still worth $${call.toFixed(2)} due to time value.`;
  }
  
  explanation += `\n\n⏰ Time remaining: ${(T * 365).toFixed(0)} days until expiration.`;
  
  return explanation;
}

// Advanced Black-Scholes calculation with second and third order Greeks
export function calculateAdvancedBlackScholes(params: BlackScholesParams): AdvancedBlackScholesResult {
  const { S, K, T, r, sigma, q = 0 } = params;
  
  // Handle edge cases - same as basic Black-Scholes
  if (T <= 0) {
    const callValue = Math.max(S - K, 0);
    const putValue = Math.max(K - S, 0);
    return {
      prices: { call: callValue, put: putValue },
      greeks: {
        delta: { call: S > K ? 1 : 0, put: S > K ? 0 : -1 },
        gamma: 0,
        theta: { call: 0, put: 0 },
        vega: 0,
        rho: { call: 0, put: 0 },
        charm: { call: 0, put: 0 },
        color: 0,
        speed: 0,
        zomma: 0,
        ultima: 0,
        vanna: 0
      }
    };
  }
  
  if (sigma <= 0) {
    const discountedStrike = K * Math.exp(-r * T);
    const callValue = Math.max(S - discountedStrike, 0);
    const putValue = Math.max(discountedStrike - S, 0);
    return {
      prices: { call: callValue, put: putValue },
      greeks: {
        delta: { call: S > discountedStrike ? 1 : 0, put: S > discountedStrike ? 0 : -1 },
        gamma: 0,
        theta: { call: 0, put: 0 },
        vega: 0,
        rho: { call: 0, put: 0 },
        charm: { call: 0, put: 0 },
        color: 0,
        speed: 0,
        zomma: 0,
        ultima: 0,
        vanna: 0
      }
    };
  }
  
  const { d1, d2 } = calculateD1D2(params);
  const sqrtT = Math.sqrt(T);
  
  // Calculate option prices
  const Nd1 = normCDF(d1);
  const Nd2 = normCDF(d2);
  const NegD1 = normCDF(-d1);
  const NegD2 = normCDF(-d2);
  
  const callPrice = S * Math.exp(-q * T) * Nd1 - K * Math.exp(-r * T) * Nd2;
  const putPrice = K * Math.exp(-r * T) * NegD2 - S * Math.exp(-q * T) * NegD1;
  
  // Calculate standard Greeks
  const phi_d1 = normPDF(d1);
  const phi_d2 = normPDF(d2);
  
  // First order Greeks
  const callDelta = Math.exp(-q * T) * Nd1;
  const putDelta = Math.exp(-q * T) * (Nd1 - 1);
  
  const gamma = (Math.exp(-q * T) * phi_d1) / (S * sigma * sqrtT);
  
  const callTheta = (
    -(S * phi_d1 * sigma * Math.exp(-q * T)) / (2 * sqrtT) -
    r * K * Math.exp(-r * T) * Nd2 +
    q * S * Math.exp(-q * T) * Nd1
  ) / 365;
  
  const putTheta = (
    -(S * phi_d1 * sigma * Math.exp(-q * T)) / (2 * sqrtT) +
    r * K * Math.exp(-r * T) * NegD2 -
    q * S * Math.exp(-q * T) * NegD1
  ) / 365;
  
  const vega = (S * Math.exp(-q * T) * phi_d1 * sqrtT) / 100;
  
  const callRho = (K * T * Math.exp(-r * T) * Nd2) / 100;
  const putRho = (-K * T * Math.exp(-r * T) * NegD2) / 100;
  
  // Advanced Greeks (second and third order)
  
  // Charm - Delta decay over time
  const callCharm = Math.exp(-q * T) * phi_d1 * (
    (2 * (r - q) * T - d2 * sigma * sqrtT) / (2 * T * sigma * sqrtT)
  ) / 365;
  const putCharm = callCharm - Math.exp(-q * T) * phi_d1 / (365 * sigma * sqrtT);
  
  // Color - Gamma decay over time
  const color = Math.exp(-q * T) * phi_d1 / (2 * S * T * sigma * sqrtT) * (
    2 * q * T + 1 + (2 * (r - q) * T - d2 * sigma * sqrtT) * d1 / (sigma * sqrtT)
  ) / 365;
  
  // Speed - Rate of change of gamma with respect to underlying price
  const speed = -gamma / S * (d1 / (sigma * sqrtT) + 1);
  
  // Zomma - Rate of change of gamma with respect to volatility
  const zomma = gamma * (d1 * d2 - 1) / sigma;
  
  // Ultima - Rate of change of vega with respect to volatility
  const ultima = -vega / sigma * (d1 * d2 * (1 - d1 * d2) + d1 * d1 + d2 * d2) / 100;
  
  // Vanna - Rate of change of delta with respect to volatility
  const vanna = vega * d2 / (sigma * 100);
  
  return {
    prices: { call: callPrice, put: putPrice },
    greeks: {
      delta: { call: callDelta, put: putDelta },
      gamma,
      theta: { call: callTheta, put: putTheta },
      vega,
      rho: { call: callRho, put: putRho },
      charm: { call: callCharm, put: putCharm },
      color,
      speed,
      zomma,
      ultima,
      vanna
    }
  };
}
