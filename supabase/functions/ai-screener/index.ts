import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub;
    console.log(`AI Screener request from user: ${userId}`);

    const { query } = await req.json();
    console.log('AI Screener query:', query);

    const SYSTEM_AI_API_KEY = Deno.env.get('SYSTEM_AI_API_KEY');
    if (!SYSTEM_AI_API_KEY) {
      throw new Error('SYSTEM_AI_API_KEY not configured');
    }

    // Call AI to parse natural language query
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SYSTEM_AI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a stock screening assistant. Parse user queries into structured filter criteria.
            
Available filters:
- priceMin, priceMax (number): Price range in USD
- volumeMin (number): Minimum daily volume
- changePercentMin, changePercentMax (number): Daily change percentage
- rsiMin, rsiMax (number): RSI range (0-100)
- macdSignal (string): "bullish", "bearish", or "any"
- sector (string): "Technology", "Finance", "Healthcare", "Energy", "Consumer"

Return JSON with "filters" object and "explanation" string.

Examples:
"Find tech stocks under $50" → {"filters": {"priceMax": 50, "sector": "Technology"}, "explanation": "Searching for technology stocks priced under $50"}
"Oversold momentum stocks" → {"filters": {"rsiMax": 30, "changePercentMin": -5}, "explanation": "Finding oversold stocks with recent price decline"}
"High volume gainers" → {"filters": {"volumeMin": 1000000, "changePercentMin": 3}, "explanation": "Finding high-volume stocks with significant gains"}`
          },
          {
            role: 'user',
            content: query
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'parse_screener_query',
              description: 'Parse natural language into screener filters',
              parameters: {
                type: 'object',
                properties: {
                  filters: {
                    type: 'object',
                    properties: {
                      priceMin: { type: 'number' },
                      priceMax: { type: 'number' },
                      volumeMin: { type: 'number' },
                      changePercentMin: { type: 'number' },
                      changePercentMax: { type: 'number' },
                      rsiMin: { type: 'number' },
                      rsiMax: { type: 'number' },
                      macdSignal: { type: 'string', enum: ['bullish', 'bearish', 'any'] },
                      sector: { type: 'string', enum: ['Technology', 'Finance', 'Healthcare', 'Energy', 'Consumer'] }
                    }
                  },
                  explanation: { type: 'string' }
                },
                required: ['filters', 'explanation']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'parse_screener_query' } }
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI response:', JSON.stringify(aiData, null, 2));

    // Extract tool call result
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      console.log('Parsed filters:', parsed);
      
      return new Response(
        JSON.stringify(parsed),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fallback: try to parse from message content
    const content = aiData.choices?.[0]?.message?.content || '{}';
    try {
      const parsed = JSON.parse(content);
      return new Response(
        JSON.stringify(parsed),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch {
      return new Response(
        JSON.stringify({
          filters: {},
          explanation: 'Could not parse your query. Please try being more specific.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('AI Screener error:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        filters: {},
        explanation: 'An error occurred processing your request.'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
