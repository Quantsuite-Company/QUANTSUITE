/**
 * Data Quality & Validation
 * Detect outliers, missing data, and quality issues
 */

export interface DataQualityReport {
  ticker: string;
  isValid: boolean;
  issues: string[];
  outliers: number;
  missingBars: number;
  totalBars: number;
}

export interface PriceBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Validate price data quality
 */
export function validatePriceData(
  ticker: string,
  data: PriceBar[]
): DataQualityReport {
  const report: DataQualityReport = {
    ticker,
    isValid: true,
    issues: [],
    outliers: 0,
    missingBars: 0,
    totalBars: data.length,
  };
  
  if (data.length < 10) {
    report.isValid = false;
    report.issues.push('Insufficient data points');
    return report;
  }
  
  // Check for missing bars (gaps in dates)
  const missingBars = detectMissingBars(data);
  report.missingBars = missingBars;
  if (missingBars > data.length * 0.1) {
    report.issues.push(`${missingBars} missing bars detected`);
  }
  
  // Check for price outliers (>10 sigma moves)
  const outliers = detectPriceOutliers(data);
  report.outliers = outliers.length;
  if (outliers.length > 0) {
    report.issues.push(`${outliers.length} price outliers detected`);
  }
  
  // Check for zero/negative prices
  const invalidPrices = data.filter(
    bar => bar.close <= 0 || bar.high <= 0 || bar.low <= 0 || bar.open <= 0
  );
  if (invalidPrices.length > 0) {
    report.isValid = false;
    report.issues.push(`${invalidPrices.length} invalid prices (zero/negative)`);
  }
  
  // Check for invalid OHLC relationships
  const invalidOHLC = data.filter(
    bar => bar.high < bar.low || 
           bar.close > bar.high || 
           bar.close < bar.low ||
           bar.open > bar.high ||
           bar.open < bar.low
  );
  if (invalidOHLC.length > 0) {
    report.issues.push(`${invalidOHLC.length} bars with invalid OHLC relationships`);
  }
  
  // Check for zero volume
  const zeroVolume = data.filter(bar => bar.volume === 0);
  if (zeroVolume.length > data.length * 0.5) {
    report.issues.push(`${zeroVolume.length} bars with zero volume`);
  }
  
  report.isValid = report.issues.length === 0;
  
  return report;
}

/**
 * Detect missing bars (gaps in trading days)
 */
function detectMissingBars(data: PriceBar[]): number {
  if (data.length < 2) return 0;
  
  const sortedData = [...data].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  let missingCount = 0;
  
  for (let i = 1; i < sortedData.length; i++) {
    const prevDate = new Date(sortedData[i - 1].date);
    const currDate = new Date(sortedData[i].date);
    
    const daysDiff = Math.floor(
      (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // Expect ~1 day between bars (accounting for weekends)
    // If gap > 5 days (week + weekend), likely missing data
    if (daysDiff > 5) {
      missingCount += Math.floor((daysDiff - 2) / 7) * 5; // Approximate weekdays
    }
  }
  
  return missingCount;
}

/**
 * Detect price outliers (>10 sigma daily returns)
 */
function detectPriceOutliers(data: PriceBar[]): number[] {
  if (data.length < 10) return [];
  
  // Calculate daily returns
  const returns: number[] = [];
  for (let i = 1; i < data.length; i++) {
    const ret = (data[i].close - data[i - 1].close) / data[i - 1].close;
    if (isFinite(ret)) {
      returns.push(ret);
    }
  }
  
  if (returns.length < 10) return [];
  
  // Calculate mean and std
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
  const std = Math.sqrt(variance);
  
  // Find outliers (>10 sigma)
  const outlierIndices: number[] = [];
  for (let i = 0; i < returns.length; i++) {
    const zScore = Math.abs((returns[i] - mean) / std);
    if (zScore > 10) {
      outlierIndices.push(i + 1); // +1 because returns start at index 1
    }
  }
  
  return outlierIndices;
}

/**
 * Clean price data (remove outliers, interpolate missing)
 */
export function cleanPriceData(
  data: PriceBar[],
  report: DataQualityReport
): PriceBar[] {
  if (report.isValid || data.length < 10) return data;
  
  let cleaned = [...data];
  
  // Remove bars with invalid OHLC
  cleaned = cleaned.filter(
    bar => bar.high >= bar.low && 
           bar.close <= bar.high && 
           bar.close >= bar.low &&
           bar.open <= bar.high &&
           bar.open >= bar.low &&
           bar.close > 0
  );
  
  // Sort by date
  cleaned.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // Cap extreme returns at 5 sigma
  for (let i = 1; i < cleaned.length; i++) {
    const ret = (cleaned[i].close - cleaned[i - 1].close) / cleaned[i - 1].close;
    
    if (Math.abs(ret) > 0.5) { // >50% move in one day is suspicious
      // Interpolate: average of prev and next
      if (i < cleaned.length - 1) {
        cleaned[i].close = (cleaned[i - 1].close + cleaned[i + 1].close) / 2;
        cleaned[i].open = cleaned[i].close;
        cleaned[i].high = Math.max(cleaned[i].close, cleaned[i - 1].close);
        cleaned[i].low = Math.min(cleaned[i].close, cleaned[i - 1].close);
      }
    }
  }
  
  return cleaned;
}

/**
 * Calculate data quality score (0-100)
 */
export function calculateQualityScore(report: DataQualityReport): number {
  if (report.totalBars === 0) return 0;
  
  let score = 100;
  
  // Penalize missing data
  const missingPct = report.missingBars / report.totalBars;
  score -= missingPct * 30;
  
  // Penalize outliers
  const outlierPct = report.outliers / report.totalBars;
  score -= outlierPct * 40;
  
  // Penalize issues
  score -= report.issues.length * 10;
  
  return Math.max(0, Math.min(100, score));
}
