/**
 * Credit Risk Models Library
 * Bloomberg-style DRSK (Default Risk) and MIBD (Market Implied Default) Models
 * Designed for retail traders with clear explanations
 */

// ============ TYPE DEFINITIONS ============

export interface CreditRiskInputs {
  // Company Identification
  companyName?: string;
  ticker?: string;
  sector?: string;
  
  // Market Data (from Bloomberg screenshot)
  sharePrice: number;         // Current share price
  marketCap: number;          // Market capitalization (in millions)
  priceVolatility1Y: number;  // 1-year price volatility (as decimal, e.g., 1.2258 = 122.58%)
  
  // Debt Structure
  shortTermDebt: number;      // Short-term debt (in millions)
  longTermDebt: number;       // Long-term debt (in millions)
  totalDebt: number;          // Total debt (in millions)
  
  // Cash Flow & Interest
  interestExpense: number;    // T12M interest expense (in millions)
  adjCFO: number;             // Adjusted Cash From Operations (in millions)
  
  // Additional Financials for Z-Score
  workingCapital?: number;    // Current assets - Current liabilities
  totalAssets?: number;
  retainedEarnings?: number;
  ebit?: number;              // Earnings Before Interest and Taxes
  bookEquity?: number;        // Book value of equity
  revenue?: number;           // Total revenue
  
  // Model Parameters
  riskFreeRate?: number;      // Default 5%
  timeHorizon?: number;       // 1, 3, or 5 years (default 1)
  recoveryRate?: number;      // Expected recovery in default (default 40%)
}

export interface CreditRiskOutputs {
  // DRSK Model Outputs
  defaultRating: string;              // DS1-DS10 scale
  defaultRatingLabel: string;         // "Investment Grade", "Speculative", etc.
  defaultProbability1Y: number;       // 1-year PD as percentage
  defaultProbability3Y: number;       // 3-year cumulative PD
  defaultProbability5Y: number;       // 5-year cumulative PD
  modelCDS5Y: number;                 // Model-implied 5Y CDS spread in bps
  distanceToDefault: number;          // Merton DD (standard deviations)
  
  // MIBD Model Outputs
  impliedPD: number;                  // Market-implied PD
  creditSpread: number;               // Implied credit spread in bps
  hazardRate: number;                 // Annual hazard rate
  
  // Risk Metrics
  debtToEquity: number;               // D/E ratio
  interestCoverage: number;           // EBIT / Interest Expense
  cashFlowAdequacy: number;           // Adj CFO / Total Debt
  liabToEbitda?: number;              // Total Liabilities / EBITDA
  
  // Altman Z-Score
  altmanZScore?: number;
  altmanZRating?: string;
  
  // LGD & EAD
  lgd: number;                        // Loss Given Default (1 - Recovery Rate)
  ead: number;                        // Exposure at Default
  expectedLoss: number;               // PD x LGD x EAD
  
  // Percentile Rankings (vs sector)
  percentiles: {
    debtToEquity: { value: number; p10: number; p50: number; p90: number };
    interestCoverage: { value: number; p10: number; p50: number; p90: number };
    roa: { value: number; p10: number; p50: number; p90: number };
    liabToEbitda: { value: number; p10: number; p50: number; p90: number };
    ebitToInterest: { value: number; p10: number; p50: number; p90: number };
  };
}

export interface DefaultRatingInfo {
  rating: string;
  label: string;
  description: string;
  color: string;
  pdRange: [number, number];
}

// ============ CONSTANTS ============

// Default sample data for the Credit Risk page
export const DEFAULT_INPUTS: CreditRiskInputs = {
  companyName: 'Sample Corp',
  ticker: 'SMPL',
  sector: 'Default',
  sharePrice: 14.20,
  marketCap: 61.10,
  priceVolatility1Y: 1.2258,
  shortTermDebt: 36.9,
  longTermDebt: 2299,
  totalDebt: 2336,
  interestExpense: 160.08,
  adjCFO: 66.95,
  riskFreeRate: 0.05,
  timeHorizon: 1,
  recoveryRate: 0.4,
};

export const DEFAULT_RATINGS: DefaultRatingInfo[] = [
  { rating: 'DS1', label: 'Investment Grade - Prime', description: 'Extremely low default risk, comparable to AAA/AA', color: 'hsl(142, 76%, 36%)', pdRange: [0, 0.1] },
  { rating: 'DS2', label: 'Investment Grade - High', description: 'Very low default risk, comparable to A', color: 'hsl(142, 70%, 45%)', pdRange: [0.1, 0.5] },
  { rating: 'DS3', label: 'Investment Grade - Upper Medium', description: 'Low default risk, comparable to BBB+', color: 'hsl(80, 60%, 45%)', pdRange: [0.5, 1.5] },
  { rating: 'DS4', label: 'Investment Grade - Lower Medium', description: 'Moderate-low risk, comparable to BBB-', color: 'hsl(60, 70%, 50%)', pdRange: [1.5, 3] },
  { rating: 'DS5', label: 'Speculative - Upper', description: 'Moderate risk, comparable to BB+', color: 'hsl(45, 93%, 47%)', pdRange: [3, 6] },
  { rating: 'DS6', label: 'Speculative - Middle', description: 'Substantial risk, comparable to BB', color: 'hsl(30, 90%, 50%)', pdRange: [6, 12] },
  { rating: 'DS7', label: 'Speculative - Lower', description: 'High risk, comparable to B+', color: 'hsl(20, 90%, 50%)', pdRange: [12, 20] },
  { rating: 'DS8', label: 'Highly Speculative', description: 'Very high risk, comparable to B-', color: 'hsl(10, 85%, 50%)', pdRange: [20, 35] },
  { rating: 'DS9', label: 'Extremely Speculative', description: 'Extreme default risk, comparable to CCC', color: 'hsl(0, 80%, 50%)', pdRange: [35, 60] },
  { rating: 'DS10', label: 'Default Imminent', description: 'Default is imminent or has occurred', color: 'hsl(0, 90%, 40%)', pdRange: [60, 100] },
];

// Sector benchmark type
interface SectorBenchmark {
  debtToEquity: { p10: number; p50: number; p90: number };
  interestCoverage: { p10: number; p50: number; p90: number };
  roa: { p10: number; p50: number; p90: number };
  liabToEbitda: { p10: number; p50: number; p90: number };
  ebitToInterest: { p10: number; p50: number; p90: number };
}

const DEFAULT_SECTOR_BENCHMARK: SectorBenchmark = {
  debtToEquity: { p10: 7.3, p50: 75, p90: 194.7 },
  interestCoverage: { p10: -3, p50: 5, p90: 11.3 },
  roa: { p10: -6.3, p50: 2, p90: 7.6 },
  liabToEbitda: { p10: 6.3, p50: 200, p90: 528 },
  ebitToInterest: { p10: -3, p50: 5, p90: 11.3 },
};

// Sector benchmark percentiles for comparison
export const SECTOR_BENCHMARKS: Record<string, SectorBenchmark> = {
  'Technology': { debtToEquity: { p10: 5, p50: 45, p90: 180 }, interestCoverage: { p10: 2, p50: 12, p90: 50 }, roa: { p10: -5, p50: 8, p90: 20 }, liabToEbitda: { p10: 50, p50: 250, p90: 600 }, ebitToInterest: { p10: 2, p50: 15, p90: 60 } },
  'Energy': { debtToEquity: { p10: 10, p50: 60, p90: 200 }, interestCoverage: { p10: -2, p50: 6, p90: 15 }, roa: { p10: -8, p50: 4, p90: 12 }, liabToEbitda: { p10: 80, p50: 350, p90: 700 }, ebitToInterest: { p10: -3, p50: 8, p90: 18 } },
  'Healthcare': { debtToEquity: { p10: 8, p50: 55, p90: 170 }, interestCoverage: { p10: 1, p50: 10, p90: 35 }, roa: { p10: -3, p50: 6, p90: 15 }, liabToEbitda: { p10: 60, p50: 280, p90: 550 }, ebitToInterest: { p10: 1, p50: 12, p90: 40 } },
  'Financials': { debtToEquity: { p10: 50, p50: 200, p90: 800 }, interestCoverage: { p10: 0.5, p50: 3, p90: 8 }, roa: { p10: 0.2, p50: 1.5, p90: 3 }, liabToEbitda: { p10: 300, p50: 1000, p90: 2500 }, ebitToInterest: { p10: 0.8, p50: 4, p90: 10 } },
  'Industrials': { debtToEquity: { p10: 12, p50: 70, p90: 220 }, interestCoverage: { p10: 0, p50: 7, p90: 20 }, roa: { p10: -4, p50: 5, p90: 12 }, liabToEbitda: { p10: 70, p50: 300, p90: 650 }, ebitToInterest: { p10: 0, p50: 9, p90: 25 } },
  'Consumer Discretionary': { debtToEquity: { p10: 15, p50: 80, p90: 250 }, interestCoverage: { p10: -1, p50: 8, p90: 25 }, roa: { p10: -6, p50: 4, p90: 14 }, liabToEbitda: { p10: 75, p50: 320, p90: 680 }, ebitToInterest: { p10: -1, p50: 10, p90: 30 } },
  'Default': DEFAULT_SECTOR_BENCHMARK,
};

// ============ UTILITY FUNCTIONS ============

/**
 * Standard Normal CDF (Phi function)
 */
export function normalCDF(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return 0.5 * (1.0 + sign * y);
}

/**
 * Inverse Normal CDF (Probit function) - Approximation
 */
export function normalInvCDF(p: number): number {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  if (p === 0.5) return 0;
  
  const a = [
    -3.969683028665376e+01, 2.209460984245205e+02,
    -2.759285104469687e+02, 1.383577518672690e+02,
    -3.066479806614716e+01, 2.506628277459239e+00
  ];
  const b = [
    -5.447609879822406e+01, 1.615858368580409e+02,
    -1.556989798598866e+02, 6.680131188771972e+01,
    -1.328068155288572e+01
  ];
  const c = [
    -7.784894002430293e-03, -3.223964580411365e-01,
    -2.400758277161838e+00, -2.549732539343734e+00,
    4.374664141464968e+00, 2.938163982698783e+00
  ];
  const d = [
    7.784695709041462e-03, 3.224671290700398e-01,
    2.445134137142996e+00, 3.754408661907416e+00
  ];

  const pLow = 0.02425;
  const pHigh = 1 - pLow;
  let q, r;

  if (p < pLow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) /
           ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
  } else if (p <= pHigh) {
    q = p - 0.5;
    r = q * q;
    return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q /
           (((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1);
  } else {
    q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) /
            ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
  }
}

// ============ DRSK MODEL (MERTON-BASED) ============

/**
 * Calculate Distance-to-Default using Merton Structural Model
 * DD = (ln(V/D) + (μ - 0.5σ²)T) / (σ√T)
 */
export function calculateDistanceToDefault(
  assetValue: number,
  debtValue: number,
  assetVolatility: number,
  driftRate: number,
  timeHorizon: number
): number {
  if (assetValue <= 0 || debtValue <= 0 || assetVolatility <= 0) {
    return 0;
  }
  
  const numerator = Math.log(assetValue / debtValue) + (driftRate - 0.5 * assetVolatility * assetVolatility) * timeHorizon;
  const denominator = assetVolatility * Math.sqrt(timeHorizon);
  
  return numerator / denominator;
}

/**
 * Convert Distance-to-Default to Default Probability
 * PD = N(-DD) where N is the standard normal CDF
 */
export function ddToDefaultProbability(distanceToDefault: number): number {
  return normalCDF(-distanceToDefault) * 100; // Return as percentage
}

/**
 * Estimate asset value and asset volatility from equity (simplified)
 * In practice, this requires iterative solving of the Merton model equations
 */
export function estimateAssetParameters(
  equityValue: number,
  equityVolatility: number,
  debtValue: number,
  riskFreeRate: number,
  timeHorizon: number
): { assetValue: number; assetVolatility: number } {
  // Simplified estimation: Asset Value ≈ Equity + Debt
  // Asset Volatility ≈ Equity Volatility * (E / (E + D))
  const assetValue = equityValue + debtValue;
  const leverageRatio = equityValue / assetValue;
  const assetVolatility = equityVolatility * leverageRatio;
  
  return { assetValue, assetVolatility };
}

/**
 * Map PD to Default Rating (DS1-DS10)
 */
export function pdToDefaultRating(pdPercent: number): DefaultRatingInfo {
  for (const rating of DEFAULT_RATINGS) {
    if (pdPercent >= rating.pdRange[0] && pdPercent < rating.pdRange[1]) {
      return rating;
    }
  }
  return DEFAULT_RATINGS[DEFAULT_RATINGS.length - 1]; // DS10 for extreme cases
}

/**
 * Calculate model-implied CDS spread from PD
 * Simplified: CDS ≈ PD × LGD × 10000 (in bps)
 */
export function pdToCDSSpread(pdPercent: number, lgd: number = 0.6): number {
  return (pdPercent / 100) * lgd * 10000;
}

// ============ MIBD MODEL (MARKET IMPLIED) ============

/**
 * Calculate market-implied default probability from CDS spread
 * PD ≈ CDS / (LGD × 10000)
 */
export function cdsToImpliedPD(cdsSpreadBps: number, lgd: number = 0.6): number {
  return (cdsSpreadBps / 10000) / lgd * 100;
}

/**
 * Calculate hazard rate from CDS spread
 * λ ≈ CDS / LGD
 */
export function cdsToHazardRate(cdsSpreadBps: number, lgd: number = 0.6): number {
  return (cdsSpreadBps / 10000) / lgd;
}

// ============ ALTMAN Z-SCORE ============

/**
 * Calculate Altman Z-Score for manufacturing companies
 * Z = 1.2X1 + 1.4X2 + 3.3X3 + 0.6X4 + 1.0X5
 */
export function calculateAltmanZScore(
  workingCapital: number,
  totalAssets: number,
  retainedEarnings: number,
  ebit: number,
  marketEquity: number,
  bookDebt: number,
  revenue: number
): { zScore: number; rating: string; interpretation: string } {
  if (totalAssets <= 0) {
    return { zScore: 0, rating: 'N/A', interpretation: 'Insufficient data' };
  }
  
  const X1 = workingCapital / totalAssets;
  const X2 = retainedEarnings / totalAssets;
  const X3 = ebit / totalAssets;
  const X4 = marketEquity / bookDebt;
  const X5 = revenue / totalAssets;
  
  const zScore = 1.2 * X1 + 1.4 * X2 + 3.3 * X3 + 0.6 * X4 + 1.0 * X5;
  
  let rating: string;
  let interpretation: string;
  
  if (zScore > 2.99) {
    rating = 'Safe Zone';
    interpretation = 'Low probability of bankruptcy';
  } else if (zScore >= 1.81) {
    rating = 'Grey Zone';
    interpretation = 'Some financial stress, needs monitoring';
  } else {
    rating = 'Distress Zone';
    interpretation = 'High probability of bankruptcy';
  }
  
  return { zScore, rating, interpretation };
}

// ============ LGD & EAD CALCULATIONS ============

export interface LGDInputs {
  seniority: 'senior_secured' | 'senior_unsecured' | 'subordinated' | 'junior';
  collateralType?: 'real_estate' | 'equipment' | 'receivables' | 'inventory' | 'unsecured';
  collateralValue?: number;
  exposureAmount?: number;
}

const SENIORITY_RECOVERY_RATES: Record<string, number> = {
  'senior_secured': 0.65,
  'senior_unsecured': 0.45,
  'subordinated': 0.30,
  'junior': 0.15,
};

const COLLATERAL_HAIRCUTS: Record<string, number> = {
  'real_estate': 0.25,
  'equipment': 0.40,
  'receivables': 0.30,
  'inventory': 0.50,
  'unsecured': 1.0,
};

export function calculateLGD(inputs: LGDInputs): { lgd: number; recoveryRate: number; explanation: string } {
  const baseRecovery = SENIORITY_RECOVERY_RATES[inputs.seniority] || 0.40;
  
  let adjustedRecovery = baseRecovery;
  let explanation = `Base recovery for ${inputs.seniority.replace('_', ' ')}: ${(baseRecovery * 100).toFixed(0)}%`;
  
  if (inputs.collateralType && inputs.collateralType !== 'unsecured' && inputs.collateralValue && inputs.exposureAmount) {
    const haircut = COLLATERAL_HAIRCUTS[inputs.collateralType] || 0.5;
    const collateralRecovery = (inputs.collateralValue * (1 - haircut)) / inputs.exposureAmount;
    adjustedRecovery = Math.min(0.95, baseRecovery + collateralRecovery * 0.5);
    explanation += `. Collateral (${inputs.collateralType}) adds ${(collateralRecovery * 50).toFixed(0)}% recovery`;
  }
  
  const lgd = 1 - adjustedRecovery;
  explanation += `. Final LGD: ${(lgd * 100).toFixed(0)}%`;
  
  return { lgd, recoveryRate: adjustedRecovery, explanation };
}

export function calculateEAD(
  drawnAmount: number,
  undrawnAmount: number,
  productType: 'term_loan' | 'revolver' | 'letter_of_credit' | 'derivative'
): { ead: number; ccf: number; explanation: string } {
  const ccfByProduct: Record<string, number> = {
    'term_loan': 1.0,      // Fully drawn
    'revolver': 0.75,      // Credit Conversion Factor
    'letter_of_credit': 0.50,
    'derivative': 0.15,
  };
  
  const ccf = ccfByProduct[productType] || 0.75;
  const ead = drawnAmount + (ccf * undrawnAmount);
  
  const explanation = `Drawn: $${drawnAmount.toFixed(0)}M + (${(ccf * 100).toFixed(0)}% × $${undrawnAmount.toFixed(0)}M undrawn) = $${ead.toFixed(2)}M EAD`;
  
  return { ead, ccf, explanation };
}

// ============ MAIN CALCULATOR ============

export function calculateCreditRisk(inputs: CreditRiskInputs): CreditRiskOutputs {
  const {
    sharePrice,
    marketCap,
    priceVolatility1Y,
    shortTermDebt,
    longTermDebt,
    totalDebt,
    interestExpense,
    adjCFO,
    workingCapital = 0,
    totalAssets = marketCap + totalDebt,
    retainedEarnings = 0,
    ebit = interestExpense * 2,
    bookEquity = marketCap * 0.8,
    revenue = marketCap * 1.5,
    riskFreeRate = 0.05,
    timeHorizon = 1,
    recoveryRate = 0.4,
    sector = 'Default',
  } = inputs;
  
  // Calculate asset parameters
  const equityValue = marketCap;
  const debtValue = totalDebt;
  const { assetValue, assetVolatility } = estimateAssetParameters(
    equityValue,
    priceVolatility1Y,
    debtValue,
    riskFreeRate,
    timeHorizon
  );
  
  // DRSK Model: Distance to Default
  const distanceToDefault = calculateDistanceToDefault(
    assetValue,
    debtValue,
    assetVolatility,
    riskFreeRate - 0.02, // Drift = risk-free rate - credit spread
    timeHorizon
  );
  
  // Default Probabilities
  const defaultProbability1Y = ddToDefaultProbability(distanceToDefault);
  const dd3Y = calculateDistanceToDefault(assetValue, debtValue, assetVolatility, riskFreeRate - 0.02, 3);
  const dd5Y = calculateDistanceToDefault(assetValue, debtValue, assetVolatility, riskFreeRate - 0.02, 5);
  const defaultProbability3Y = ddToDefaultProbability(dd3Y);
  const defaultProbability5Y = ddToDefaultProbability(dd5Y);
  
  // Default Rating
  const ratingInfo = pdToDefaultRating(defaultProbability1Y);
  
  // Model CDS spread
  const lgd = 1 - recoveryRate;
  const modelCDS5Y = pdToCDSSpread(defaultProbability5Y / 5, lgd); // Annualized
  
  // Risk Metrics
  const debtToEquity = (totalDebt / equityValue) * 100;
  const interestCoverage = interestExpense > 0 ? ebit / interestExpense : 999;
  const cashFlowAdequacy = totalDebt > 0 ? (adjCFO / totalDebt) * 100 : 999;
  const liabToEbitda = ebit > 0 ? (totalDebt / ebit) * 100 : 999;
  const roa = totalAssets > 0 ? (ebit / totalAssets) * 100 : 0;
  
  // Altman Z-Score
  const altmanResult = calculateAltmanZScore(
    workingCapital,
    totalAssets,
    retainedEarnings,
    ebit,
    equityValue,
    totalDebt,
    revenue
  );
  
  // MIBD: Market-implied metrics
  const impliedCreditSpread = modelCDS5Y; // Using model as proxy
  const hazardRate = cdsToHazardRate(impliedCreditSpread, lgd);
  const impliedPD = defaultProbability1Y;
  
  // LGD & EAD
  const ead = totalDebt;
  const expectedLoss = (defaultProbability1Y / 100) * lgd * ead;
  
  // Sector percentile rankings
  const benchmarks = SECTOR_BENCHMARKS[sector] || DEFAULT_SECTOR_BENCHMARK;
  
  const calculatePercentilePosition = (value: number, p10: number, p90: number): number => {
    if (value <= p10) return 0;
    if (value >= p90) return 100;
    return ((value - p10) / (p90 - p10)) * 100;
  };
  
  const percentiles = {
    debtToEquity: {
      value: debtToEquity,
      p10: benchmarks.debtToEquity.p10,
      p50: benchmarks.debtToEquity.p50,
      p90: benchmarks.debtToEquity.p90,
    },
    interestCoverage: {
      value: interestCoverage,
      p10: benchmarks.interestCoverage.p10,
      p50: benchmarks.interestCoverage.p50,
      p90: benchmarks.interestCoverage.p90,
    },
    roa: {
      value: roa,
      p10: benchmarks.roa.p10,
      p50: benchmarks.roa.p50,
      p90: benchmarks.roa.p90,
    },
    liabToEbitda: {
      value: liabToEbitda,
      p10: benchmarks.liabToEbitda.p10,
      p50: benchmarks.liabToEbitda.p50,
      p90: benchmarks.liabToEbitda.p90,
    },
    ebitToInterest: {
      value: interestCoverage,
      p10: benchmarks.ebitToInterest.p10,
      p50: benchmarks.ebitToInterest.p50,
      p90: benchmarks.ebitToInterest.p90,
    },
  };
  
  return {
    defaultRating: ratingInfo.rating,
    defaultRatingLabel: ratingInfo.label,
    defaultProbability1Y,
    defaultProbability3Y,
    defaultProbability5Y,
    modelCDS5Y,
    distanceToDefault,
    impliedPD,
    creditSpread: impliedCreditSpread,
    hazardRate,
    debtToEquity,
    interestCoverage,
    cashFlowAdequacy,
    liabToEbitda,
    altmanZScore: altmanResult.zScore,
    altmanZRating: altmanResult.rating,
    lgd,
    ead,
    expectedLoss,
    percentiles,
  };
}

// ============ HISTORICAL PD SIMULATION ============

export function generatePDHistory(
  currentPD: number,
  months: number = 24,
  volatility: number = 0.3
): Array<{ date: string; pd: number; rating: string }> {
  const history: Array<{ date: string; pd: number; rating: string }> = [];
  let pd = currentPD;
  
  const now = new Date();
  
  for (let i = months; i >= 0; i--) {
    const date = new Date(now);
    date.setMonth(date.getMonth() - i);
    
    // Random walk with mean reversion
    const randomShock = (Math.random() - 0.5) * volatility * pd;
    const meanReversion = (currentPD - pd) * 0.1;
    pd = Math.max(0.01, pd + randomShock + meanReversion);
    
    const rating = pdToDefaultRating(pd);
    
    history.push({
      date: date.toISOString().split('T')[0],
      pd: Math.round(pd * 100) / 100,
      rating: rating.rating,
    });
  }
  
  return history;
}

// ============ RATING DISTRIBUTION DATA ============

export function generateRatingDistribution(currentRating?: string): Array<{ rating: string; count: number; avgPD: number; isCurrentRating: boolean }> {
  const baseDistribution = [
    { rating: 'DS1', count: 15, avgPD: 0.05 },
    { rating: 'DS2', count: 22, avgPD: 0.3 },
    { rating: 'DS3', count: 35, avgPD: 1.0 },
    { rating: 'DS4', count: 48, avgPD: 2.2 },
    { rating: 'DS5', count: 42, avgPD: 4.5 },
    { rating: 'DS6', count: 28, avgPD: 9.0 },
    { rating: 'DS7', count: 18, avgPD: 16.0 },
    { rating: 'DS8', count: 12, avgPD: 27.0 },
    { rating: 'DS9', count: 6, avgPD: 45.0 },
    { rating: 'DS10', count: 3, avgPD: 75.0 },
  ];
  
  return baseDistribution.map(item => ({
    ...item,
    isCurrentRating: item.rating === currentRating,
  }));
}

// ============ SENSITIVITY ANALYSIS ============

export function generateSensitivityData(
  inputs: CreditRiskInputs,
  calculateFn: (inputs: CreditRiskInputs) => CreditRiskOutputs
): Array<{ change: string; changeNum: number; pd: number; rating: string; isCurrentPoint: boolean }> {
  const changes = [-40, -30, -20, -10, 0, 10, 20, 30, 40];
  
  return changes.map(change => {
    const adjustedInputs = {
      ...inputs,
      marketCap: inputs.marketCap * (1 + change / 100),
    };
    const result = calculateFn(adjustedInputs);
    return {
      change: `${change > 0 ? '+' : ''}${change}%`,
      changeNum: change,
      pd: result.defaultProbability1Y,
      rating: result.defaultRating,
      isCurrentPoint: change === 0,
    };
  });
}
