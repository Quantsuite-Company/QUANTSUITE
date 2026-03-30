import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

interface SentimentRequest {
  headlines: string[];
  symbol?: string;
}

interface SentimentAnalysis {
  overallSentiment: number;
  confidence: number;
  keyThemes: string[];
  riskFlags: string[];
  summary: string;
  symbol?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const { headlines, symbol }: SentimentRequest = await req.json();

    if (!headlines || headlines.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No headlines provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[QuantSuite] Analyzing sentiment for ${symbol || 'market'}: ${headlines.length} headlines`);

    // Call Lovable AI for sentiment analysis
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are QuantSuite's financial sentiment analyzer. Analyze news headlines and extract structured sentiment data for quantitative trading.`
          },
          {
            role: 'user',
            content: `Analyze these financial headlines${symbol ? ` for ${symbol}` : ''}:\n\n${headlines.join('\n')}`
          }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'analyze_sentiment',
            description: 'Return structured sentiment analysis',
            parameters: {
              type: 'object',
              properties: {
                overallSentiment: { 
                  type: 'number', 
                  description: 'Sentiment score from -1 (very bearish) to 1 (very bullish)' 
                },
                confidence: { 
                  type: 'number', 
                  description: 'Confidence in the analysis from 0 to 1' 
                },
                keyThemes: { 
                  type: 'array', 
                  items: { type: 'string' },
                  description: 'Main themes extracted from headlines (3-5 items)'
                },
                riskFlags: { 
                  type: 'array', 
                  items: { type: 'string' },
                  description: 'Potential risk factors identified'
                },
                summary: {
                  type: 'string',
                  description: 'Brief 1-2 sentence summary of overall sentiment'
                }
              },
              required: ['overallSentiment', 'confidence', 'keyThemes', 'riskFlags', 'summary']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'analyze_sentiment' } }
      })
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Lovable AI credits exhausted. Please add funds.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    
    // Extract tool call result
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No sentiment analysis returned from AI');
    }

    const analysis: SentimentAnalysis = JSON.parse(toolCall.function.arguments);
    analysis.symbol = symbol;

    console.log(`[QuantSuite] Sentiment analysis complete: ${analysis.overallSentiment.toFixed(2)} (${(analysis.confidence * 100).toFixed(0)}% confidence)`);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[QuantSuite] Sentiment analysis error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        fallback: {
          overallSentiment: 0,
          confidence: 0,
          keyThemes: [],
          riskFlags: ['Analysis unavailable'],
          summary: 'Sentiment analysis temporarily unavailable'
        }
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
