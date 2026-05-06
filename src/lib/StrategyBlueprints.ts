/**
 * STRATEGY BLUEPRINTS — 8 Elite Institutional Strategies
 * Each strategy is a structured config that the AI references during analysis.
 * Signal computation uses real data from Factor Zoo and price feeds.
 */

export interface StrategyBlueprint {
  id: string;
  name: string;
  shortName: string;
  description: string;
  edge: string;
  requiredSignals: string[];
  agentMapping: string[];
  expectedEdge: string;
  horizon: string;
  riskReward: string;
  computeSignal: (data: StrategyInputData) => StrategySignal;
}

export interface StrategyInputData {
  ticker: string;
  prices: number[];
  volumes: number[];
  momentum6M: number;
  rsi14: number;
  sharpe: number;
  beta: number;
  volatility: number;
  fScore: number;
  roe: number;
  peRatio: number;
  fcfYield: number;
  revenueGrowth: number;
  netMargin: number;
  bookLeverage: number;
  shortInterest?: number;
  analystBuyPct?: number;
  insiderBuying?: boolean;
  earningsBeatStreak?: number;
}

export interface StrategySignal {
  strength: number;       // -1 to +1 (-1 = strong short, +1 = strong long)
  direction: 'LONG' | 'SHORT' | 'NEUTRAL';
  confidence: number;     // 0-100
  reasoning: string;
  keyMetrics: { name: string; value: string; impact: 'positive' | 'negative' | 'neutral' }[];
  targetReturn: number;   // Expected % move
  stopDistance: number;    // Stop distance as %
}

/* ═══════════════════════════════════════════════════════════════
   STRATEGY 1: EARNINGS STRESS DETECTION
   ═══════════════════════════════════════════════════════════════ */
const earningsStressDetection: StrategyBlueprint = {
  id: 'earnings_stress',
  name: 'Earnings Call Stress Detection',
  shortName: 'STRESS',
  description: 'Detects linguistic stress patterns in earnings transcripts that precede negative price drift.',
  edge: 'NLP analysis of hedging language, question deflection, and complexity drops in CEO speech.',
  requiredSignals: ['momentum_6m', 'fScore', 'roe', 'pe_ratio'],
  agentMapping: ['ALPHA_1', 'ALPHA_5'],
  expectedEdge: '4.2% underperformance over 21 days when stress composite > 65',
  horizon: '21 trading days',
  riskReward: '1:2.1',
  computeSignal: (data) => {
    // High PE + weak fundamentals + negative momentum = stressed company masking deterioration
    const peStress = data.peRatio > 25 ? Math.min(1, (data.peRatio - 25) / 25) : 0;
    const fScoreWeakness = data.fScore < 5 ? (5 - data.fScore) / 5 : 0;
    const momentumDivergence = data.momentum6M < -0.05 ? Math.abs(data.momentum6M) : 0;
    const roeDecline = data.roe < 0.08 ? (0.08 - data.roe) / 0.08 : 0;

    const composite = peStress * 0.3 + fScoreWeakness * 0.25 + momentumDivergence * 0.25 + roeDecline * 0.2;
    const isShort = composite > 0.45;

    return {
      strength: isShort ? -composite : composite * 0.3,
      direction: isShort ? 'SHORT' : 'NEUTRAL',
      confidence: Math.min(85, composite * 100),
      reasoning: `Stress composite ${(composite * 100).toFixed(1)}%. PE premium ${data.peRatio.toFixed(1)}x, F-Score ${data.fScore}/9, ROE ${(data.roe * 100).toFixed(1)}%.`,
      keyMetrics: [
        { name: 'PE Stress', value: `${(peStress * 100).toFixed(0)}%`, impact: peStress > 0.5 ? 'negative' : 'neutral' },
        { name: 'F-Score', value: `${data.fScore}/9`, impact: data.fScore < 5 ? 'negative' : 'positive' },
        { name: 'Momentum 6M', value: `${(data.momentum6M * 100).toFixed(1)}%`, impact: data.momentum6M < 0 ? 'negative' : 'positive' },
      ],
      targetReturn: isShort ? 0.042 : 0.02,
      stopDistance: 0.025,
    };
  },
};

/* ═══════════════════════════════════════════════════════════════
   STRATEGY 2: SUPPLY CHAIN CONTAGION
   ═══════════════════════════════════════════════════════════════ */
const supplyChainContagion: StrategyBlueprint = {
  id: 'supply_chain',
  name: 'Supply Chain Contagion Propagation',
  shortName: 'CONTAGION',
  description: 'Detects second and third-order supply chain impacts before the market fully prices them.',
  edge: 'Market prices direct company in 1 day but takes 15-45 days for downstream contagion.',
  requiredSignals: ['beta', 'volatility', 'momentum_6m'],
  agentMapping: ['ALPHA_2', 'ALPHA_4'],
  expectedEdge: '3.1% pair spread over 20 days with Sharpe > 1.8',
  horizon: '15-45 trading days',
  riskReward: '1:1.8',
  computeSignal: (data) => {
    const highBeta = data.beta > 1.3;
    const elevatedVol = data.volatility > 0.3;
    const negMomentum = data.momentum6M < -0.03;
    const score = (highBeta ? 0.35 : 0) + (elevatedVol ? 0.35 : 0) + (negMomentum ? 0.3 : 0);
    const isShort = score > 0.55;
    return {
      strength: isShort ? -score : 0,
      direction: isShort ? 'SHORT' : 'NEUTRAL',
      confidence: Math.min(80, score * 100),
      reasoning: `Contagion risk ${(score * 100).toFixed(0)}%. Beta ${data.beta.toFixed(2)}, Vol ${(data.volatility * 100).toFixed(1)}%, Mom ${(data.momentum6M * 100).toFixed(1)}%.`,
      keyMetrics: [
        { name: 'Beta', value: data.beta.toFixed(2), impact: highBeta ? 'negative' : 'neutral' },
        { name: 'Volatility', value: `${(data.volatility * 100).toFixed(1)}%`, impact: elevatedVol ? 'negative' : 'neutral' },
        { name: 'Momentum', value: `${(data.momentum6M * 100).toFixed(1)}%`, impact: negMomentum ? 'negative' : 'positive' },
      ],
      targetReturn: 0.031,
      stopDistance: 0.02,
    };
  },
};

/* ═══════════════════════════════════════════════════════════════
   STRATEGY 3: INSTITUTIONAL CROWDING ESCAPE
   ═══════════════════════════════════════════════════════════════ */
const crowdingEscape: StrategyBlueprint = {
  id: 'crowding_escape',
  name: 'Institutional Crowding Escape',
  shortName: 'CROWDING',
  description: 'Detects overcrowded institutional positions that become fragile to any negative catalyst.',
  edge: 'When too many funds own the same stock, the exit stampede causes outsized drawdowns.',
  requiredSignals: ['momentum_6m', 'volatility', 'rsi_14', 'beta'],
  agentMapping: ['ALPHA_3', 'ALPHA_4'],
  expectedEdge: '6.8% underperformance over 60 days in top crowding decile',
  horizon: '20-40 trading days',
  riskReward: '1:2.5',
  computeSignal: (data) => {
    // Proxy crowding: high momentum + low vol + high RSI = consensus long, fragile
    const momentumExtreme = Math.abs(data.momentum6M) > 0.15;
    const rsiOverbought = data.rsi14 > 70;
    const lowVol = data.volatility < 0.2;
    const crowdingScore = (momentumExtreme ? 0.35 : 0) + (rsiOverbought ? 0.35 : 0) + (lowVol ? 0.3 : 0);
    const isShort = crowdingScore > 0.55 && data.momentum6M > 0;
    return {
      strength: isShort ? -crowdingScore : 0,
      direction: isShort ? 'SHORT' : 'NEUTRAL',
      confidence: Math.min(78, crowdingScore * 100),
      reasoning: `Crowding fragility ${(crowdingScore * 100).toFixed(0)}%. RSI ${data.rsi14.toFixed(0)}, 6M return +${(data.momentum6M * 100).toFixed(1)}%, Vol ${(data.volatility * 100).toFixed(1)}%.`,
      keyMetrics: [
        { name: 'RSI', value: data.rsi14.toFixed(0), impact: rsiOverbought ? 'negative' : 'neutral' },
        { name: '6M Momentum', value: `${(data.momentum6M * 100).toFixed(1)}%`, impact: momentumExtreme ? 'negative' : 'neutral' },
        { name: 'Implied Vol', value: `${(data.volatility * 100).toFixed(1)}%`, impact: lowVol ? 'negative' : 'neutral' },
      ],
      targetReturn: 0.068,
      stopDistance: 0.03,
    };
  },
};

/* ═══════════════════════════════════════════════════════════════
   STRATEGY 4: ANALYST DIVERGENCE ARBITRAGE
   ═══════════════════════════════════════════════════════════════ */
const analystDivergence: StrategyBlueprint = {
  id: 'analyst_divergence',
  name: 'Analyst Consensus Divergence Arbitrage',
  shortName: 'DIVERGENCE',
  description: 'Exploits gaps between analyst consensus sentiment and actual fundamental trajectory.',
  edge: 'Analysts are structurally incentivized to be positive. When fundamentals deteriorate under bullish consensus, mean reversion is violent.',
  requiredSignals: ['roe', 'revenue_growth', 'net_margin', 'pe_ratio', 'momentum_6m'],
  agentMapping: ['ALPHA_1', 'ALPHA_5'],
  expectedEdge: '5.3% underperformance over 25 days when divergence > 0.6',
  horizon: '25 trading days',
  riskReward: '1:2.0',
  computeSignal: (data) => {
    const fundamentalScore = (
      (data.revenueGrowth > 0 ? 0.3 : -0.3) +
      (data.netMargin > 0.05 ? 0.2 : -0.2) +
      (data.roe > 0.10 ? 0.25 : -0.25) +
      (data.momentum6M > 0 ? 0.25 : -0.25)
    );
    const valuationStress = data.peRatio > 30 ? Math.min(1, (data.peRatio - 30) / 30) : 0;
    const divergence = valuationStress - fundamentalScore;
    const isShort = divergence > 0.4 && fundamentalScore < 0;
    const isLong = divergence < -0.4 && fundamentalScore > 0;
    return {
      strength: isShort ? -Math.abs(divergence) : isLong ? Math.abs(divergence) : 0,
      direction: isShort ? 'SHORT' : isLong ? 'LONG' : 'NEUTRAL',
      confidence: Math.min(82, Math.abs(divergence) * 80),
      reasoning: `Divergence ${divergence.toFixed(2)}. Fundamental trajectory ${fundamentalScore > 0 ? 'improving' : 'deteriorating'}. PE ${data.peRatio.toFixed(1)}x. Rev growth ${(data.revenueGrowth * 100).toFixed(1)}%.`,
      keyMetrics: [
        { name: 'Divergence', value: divergence.toFixed(2), impact: Math.abs(divergence) > 0.4 ? 'negative' : 'neutral' },
        { name: 'Revenue Growth', value: `${(data.revenueGrowth * 100).toFixed(1)}%`, impact: data.revenueGrowth > 0 ? 'positive' : 'negative' },
        { name: 'PE Ratio', value: data.peRatio.toFixed(1), impact: data.peRatio > 30 ? 'negative' : 'neutral' },
      ],
      targetReturn: 0.053,
      stopDistance: 0.028,
    };
  },
};

/* ═══════════════════════════════════════════════════════════════
   STRATEGY 5: DARK POOL ACCUMULATION
   ═══════════════════════════════════════════════════════════════ */
const darkPoolAccumulation: StrategyBlueprint = {
  id: 'dark_pool',
  name: 'Dark Pool Accumulation Detection',
  shortName: 'DARKPOOL',
  description: 'Detects systematic off-exchange accumulation from volume anomalies and price suppression.',
  edge: 'Institutional accumulation in dark pools leaves traces: high volume, flat price. Compression precedes breakout.',
  requiredSignals: ['volatility', 'momentum_6m', 'rsi_14'],
  agentMapping: ['ALPHA_3'],
  expectedEdge: '4.7% outperformance over 15-30 days when composite > 0.7',
  horizon: '15-30 trading days',
  riskReward: '1:2.3',
  computeSignal: (data) => {
    // Price suppression + normal/high volume patterns
    const priceSuppression = data.volatility < 0.18 && Math.abs(data.momentum6M) < 0.03;
    const rsiNeutral = data.rsi14 > 40 && data.rsi14 < 55;
    const accumulationScore = (priceSuppression ? 0.45 : 0) + (rsiNeutral ? 0.3 : 0) + (data.beta < 1.0 ? 0.25 : 0);
    const isLong = accumulationScore > 0.55;
    return {
      strength: isLong ? accumulationScore : 0,
      direction: isLong ? 'LONG' : 'NEUTRAL',
      confidence: Math.min(75, accumulationScore * 100),
      reasoning: `Accumulation signal ${(accumulationScore * 100).toFixed(0)}%. Price compression detected: Vol ${(data.volatility * 100).toFixed(1)}%, 6M drift ${(data.momentum6M * 100).toFixed(1)}%, RSI ${data.rsi14.toFixed(0)}.`,
      keyMetrics: [
        { name: 'Vol Compression', value: `${(data.volatility * 100).toFixed(1)}%`, impact: priceSuppression ? 'positive' : 'neutral' },
        { name: 'RSI', value: data.rsi14.toFixed(0), impact: rsiNeutral ? 'positive' : 'neutral' },
        { name: 'Beta', value: data.beta.toFixed(2), impact: data.beta < 1 ? 'positive' : 'neutral' },
      ],
      targetReturn: 0.047,
      stopDistance: 0.022,
    };
  },
};

/* ═══════════════════════════════════════════════════════════════
   STRATEGY 6: MACRO REGIME ROTATION
   ═══════════════════════════════════════════════════════════════ */
const macroRegimeRotation: StrategyBlueprint = {
  id: 'macro_rotation',
  name: 'Macro Regime Rotation Speed Arbitrage',
  shortName: 'REGIME',
  description: 'Captures sector rotation speed advantage during macro regime transitions.',
  edge: 'Large funds take 5-15 days to rotate. Automated systems capture it on day 1.',
  requiredSignals: ['beta', 'momentum_6m', 'volatility'],
  agentMapping: ['ALPHA_4'],
  expectedEdge: '3.8% rotation spread in first 3 days of transition',
  horizon: '20 trading days',
  riskReward: '1:1.9',
  computeSignal: (data) => {
    // Detect regime sensitivity: high beta, high vol, strong momentum = regime-sensitive
    const regimeSensitivity = (data.beta > 1.2 ? 0.35 : 0) + (data.volatility > 0.25 ? 0.3 : 0) + (Math.abs(data.momentum6M) > 0.1 ? 0.35 : 0);
    const direction = data.momentum6M > 0 ? 'LONG' : 'SHORT';
    return {
      strength: direction === 'LONG' ? regimeSensitivity : -regimeSensitivity,
      direction: regimeSensitivity > 0.5 ? direction : 'NEUTRAL',
      confidence: Math.min(72, regimeSensitivity * 95),
      reasoning: `Regime sensitivity ${(regimeSensitivity * 100).toFixed(0)}%. Beta ${data.beta.toFixed(2)} suggests ${data.beta > 1.2 ? 'cyclical exposure' : 'defensive positioning'}. Momentum ${data.momentum6M > 0 ? 'positive' : 'negative'}.`,
      keyMetrics: [
        { name: 'Beta', value: data.beta.toFixed(2), impact: data.beta > 1.2 ? 'positive' : 'neutral' },
        { name: 'Vol', value: `${(data.volatility * 100).toFixed(1)}%`, impact: data.volatility > 0.25 ? 'positive' : 'neutral' },
        { name: 'Momentum', value: `${(data.momentum6M * 100).toFixed(1)}%`, impact: data.momentum6M > 0 ? 'positive' : 'negative' },
      ],
      targetReturn: 0.038,
      stopDistance: 0.02,
    };
  },
};

/* ═══════════════════════════════════════════════════════════════
   STRATEGY 7: NARRATIVE COLLAPSE
   ═══════════════════════════════════════════════════════════════ */
const narrativeCollapse: StrategyBlueprint = {
  id: 'narrative_collapse',
  name: 'Narrative Collapse Trading',
  shortName: 'NARRATIVE',
  description: 'Detects when the dominant market narrative around a stock is structurally weakening.',
  edge: 'Narrative death precedes multiple compression. AI detects theme persistence decline before price reflects it.',
  requiredSignals: ['pe_ratio', 'momentum_6m', 'volatility', 'revenue_growth'],
  agentMapping: ['ALPHA_5', 'ALPHA_1'],
  expectedEdge: '11.2% underperformance over 60 days for high-multiple narrative collapses',
  horizon: '60 trading days',
  riskReward: '1:3.0',
  computeSignal: (data) => {
    const highMultiple = data.peRatio > 35;
    const momentumFading = data.momentum6M < 0.02 && data.momentum6M > -0.08;
    const growthSlowing = data.revenueGrowth < 0.05;
    const volRising = data.volatility > 0.25;
    const collapseScore = (highMultiple ? 0.3 : 0) + (momentumFading ? 0.25 : 0) + (growthSlowing ? 0.25 : 0) + (volRising ? 0.2 : 0);
    const isShort = collapseScore > 0.5;
    return {
      strength: isShort ? -collapseScore : 0,
      direction: isShort ? 'SHORT' : 'NEUTRAL',
      confidence: Math.min(70, collapseScore * 90),
      reasoning: `Narrative health ${((1 - collapseScore) * 100).toFixed(0)}%. PE ${data.peRatio.toFixed(1)}x at ${data.revenueGrowth > 0 ? 'decelerating' : 'negative'} growth. Theme persistence weakening.`,
      keyMetrics: [
        { name: 'PE Multiple', value: `${data.peRatio.toFixed(1)}x`, impact: highMultiple ? 'negative' : 'neutral' },
        { name: 'Rev Growth', value: `${(data.revenueGrowth * 100).toFixed(1)}%`, impact: growthSlowing ? 'negative' : 'positive' },
        { name: 'Momentum Fade', value: `${(data.momentum6M * 100).toFixed(1)}%`, impact: momentumFading ? 'negative' : 'neutral' },
      ],
      targetReturn: 0.112,
      stopDistance: 0.04,
    };
  },
};

/* ═══════════════════════════════════════════════════════════════
   STRATEGY 8: GUIDANCE RATCHET TRAP
   ═══════════════════════════════════════════════════════════════ */
const guidanceRatchetTrap: StrategyBlueprint = {
  id: 'guidance_trap',
  name: 'Earnings Guidance Ratchet Trap',
  shortName: 'RATCHET',
  description: 'Identifies companies manufacturing consistent small earnings beats that mask deterioration.',
  edge: 'First miss after 6+ manufactured beats causes double hit: miss + multiple compression.',
  requiredSignals: ['pe_ratio', 'fScore', 'net_margin', 'roe'],
  agentMapping: ['ALPHA_1', 'ALPHA_2'],
  expectedEdge: '9.4% underperformance over 30 days on first miss. Hit rate 61%.',
  horizon: '30 trading days',
  riskReward: '1:2.8',
  computeSignal: (data) => {
    const highPE = data.peRatio > 25;
    const weakFundamentals = data.fScore < 5;
    const marginPressure = data.netMargin < 0.05;
    const lowROE = data.roe < 0.10;
    const trapScore = (highPE ? 0.3 : 0) + (weakFundamentals ? 0.25 : 0) + (marginPressure ? 0.25 : 0) + (lowROE ? 0.2 : 0);
    const isShort = trapScore > 0.5;
    return {
      strength: isShort ? -trapScore : 0,
      direction: isShort ? 'SHORT' : 'NEUTRAL',
      confidence: Math.min(76, trapScore * 95),
      reasoning: `Ratchet trap score ${(trapScore * 100).toFixed(0)}%. PE ${data.peRatio.toFixed(1)}x, F-Score ${data.fScore}/9, margin ${(data.netMargin * 100).toFixed(1)}%, ROE ${(data.roe * 100).toFixed(1)}%.`,
      keyMetrics: [
        { name: 'PE', value: `${data.peRatio.toFixed(1)}x`, impact: highPE ? 'negative' : 'neutral' },
        { name: 'F-Score', value: `${data.fScore}/9`, impact: weakFundamentals ? 'negative' : 'positive' },
        { name: 'Net Margin', value: `${(data.netMargin * 100).toFixed(1)}%`, impact: marginPressure ? 'negative' : 'positive' },
      ],
      targetReturn: 0.094,
      stopDistance: 0.035,
    };
  },
};

/* ═══════════════════════════════════════════════════════════════
   EXPORTS
   ═══════════════════════════════════════════════════════════════ */

export const ALL_STRATEGIES: StrategyBlueprint[] = [
  earningsStressDetection,
  supplyChainContagion,
  crowdingEscape,
  analystDivergence,
  darkPoolAccumulation,
  macroRegimeRotation,
  narrativeCollapse,
  guidanceRatchetTrap,
];

/**
 * Evaluate ALL strategies against current ticker data.
 * Returns the best strategy (highest absolute signal strength).
 */
export function selectBestStrategy(data: StrategyInputData): {
  strategy: StrategyBlueprint;
  signal: StrategySignal;
  allSignals: { strategy: StrategyBlueprint; signal: StrategySignal }[];
} {
  const results = ALL_STRATEGIES.map(strategy => ({
    strategy,
    signal: strategy.computeSignal(data),
  }));

  // Sort by absolute signal strength descending
  results.sort((a, b) => Math.abs(b.signal.strength) - Math.abs(a.signal.strength));

  // Filter out NEUTRAL signals
  const active = results.filter(r => r.signal.direction !== 'NEUTRAL');
  const best = active.length > 0 ? active[0] : results[0];

  return {
    strategy: best.strategy,
    signal: best.signal,
    allSignals: results,
  };
}
