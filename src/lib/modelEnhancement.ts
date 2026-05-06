/**
 * QuantSuite Model Enhancement System
 * Few-shot examples, prompt selection, and context compression
 * for making free models behave like flagship models
 */
import { supabase } from '@/integrations/supabase/client';

// ================================
// FEW-SHOT EXAMPLE DATABASE
// ================================

export interface FewShotExample {
  query: string;
  response: string;
  category: string;
}

const ATHENA_EXAMPLES: FewShotExample[] = [
  {
    category: 'risk_analysis',
    query: 'What is my portfolio risk exposure?',
    response: `REGIME: BULL (78% confidence). Trend strength at +62%. Volatility compressed at 14.2% annualized — below historical median.

\`\`\`chart:pie
{"title": "Risk Allocation", "data": [{"name": "Systematic Risk (β)", "value": 65}, {"name": "Idiosyncratic", "value": 25}, {"name": "Tail Risk", "value": 10}]}
\`\`\`

VaR 95% stands at ₹42,800 — meaning on 19/20 trading days, you will not lose more than this amount. However, your CVaR (Expected Shortfall) at ₹61,200 tells the real story: when losses DO breach VaR, they average 43% worse.

**CRITICAL CONCENTRATION RISK**: 38% of portfolio value concentrated in 2 positions. HHI at 0.18 — borderline dangerous. One earnings miss from RELIANCE or TCS could vaporize 5-8% of total portfolio value in a single session.

\`\`\`tickers
[{"symbol": "RELIANCE", "price": 2450, "change": 1.2, "action": "hold"}, {"symbol": "TCS", "price": 3680, "change": -0.8, "action": "hold"}, {"symbol": "HDFCBANK", "price": 1650, "change": 0.5, "action": "buy"}]
\`\`\`

IMMEDIATE ACTION: Trim RELIANCE by 5% and redistribute into HDFCBANK and INFY to reduce HHI below 0.12.`
  },
  {
    category: 'optimization',
    query: 'Optimize my portfolio for maximum Sharpe',
    response: `Current Sharpe at 0.82 — institutional threshold minimum is 1.0. You are leaving alpha on the table.

\`\`\`comparison
{"before": [{"label": "Sharpe Ratio", "value": "0.82"}, {"label": "Annual Vol", "value": "22.4%"}, {"label": "Max DD", "value": "-18.6%"}], "after": [{"label": "Sharpe Ratio", "value": "1.34"}, {"label": "Annual Vol", "value": "15.8%"}, {"label": "Max DD", "value": "-11.2%"}]}
\`\`\`

The efficient frontier analysis reveals your portfolio sits 340bps below the optimal risk-return line. By reallocating 15% from high-beta positions into defensive names and adding a 5% gold hedge, we push Sharpe to 1.34 while REDUCING max drawdown by 40%.`
  }
];

const MARKET_MAW_EXAMPLES: FewShotExample[] = [
  {
    category: 'market_overview',
    query: 'What is happening in the market today?',
    response: `MARKETS ARE ON FIRE. Nifty 50 ▲ 1.8% ripping through the 22,500 resistance level on monster volume — 2.3x the 20-day average. This is not a dead cat bounce. This is institutional accumulation.

\`\`\`chart:bar
{"title": "Index Performance", "data": [{"name": "NIFTY 50", "value": 1.8}, {"name": "SENSEX", "value": 1.6}, {"name": "BANK NIFTY", "value": 2.3}, {"name": "MIDCAP", "value": 1.1}]}
\`\`\`

BANKING LEADS THE CHARGE — BANK NIFTY up 2.3% as FII buying floods into HDFC, ICICI, and KOTAK. This is rotation FROM IT (which is bleeding -0.8%) INTO financials.

\`\`\`tickers
[{"symbol": "HDFCBANK", "price": 1685, "change": 3.2, "action": "buy"}, {"symbol": "ICICIBANK", "price": 1120, "change": 2.8, "action": "buy"}, {"symbol": "TCS", "price": 3650, "change": -1.2, "action": "hold"}, {"symbol": "INFY", "price": 1480, "change": -0.9, "action": "hold"}]
\`\`\`

FinBERT SENTIMENT: BULLISH (Score: +0.72). 14 of 20 scanned headlines positive. Top signal: "FII buying hits 6-month high as India growth outlook upgraded"`
  }
];

const STRATEGY_EXAMPLES: FewShotExample[] = [
  {
    category: 'strategy_recommendation',
    query: 'What strategy should I use right now?',
    response: `REGIME DETECTION: BULL with HIGH_VOL undertone. Trend ratio at 1.8x — strong directional move but volatility at 24% is elevated. This is the PERFECT environment for a MOMENTUM + TRAILING STOP strategy.

\`\`\`chart:pie
{"title": "Strategy Score Distribution", "data": [{"name": "Momentum", "value": 88}, {"name": "Vol Trading", "value": 72}, {"name": "Mean Reversion", "value": 35}, {"name": "Stat Arb", "value": 45}]}
\`\`\`

**SANDBOX BACKTEST RESULTS**: Momentum strategy on your portfolio's top holdings over 90 days:
- Total Return: +12.4% vs Benchmark +7.2%
- Sharpe: 1.82 | Max DD: -6.8% | Win Rate: 68%

IMPLEMENTATION:
1. **Size positions at 8-10% each** — no single bet exceeds risk tolerance
2. **Entry**: Buy on RSI crossing above 50 with positive MACD histogram
3. **Exit**: Trailing stop at 2x ATR (currently ~3.2% for large caps)
4. **Risk cap**: Maximum 3 concurrent positions

\`\`\`tickers
[{"symbol": "RELIANCE", "price": 2450, "change": 2.1, "action": "buy"}, {"symbol": "HDFCBANK", "price": 1685, "change": 3.2, "action": "buy"}, {"symbol": "BHARTIARTL", "price": 1580, "change": 1.8, "action": "buy"}]
\`\`\``
  }
];

// ================================
// PROMPT SELECTION
// ================================

export type QueryCategory = 'risk' | 'optimization' | 'market_overview' | 'stock_specific' | 'strategy' | 'general';

export function classifyQuery(query: string): QueryCategory {
  const lower = query.toLowerCase();
  if (/risk|var|drawdown|exposure|hedge|protect|volatil/.test(lower)) return 'risk';
  if (/optim|sharpe|rebalance|efficient|allocat/.test(lower)) return 'optimization';
  if (/market|today|news|sector|index|nifty|sensex|s&p/.test(lower)) return 'market_overview';
  if (/\b[A-Z]{2,5}\b/.test(query) && /buy|sell|price|target|analysis/.test(lower)) return 'stock_specific';
  if (/strateg|trade|entry|exit|backtest|signal|momentum|reversion/.test(lower)) return 'strategy';
  return 'general';
}

export async function getRelevantExamples(agent: 'athena' | 'market_maw' | 'strategy_advisor', category: QueryCategory): Promise<string> {
  let context = '\n\n[REFERENCE EXAMPLES — Match this quality and format]\n\n';
  let hasRlhfExamples = false;

  try {
    // 1. Fetch top-rated RLHF examples from ai_feedback table
    const { data: feedbackData, error } = await (supabase as any)
      .from('ai_feedback')
      .select('prompt, response')
      .eq('agent_id', agent)
      .eq('rating', 1) // Only positive ratings
      .order('created_at', { ascending: false })
      .limit(2);

    if (!error && feedbackData && feedbackData.length > 0) {
      hasRlhfExamples = true;
      feedbackData.forEach((ex, i) => {
        context += `Example ${i + 1} (RLHF Curated):\nUser: "${ex.prompt}"\nAssistant Response:\n${ex.response}\n\n---\n\n`;
      });
    }
  } catch (error) {
    console.warn('[ModelEnhancement] Failed to fetch RLHF examples:', error);
  }

  // 2. Fallback to hardcoded examples if no RLHF found
  if (!hasRlhfExamples) {
    let examples: FewShotExample[] = [];
    if (agent === 'athena') examples = ATHENA_EXAMPLES;
    else if (agent === 'market_maw') examples = MARKET_MAW_EXAMPLES;
    else examples = STRATEGY_EXAMPLES;
    
    const relevant = examples.slice(0, 2);
    if (relevant.length === 0) return '';
    
    relevant.forEach((ex, i) => {
      context += `Example ${i + 1}:\nUser: "${ex.query}"\nAssistant Response:\n${ex.response}\n\n---\n\n`;
    });
  }
  
  return context;
}

// ================================
// CONTEXT COMPRESSION
// ================================

export function compressPortfolioContext(positions: any[], maxPositions: number = 10): string {
  if (!positions || positions.length === 0) return 'No portfolio data available.';
  
  const sorted = [...positions].sort((a, b) => (b.value || 0) - (a.value || 0));
  const top = sorted.slice(0, maxPositions);
  const totalValue = sorted.reduce((s, p) => s + (p.value || 0), 0);
  
  let ctx = `Portfolio: ${positions.length} positions, Total: $${totalValue.toLocaleString()}\n`;
  ctx += `Top ${top.length}: `;
  ctx += top.map(p => `${p.symbol || p.ticker}(${((p.value || 0) / totalValue * 100).toFixed(0)}%)`).join(', ');
  
  return ctx;
}

export function compressMarketContext(indices: any[]): string {
  if (!indices || indices.length === 0) return 'No market data.';
  return indices.map(i => `${i.name || i.symbol}: ${i.price?.toFixed(0) || '?'} (${i.changePercent >= 0 ? '+' : ''}${i.changePercent?.toFixed(2) || '?'}%)`).join(' | ');
}

// ================================
// V5: HALLUCINATION GUARD POST-PROCESSOR
// ================================

/**
 * Scans an AI response for numbers that do NOT appear in the injected data context.
 * Flags potentially hallucinated metrics. Returns the response with warnings injected.
 */
export function hallucinationGuard(aiResponse: string, injectedContext: string): {
  cleanedResponse: string;
  flaggedNumbers: string[];
  hallucineScore: number; // 0-1, where 1 = likely all hallucinated
} {
  // Extract all numbers from the AI response (prices, percentages, metrics)
  const numberPattern = /(?:[$₹€£]?\s*[\d,]+\.?\d*\s*%?)/g;
  const responseNumbers = (aiResponse.match(numberPattern) || [])
    .map(n => n.replace(/[$₹€£,\s%]/g, ''))
    .filter(n => n.length > 0 && !isNaN(parseFloat(n)));

  // Extract all numbers from the injected context
  const contextNumbers = (injectedContext.match(numberPattern) || [])
    .map(n => n.replace(/[$₹€£,\s%]/g, ''))
    .filter(n => n.length > 0 && !isNaN(parseFloat(n)));

  const contextSet = new Set(contextNumbers);

  // Find numbers in response that aren't in context
  const flagged: string[] = [];
  for (const num of responseNumbers) {
    const val = parseFloat(num);
    // Skip common non-data numbers (0, 1, 2, 100, chart axis values, etc.)
    if (val === 0 || val === 1 || val === 100 || val === 50 || val === 5) continue;
    // Skip small integers that are likely formatting (e.g. "top 3", "5 positions")
    if (Number.isInteger(val) && val < 20) continue;

    if (!contextSet.has(num)) {
      // Check if it's close to any context number (within 0.1% — could be a rounding difference)
      const isClose = contextNumbers.some(cn => {
        const cv = parseFloat(cn);
        return Math.abs(cv - val) / (Math.abs(cv) || 1) < 0.001;
      });
      if (!isClose) {
        flagged.push(num);
      }
    }
  }

  const hallucineScore = responseNumbers.length > 0
    ? flagged.length / responseNumbers.length
    : 0;

  let cleanedResponse = aiResponse;
  if (flagged.length > 0 && hallucineScore > 0.3) {
    cleanedResponse += `\n\n---\n⚠️ **DATA INTEGRITY WARNING**: ${flagged.length} numeric values in this response could not be traced to the source data. Hallucination score: ${(hallucineScore * 100).toFixed(0)}%. Flagged values: ${flagged.slice(0, 5).join(', ')}${flagged.length > 5 ? '...' : ''}`;
  }

  return { cleanedResponse, flaggedNumbers: flagged, hallucineScore };
}
