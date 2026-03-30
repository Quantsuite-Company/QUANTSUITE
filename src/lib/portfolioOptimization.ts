/**
 * Portfolio Optimization Suite
 * Mean-Variance, Black-Litterman, Risk Parity, and Hierarchical Risk Parity
 */

export interface OptimizationConstraints {
  minWeight?: number;
  maxWeight?: number;
  maxTotalWeight?: number;
  targetReturn?: number;
  targetRisk?: number;
  longOnly?: boolean;
}

export interface OptimizationObjective {
  type: 'max_sharpe' | 'min_variance' | 'max_return' | 'risk_parity' | 'black_litterman';
  constraints: OptimizationConstraints;
  riskFreeRate?: number;
  views?: MarketView[];
}

export interface MarketView {
  asset: string;
  expectedReturn: number;
  confidence: number;
}

export interface PortfolioWeights {
  [ticker: string]: number;
}

export interface FrontierPoint {
  return: number;
  risk: number;
  sharpe: number;
  weights: PortfolioWeights;
}

export interface OptimizationResult {
  weights: PortfolioWeights;
  expectedReturn: number;
  expectedRisk: number;
  sharpeRatio: number;
  objective: string;
}

/**
 * Matrix operations helper
 */
class Matrix {
  constructor(public data: number[][]) {}

  static zeros(rows: number, cols: number): Matrix {
    return new Matrix(Array(rows).fill(0).map(() => Array(cols).fill(0)));
  }

  static identity(size: number): Matrix {
    const data = Array(size).fill(0).map(() => Array(size).fill(0));
    for (let i = 0; i < size; i++) {
      data[i][i] = 1;
    }
    return new Matrix(data);
  }

  transpose(): Matrix {
    const rows = this.data[0].length;
    const cols = this.data.length;
    const result = Matrix.zeros(rows, cols);
    
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        result.data[j][i] = this.data[i][j];
      }
    }
    return result;
  }

  multiply(other: Matrix): Matrix {
    const rows = this.data.length;
    const cols = other.data[0].length;
    const inner = this.data[0].length;
    const result = Matrix.zeros(rows, cols);

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        let sum = 0;
        for (let k = 0; k < inner; k++) {
          sum += this.data[i][k] * other.data[k][j];
        }
        result.data[i][j] = sum;
      }
    }
    return result;
  }

  inverse(): Matrix {
    // Simplified: Use Gaussian elimination (in production, use proper library)
    const n = this.data.length;
    const augmented = this.data.map((row, i) => [
      ...row,
      ...Array(n).fill(0).map((_, j) => (i === j ? 1 : 0)),
    ]);

    // Forward elimination
    for (let i = 0; i < n; i++) {
      let maxRow = i;
      for (let j = i + 1; j < n; j++) {
        if (Math.abs(augmented[j][i]) > Math.abs(augmented[maxRow][i])) {
          maxRow = j;
        }
      }
      [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];

      for (let j = i + 1; j < n; j++) {
        const factor = augmented[j][i] / augmented[i][i];
        for (let k = i; k < 2 * n; k++) {
          augmented[j][k] -= factor * augmented[i][k];
        }
      }
    }

    // Back substitution
    for (let i = n - 1; i >= 0; i--) {
      for (let j = i - 1; j >= 0; j--) {
        const factor = augmented[j][i] / augmented[i][i];
        for (let k = 0; k < 2 * n; k++) {
          augmented[j][k] -= factor * augmented[i][k];
        }
      }
      const divisor = augmented[i][i];
      for (let k = 0; k < 2 * n; k++) {
        augmented[i][k] /= divisor;
      }
    }

    return new Matrix(augmented.map(row => row.slice(n)));
  }
}

/**
 * Mean-Variance Portfolio Optimizer
 */
export class MeanVarianceOptimizer {
  /**
   * Optimize portfolio based on objective
   */
  optimize(
    returns: number[],
    covMatrix: number[][],
    objective: OptimizationObjective,
    tickers: string[]
  ): OptimizationResult {
    switch (objective.type) {
      case 'max_sharpe':
        return this.maximizeSharpe(returns, covMatrix, objective, tickers);
      case 'min_variance':
        return this.minimizeVariance(covMatrix, objective, tickers);
      case 'risk_parity':
        return this.riskParity(covMatrix, objective, tickers);
      case 'black_litterman':
        return this.blackLitterman(returns, covMatrix, objective, tickers);
      default:
        throw new Error(`Unknown objective: ${objective.type}`);
    }
  }

  /**
   * Maximum Sharpe Ratio Portfolio
   */
  private maximizeSharpe(
    returns: number[],
    covMatrix: number[][],
    objective: OptimizationObjective,
    tickers: string[]
  ): OptimizationResult {
    const rf = objective.riskFreeRate || 0;
    const n = returns.length;

    // Excess returns
    const excessReturns = returns.map(r => r - rf);

    // Inverse covariance matrix
    const covMat = new Matrix(covMatrix);
    const invCov = covMat.inverse();

    // Optimal weights: w* = Σ^(-1) * (μ - rf * 1)
    let weights: number[] = Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        weights[i] += invCov.data[i][j] * excessReturns[j];
      }
    }

    // Normalize weights
    const sumWeights = weights.reduce((sum, w) => sum + w, 0);
    weights = weights.map(w => w / sumWeights);

    // Apply constraints
    weights = this.applyConstraints(weights, objective.constraints);

    // Calculate metrics
    const expectedReturn = this.calculateExpectedReturn(weights, returns);
    const expectedRisk = this.calculateRisk(weights, covMatrix);
    const sharpeRatio = (expectedReturn - rf) / expectedRisk;

    const weightsObj: PortfolioWeights = {};
    tickers.forEach((ticker, i) => {
      weightsObj[ticker] = weights[i];
    });

    return {
      weights: weightsObj,
      expectedReturn,
      expectedRisk,
      sharpeRatio,
      objective: 'Maximum Sharpe Ratio',
    };
  }

  /**
   * Minimum Variance Portfolio
   */
  private minimizeVariance(
    covMatrix: number[][],
    objective: OptimizationObjective,
    tickers: string[]
  ): OptimizationResult {
    const n = covMatrix.length;
    const covMat = new Matrix(covMatrix);
    const invCov = covMat.inverse();

    // w* = Σ^(-1) * 1 / (1' Σ^(-1) 1)
    let weights: number[] = Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        weights[i] += invCov.data[i][j];
      }
    }

    const sumWeights = weights.reduce((sum, w) => sum + w, 0);
    weights = weights.map(w => w / sumWeights);

    weights = this.applyConstraints(weights, objective.constraints);

    const expectedRisk = this.calculateRisk(weights, covMatrix);

    const weightsObj: PortfolioWeights = {};
    tickers.forEach((ticker, i) => {
      weightsObj[ticker] = weights[i];
    });

    return {
      weights: weightsObj,
      expectedReturn: 0, // Not optimizing for return
      expectedRisk,
      sharpeRatio: 0,
      objective: 'Minimum Variance',
    };
  }

  /**
   * Risk Parity Portfolio
   * Each asset contributes equally to portfolio risk
   */
  private riskParity(
    covMatrix: number[][],
    objective: OptimizationObjective,
    tickers: string[]
  ): OptimizationResult {
    const n = covMatrix.length;
    
    // Start with equal weights
    let weights = Array(n).fill(1 / n);

    // Iterative optimization to equalize risk contributions
    const maxIter = 1000;
    const tolerance = 1e-6;

    for (let iter = 0; iter < maxIter; iter++) {
      const riskContributions = this.calculateRiskContributions(weights, covMatrix);
      const targetContribution = 1 / n;

      // Adjust weights based on deviation from target
      const adjustments = riskContributions.map(rc => targetContribution / rc);
      const newWeights = weights.map((w, i) => w * adjustments[i]);

      // Normalize
      const sum = newWeights.reduce((s, w) => s + w, 0);
      const normalizedWeights = newWeights.map(w => w / sum);

      // Check convergence
      const maxChange = Math.max(
        ...normalizedWeights.map((w, i) => Math.abs(w - weights[i]))
      );

      weights = normalizedWeights;

      if (maxChange < tolerance) break;
    }

    weights = this.applyConstraints(weights, objective.constraints);

    const expectedRisk = this.calculateRisk(weights, covMatrix);

    const weightsObj: PortfolioWeights = {};
    tickers.forEach((ticker, i) => {
      weightsObj[ticker] = weights[i];
    });

    return {
      weights: weightsObj,
      expectedReturn: 0,
      expectedRisk,
      sharpeRatio: 0,
      objective: 'Risk Parity',
    };
  }

  /**
   * Black-Litterman Model
   * Combines market equilibrium with investor views
   */
  private blackLitterman(
    returns: number[],
    covMatrix: number[][],
    objective: OptimizationObjective,
    tickers: string[]
  ): OptimizationResult {
    const views = objective.views || [];
    const tau = 0.05; // Scaling factor

    // Market equilibrium returns (implied returns)
    const marketWeights = Array(returns.length).fill(1 / returns.length);
    const lambda = 2.5; // Risk aversion coefficient
    const pi = this.calculateImpliedReturns(marketWeights, covMatrix, lambda);

    // Incorporate views (simplified)
    const blReturns = pi.map((piVal, i) => {
      const view = views.find(v => v.asset === tickers[i]);
      if (view) {
        // Weight by confidence
        return (1 - view.confidence) * piVal + view.confidence * view.expectedReturn;
      }
      return piVal;
    });

    // Optimize with BL returns
    return this.maximizeSharpe(blReturns, covMatrix, objective, tickers);
  }

  /**
   * Calculate implied returns from equilibrium
   */
  private calculateImpliedReturns(
    weights: number[],
    covMatrix: number[][],
    lambda: number
  ): number[] {
    // π = λ Σ w
    const n = weights.length;
    const pi: number[] = Array(n).fill(0);

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        pi[i] += lambda * covMatrix[i][j] * weights[j];
      }
    }

    return pi;
  }

  /**
   * Calculate risk contributions
   */
  private calculateRiskContributions(weights: number[], covMatrix: number[][]): number[] {
    const n = weights.length;
    const portfolioRisk = this.calculateRisk(weights, covMatrix);
    const contributions: number[] = Array(n).fill(0);

    for (let i = 0; i < n; i++) {
      let marginalRisk = 0;
      for (let j = 0; j < n; j++) {
        marginalRisk += covMatrix[i][j] * weights[j];
      }
      contributions[i] = (weights[i] * marginalRisk) / portfolioRisk;
    }

    return contributions;
  }

  /**
   * Apply portfolio constraints
   */
  private applyConstraints(weights: number[], constraints: OptimizationConstraints): number[] {
    const { minWeight = 0, maxWeight = 1, longOnly = true } = constraints;

    let adjusted = weights.map(w => {
      if (longOnly && w < 0) return 0;
      if (w < minWeight) return minWeight;
      if (w > maxWeight) return maxWeight;
      return w;
    });

    // Re-normalize
    const sum = adjusted.reduce((s, w) => s + w, 0);
    if (sum > 0) {
      adjusted = adjusted.map(w => w / sum);
    }

    return adjusted;
  }

  /**
   * Calculate expected return
   */
  private calculateExpectedReturn(weights: number[], returns: number[]): number {
    return weights.reduce((sum, w, i) => sum + w * returns[i], 0);
  }

  /**
   * Calculate portfolio risk (standard deviation)
   */
  private calculateRisk(weights: number[], covMatrix: number[][]): number {
    const n = weights.length;
    let variance = 0;

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        variance += weights[i] * weights[j] * covMatrix[i][j];
      }
    }

    return Math.sqrt(variance);
  }

  /**
   * Generate efficient frontier
   */
  efficientFrontier(
    returns: number[],
    covMatrix: number[][],
    tickers: string[],
    points: number = 50
  ): FrontierPoint[] {
    const frontier: FrontierPoint[] = [];

    // Min variance portfolio
    const minVar = this.minimizeVariance(covMatrix, { type: 'min_variance', constraints: { longOnly: true } }, tickers);

    // Max return portfolio
    const maxReturnWeights = returns.map((r, i) => 
      r === Math.max(...returns) ? 1 : 0
    );
    const maxRet = this.calculateExpectedReturn(maxReturnWeights, returns);

    // Generate points along frontier
    for (let i = 0; i < points; i++) {
      const targetReturn = minVar.expectedReturn + (i / points) * (maxRet - minVar.expectedReturn);
      
      const result = this.optimize(
        returns,
        covMatrix,
        {
          type: 'min_variance',
          constraints: { targetReturn, longOnly: true },
          riskFreeRate: 0,
        },
        tickers
      );

      frontier.push({
        return: result.expectedReturn,
        risk: result.expectedRisk,
        sharpe: result.sharpeRatio,
        weights: result.weights,
      });
    }

    return frontier;
  }
}

/**
 * Export convenience function
 */
export function optimizePortfolio(
  returns: number[],
  covMatrix: number[][],
  objective: OptimizationObjective,
  tickers: string[]
): OptimizationResult {
  const optimizer = new MeanVarianceOptimizer();
  return optimizer.optimize(returns, covMatrix, objective, tickers);
}
