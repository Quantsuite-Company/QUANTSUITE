import { calculateBlackScholes, BlackScholesParams } from './blackScholes';
import { StrategyLeg } from './optionsStrategies';

export interface PayoffPoint {
  price: number;
  pnl: number;
  atExpiration: number;
  days30: number;
  days60: number;
}

export interface StrategyMetrics {
  maxProfit: number;
  maxLoss: number;
  breakevens: number[];
  probabilityOfProfit: number;
  capitalRequired: number;
  riskRewardRatio: number;
  netDelta: number;
  netGamma: number;
  netTheta: number;
  netVega: number;
  netRho: number;
}

export interface LegDetails {
  action: 'buy' | 'sell';
  type: 'call' | 'put';
  strike: number;
  quantity: number;
  premium: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
}

export interface StrategyPosition {
  legs: LegDetails[];
  spotPrice: number;
  expiry: number;
  riskFreeRate: number;
  volatility: number;
}

// Calculate option payoff at expiration
export const calculateOptionPayoff = (
  type: 'call' | 'put',
  strike: number,
  premium: number,
  spotPrice: number,
  action: 'buy' | 'sell'
): number => {
  let intrinsicValue = 0;
  
  if (type === 'call') {
    intrinsicValue = Math.max(0, spotPrice - strike);
  } else {
    intrinsicValue = Math.max(0, strike - spotPrice);
  }
  
  const multiplier = action === 'buy' ? 1 : -1;
  return multiplier * (intrinsicValue - premium);
};

// Calculate position payoff at a specific price point
export const calculatePositionPayoff = (
  position: StrategyPosition,
  pricePoint: number,
  daysToExpiry?: number
): number => {
  let totalPayoff = 0;
  
  position.legs.forEach(leg => {
    if (daysToExpiry !== undefined && daysToExpiry > 0) {
      // Calculate value using Black-Scholes for time before expiration
      const params: BlackScholesParams = {
        S: pricePoint,
        K: leg.strike,
        T: daysToExpiry / 365,
        r: position.riskFreeRate,
        sigma: position.volatility,
        q: 0
      };
      
      const result = calculateBlackScholes(params);
      const currentValue = leg.type === 'call' ? result.prices.call : result.prices.put;
      const multiplier = leg.action === 'buy' ? 1 : -1;
      totalPayoff += multiplier * leg.quantity * (currentValue - leg.premium);
    } else {
      // Calculate payoff at expiration
      totalPayoff += leg.quantity * calculateOptionPayoff(
        leg.type,
        leg.strike,
        leg.premium,
        pricePoint,
        leg.action
      );
    }
  });
  
  return totalPayoff;
};

// Generate payoff curve data
export const generatePayoffCurve = (
  position: StrategyPosition,
  numPoints: number = 100
): PayoffPoint[] => {
  const strikes = position.legs.map(l => l.strike);
  const minStrike = Math.min(...strikes);
  const maxStrike = Math.max(...strikes);
  const range = maxStrike - minStrike;
  const startPrice = Math.max(0, minStrike - range * 0.5);
  const endPrice = maxStrike + range * 0.5;
  const step = (endPrice - startPrice) / (numPoints - 1);
  
  const points: PayoffPoint[] = [];
  
  for (let i = 0; i < numPoints; i++) {
    const price = startPrice + (step * i);
    points.push({
      price: Math.round(price * 100) / 100,
      pnl: calculatePositionPayoff(position, price),
      atExpiration: calculatePositionPayoff(position, price, 0),
      days30: calculatePositionPayoff(position, price, 30),
      days60: calculatePositionPayoff(position, price, 60)
    });
  }
  
  return points;
};

// Find breakeven points
const findBreakevens = (payoffCurve: PayoffPoint[]): number[] => {
  const breakevens: number[] = [];
  
  for (let i = 1; i < payoffCurve.length; i++) {
    const prev = payoffCurve[i - 1];
    const curr = payoffCurve[i];
    
    // Check if PnL crosses zero
    if ((prev.atExpiration < 0 && curr.atExpiration >= 0) || 
        (prev.atExpiration > 0 && curr.atExpiration <= 0)) {
      // Linear interpolation to find exact breakeven
      const ratio = Math.abs(prev.atExpiration) / (Math.abs(prev.atExpiration) + Math.abs(curr.atExpiration));
      const breakeven = prev.price + ratio * (curr.price - prev.price);
      breakevens.push(Math.round(breakeven * 100) / 100);
    }
  }
  
  return breakevens;
};

// Calculate strategy metrics
export const calculateStrategyMetrics = (position: StrategyPosition): StrategyMetrics => {
  const payoffCurve = generatePayoffCurve(position);
  
  // Max profit and loss
  const pnls = payoffCurve.map(p => p.atExpiration);
  const maxProfit = Math.max(...pnls);
  const maxLoss = Math.min(...pnls);
  
  // Breakeven points
  const breakevens = findBreakevens(payoffCurve);
  
  // Net Greeks
  let netDelta = 0, netGamma = 0, netTheta = 0, netVega = 0, netRho = 0;
  
  position.legs.forEach(leg => {
    const multiplier = leg.action === 'buy' ? 1 : -1;
    netDelta += multiplier * leg.quantity * leg.delta;
    netGamma += multiplier * leg.quantity * leg.gamma;
    netTheta += multiplier * leg.quantity * leg.theta;
    netVega += multiplier * leg.quantity * leg.vega;
    netRho += multiplier * leg.quantity * leg.rho;
  });
  
  // Capital required (sum of premiums paid)
  const capitalRequired = position.legs.reduce((sum, leg) => {
    if (leg.action === 'buy') {
      return sum + (leg.premium * leg.quantity);
    }
    return sum;
  }, 0);
  
  // Probability of profit (simplified using normal distribution)
  const currentPayoff = calculatePositionPayoff(position, position.spotPrice);
  const profitablePoints = payoffCurve.filter(p => p.atExpiration > 0).length;
  const probabilityOfProfit = (profitablePoints / payoffCurve.length) * 100;
  
  // Risk/Reward ratio
  const riskRewardRatio = maxLoss !== 0 ? Math.abs(maxProfit / maxLoss) : Infinity;
  
  return {
    maxProfit: Math.round(maxProfit * 100) / 100,
    maxLoss: Math.round(maxLoss * 100) / 100,
    breakevens,
    probabilityOfProfit: Math.round(probabilityOfProfit * 100) / 100,
    capitalRequired: Math.round(capitalRequired * 100) / 100,
    riskRewardRatio: Math.round(riskRewardRatio * 100) / 100,
    netDelta: Math.round(netDelta * 1000) / 1000,
    netGamma: Math.round(netGamma * 1000) / 1000,
    netTheta: Math.round(netTheta * 1000) / 1000,
    netVega: Math.round(netVega * 1000) / 1000,
    netRho: Math.round(netRho * 1000) / 1000
  };
};

// Build position from strategy template
export const buildPositionFromTemplate = (
  legs: StrategyLeg[],
  spotPrice: number,
  strikeInterval: number,
  expiry: number,
  riskFreeRate: number,
  volatility: number
): StrategyPosition => {
  const legDetails: LegDetails[] = legs.map(leg => {
    const strike = spotPrice + (leg.strikeOffset * strikeInterval);
    
    const params: BlackScholesParams = {
      S: spotPrice,
      K: strike,
      T: expiry / 365,
      r: riskFreeRate,
      sigma: volatility,
      q: 0
    };
    
    const result = calculateBlackScholes(params);
    const premium = leg.type === 'call' ? result.prices.call : result.prices.put;
    const greeks = {
      delta: leg.type === 'call' ? result.greeks.delta.call : result.greeks.delta.put,
      gamma: result.greeks.gamma,
      theta: leg.type === 'call' ? result.greeks.theta.call : result.greeks.theta.put,
      vega: result.greeks.vega,
      rho: leg.type === 'call' ? result.greeks.rho.call : result.greeks.rho.put
    };
    
    return {
      action: leg.action,
      type: leg.type,
      strike: Math.round(strike * 100) / 100,
      quantity: leg.quantity,
      premium: Math.round(premium * 100) / 100,
      delta: greeks.delta,
      gamma: greeks.gamma,
      theta: greeks.theta,
      vega: greeks.vega,
      rho: greeks.rho
    };
  });
  
  return {
    legs: legDetails,
    spotPrice,
    expiry,
    riskFreeRate,
    volatility
  };
};
