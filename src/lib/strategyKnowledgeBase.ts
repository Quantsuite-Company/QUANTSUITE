/**
 * QuantScript Strategy Knowledge Base
 * RAG Pipeline: Query classification + Few-shot retrieval + Context injection
 */

export type StrategyType = 'momentum' | 'mean_reversion' | 'breakout' | 'volatility' | 'options' | 'pairs' | 'multi_factor' | 'general';

// ============================================================
// QUERY CLASSIFIER — Detects strategy type from natural language
// ============================================================
export function classifyStrategyQuery(query: string): StrategyType {
  const q = query.toLowerCase();
  if (/momentum|trend|follow|moving average|ma crossover|macd|relative strength/i.test(q)) return 'momentum';
  if (/mean.?rev|rsi|overbought|oversold|bollinger|zscore|deviation|contrarian|buy.?the.?dip/i.test(q)) return 'mean_reversion';
  if (/breakout|resistance|support|52.?week|high|channel|range|squeeze/i.test(q)) return 'breakout';
  if (/volatil|vix|straddle|strangle|iron.?condor|gamma|vega|iv.?rank|vol.?crush/i.test(q)) return 'volatility';
  if (/option|call|put|spread|butterfly|collar|covered|iron|credit|debit/i.test(q)) return 'options';
  if (/pair|spread|arbitrage|cointegrat|correlation|hedge|long.?short|market.?neutral/i.test(q)) return 'pairs';
  if (/multi.?factor|alpha|sharpe|portfolio|optimiz|weight|allocat/i.test(q)) return 'multi_factor';
  return 'general';
}

// ============================================================
// STRATEGY TEMPLATES — Curated institutional examples
// ============================================================
export interface StrategyTemplate {
  label: string;
  type: StrategyType;
  icon: string;
  prompt: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  expectedSharpe: string;
}

export const STRATEGY_TEMPLATES: StrategyTemplate[] = [
  {
    label: 'RSI Mean Reversion',
    type: 'mean_reversion',
    icon: '📉',
    difficulty: 'beginner',
    expectedSharpe: '1.2-1.8',
    description: 'Buy oversold dips, sell overbought rips using RSI momentum exhaustion',
    prompt: 'Create a mean reversion strategy using RSI. Buy when 14-day RSI drops below 30 and price is below 50-day SMA. Sell when RSI rises above 70 or price drops 5%. Use 2% position sizing with weekly rebalancing.',
  },
  {
    label: 'Momentum Breakout',
    type: 'breakout',
    icon: '🚀',
    difficulty: 'intermediate',
    expectedSharpe: '1.5-2.2',
    description: 'Ride explosive moves as price breaks through 52-week highs on volume',
    prompt: 'Build a momentum breakout strategy. Enter long when price breaks above 52-week high with volume 2x above 20-day average. Exit on 15% profit or 10% loss. Trail stop at 2 ATR after 10% gain.',
  },
  {
    label: 'MACD Crossover',
    type: 'momentum',
    icon: '📊',
    difficulty: 'beginner',
    expectedSharpe: '1.0-1.5',
    description: 'Classic trend-following using MACD signal line crossovers from below zero',
    prompt: 'Design a MACD crossover strategy. Buy when MACD line crosses above signal line and both are below zero (early momentum). Sell when MACD crosses below signal or -5% stop loss.',
  },
  {
    label: 'Bollinger Squeeze',
    type: 'volatility',
    icon: '💥',
    difficulty: 'advanced',
    expectedSharpe: '1.8-2.5',
    description: 'Exploit volatility compression for explosive breakout moves',
    prompt: 'Create a Bollinger Band squeeze breakout strategy. Enter when bandwidth is in lowest 10% of 120-day range and price breaks above upper band. Exit at 2x ATR take profit or lower band touch.',
  },
  {
    label: 'Dual Moving Average',
    type: 'momentum',
    icon: '📈',
    difficulty: 'beginner',
    expectedSharpe: '0.8-1.3',
    description: 'Trend following using golden cross / death cross of EMAs',
    prompt: 'Build a dual moving average crossover strategy using 9-EMA and 21-EMA. Go long on golden cross (9 crosses above 21) with ADX > 25 confirming trend strength. Exit on death cross. Risk 1.5% per trade.',
  },
  {
    label: 'Gap & Go Momentum',
    type: 'breakout',
    icon: '⚡',
    difficulty: 'advanced',
    expectedSharpe: '2.0-3.0',
    description: 'Capture morning gap momentum with volume confirmation and tight stops',
    prompt: 'Design a gap-and-go strategy for daily timeframe. Enter when stock gaps up more than 3% on open with pre-market volume 5x average. Hold for intraday momentum with trailing stop at VWAP. Exit at close.',
  },
  {
    label: 'Mean Reversion Z-Score',
    type: 'mean_reversion',
    icon: '🎯',
    difficulty: 'intermediate',
    expectedSharpe: '1.5-2.0',
    description: 'Statistical mean reversion using z-score of price vs rolling mean',
    prompt: 'Create a z-score mean reversion strategy. Calculate 20-day z-score of close price. Enter long when z-score < -2.0, enter short when z-score > 2.0. Exit when z-score returns to [-0.5, 0.5] range. Max 3 positions.',
  },
  {
    label: 'Volatility Regime Switch',
    type: 'volatility',
    icon: '🌪️',
    difficulty: 'advanced',
    expectedSharpe: '1.8-2.5',
    description: 'Adapt strategy based on volatility regime detection',
    prompt: 'Build a regime-switching strategy. In low-vol regime (20-day HV < 15%), use momentum (buy breakouts). In high-vol regime (HV > 30%), switch to mean reversion (fade extremes). Use ATR-based sizing inversely proportional to volatility.',
  },
  {
    label: 'RSI Divergence',
    type: 'mean_reversion',
    icon: '🔀',
    difficulty: 'intermediate',
    expectedSharpe: '1.3-1.8',
    description: 'Spot bearish/bullish divergences between price and RSI for reversal entries',
    prompt: 'Design a strategy based on RSI divergence. Detect bullish divergence when price makes lower low but RSI(14) makes higher low. Enter long with confirmation candle. Stop below recent swing low. Target 2:1 R:R.',
  },
  {
    label: 'Turtle Breakout (Modified)',
    type: 'breakout',
    icon: '🐢',
    difficulty: 'intermediate',
    expectedSharpe: '1.2-1.8',
    description: 'Classic turtle trading rules adapted for modern markets with tighter risk',
    prompt: 'Build a modified Turtle Trading strategy. Enter on 20-day high breakout, add to position on each new 10-day high (max 4 units). Size by 1% risk per unit (ATR-based). Exit on 10-day low or 2x ATR trailing stop.',
  },
  {
    label: 'Iron Condor Weekly',
    type: 'options',
    icon: '🦅',
    difficulty: 'advanced',
    expectedSharpe: '1.5-2.0',
    description: 'Sell weekly iron condors on large-cap indices for theta decay',
    prompt: 'Create an iron condor selling strategy on SPY weekly options. Sell 16-delta call spread and 16-delta put spread. Open on Monday, close at 50% profit or Thursday close. Adjust if underlying moves beyond short strike. Max risk 2% of account per trade.',
  },
  {
    label: 'Pairs Trading',
    type: 'pairs',
    icon: '⚖️',
    difficulty: 'advanced',
    expectedSharpe: '1.5-2.5',
    description: 'Market-neutral pairs trading using cointegrated stock pairs',
    prompt: 'Design a statistical pairs trading strategy. Find cointegrated pairs using Engle-Granger test. Enter when spread z-score exceeds ±2.0 (long underperformer, short outperformer). Exit at z-score 0. Half-Kelly sizing.',
  },
  {
    label: 'VWAP Reversion',
    type: 'mean_reversion',
    icon: '📏',
    difficulty: 'intermediate',
    expectedSharpe: '1.3-1.7',
    description: 'Intraday mean reversion to VWAP with volume profile confirmation',
    prompt: 'Build an intraday VWAP reversion strategy. Enter long when price is > 2 standard deviations below VWAP with increasing volume. Enter short when > 2 stdev above VWAP. Target VWAP touch. Stop at 3 stdev.',
  },
  {
    label: 'Multi-Factor Alpha',
    type: 'multi_factor',
    icon: '🧬',
    difficulty: 'advanced',
    expectedSharpe: '2.0-3.0',
    description: 'Combine momentum, value, and quality factors for cross-sectional alpha',
    prompt: 'Create a multi-factor strategy combining: (1) 12-1 month momentum, (2) earnings yield (value), (3) ROE (quality). Rank stocks by composite score. Go long top decile, short bottom decile. Monthly rebalance. Equal-weight.',
  },
  {
    label: 'Earnings Momentum',
    type: 'momentum',
    icon: '💰',
    difficulty: 'intermediate',
    expectedSharpe: '1.5-2.2',
    description: 'Post-earnings announcement drift — ride the momentum after beats/misses',
    prompt: 'Design a post-earnings announcement drift (PEAD) strategy. Enter long on stocks that beat earnings estimates by > 10% with positive price reaction on earnings day. Hold for 60 days. Size by surprise magnitude. Stop at -8%.',
  },
];

// ============================================================
// FEW-SHOT RETRIEVAL — Select relevant examples for RAG
// ============================================================
interface FewShotStrategy {
  type: StrategyType;
  userQuery: string;
  idealResponse: string;
}

const FEW_SHOT_EXAMPLES: FewShotStrategy[] = [
  {
    type: 'momentum',
    userQuery: 'Build me an EMA crossover strategy with trend confirmation',
    idealResponse: `{"strategy":{"name":"EMA Crossover with ADX Trend Filter","philosophy":"Exploit persistent price trends by catching momentum shifts early, confirmed by trend strength","market_conditions":"Trending markets with ADX > 25","timeframe":"daily","asset_classes":["Stocks","ETFs"],"entry_rules":["1. 9-EMA crosses above 21-EMA (golden cross)","2. ADX(14) > 25 confirming genuine trend","3. Volume > 1.5x 20-day average on crossover day","4. Price must be above 200-day SMA (long-term uptrend filter)"],"exit_rules":["1. 9-EMA crosses below 21-EMA (death cross)","2. Hard stop loss at 2x ATR(14) below entry price","3. Take profit at 3x ATR(14) above entry (R:R = 1:1.5)","4. Exit if ADX drops below 20 (trend dying)"],"risk_parameters":{"max_position_pct":8,"stop_loss_pct":4,"take_profit_pct":12,"max_drawdown_pct":15,"risk_reward_ratio":"1:1.5","max_open_positions":5}}}`
  },
  {
    type: 'mean_reversion',
    userQuery: 'RSI strategy that buys oversold stocks',
    idealResponse: `{"strategy":{"name":"RSI Snap-Back Alpha","philosophy":"Exploit short-term oversold conditions caused by panic selling — price reverts to mean within 5-10 days","market_conditions":"Range-bound or mild uptrend, NOT during crash regimes","timeframe":"daily","asset_classes":["Large-cap Stocks"],"entry_rules":["1. RSI(14) drops below 30","2. Price is within 5% of 50-day SMA (not in freefall)","3. Volume spike > 2x average (capitulation signal)","4. Stock must have market cap > $10B (liquidity filter)"],"exit_rules":["1. RSI(14) rises above 55 (mean reverting)","2. Hard stop at -5% from entry","3. Time exit: close position after 10 trading days regardless","4. Trailing stop activated at +3%: trail at 1.5x ATR"],"risk_parameters":{"max_position_pct":5,"stop_loss_pct":5,"take_profit_pct":10,"max_drawdown_pct":12,"risk_reward_ratio":"1:2","max_open_positions":4}}}`
  },
];

/**
 * Build RAG context for the model based on query type
 */
export function buildRAGContext(query: string, pastFeedback?: { prompt: string; response: string }[]): string {
  const stratType = classifyStrategyQuery(query);
  let context = '';

  // 1. Strategy type context
  context += `[STRATEGY CLASSIFICATION: ${stratType.toUpperCase()}]\n`;
  context += `The user is requesting a ${stratType.replace('_', ' ')} strategy. `;

  switch (stratType) {
    case 'momentum':
      context += 'Focus on trend-following indicators (EMA, MACD, ADX), momentum confirmation, and trend strength filters. Use trailing stops to let winners run.\n';
      break;
    case 'mean_reversion':
      context += 'Focus on oversold/overbought indicators (RSI, Bollinger Bands, z-score), mean reversion timing, and regime filters to avoid catching falling knives.\n';
      break;
    case 'breakout':
      context += 'Focus on resistance/support levels, volume confirmation on breakout, and false breakout filters. Use ATR for dynamic stop placement.\n';
      break;
    case 'volatility':
      context += 'Focus on volatility regimes (HV, IV rank), Bollinger squeeze detection, and regime-switching logic. Size inversely to volatility.\n';
      break;
    case 'options':
      context += 'Focus on options Greeks, theta decay curves, IV rank for entry timing, and defined-risk structures. Always specify strike selection rules.\n';
      break;
    case 'pairs':
      context += 'Focus on cointegration tests, spread z-score, half-life of mean reversion, and correlation stability. Market-neutral by construction.\n';
      break;
    case 'multi_factor':
      context += 'Focus on factor construction (momentum, value, quality, size), cross-sectional ranking, and factor timing. Discuss factor crowding risks.\n';
      break;
    default:
      context += 'Generate the most appropriate strategy type based on the user description.\n';
  }

  // 2. Few-shot examples
  const relevantExamples = FEW_SHOT_EXAMPLES.filter(e => e.type === stratType);
  if (relevantExamples.length > 0) {
    context += '\n[REFERENCE EXAMPLES — Match this quality and precision]\n\n';
    relevantExamples.forEach((ex, i) => {
      context += `Example ${i + 1}:\nUser: "${ex.userQuery}"\nIdeal Output:\n${ex.idealResponse}\n\n---\n\n`;
    });
  }

  // 3. RLHF-curated past successes
  if (pastFeedback && pastFeedback.length > 0) {
    context += '\n[USER-APPROVED EXAMPLES — These got positive feedback]\n\n';
    pastFeedback.slice(0, 2).forEach((fb, i) => {
      context += `Approved ${i + 1}:\nQuery: "${fb.prompt}"\nResponse: ${fb.response.substring(0, 500)}...\n\n`;
    });
  }

  return context;
}

/**
 * Get strategy template suggestions based on query similarity
 */
export function getSuggestedTemplates(query: string): StrategyTemplate[] {
  if (!query.trim()) return STRATEGY_TEMPLATES.slice(0, 6);
  
  const stratType = classifyStrategyQuery(query);
  const exact = STRATEGY_TEMPLATES.filter(t => t.type === stratType);
  const others = STRATEGY_TEMPLATES.filter(t => t.type !== stratType);
  
  // Return exact matches first, then fill with others
  return [...exact, ...others].slice(0, 6);
}
