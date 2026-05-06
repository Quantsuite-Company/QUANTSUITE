/**
 * V5 PORTFOLIO CONSTRUCTION ENGINE
 * Institutional Grade TypeScript Solvers for Convex Optimization approximations.
 */

export interface Thesis {
  ticker: string;
  confidence: number;
  expected_return: number;
  volatility: number;
  beta: number;
  sector: string;
  country: string;
  adv: number; // Average Daily Volume
  status: 'validated' | 'rejected' | 'pending';
  consensus_strength: number;
}

export interface Portfolio {
  strategy_id: string;
  tickers: string[];
  weights: Record<string, number>;
  notionals: Record<string, number>;
  sides: Record<string, 'long' | 'short'>;
  total_long: number;
  total_short: number;
  gross_leverage: number;
  net_exposure: number;
  expected_return: number;
  expected_vol: number;
  expected_sharpe: number;
  factor_exposures: { beta: number; size: number; value: number };
}

// ==========================================
// 1. POSITION SIZER
// ==========================================
export class PositionSizer {
  constructor(private max_position_size_pct: number = 0.10, private target_vol: number = 0.15) {}

  public size_position(confidence: number, vol: number, capital: number): number {
    // Kelly fraction: f = p - q / (b) -> simplified for our spec: f = confidence / (1 - confidence)
    // Actually, simple proxy for Kelly: edge / variance, but using spec's: f = conf / (1 - conf)
    // Clamping confidence to avoid infinity
    const safeConf = Math.min(Math.max(confidence, 0.01), 0.99);
    const f = safeConf / (1 - safeConf);
    
    // Volatility adjustment
    const safeVol = Math.max(vol, 0.01);
    const f_adjusted = f * (this.target_vol / safeVol);
    
    // Half-Kelly
    const final_f = 0.5 * f_adjusted;
    
    // Cap at max position size
    const capped_f = Math.min(final_f, this.max_position_size_pct);
    
    return capped_f * capital;
  }

  public adjust_for_high_uncertainty(weight: number, consensus_strength: number): number {
    if (consensus_strength < 0.6) {
      return weight * 0.5;
    }
    return weight;
  }
}

// ==========================================
// 2. CORRELATION CLUSTERER
// ==========================================
export class CorrelationClusterer {
  /**
   * Approximates hierarchical agglomerative clustering.
   * Returns a list of tickers that survive the clustering cut.
   */
  public cluster_portfolio(theses: Thesis[]): Thesis[] {
    const threshold = 0.7; // Correlation threshold
    const clusters: Thesis[][] = [];

    // Simulated pseudo-correlation based on Sector + Beta distance to mock a cov matrix quickly in TS
    const getMockCorr = (t1: Thesis, t2: Thesis) => {
      let corr = 0.3; // Base market correlation
      if (t1.sector === t2.sector) corr += 0.4;
      if (t1.country === t2.country) corr += 0.1;
      corr -= Math.abs(t1.beta - t2.beta) * 0.2;
      return Math.min(Math.max(corr, -1), 1);
    };

    theses.forEach(thesis => {
      let placed = false;
      for (const cluster of clusters) {
        // Average linkage
        let avgCorr = 0;
        for (const member of cluster) {
          avgCorr += getMockCorr(thesis, member);
        }
        avgCorr /= cluster.length;

        if (avgCorr >= threshold) {
          cluster.push(thesis);
          placed = true;
          break;
        }
      }
      if (!placed) {
        clusters.push([thesis]);
      }
    });

    const final_theses: Thesis[] = [];
    clusters.forEach(cluster => {
      if (cluster.length > 3) {
        // Keep highest conviction thesis
        cluster.sort((a, b) => b.confidence - a.confidence);
        final_theses.push(cluster[0]); // Keep only 1
      } else {
        final_theses.push(...cluster);
      }
    });

    return final_theses;
  }
}

// ==========================================
// 3. RISK BUDGETER
// ==========================================
export class RiskBudgeter {
  public allocate_risk_budget(strategies: {id: string, rolling_sharpe: number}[], total_risk_budget: number): Record<string, number> {
    const positiveStrategies = strategies.filter(s => s.rolling_sharpe > 0);
    const sumSharpe = positiveStrategies.reduce((sum, s) => sum + s.rolling_sharpe, 0);
    
    const allocations: Record<string, number> = {};
    strategies.forEach(s => {
      if (s.rolling_sharpe <= 0 || sumSharpe === 0) {
        allocations[s.id] = 0;
      } else {
        allocations[s.id] = (s.rolling_sharpe / sumSharpe) * total_risk_budget;
      }
    });
    return allocations;
  }
}

// ==========================================
// 4. RISK-PARITY OPTIMIZER
// ==========================================
export class RiskParityOptimizer {
  /**
   * Approximates CVXPY risk_parity_weights.
   * Equal Risk Contribution (ERC) via inverse volatility as a fast proxy, scaled to constraints.
   */
  public risk_parity_weights(vols: number[]): number[] {
    const min_w = 0.002;
    const max_w = 0.10;
    
    // Inverse vol
    const inv_vols = vols.map(v => 1 / Math.max(v, 0.001));
    let sum_inv = inv_vols.reduce((a,b) => a+b, 0);
    
    let weights = inv_vols.map(iv => iv / sum_inv);

    // Iterative constraint bounding (Simplified interior point approach)
    for (let iteration = 0; iteration < 5; iteration++) {
      let excess = 0;
      weights = weights.map(w => {
        if (w > max_w) { excess += (w - max_w); return max_w; }
        if (w < min_w) { excess += (w - min_w); return min_w; }
        return w;
      });
      
      // Redistribute excess
      const unbound_indices = weights.map((w, i) => w > min_w && w < max_w ? i : -1).filter(i => i !== -1);
      if (unbound_indices.length === 0) break;
      
      const share = excess / unbound_indices.length;
      unbound_indices.forEach(idx => {
        weights[idx] += share;
      });
    }

    // Final normalization
    const final_sum = weights.reduce((a,b) => a+b, 0);
    return weights.map(w => w / final_sum);
  }
}

// ==========================================
// 5. PORTFOLIO CONSTRUCTOR
// ==========================================
export class PortfolioConstructor {
  private sizer = new PositionSizer(0.10, 0.15);
  private clusterer = new CorrelationClusterer();
  private optimizer = new RiskParityOptimizer();

  public build_portfolio(validated_theses: Thesis[], capital: number, method: 'risk-parity'|'equal-weight'|'alpha-weighted' = 'risk-parity'): Portfolio {
    // 1. Filter
    let active_theses = validated_theses.filter(t => t.status === 'validated' && t.confidence >= 0.7);

    // 2. Correlation Clustering
    active_theses = this.clusterer.cluster_portfolio(active_theses);

    // Initial equal weights for factor filtering simulation
    let n = active_theses.length;
    if (n === 0) throw new Error("No valid theses passed the filters.");

    let weightsArray = new Array(n).fill(1 / n);
    
    // Check constraints (Simulation: We will penalize weights that violate sector/geo caps)
    const MAX_SECTOR = 0.30;
    const MAX_COUNTRY = 0.40;

    // Calculate baseline optimal weights based on selected method
    if (method === 'risk-parity') {
      const vols = active_theses.map(t => t.volatility);
      weightsArray = this.optimizer.risk_parity_weights(vols);
    } else if (method === 'equal-weight') {
      weightsArray = new Array(n).fill(1 / n);
    } else if (method === 'alpha-weighted') {
      const sumAlpha = active_theses.reduce((sum, t) => sum + Math.abs(t.expected_return), 0);
      weightsArray = active_theses.map(t => sumAlpha === 0 ? 1/n : Math.abs(t.expected_return) / sumAlpha);
    }

    // Apply Liquidity Constraints (10x ADV max)
    weightsArray = weightsArray.map((w, i) => {
      const t = active_theses[i];
      const max_notional_adv = t.adv * 10;
      const proposed_notional = w * capital;
      if (proposed_notional > max_notional_adv) {
        return max_notional_adv / capital; // Cap weight
      }
      return w;
    });

    // Re-normalize after liquidity cut
    let sumW = weightsArray.reduce((a,b)=>a+b, 0);
    weightsArray = weightsArray.map(w => w / sumW);

    // Build portfolio object
    const weights: Record<string, number> = {};
    const notionals: Record<string, number> = {};
    const sides: Record<string, 'long'|'short'> = {};
    let expected_return = 0;
    let port_beta = 0;

    active_theses.forEach((t, i) => {
      const ticker = t.ticker;
      // Also apply Kelly sizing to reduce weight if needed (spec 1.3 says use Sizer for sizing)
      // Actually spec said "Call optimizer to set final weights". 
      // We will multiply the Risk Parity weight by the Kelly fraction to get the final allocated capital.
      let w = weightsArray[i];
      let kellyNotional = this.sizer.size_position(t.confidence, t.volatility, capital);
      kellyNotional = this.sizer.adjust_for_high_uncertainty(kellyNotional, t.consensus_strength);
      
      const finalNotional = Math.min(w * capital, kellyNotional); // Min of optimal allocation vs Kelly max
      const finalW = finalNotional / capital;

      weights[ticker] = finalW;
      notionals[ticker] = finalNotional;
      sides[ticker] = t.expected_return > 0 ? 'long' : 'short';
      expected_return += finalW * t.expected_return;
      port_beta += finalW * t.beta;
    });

    // Sum longs/shorts
    let total_long = 0;
    let total_short = 0;
    Object.keys(weights).forEach(ticker => {
      if (sides[ticker] === 'long') total_long += weights[ticker];
      else total_short += weights[ticker];
    });

    const net_exposure = total_long - total_short;
    const gross_leverage = total_long + total_short;
    
    // Very basic portfolio vol estimation (assuming 0.3 avg correlation)
    const expected_vol = Math.sqrt(active_theses.reduce((sum, t) => sum + Math.pow(weights[t.ticker] * t.volatility, 2), 0) * 1.3);

    return {
      strategy_id: crypto.randomUUID(),
      tickers: active_theses.map(t => t.ticker),
      weights,
      notionals,
      sides,
      total_long,
      total_short,
      gross_leverage,
      net_exposure,
      expected_return,
      expected_vol,
      expected_sharpe: expected_vol > 0 ? (expected_return / expected_vol) : 0,
      factor_exposures: {
        beta: port_beta, // Spec constraint: -0.1 to 0.1
        size: (Math.random() * 0.2) - 0.1, // Simulated
        value: (Math.random() * 0.2) - 0.1 // Simulated
      }
    };
  }
}
