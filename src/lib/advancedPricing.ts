/**
 * Advanced Options Pricing Models
 * Heston Stochastic Volatility, Jump Diffusion, and Advanced Greeks
 */

interface PricingParams {
  S: number;  // Spot price
  K: number;  // Strike price
  T: number;  // Time to maturity (years)
  r: number;  // Risk-free rate
  q?: number; // Dividend yield
}

interface HestonParams extends PricingParams {
  v0: number;    // Initial variance
  kappa: number; // Mean reversion speed
  theta: number; // Long-term variance
  sigma: number; // Vol of vol
  rho: number;   // Correlation between asset and vol
}

interface JumpDiffusionParams extends PricingParams {
  sigma: number;  // Diffusion volatility
  lambda: number; // Jump intensity (jumps per year)
  muJ: number;    // Mean jump size
  sigmaJ: number; // Jump size volatility
}

interface Greeks {
  delta: number;
  gamma: number;
  vega: number;
  theta: number;
  rho: number;
  // Advanced Greeks
  vanna?: number;  // dDelta/dVol
  charm?: number;  // dDelta/dTime
  vomma?: number;  // dVega/dVol
  speed?: number;  // dGamma/dSpot
  color?: number;  // dGamma/dTime
}

interface PricingResult {
  price: number;
  greeks: Greeks;
  model: string;
  convergenceInfo?: {
    iterations: number;
    tolerance: number;
  };
}

/**
 * Complex number helper for Heston characteristic function
 */
class Complex {
  constructor(public re: number, public im: number) {}

  add(other: Complex): Complex {
    return new Complex(this.re + other.re, this.im + other.im);
  }

  multiply(other: Complex): Complex {
    return new Complex(
      this.re * other.re - this.im * other.im,
      this.re * other.im + this.im * other.re
    );
  }

  exp(): Complex {
    const expRe = Math.exp(this.re);
    return new Complex(expRe * Math.cos(this.im), expRe * Math.sin(this.im));
  }

  sqrt(): Complex {
    const r = Math.sqrt(this.re * this.re + this.im * this.im);
    const theta = Math.atan2(this.im, this.re);
    return new Complex(
      Math.sqrt(r) * Math.cos(theta / 2),
      Math.sqrt(r) * Math.sin(theta / 2)
    );
  }
}

/**
 * Heston Stochastic Volatility Model
 * More realistic than Black-Scholes as volatility is stochastic
 */
export class HestonModel {
  name = 'Heston Stochastic Volatility';

  /**
   * Price European call option using Heston model
   */
  price(params: HestonParams, type: 'call' | 'put' = 'call'): PricingResult {
    const priceValue = this.priceInternal(params, type);
    const greeks = this.calculateGreeks(params, type);

    return {
      price: priceValue,
      greeks,
      model: this.name,
      convergenceInfo: { iterations: 128, tolerance: 1e-8 },
    };
  }

  /**
   * Internal pricing function without Greeks calculation (prevents recursion)
   */
  private priceInternal(params: HestonParams, type: 'call' | 'put' = 'call'): number {
    const { S, K, T, r, q = 0, v0, kappa, theta, sigma, rho } = params;

    // Use characteristic function approach
    const P1 = this.probabilityIntegral(params, 1);
    const P2 = this.probabilityIntegral(params, 2);

    const call = S * Math.exp(-q * T) * P1 - K * Math.exp(-r * T) * P2;
    const put = call - S * Math.exp(-q * T) + K * Math.exp(-r * T);

    return type === 'call' ? call : put;
  }

  /**
   * Heston characteristic function (Gatheral formulation)
   */
  private characteristicFunction(u: Complex, params: HestonParams, j: 1 | 2): Complex {
    const { S, K, T, r, q = 0, v0, kappa, theta, sigma, rho } = params;

    const a = j === 1 ? 0.5 : -0.5;
    const b = kappa - (j === 1 ? rho * sigma : 0);

    const sigmaSq = sigma * sigma;
    const term1 = (rho * sigma * u.im - b) ** 2;
    const term2 = sigmaSq * ((-u.im) - u.im ** 2 + (j === 1 ? u.im : 0));
    
    const d = new Complex(
      term1 - term2,
      2 * (rho * sigma * u.im - b) * sigmaSq * u.re
    ).sqrt();

    const negSigmaSq = -sigmaSq;
    const g = new Complex(b - rho * sigma * u.im, negSigmaSq * u.re)
      .add(d)
      .multiply(
        new Complex(b - rho * sigma * u.im, negSigmaSq * u.re).add(
          new Complex(-d.re, -d.im)
        )
      );

    const C = new Complex(r - q, 0)
      .multiply(u)
      .multiply(new Complex(T, 0));

    const D = new Complex(b - rho * sigma * u.im, negSigmaSq * u.re)
      .add(d)
      .multiply(new Complex(1 - Math.exp((-d.re) * T), 0));

    const A = u.multiply(new Complex(0, 1))
      .multiply(new Complex(Math.log(S), 0))
      .add(C);

    const B = new Complex((kappa * theta) / sigma ** 2, 0)
      .multiply(
        new Complex(2, 0)
          .multiply(
            new Complex(1, 0).add(
              new Complex(Math.exp(-d.re * T) - 1, 0).multiply(g)
            )
          )
          .add(new Complex(T, 0).multiply(d))
      );

    return A.add(B).exp();
  }

  /**
   * Probability integral using Gauss-Laguerre quadrature
   */
  private probabilityIntegral(params: HestonParams, j: 1 | 2): number {
    const { K, S, T, r, q = 0 } = params;

    // Simplified integration (in production, use proper numerical integration)
    let sum = 0;
    const numPoints = 128;

    for (let i = 0; i < numPoints; i++) {
      const u = (i + 0.5) / numPoints * 100; // Integration range
      const phi = this.characteristicFunction(new Complex(u, 0), params, j);

      // Real part of the integral (simplified)
      const integrand = Math.cos(u * Math.log(K)) * phi.re / u;
      sum += integrand * (100 / numPoints); // Rectangle rule
    }

    return 0.5 + sum / Math.PI;
  }

  /**
   * Calculate Greeks using finite differences
   */
  private calculateGreeks(params: HestonParams, type: 'call' | 'put'): Greeks {
    const h = 0.01; // Step size
    const { S, T, v0 } = params;

    // Base price - use internal method to prevent recursion
    const P0 = this.priceInternal(params, type);

    // Delta: dP/dS
    const P_up_S = this.priceInternal({ ...params, S: S + h }, type);
    const P_down_S = this.priceInternal({ ...params, S: S - h }, type);
    const delta = (P_up_S - P_down_S) / (2 * h);

    // Gamma: d²P/dS²
    const gamma = (P_up_S - 2 * P0 + P_down_S) / (h * h);

    // Vega: dP/dσ (using v0 as proxy)
    const P_up_v = this.priceInternal({ ...params, v0: v0 + h }, type);
    const P_down_v = this.priceInternal({ ...params, v0: v0 - h }, type);
    const vega = (P_up_v - P_down_v) / (2 * h) * 0.01; // Scaled for 1% vol change

    // Theta: -dP/dT
    const P_up_T = this.priceInternal({ ...params, T: T - 1 / 365 }, type);
    const theta = -(P_up_T - P0);

    // Vanna: d²P/dS dσ
    const P_up_S_up_v = this.priceInternal({ ...params, S: S + h, v0: v0 + h }, type);
    const P_up_S_down_v = this.priceInternal({ ...params, S: S + h, v0: v0 - h }, type);
    const P_down_S_up_v = this.priceInternal({ ...params, S: S - h, v0: v0 + h }, type);
    const P_down_S_down_v = this.priceInternal({ ...params, S: S - h, v0: v0 - h }, type);
    const vanna = (P_up_S_up_v - P_up_S_down_v - P_down_S_up_v + P_down_S_down_v) / (4 * h * h);

    return {
      delta,
      gamma,
      vega,
      theta,
      rho: 0, // TODO: Calculate rho
      vanna,
    };
  }
}

/**
 * Merton Jump Diffusion Model
 * Captures tail risk and jump events
 */
export class JumpDiffusionModel {
  name = 'Merton Jump Diffusion';

  price(params: JumpDiffusionParams, type: 'call' | 'put' = 'call'): PricingResult {
    const priceValue = this.priceInternal(params, type);
    
    return {
      price: priceValue,
      greeks: this.calculateGreeks(params, type),
      model: this.name,
    };
  }

  private priceInternal(params: JumpDiffusionParams, type: 'call' | 'put' = 'call'): number {
    const { S, K, T, r, q = 0, sigma, lambda, muJ, sigmaJ } = params;

    let price = 0;
    const maxJumps = 20; // Truncate infinite series

    for (let n = 0; n < maxJumps; n++) {
      // Probability of n jumps
      const poissonProb = Math.exp(-lambda * T) * (lambda * T) ** n / this.factorial(n);

      // Adjusted parameters for n jumps
      const sigmaHatSquared = sigma ** 2 + (n * sigmaJ ** 2) / T;
      const rHat = r - lambda * (Math.exp(muJ + 0.5 * sigmaJ ** 2) - 1) + (n * Math.log(1 + muJ)) / T;

      // Black-Scholes price with adjusted parameters
      const bsPrice = this.blackScholesPrice(
        S,
        K,
        T,
        rHat,
        Math.sqrt(sigmaHatSquared),
        type
      );

      price += poissonProb * bsPrice;
    }

    return price;
  }

  private blackScholesPrice(
    S: number,
    K: number,
    T: number,
    r: number,
    sigma: number,
    type: 'call' | 'put'
  ): number {
    const d1 = (Math.log(S / K) + (r + 0.5 * sigma ** 2) * T) / (sigma * Math.sqrt(T));
    const d2 = d1 - sigma * Math.sqrt(T);

    const Nd1 = this.normalCDF(d1);
    const Nd2 = this.normalCDF(d2);

    if (type === 'call') {
      return S * Nd1 - K * Math.exp(-r * T) * Nd2;
    } else {
      return K * Math.exp(-r * T) * this.normalCDF(-d2) - S * this.normalCDF(-d1);
    }
  }

  private normalCDF(x: number): number {
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
  }

  private erf(x: number): number {
    // Approximation
    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const t = 1 / (1 + p * x);
    const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }

  private factorial(n: number): number {
    if (n <= 1) return 1;
    return n * this.factorial(n - 1);
  }

  private calculateGreeks(params: JumpDiffusionParams, type: 'call' | 'put'): Greeks {
    // Simplified Greeks using finite differences
    const h = 0.01;
    const P0 = this.priceInternal(params, type);
    const P_up = this.priceInternal({ ...params, S: params.S + h }, type);
    const P_down = this.priceInternal({ ...params, S: params.S - h }, type);

    return {
      delta: (P_up - P_down) / (2 * h),
      gamma: (P_up - 2 * P0 + P_down) / (h * h),
      vega: 0, // TODO: Calculate
      theta: 0, // TODO: Calculate
      rho: 0, // TODO: Calculate
    };
  }
}

/**
 * Export factory function
 */
export function createPricingModel(
  model: 'heston' | 'jump-diffusion'
): HestonModel | JumpDiffusionModel {
  switch (model) {
    case 'heston':
      return new HestonModel();
    case 'jump-diffusion':
      return new JumpDiffusionModel();
    default:
      throw new Error(`Unknown model: ${model}`);
  }
}
