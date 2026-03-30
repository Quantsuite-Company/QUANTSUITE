export type StrategyType = 'directional' | 'volatility' | 'income' | 'advanced';
export type MarketOutlook = 'bullish' | 'bearish' | 'neutral' | 'high-volatility' | 'low-volatility';
export type RiskLevel = 'low' | 'medium' | 'high';
export type OptionAction = 'buy' | 'sell';
export type OptionType = 'call' | 'put';

export interface StrategyLeg {
  action: OptionAction;
  type: OptionType;
  strikeOffset: number; // Offset from current price (0 = at current, positive = above, negative = below)
  quantity: number;
}

export interface StrategyTemplate {
  id: string;
  name: string;
  description: string;
  type: StrategyType;
  outlook: MarketOutlook[];
  riskLevel: RiskLevel;
  maxProfitType: 'limited' | 'unlimited';
  maxLossType: 'limited' | 'unlimited';
  legs: StrategyLeg[];
  useCases: string[];
  icon: string;
  idealConditions: string;
}

export const STRATEGY_TEMPLATES: StrategyTemplate[] = [
  // DIRECTIONAL STRATEGIES
  {
    id: 'long-call',
    name: 'Long Call',
    description: 'Buy a call option to profit from bullish price movement',
    type: 'directional',
    outlook: ['bullish'],
    riskLevel: 'medium',
    maxProfitType: 'unlimited',
    maxLossType: 'limited',
    legs: [{ action: 'buy', type: 'call', strikeOffset: 0, quantity: 1 }],
    useCases: ['Strong bullish view', 'Limited risk with unlimited upside'],
    icon: '📈',
    idealConditions: 'Expect significant upward price movement'
  },
  {
    id: 'long-put',
    name: 'Long Put',
    description: 'Buy a put option to profit from bearish price movement',
    type: 'directional',
    outlook: ['bearish'],
    riskLevel: 'medium',
    maxProfitType: 'limited',
    maxLossType: 'limited',
    legs: [{ action: 'buy', type: 'put', strikeOffset: 0, quantity: 1 }],
    useCases: ['Strong bearish view', 'Portfolio hedging'],
    icon: '📉',
    idealConditions: 'Expect significant downward price movement'
  },
  {
    id: 'bull-call-spread',
    name: 'Bull Call Spread',
    description: 'Buy option at current price, sell option above current price for limited profit and risk',
    type: 'directional',
    outlook: ['bullish'],
    riskLevel: 'low',
    maxProfitType: 'limited',
    maxLossType: 'limited',
    legs: [
      { action: 'buy', type: 'call', strikeOffset: 0, quantity: 1 },
      { action: 'sell', type: 'call', strikeOffset: 2, quantity: 1 }
    ],
    useCases: ['Moderate bullish view', 'Lower cost than long call'],
    icon: '🐂',
    idealConditions: 'Moderately bullish with controlled risk'
  },
  {
    id: 'bear-put-spread',
    name: 'Bear Put Spread',
    description: 'Buy option at current price, sell option below current price for limited profit and risk',
    type: 'directional',
    outlook: ['bearish'],
    riskLevel: 'low',
    maxProfitType: 'limited',
    maxLossType: 'limited',
    legs: [
      { action: 'buy', type: 'put', strikeOffset: 0, quantity: 1 },
      { action: 'sell', type: 'put', strikeOffset: -2, quantity: 1 }
    ],
    useCases: ['Moderate bearish view', 'Lower cost than long put'],
    icon: '🐻',
    idealConditions: 'Moderately bearish with controlled risk'
  },
  {
    id: 'covered-call',
    name: 'Covered Call',
    description: 'Sell option above current price against stock holding to generate income',
    type: 'income',
    outlook: ['neutral', 'bullish'],
    riskLevel: 'low',
    maxProfitType: 'limited',
    maxLossType: 'unlimited',
    legs: [{ action: 'sell', type: 'call', strikeOffset: 2, quantity: 1 }],
    useCases: ['Generate income on holdings', 'Neutral to slightly bullish'],
    icon: '🛡️',
    idealConditions: 'Own underlying stock, expect sideways to moderate upward movement'
  },
  
  // VOLATILITY STRATEGIES
  {
    id: 'long-straddle',
    name: 'Long Straddle',
    description: 'Buy call and put at current price to profit from high volatility',
    type: 'volatility',
    outlook: ['high-volatility'],
    riskLevel: 'medium',
    maxProfitType: 'unlimited',
    maxLossType: 'limited',
    legs: [
      { action: 'buy', type: 'call', strikeOffset: 0, quantity: 1 },
      { action: 'buy', type: 'put', strikeOffset: 0, quantity: 1 }
    ],
    useCases: ['Expect large price move', 'Before major news/events'],
    icon: '⚡',
    idealConditions: 'High volatility expected, direction uncertain'
  },
  {
    id: 'long-strangle',
    name: 'Long Strangle',
    description: 'Buy call and put away from current price for lower cost volatility play',
    type: 'volatility',
    outlook: ['high-volatility'],
    riskLevel: 'medium',
    maxProfitType: 'unlimited',
    maxLossType: 'limited',
    legs: [
      { action: 'buy', type: 'call', strikeOffset: 2, quantity: 1 },
      { action: 'buy', type: 'put', strikeOffset: -2, quantity: 1 }
    ],
    useCases: ['Lower cost than straddle', 'Expect very large move'],
    icon: '💥',
    idealConditions: 'Expect extreme volatility, lower premium than straddle'
  },
  {
    id: 'short-straddle',
    name: 'Short Straddle',
    description: 'Sell call and put at current price to profit from low volatility',
    type: 'volatility',
    outlook: ['low-volatility'],
    riskLevel: 'high',
    maxProfitType: 'limited',
    maxLossType: 'unlimited',
    legs: [
      { action: 'sell', type: 'call', strikeOffset: 0, quantity: 1 },
      { action: 'sell', type: 'put', strikeOffset: 0, quantity: 1 }
    ],
    useCases: ['Collect premium in range-bound market', 'High risk, high reward'],
    icon: '🎯',
    idealConditions: 'Low volatility expected, stock to stay near current price'
  },
  {
    id: 'short-strangle',
    name: 'Short Strangle',
    description: 'Sell call and put away from current price for income with wider breakevens',
    type: 'volatility',
    outlook: ['low-volatility'],
    riskLevel: 'high',
    maxProfitType: 'limited',
    maxLossType: 'unlimited',
    legs: [
      { action: 'sell', type: 'call', strikeOffset: 2, quantity: 1 },
      { action: 'sell', type: 'put', strikeOffset: -2, quantity: 1 }
    ],
    useCases: ['Wider profit range than short straddle', 'Lower premium collection'],
    icon: '🎪',
    idealConditions: 'Low volatility with wider safety margin'
  },
  
  // INCOME STRATEGIES
  {
    id: 'iron-condor',
    name: 'Iron Condor',
    description: 'Sell call and put spreads away from current price for range-bound income',
    type: 'income',
    outlook: ['neutral', 'low-volatility'],
    riskLevel: 'medium',
    maxProfitType: 'limited',
    maxLossType: 'limited',
    legs: [
      { action: 'buy', type: 'call', strikeOffset: 4, quantity: 1 },
      { action: 'sell', type: 'call', strikeOffset: 2, quantity: 1 },
      { action: 'sell', type: 'put', strikeOffset: -2, quantity: 1 },
      { action: 'buy', type: 'put', strikeOffset: -4, quantity: 1 }
    ],
    useCases: ['Best for range-bound markets', 'Defined risk income strategy'],
    icon: '🦅',
    idealConditions: 'Expect price to stay within range, low volatility'
  },
  {
    id: 'iron-butterfly',
    name: 'Iron Butterfly',
    description: 'Sell straddle at current price, buy call and put away for protection',
    type: 'income',
    outlook: ['neutral'],
    riskLevel: 'medium',
    maxProfitType: 'limited',
    maxLossType: 'limited',
    legs: [
      { action: 'buy', type: 'call', strikeOffset: 3, quantity: 1 },
      { action: 'sell', type: 'call', strikeOffset: 0, quantity: 1 },
      { action: 'sell', type: 'put', strikeOffset: 0, quantity: 1 },
      { action: 'buy', type: 'put', strikeOffset: -3, quantity: 1 }
    ],
    useCases: ['Higher premium than iron condor', 'Narrower profit range'],
    icon: '🦋',
    idealConditions: 'Expect minimal price movement around current level'
  },
  
  // ADVANCED STRATEGIES
  {
    id: 'butterfly-spread',
    name: 'Butterfly Spread',
    description: 'Buy option below price, sell 2 at current price, buy 1 above price for limited risk/reward',
    type: 'advanced',
    outlook: ['neutral'],
    riskLevel: 'low',
    maxProfitType: 'limited',
    maxLossType: 'limited',
    legs: [
      { action: 'buy', type: 'call', strikeOffset: -2, quantity: 1 },
      { action: 'sell', type: 'call', strikeOffset: 0, quantity: 2 },
      { action: 'buy', type: 'call', strikeOffset: 2, quantity: 1 }
    ],
    useCases: ['Very precise profit zone', 'Low cost, low risk'],
    icon: '🦋',
    idealConditions: 'Expect price to settle at specific level'
  },
  {
    id: 'calendar-spread',
    name: 'Calendar Spread',
    description: 'Sell near-term, buy longer-term at same strike',
    type: 'advanced',
    outlook: ['neutral', 'low-volatility'],
    riskLevel: 'medium',
    maxProfitType: 'limited',
    maxLossType: 'limited',
    legs: [
      { action: 'sell', type: 'call', strikeOffset: 0, quantity: 1 },
      { action: 'buy', type: 'call', strikeOffset: 0, quantity: 1 }
    ],
    useCases: ['Profit from time decay differential', 'Volatility plays'],
    icon: '📅',
    idealConditions: 'Near-term to decay faster, expect minimal price movement'
  }
];

export const getStrategyByType = (type: StrategyType): StrategyTemplate[] => {
  return STRATEGY_TEMPLATES.filter(s => s.type === type);
};

export const getStrategyByOutlook = (outlook: MarketOutlook): StrategyTemplate[] => {
  return STRATEGY_TEMPLATES.filter(s => s.outlook.includes(outlook));
};

export const getStrategyById = (id: string): StrategyTemplate | undefined => {
  return STRATEGY_TEMPLATES.find(s => s.id === id);
};
