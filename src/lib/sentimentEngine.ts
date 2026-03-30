/**
 * QuantSuite Sentiment Engine
 * Client-side FinBERT-powered sentiment analysis using @huggingface/transformers
 * Falls back to rule-based sentiment when model loading fails
 */

export interface SentimentResult {
  text: string;
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  confidence: number;
  scores: { positive: number; negative: number; neutral: number };
}

export interface SentimentSummary {
  overallSentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  overallScore: number; // -1 (very bearish) to +1 (very bullish)
  bullishCount: number;
  bearishCount: number;
  neutralCount: number;
  topBullish: SentimentResult[];
  topBearish: SentimentResult[];
  results: SentimentResult[];
}

// ================================
// RULE-BASED SENTIMENT (Fallback)
// ================================

const BULLISH_KEYWORDS = [
  'surge', 'rally', 'gain', 'soar', 'jump', 'rise', 'climb', 'bullish', 'upside',
  'outperform', 'upgrade', 'buy', 'strong', 'beat', 'exceeds', 'record', 'high',
  'growth', 'profit', 'revenue', 'positive', 'boom', 'momentum', 'breakout',
  'accumulation', 'expansion', 'recovery', 'optimistic', 'upbeat', 'robust',
  'impressive', 'exceeded expectations', 'dividend', 'buyback', 'acquisition'
];

const BEARISH_KEYWORDS = [
  'crash', 'plunge', 'drop', 'fall', 'decline', 'sink', 'bearish', 'downside',
  'underperform', 'downgrade', 'sell', 'weak', 'miss', 'below', 'low', 'loss',
  'recession', 'negative', 'bust', 'correction', 'breakdown', 'distribution',
  'contraction', 'warning', 'pessimistic', 'disappointing', 'inflation', 'default',
  'bankruptcy', 'layoff', 'writedown', 'risk', 'volatile', 'uncertainty', 'tariff'
];

function ruleBasedSentiment(text: string): SentimentResult {
  const lower = text.toLowerCase();
  let bullScore = 0;
  let bearScore = 0;
  
  BULLISH_KEYWORDS.forEach(kw => {
    if (lower.includes(kw)) bullScore += 1;
  });
  
  BEARISH_KEYWORDS.forEach(kw => {
    if (lower.includes(kw)) bearScore += 1;
  });
  
  const total = bullScore + bearScore + 1;
  const positive = bullScore / total;
  const negative = bearScore / total;
  const neutral = 1 / total;
  
  let sentiment: SentimentResult['sentiment'] = 'NEUTRAL';
  let confidence = 0.5;
  
  if (bullScore > bearScore + 1) {
    sentiment = 'BULLISH';
    confidence = Math.min(0.95, 0.5 + (bullScore - bearScore) * 0.1);
  } else if (bearScore > bullScore + 1) {
    sentiment = 'BEARISH';
    confidence = Math.min(0.95, 0.5 + (bearScore - bullScore) * 0.1);
  }
  
  return { text, sentiment, confidence, scores: { positive, negative, neutral } };
}

// ================================
// FINBERT-POWERED SENTIMENT
// ================================

let pipeline: any = null;
let loadingPromise: Promise<any> | null = null;
let modelFailed = false;

async function loadFinBERTModel() {
  if (modelFailed) return null;
  if (pipeline) return pipeline;
  if (loadingPromise) return loadingPromise;
  
  loadingPromise = (async () => {
    try {
      const { pipeline: createPipeline } = await import('@huggingface/transformers');
      pipeline = await createPipeline(
        'text-classification',
        'Xenova/finbert', // Quantized FinBERT for browser
        { device: 'wasm' }
      );
      console.log('[SentimentEngine] FinBERT model loaded successfully');
      return pipeline;
    } catch (error) {
      console.warn('[SentimentEngine] FinBERT load failed, using rule-based fallback:', error);
      modelFailed = true;
      return null;
    }
  })();
  
  return loadingPromise;
}

async function finbertSentiment(text: string): Promise<SentimentResult> {
  const model = await loadFinBERTModel();
  
  if (!model) {
    return ruleBasedSentiment(text);
  }
  
  try {
    const result = await model(text.substring(0, 512), { topk: 3 });
    
    const scores = { positive: 0, negative: 0, neutral: 0 };
    result.forEach((r: any) => {
      if (r.label === 'positive') scores.positive = r.score;
      else if (r.label === 'negative') scores.negative = r.score;
      else scores.neutral = r.score;
    });
    
    let sentiment: SentimentResult['sentiment'] = 'NEUTRAL';
    let confidence = scores.neutral;
    
    if (scores.positive > scores.negative && scores.positive > scores.neutral) {
      sentiment = 'BULLISH';
      confidence = scores.positive;
    } else if (scores.negative > scores.positive && scores.negative > scores.neutral) {
      sentiment = 'BEARISH';
      confidence = scores.negative;
    }
    
    return { text, sentiment, confidence, scores };
  } catch (error) {
    console.warn('[SentimentEngine] FinBERT inference failed:', error);
    return ruleBasedSentiment(text);
  }
}

// ================================
// PUBLIC API
// ================================

/**
 * Analyze sentiment of a single text
 */
export async function analyzeSentiment(text: string, useFinBERT: boolean = true): Promise<SentimentResult> {
  if (useFinBERT) {
    return finbertSentiment(text);
  }
  return ruleBasedSentiment(text);
}

/**
 * Batch analyze multiple texts and aggregate results
 */
export async function batchAnalyzeSentiment(
  texts: string[],
  useFinBERT: boolean = true
): Promise<SentimentSummary> {
  const results = await Promise.all(
    texts.map(t => useFinBERT ? finbertSentiment(t) : Promise.resolve(ruleBasedSentiment(t)))
  );
  
  const bullishResults = results.filter(r => r.sentiment === 'BULLISH');
  const bearishResults = results.filter(r => r.sentiment === 'BEARISH');
  const neutralResults = results.filter(r => r.sentiment === 'NEUTRAL');
  
  // Weighted score: -1 (very bearish) to +1 (very bullish)
  const weightedScore = results.reduce((sum, r) => {
    const weight = r.confidence;
    if (r.sentiment === 'BULLISH') return sum + weight;
    if (r.sentiment === 'BEARISH') return sum - weight;
    return sum;
  }, 0) / Math.max(1, results.length);
  
  let overallSentiment: SentimentSummary['overallSentiment'] = 'NEUTRAL';
  if (weightedScore > 0.15) overallSentiment = 'BULLISH';
  else if (weightedScore < -0.15) overallSentiment = 'BEARISH';
  
  return {
    overallSentiment,
    overallScore: Math.round(weightedScore * 100) / 100,
    bullishCount: bullishResults.length,
    bearishCount: bearishResults.length,
    neutralCount: neutralResults.length,
    topBullish: bullishResults.sort((a, b) => b.confidence - a.confidence).slice(0, 3),
    topBearish: bearishResults.sort((a, b) => b.confidence - a.confidence).slice(0, 3),
    results
  };
}

/**
 * Format sentiment results for LLM context injection
 */
export function formatSentimentForLLM(summary: SentimentSummary): string {
  let context = `\n\n[FINBERT SENTIMENT ANALYSIS — PRE-COMPUTED]\n\n`;
  
  context += `**OVERALL SENTIMENT**: ${summary.overallSentiment} (Score: ${summary.overallScore > 0 ? '+' : ''}${summary.overallScore.toFixed(2)})\n`;
  context += `Distribution: ${summary.bullishCount} Bullish, ${summary.bearishCount} Bearish, ${summary.neutralCount} Neutral\n\n`;
  
  if (summary.topBullish.length > 0) {
    context += `**TOP BULLISH SIGNALS**:\n`;
    summary.topBullish.forEach(r => {
      context += `- [${(r.confidence * 100).toFixed(0)}%] "${r.text.substring(0, 100)}"\n`;
    });
    context += '\n';
  }
  
  if (summary.topBearish.length > 0) {
    context += `**TOP BEARISH SIGNALS**:\n`;
    summary.topBearish.forEach(r => {
      context += `- [${(r.confidence * 100).toFixed(0)}%] "${r.text.substring(0, 100)}"\n`;
    });
    context += '\n';
  }
  
  context += `USE THIS SENTIMENT DATA in your market analysis. The FinBERT model has classified ${summary.results.length} headlines.\n`;
  
  return context;
}

/**
 * Pre-warm the FinBERT model (call early for faster first inference)
 */
export function preWarmModel(): void {
  loadFinBERTModel().catch(() => {});
}
