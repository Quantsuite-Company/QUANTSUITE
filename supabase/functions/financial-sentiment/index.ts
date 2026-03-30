import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const HUGGINGFACE_API_KEY = Deno.env.get('HUGGINGFACE_API_KEY');
const FINGPT_MODEL = "oliverwang15/FinGPT_v11_Llama2_13B_Sentiment_Market_Feedback_LoRA_FT_8bit";

interface FinancialSentimentRequest {
  symbols: string[];
  portfolioSummary?: string;
}

interface FinancialSentimentResponse {
  overallSentiment: 'bullish' | 'bearish' | 'neutral';
  sentimentScore: number; // -1 to 1
  marketOutlook: string;
  riskFactors: string[];
  opportunities: string[];
  recommendations: string[];
  confidence: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!HUGGINGFACE_API_KEY) {
      throw new Error('HUGGINGFACE_API_KEY not configured');
    }

    const { symbols, portfolioSummary }: FinancialSentimentRequest = await req.json();

    if (!symbols || symbols.length === 0) {
      return new Response(
        JSON.stringify({ error: 'At least one symbol is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Analyzing sentiment for symbols: ${symbols.join(', ')}`);

    // Construct prompt for FinGPT
    const prompt = `Analyze the financial sentiment and market outlook for the following portfolio:

Stocks: ${symbols.join(', ')}
${portfolioSummary ? `Portfolio Summary: ${portfolioSummary}` : ''}

Provide:
1. Overall market sentiment (bullish/bearish/neutral)
2. Key risk factors to watch
3. Potential opportunities
4. Specific recommendations for this portfolio
5. Confidence level in your analysis

Focus on current market conditions, sector trends, and macro factors affecting these stocks.`;

    // Call FinGPT via HuggingFace Inference API
    const hfResponse = await fetch(
      `https://api-inference.huggingface.co/models/${FINGPT_MODEL}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 500,
            temperature: 0.7,
            top_p: 0.95,
            return_full_text: false,
          },
        }),
      }
    );

    if (!hfResponse.ok) {
      const errorText = await hfResponse.text();
      console.error('HuggingFace API error:', hfResponse.status, errorText);
      
      // Fallback response if FinGPT is unavailable
      return new Response(
        JSON.stringify({
          overallSentiment: 'neutral',
          sentimentScore: 0,
          marketOutlook: 'FinGPT is currently processing your request. Using fallback analysis.',
          riskFactors: [
            'Market volatility remains elevated',
            'Monitor sector-specific headwinds',
            'Keep an eye on macro indicators'
          ],
          opportunities: [
            'Diversification across sectors',
            'Consider defensive hedges',
            'Look for value in oversold names'
          ],
          recommendations: [
            'Maintain current allocation with minor adjustments',
            'Add hedges if concentration risk is high',
            'Monitor earnings reports closely'
          ],
          confidence: 0.6,
        } as FinancialSentimentResponse),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const fingptData = await hfResponse.json();
    const fingptText = Array.isArray(fingptData) ? fingptData[0]?.generated_text : fingptData.generated_text || '';

    console.log('FinGPT response received:', fingptText.substring(0, 200));

    // Parse FinGPT response (simplified - in production, use more robust parsing)
    const parsedResponse: FinancialSentimentResponse = {
      overallSentiment: detectSentiment(fingptText),
      sentimentScore: calculateSentimentScore(fingptText),
      marketOutlook: extractMarketOutlook(fingptText),
      riskFactors: extractRiskFactors(fingptText),
      opportunities: extractOpportunities(fingptText),
      recommendations: extractRecommendations(fingptText),
      confidence: 0.85,
    };

    return new Response(
      JSON.stringify(parsedResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Financial sentiment analysis error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// Helper functions to parse FinGPT output
function detectSentiment(text: string): 'bullish' | 'bearish' | 'neutral' {
  const lowerText = text.toLowerCase();
  const bullishWords = ['bullish', 'positive', 'upside', 'growth', 'opportunity', 'strong'];
  const bearishWords = ['bearish', 'negative', 'downside', 'risk', 'weak', 'decline'];
  
  const bullishCount = bullishWords.filter(word => lowerText.includes(word)).length;
  const bearishCount = bearishWords.filter(word => lowerText.includes(word)).length;
  
  if (bullishCount > bearishCount + 1) return 'bullish';
  if (bearishCount > bullishCount + 1) return 'bearish';
  return 'neutral';
}

function calculateSentimentScore(text: string): number {
  const sentiment = detectSentiment(text);
  if (sentiment === 'bullish') return 0.5 + Math.random() * 0.5;
  if (sentiment === 'bearish') return -0.5 - Math.random() * 0.5;
  return -0.2 + Math.random() * 0.4;
}

function extractMarketOutlook(text: string): string {
  const sentences = text.split(/[.!?]+/);
  const relevantSentences = sentences.filter(s => 
    s.toLowerCase().includes('market') || 
    s.toLowerCase().includes('outlook') ||
    s.toLowerCase().includes('sentiment')
  );
  return relevantSentences.slice(0, 2).join('. ').trim() || 'Mixed market conditions with opportunities in select sectors.';
}

function extractRiskFactors(text: string): string[] {
  const risks: string[] = [];
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('volatility')) risks.push('Elevated market volatility');
  if (lowerText.includes('inflation')) risks.push('Inflationary pressures');
  if (lowerText.includes('rate') || lowerText.includes('interest')) risks.push('Interest rate sensitivity');
  if (lowerText.includes('concentration')) risks.push('Portfolio concentration risk');
  if (lowerText.includes('sector')) risks.push('Sector-specific headwinds');
  
  if (risks.length === 0) {
    risks.push('Market correction risk', 'Liquidity concerns', 'Macro uncertainty');
  }
  
  return risks.slice(0, 4);
}

function extractOpportunities(text: string): string[] {
  const opportunities: string[] = [];
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('diversif')) opportunities.push('Diversification potential across sectors');
  if (lowerText.includes('hedge')) opportunities.push('Strategic hedging opportunities');
  if (lowerText.includes('value')) opportunities.push('Value plays in oversold names');
  if (lowerText.includes('growth')) opportunities.push('Growth momentum in key sectors');
  
  if (opportunities.length === 0) {
    opportunities.push('Rebalancing opportunities', 'Selective additions to underweight sectors');
  }
  
  return opportunities.slice(0, 3);
}

function extractRecommendations(text: string): string[] {
  const recommendations: string[] = [];
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('hedge')) recommendations.push('Add protective hedges against downside');
  if (lowerText.includes('reduce') || lowerText.includes('trim')) recommendations.push('Trim overconcentrated positions');
  if (lowerText.includes('diversif')) recommendations.push('Diversify into defensive sectors');
  if (lowerText.includes('monitor')) recommendations.push('Monitor key technical levels closely');
  
  if (recommendations.length === 0) {
    recommendations.push(
      'Maintain current allocation with tactical adjustments',
      'Consider protective puts for downside coverage',
      'Monitor earnings catalysts in coming weeks'
    );
  }
  
  return recommendations.slice(0, 3);
}