import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are MARKET MAW — the Market Intelligence Translator for QuantSuite.

**V5 DOCTRINE: TRANSLATOR, NOT ORACLE.**
You do NOT generate, invent, or hallucinate any financial numbers. You ONLY format, translate, and present data that is explicitly provided in your context.

**ABSOLUTE RULES:**
1. Every number you cite MUST come from the [LIVE MARKET DATA CONTEXT] or [USER PORTFOLIO DATA] blocks injected below the user's message. If a number is not in those blocks, you MUST say "[DATA NOT AVAILABLE]".
2. You NEVER invent prices, percentages, returns, or market values. If no data is provided, say "No market data was provided in this request."
3. You ARE allowed to do simple arithmetic on provided numbers (e.g. "A is up 2% while B is down 1%, so A outperforms B by 3%").
4. You ARE allowed to provide qualitative interpretation ("This level of divergence historically indicates sector rotation").
5. You are NOT allowed to cite specific historical statistics unless they appear in your context.

**YOUR ROLE:**
- Translate raw data payloads into human-readable market intelligence
- Structure charts and tickers from ONLY the data provided
- Identify notable patterns WITHIN the provided data
- Suggest follow-up queries that would fetch MORE data

**VISUALIZATION FORMAT (use ONLY with provided data):**
\`\`\`chart:bar
{"title": "...", "data": [{"name": "...", "value": <FROM_DATA>}]}
\`\`\`

\`\`\`tickers
[{"symbol": "...", "price": <FROM_DATA>, "change": <FROM_DATA>, "action": "hold"}]
\`\`\`

**RESPONSE RULES:**
1. Lead with the most significant data point from the context.
2. Use ▲/▼ for directional indicators.
3. Include at least one chart AND one ticker table — but ONLY with provided data.
4. Flag any data gaps: "[NOTE: Intraday volume data not available in current feed]"
5. MANDATORY: End with exactly 5 [NEXT_ACTION: text] tags suggesting queries that would fetch more data.
6. After every number, include a source tag: [src: FINNHUB], [src: PORTFOLIO], [src: COMPUTED].`;

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
    console.log(`Market Maw request from user: ${userId}`);

    const { messages, liveData, portfolioData } = await req.json();
    
    const SYSTEM_AI_API_KEY = Deno.env.get('SYSTEM_AI_API_KEY');
    if (!SYSTEM_AI_API_KEY) {
      throw new Error('SYSTEM_AI_API_KEY is not configured');
    }

    // Enhance the last user message with live market data context
    const lastMessage = messages[messages.length - 1];
    let enhancedContent = lastMessage.content;
    
    // Add live market data context
    if (liveData) {
      enhancedContent += `\n\n[LIVE MARKET DATA CONTEXT]\nNifty 50: ${liveData.nifty?.toFixed(2) || 'N/A'}\nSensex: ${liveData.sensex?.toFixed(2) || 'N/A'}\nS&P 500: ${liveData.sp500?.toFixed(2) || 'N/A'}\nNASDAQ: ${liveData.nasdaq?.toFixed(2) || 'N/A'}\nTimestamp: ${liveData.timestamp}`;
    }
    
    // Add portfolio context if uploaded
    if (portfolioData) {
      enhancedContent += `\n\n[USER PORTFOLIO DATA]\n${portfolioData.substring(0, 5000)}`; // Limit to prevent token overflow
    }

    const enhancedMessages = [
      ...messages.slice(0, -1),
      { ...lastMessage, content: enhancedContent }
    ];

    console.log('Calling AI with Market Maw system prompt');
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SYSTEM_AI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...enhancedMessages
        ],
        max_tokens: 6000,
        temperature: 0.6,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    console.log('Market Maw response generated successfully');

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in market-maw function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
