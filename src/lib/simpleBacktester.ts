/**
 * Simple Backtester
 * Daily rebalancing, realistic fees & slippage
 */

export interface BacktestConfig {
  initialCapital: number;
  rebalanceFrequency: 'daily' | 'weekly' | 'monthly';
  feeRate: number;
  slippageRate: number;
}

export interface BacktestResult {
  dates: string[];
  equityCurve: number[];
  returns: number[];
  drawdown: number[];
  trades: Array<{
    date: string;
    ticker: string;
    weight: number;
    cost: number;
  }>;
  metrics: {
    totalReturn: number;
    annualizedReturn: number;
    annualizedVolatility: number;
    sharpeRatio: number;
    maxDrawdown: number;
    calmarRatio: number;
    winRate: number;
    totalTrades: number;
  };
}

export function runBacktest(
  portfolioWeightsByDate: { [date: string]: { [ticker: string]: number } },
  pricesByDate: { [date: string]: { [ticker: string]: number } },
  config: BacktestConfig
): BacktestResult {
  const dates = Object.keys(portfolioWeightsByDate).sort();
  const equityCurve: number[] = [config.initialCapital];
  const returns: number[] = [];
  const trades: BacktestResult['trades'] = [];
  
  let cash = config.initialCapital;
  let holdings: { [ticker: string]: number } = {};
  
  for (let i = 0; i < dates.length - 1; i++) {
    const date = dates[i];
    const nextDate = dates[i + 1];
    
    const targetWeights = portfolioWeightsByDate[date];
    const currentPrices = pricesByDate[date];
    const nextPrices = pricesByDate[nextDate];
    
    if (!currentPrices || !nextPrices) continue;
    
    // Calculate current holdings value
    const portfolioValue = Object.entries(holdings).reduce((sum, [ticker, shares]) => {
      const price = currentPrices[ticker] || 0;
      return sum + shares * price;
    }, 0) + cash;
    
    // Rebalance to target weights
    const newHoldings: { [ticker: string]: number } = {};
    let transactionCosts = 0;
    
    for (const [ticker, weight] of Object.entries(targetWeights)) {
      if (weight === 0) continue;
      
      const targetValue = portfolioValue * weight;
      const price = currentPrices[ticker];
      if (!price) continue;
      
      const targetShares = targetValue / price;
      const currentShares = holdings[ticker] || 0;
      const tradeShares = targetShares - currentShares;
      
      if (Math.abs(tradeShares) > 0) {
        const tradeCost = Math.abs(tradeShares) * price * (config.feeRate + config.slippageRate);
        transactionCosts += tradeCost;
        
        trades.push({
          date,
          ticker,
          weight,
          cost: tradeCost,
        });
      }
      
      newHoldings[ticker] = targetShares;
    }
    
    cash -= transactionCosts;
    holdings = newHoldings;
    
    // Calculate P&L from price changes
    let pnl = 0;
    for (const [ticker, shares] of Object.entries(holdings)) {
      const currentPrice = currentPrices[ticker] || 0;
      const nextPrice = nextPrices[ticker] || 0;
      pnl += shares * (nextPrice - currentPrice);
    }
    
    cash += pnl;
    
    // Calculate total portfolio value
    const newPortfolioValue = Object.entries(holdings).reduce((sum, [ticker, shares]) => {
      const price = nextPrices[ticker] || 0;
      return sum + shares * price;
    }, 0) + cash;
    
    equityCurve.push(newPortfolioValue);
    const dailyReturn = (newPortfolioValue - portfolioValue) / portfolioValue;
    returns.push(dailyReturn);
  }
  
  // Calculate drawdown
  const drawdown: number[] = [];
  let peak = equityCurve[0];
  for (const value of equityCurve) {
    peak = Math.max(peak, value);
    drawdown.push((value - peak) / peak);
  }
  
  // Calculate metrics
  const totalReturn = (equityCurve[equityCurve.length - 1] - config.initialCapital) / config.initialCapital;
  const tradingDays = returns.length;
  const annualizedReturn = Math.pow(1 + totalReturn, 252 / tradingDays) - 1;
  
  const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
  const annualizedVolatility = Math.sqrt(variance * 252);
  
  const sharpeRatio = annualizedVolatility > 0 ? annualizedReturn / annualizedVolatility : 0;
  const maxDrawdown = Math.min(...drawdown);
  const calmarRatio = maxDrawdown < 0 ? annualizedReturn / Math.abs(maxDrawdown) : 0;
  
  const winningTrades = returns.filter(r => r > 0).length;
  const winRate = returns.length > 0 ? winningTrades / returns.length : 0;
  
  return {
    dates: dates.slice(1),
    equityCurve,
    returns,
    drawdown,
    trades,
    metrics: {
      totalReturn,
      annualizedReturn,
      annualizedVolatility,
      sharpeRatio,
      maxDrawdown,
      calmarRatio,
      winRate,
      totalTrades: trades.length,
    },
  };
}
