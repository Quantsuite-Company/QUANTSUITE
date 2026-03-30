/**
 * Risk Attribution & Factor Models
 * Decompose portfolio risk into systematic and idiosyncratic components
 */

interface FactorReturns {
  factors: string[];
  returns: number[][];
  cov: number[][];
}

interface FactorExposure {
  factor: string;
  exposure: number;
  contribution: number;
}

interface SystematicRisk {
  total: number;
  byFactor: Record<string, number>;
}

interface RiskDecomposition {
  systematic: SystematicRisk;
  idiosyncratic: number;
  totalRisk: number;
  factors: FactorExposure[];
  marginalContributions: Record<string, number>;
}

interface Portfolio {
  tickers: string[];
  weights: number[];
  returns: number[];
}

/**
 * Factor Risk Model
 * Using Fama-French style factor decomposition
 */
export class FactorRiskModel {
  private factors = ['Market', 'Size', 'Value', 'Momentum', 'Quality', 'LowVol'];

  /**
   * Decompose portfolio risk into factor exposures
   */
  decompose(portfolio: Portfolio, factorReturns: FactorReturns): RiskDecomposition {
    // Step 1: Estimate factor exposures via regression
    const exposures = this.estimateExposures(portfolio, factorReturns);

    // Step 2: Calculate systematic risk from factors
    const systematic = this.calculateSystematicRisk(exposures, factorReturns.cov);

    // Step 3: Calculate total portfolio risk
    const totalRisk = this.calculatePortfolioRisk(portfolio);

    // Step 4: Idiosyncratic risk (residual)
    const idiosyncratic = Math.sqrt(totalRisk ** 2 - systematic.total ** 2);

    // Step 5: Marginal contribution to risk
    const mctr = this.marginalContributionToRisk(portfolio, factorReturns);

    return {
      systematic,
      idiosyncratic,
      totalRisk,
      factors: exposures,
      marginalContributions: mctr,
    };
  }

  /**
   * Estimate factor exposures using multiple regression
   */
  private estimateExposures(
    portfolio: Portfolio,
    factorReturns: FactorReturns
  ): FactorExposure[] {
    const n = factorReturns.returns.length; // Time periods
    const k = factorReturns.factors.length; // Number of factors

    // Portfolio returns (weighted)
    const portfolioReturns = this.calculatePortfolioReturns(portfolio);

    // Regression: r_p = α + β₁f₁ + β₂f₂ + ... + βₖfₖ + ε
    const { betas, rSquared } = this.multipleRegression(
      portfolioReturns,
      factorReturns.returns
    );

    // Calculate risk contribution of each factor
    const factorContributions = this.calculateFactorContributions(
      betas,
      factorReturns.cov
    );

    return factorReturns.factors.map((factor, i) => ({
      factor,
      exposure: betas[i],
      contribution: factorContributions[i],
    }));
  }

  /**
   * Multiple regression to estimate betas
   */
  private multipleRegression(
    y: number[],
    X: number[][]
  ): { betas: number[]; rSquared: number } {
    const n = y.length;
    const k = X[0].length;

    // Add intercept column
    const Xaugmented = X.map(row => [1, ...row]);

    // Normal equation: β = (X'X)^(-1) X'y
    const XtX = this.matrixMultiply(this.transpose(Xaugmented), Xaugmented);
    const XtXinv = this.matrixInverse(XtX);
    const Xty = this.matrixVectorMultiply(this.transpose(Xaugmented), y);
    const betasWithIntercept = this.matrixVectorMultiply(XtXinv, Xty);

    // Remove intercept from betas
    const betas = betasWithIntercept.slice(1);

    // Calculate R²
    const yMean = y.reduce((sum, val) => sum + val, 0) / n;
    const yHat = X.map(row =>
      betasWithIntercept[0] + row.reduce((sum, val, i) => sum + val * betas[i], 0)
    );

    const ssTotal = y.reduce((sum, val) => sum + (val - yMean) ** 2, 0);
    const ssResidual = y.reduce((sum, val, i) => sum + (val - yHat[i]) ** 2, 0);
    const rSquared = 1 - ssResidual / ssTotal;

    return { betas, rSquared };
  }

  /**
   * Calculate systematic risk from factor exposures
   */
  private calculateSystematicRisk(
    exposures: FactorExposure[],
    factorCov: number[][]
  ): SystematicRisk {
    const k = exposures.length;
    const betas = exposures.map(e => e.exposure);

    // Systematic variance = β' Σ_f β
    let systematicVariance = 0;
    for (let i = 0; i < k; i++) {
      for (let j = 0; j < k; j++) {
        systematicVariance += betas[i] * betas[j] * factorCov[i][j];
      }
    }

    const systematicRisk = Math.sqrt(systematicVariance);

    // Risk by factor
    const byFactor: Record<string, number> = {};
    exposures.forEach((exp, i) => {
      // Marginal contribution of factor i
      let marginal = 0;
      for (let j = 0; j < k; j++) {
        marginal += betas[j] * factorCov[i][j];
      }
      byFactor[exp.factor] = (betas[i] * marginal) / systematicRisk;
    });

    return {
      total: systematicRisk,
      byFactor,
    };
  }

  /**
   * Calculate marginal contribution to risk (MCTR)
   */
  private marginalContributionToRisk(
    portfolio: Portfolio,
    factorReturns: FactorReturns
  ): Record<string, number> {
    const exposures = this.estimateExposures(portfolio, factorReturns);
    const mctr: Record<string, number> = {};

    const portfolioRisk = this.calculatePortfolioRisk(portfolio);

    // For each asset, calculate its marginal contribution
    portfolio.tickers.forEach((ticker, i) => {
      // Simplified: contribution = w_i * (∂σ_p / ∂w_i)
      // This is the marginal increase in risk from increasing weight of asset i
      const h = 0.01;
      const weightsUp = [...portfolio.weights];
      weightsUp[i] += h;

      const portfolioUp = { ...portfolio, weights: weightsUp };
      const riskUp = this.calculatePortfolioRisk(portfolioUp);

      mctr[ticker] = (riskUp - portfolioRisk) / h;
    });

    return mctr;
  }

  /**
   * Calculate portfolio returns
   */
  private calculatePortfolioReturns(portfolio: Portfolio): number[] {
    // Simplified: assuming returns is a 2D array where each row is a time period
    // and each column is an asset
    const n = portfolio.returns.length;
    const portfolioReturns: number[] = [];

    for (let t = 0; t < n; t++) {
      let ret = 0;
      portfolio.weights.forEach((w, i) => {
        ret += w * portfolio.returns[t];
      });
      portfolioReturns.push(ret);
    }

    return portfolioReturns;
  }

  /**
   * Calculate portfolio risk (standard deviation)
   */
  private calculatePortfolioRisk(portfolio: Portfolio): number {
    const returns = this.calculatePortfolioReturns(portfolio);
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance =
      returns.reduce((sum, r) => sum + (r - mean) ** 2, 0) / (returns.length - 1);
    return Math.sqrt(variance);
  }

  /**
   * Calculate factor contributions to risk
   */
  private calculateFactorContributions(
    betas: number[],
    factorCov: number[][]
  ): number[] {
    const k = betas.length;
    const contributions: number[] = Array(k).fill(0);

    for (let i = 0; i < k; i++) {
      for (let j = 0; j < k; j++) {
        contributions[i] += betas[i] * betas[j] * factorCov[i][j];
      }
    }

    return contributions.map(c => Math.sqrt(c));
  }

  // Matrix helper methods
  private transpose(matrix: number[][]): number[][] {
    return matrix[0].map((_, i) => matrix.map(row => row[i]));
  }

  private matrixMultiply(A: number[][], B: number[][]): number[][] {
    const rowsA = A.length;
    const colsA = A[0].length;
    const colsB = B[0].length;

    const result: number[][] = Array(rowsA)
      .fill(0)
      .map(() => Array(colsB).fill(0));

    for (let i = 0; i < rowsA; i++) {
      for (let j = 0; j < colsB; j++) {
        for (let k = 0; k < colsA; k++) {
          result[i][j] += A[i][k] * B[k][j];
        }
      }
    }

    return result;
  }

  private matrixVectorMultiply(A: number[][], v: number[]): number[] {
    return A.map(row => row.reduce((sum, val, i) => sum + val * v[i], 0));
  }

  private matrixInverse(matrix: number[][]): number[][] {
    // Simplified Gaussian elimination (use proper library in production)
    const n = matrix.length;
    const augmented = matrix.map((row, i) => [
      ...row,
      ...Array(n)
        .fill(0)
        .map((_, j) => (i === j ? 1 : 0)),
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

    return augmented.map(row => row.slice(n));
  }
}

/**
 * Export convenience function
 */
export function decomposeRisk(
  portfolio: Portfolio,
  factorReturns: FactorReturns
): RiskDecomposition {
  const model = new FactorRiskModel();
  return model.decompose(portfolio, factorReturns);
}
