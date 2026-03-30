import { Position, UnifiedPosition } from './csvParser';

export interface PortfolioMetrics {
  totalPnL: number;
  winRate: number;
  profitFactor: number;
  capitalDeployed: number;
  currentValue: number;
  returnPercent: number;
  winningTrades: number;
  losingTrades: number;
  totalTrades: number;
  avgWin: number;
  avgLoss: number;
  largestWin: number;
  largestLoss: number;
}

export interface EquityVsOptions {
  equity: {
    count: number;
    capital: number;
    pnl: number;
    returnPercent: number;
  };
  options: {
    count: number;
    capital: number;
    pnl: number;
    returnPercent: number;
  };
}

export interface OptionDetails {
  index: string;
  expiry: string;
  strike: number;
  type: 'CE' | 'PE';
  original: string;
}

export interface RiskMetrics {
  concentrationIndex: number;
  largestPosition: number;
  largestPositionPercent: number;
  top3Percent: number;
}

// Overloaded version for UnifiedPosition
export const calculatePortfolioMetrics = (positions: Position[] | UnifiedPosition[]): PortfolioMetrics => {
  const totalPnL = positions.reduce((sum, p) => sum + p.pnl, 0);
  const capitalDeployed = positions.reduce((sum, p) => sum + (p.quantity * p.avgPrice), 0);
  const currentValue = positions.reduce((sum, p) => sum + (p.quantity * p.lastPrice), 0);
  
  const winners = positions.filter(p => p.pnl > 0);
  const losers = positions.filter(p => p.pnl < 0);
  
  const winningTrades = winners.length;
  const losingTrades = losers.length;
  const totalTrades = positions.length;
  
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
  
  const sumWins = winners.reduce((sum, p) => sum + p.pnl, 0);
  const sumLosses = Math.abs(losers.reduce((sum, p) => sum + p.pnl, 0));
  
  const profitFactor = sumLosses > 0 ? sumWins / sumLosses : sumWins > 0 ? Infinity : 0;
  
  const avgWin = winningTrades > 0 ? sumWins / winningTrades : 0;
  const avgLoss = losingTrades > 0 ? sumLosses / losingTrades : 0;
  
  const largestWin = winners.length > 0 ? Math.max(...winners.map(p => p.pnl)) : 0;
  const largestLoss = losers.length > 0 ? Math.min(...losers.map(p => p.pnl)) : 0;
  
  const returnPercent = capitalDeployed > 0 ? (totalPnL / capitalDeployed) * 100 : 0;

  return {
    totalPnL,
    winRate,
    profitFactor,
    capitalDeployed,
    currentValue,
    returnPercent,
    winningTrades,
    losingTrades,
    totalTrades,
    avgWin,
    avgLoss,
    largestWin,
    largestLoss
  };
};

export const calculateEquityVsOptions = (positions: Position[] | UnifiedPosition[]): EquityVsOptions => {
  const equityPositions = positions.filter(p => p.type === 'EQ' || p.type === 'CNC' || p.type === 'DELIVERY');
  const optionPositions = positions.filter(p => {
    const symbol = 'symbol' in p ? p.symbol : ('instrument' in p ? p.instrument : '');
    return p.type === 'OPT' || p.type === 'NFO' || symbol?.match(/\d{2}[A-Z]{3}\d+[CP]E/);
  });
  
  const calculateStats = (positions: (Position | UnifiedPosition)[]) => ({
    count: positions.length,
    capital: positions.reduce((sum, p) => sum + (p.quantity * p.avgPrice), 0),
    pnl: positions.reduce((sum, p) => sum + p.pnl, 0),
    returnPercent: 0
  });
  
  const equity = calculateStats(equityPositions);
  const options = calculateStats(optionPositions);
  
  equity.returnPercent = equity.capital > 0 ? (equity.pnl / equity.capital) * 100 : 0;
  options.returnPercent = options.capital > 0 ? (options.pnl / options.capital) * 100 : 0;
  
  return { equity, options };
};

export const parseOptionSymbol = (symbol: string): OptionDetails | null => {
  // Match patterns like BANKNIFTY23OCT40000CE or NIFTY24JAN21000PE
  const regex = /^([A-Z]+)(\d{2}[A-Z]{3})(\d+)(CE|PE)$/;
  const match = symbol.match(regex);
  
  if (!match) return null;
  
  return {
    index: match[1],
    expiry: match[2],
    strike: parseInt(match[3]),
    type: match[4] as 'CE' | 'PE',
    original: symbol
  };
};

export const detectStrategy = (positions: Position[]): string[] => {
  const strategies: string[] = [];
  const optionPositions = positions
    .map(p => ({ ...p, parsed: parseOptionSymbol(p.instrument) }))
    .filter(p => p.parsed !== null);
  
  // Group by expiry
  const byExpiry = optionPositions.reduce((acc, p) => {
    if (!p.parsed) return acc;
    const key = p.parsed.expiry;
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {} as Record<string, any[]>);
  
  // Detect strategies
  Object.entries(byExpiry).forEach(([expiry, positions]) => {
    const strikes = positions.map(p => p.parsed!.strike);
    const uniqueStrikes = [...new Set(strikes)];
    
    // Straddle: Same strike, both CE and PE
    uniqueStrikes.forEach(strike => {
      const atStrike = positions.filter(p => p.parsed!.strike === strike);
      const hasCE = atStrike.some(p => p.parsed!.type === 'CE');
      const hasPE = atStrike.some(p => p.parsed!.type === 'PE');
      if (hasCE && hasPE) {
        strategies.push(`Straddle at ${strike} (${expiry})`);
      }
    });
    
    // Spread: Consecutive strikes, same type
    const sortedStrikes = [...uniqueStrikes].sort((a, b) => a - b);
    for (let i = 0; i < sortedStrikes.length - 1; i++) {
      const lower = sortedStrikes[i];
      const upper = sortedStrikes[i + 1];
      
      const lowerPos = positions.filter(p => p.parsed!.strike === lower);
      const upperPos = positions.filter(p => p.parsed!.strike === upper);
      
      const ceSpread = lowerPos.some(p => p.parsed!.type === 'CE') && upperPos.some(p => p.parsed!.type === 'CE');
      const peSpread = lowerPos.some(p => p.parsed!.type === 'PE') && upperPos.some(p => p.parsed!.type === 'PE');
      
      if (ceSpread) strategies.push(`Call Spread ${lower}-${upper} (${expiry})`);
      if (peSpread) strategies.push(`Put Spread ${lower}-${upper} (${expiry})`);
    }
    
    // Directional bias
    const ceCount = positions.filter(p => p.parsed!.type === 'CE').length;
    const peCount = positions.filter(p => p.parsed!.type === 'PE').length;
    
    if (ceCount > peCount * 2) strategies.push(`Bullish bias (${expiry}): ${ceCount} Calls vs ${peCount} Puts`);
    if (peCount > ceCount * 2) strategies.push(`Bearish bias (${expiry}): ${peCount} Puts vs ${ceCount} Calls`);
  });
  
  return strategies;
};

export const calculateRiskMetrics = (positions: Position[] | UnifiedPosition[]): RiskMetrics => {
  const capitalByPosition = positions.map(p => p.quantity * p.avgPrice);
  const totalCapital = capitalByPosition.reduce((sum, c) => sum + c, 0);
  
  // Herfindahl Index
  const weights = capitalByPosition.map(c => c / totalCapital);
  const concentrationIndex = weights.reduce((sum, w) => sum + (w * w), 0);
  
  const largestPosition = Math.max(...capitalByPosition);
  const largestPositionPercent = totalCapital > 0 ? (largestPosition / totalCapital) * 100 : 0;
  
  // Top 3 concentration
  const sorted = [...capitalByPosition].sort((a, b) => b - a);
  const top3 = sorted.slice(0, 3).reduce((sum, c) => sum + c, 0);
  const top3Percent = totalCapital > 0 ? (top3 / totalCapital) * 100 : 0;
  
  return {
    concentrationIndex,
    largestPosition,
    largestPositionPercent,
    top3Percent
  };
};

export const detectAveraging = (positions: Position[]): Array<{
  instrument: string;
  instances: number;
  avgPriceRange: { min: number; max: number };
  totalQuantity: number;
  weightedAvg: number;
  type: 'averaging_down' | 'averaging_up' | 'multiple_entries';
}> => {
  // Group by instrument
  const grouped = positions.reduce((acc, p) => {
    if (!acc[p.instrument]) acc[p.instrument] = [];
    acc[p.instrument].push(p);
    return acc;
  }, {} as Record<string, Position[]>);
  
  return Object.entries(grouped)
    .filter(([_, positions]) => positions.length > 1)
    .map(([instrument, positions]) => {
      const prices = positions.map(p => p.avgPrice);
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      
      const totalQuantity = positions.reduce((sum, p) => sum + p.quantity, 0);
      const totalCost = positions.reduce((sum, p) => sum + (p.quantity * p.avgPrice), 0);
      const weightedAvg = totalCost / totalQuantity;
      
      let type: 'averaging_down' | 'averaging_up' | 'multiple_entries' = 'multiple_entries';
      if (positions.length === 2) {
        type = positions[1].avgPrice < positions[0].avgPrice ? 'averaging_down' : 'averaging_up';
      }
      
      return {
        instrument,
        instances: positions.length,
        avgPriceRange: { min, max },
        totalQuantity,
        weightedAvg,
        type
      };
    });
};

export const estimateCosts = (positions: Position[] | UnifiedPosition[]) => {
  let totalSTT = 0;
  let totalBrokerage = 0;
  
  positions.forEach(p => {
    const capital = p.quantity * p.avgPrice;
    const symbol = 'symbol' in p ? p.symbol : ('instrument' in p ? p.instrument : '');
    const isOption = p.type === 'OPT' || p.type === 'NFO' || symbol?.match(/\d{2}[A-Z]{3}\d+[CP]E/);
    
    // STT
    if (isOption) {
      totalSTT += capital * 0.0005; // 0.05% on options
    } else {
      totalSTT += capital * 0.001; // 0.1% on equity delivery
    }
    
    // Brokerage (Zerodha-like: ₹20 or 0.03%, whichever lower)
    if (isOption) {
      totalBrokerage += 20; // Flat ₹20 per options trade
    } else {
      totalBrokerage += Math.min(20, capital * 0.0003); // ₹20 or 0.03%
    }
  });
  
  return {
    stt: totalSTT * 2, // Buy + Sell
    brokerage: totalBrokerage * 2, // Buy + Sell
    total: (totalSTT + totalBrokerage) * 2
  };
};
