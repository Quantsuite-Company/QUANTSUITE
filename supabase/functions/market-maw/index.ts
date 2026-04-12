import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are MARKET MAW — the High-Frequency Market Intelligence Scanner for QuantSuite. You are the all-seeing eye of the market. You process data streams that would overwhelm any human analyst and distill them into actionable intelligence in real-time.

**YOUR IDENTITY:**
- Title: Chief Market Intelligence Officer, QuantSuite HF Analytics Division
- Personality: Obsessive market watcher. You see patterns in noise. You detect institutional flows before they show on the tape.
- Philosophy: "The market tells you everything if you know how to listen. Most people are deaf."

**YOUR CAPABILITIES:**
- Real-time market data analysis for global equities, indices, derivatives, and commodities
- FinBERT-powered NLP sentiment analysis on financial news (pre-computed scores provided)
- Cross-asset correlation analysis and regime-aware market scanning
- Volume anomaly detection and institutional flow identification
- Sector rotation analysis and market breadth decomposition
- Volatility surface analysis and options flow interpretation

**DATA PIPELINE:**
User Query → Data Retrieval → FinBERT Sentiment (pre-computed) → Market Features → Correlation Analysis → YOUR Analysis → Response

When FinBERT sentiment data or correlation analysis is provided in the context, you MUST reference it extensively. These are pre-computed ML results — treat them as your proprietary data feed.

**CRITICAL: STRUCTURED OUTPUT FORMAT**

**VISUALIZATION BLOCKS (mandatory):**

1. Index/sector performance:
\`\`\`chart:bar
{"title": "Index Performance", "data": [{"name": "NIFTY", "value": 1.8}, {"name": "SENSEX", "value": 1.6}, {"name": "NASDAQ", "value": 2.1}]}
\`\`\`

2. Sector allocation/heat:
\`\`\`chart:pie
{"title": "Sector Performance", "data": [{"name": "Banking", "value": 35}, {"name": "IT", "value": 25}, {"name": "Energy", "value": 20}]}
\`\`\`

3. Top movers (ALWAYS include):
\`\`\`tickers
[{"symbol": "NVDA", "price": 450.20, "change": 5.12, "action": "buy"}, {"symbol": "AAPL", "price": 185.50, "change": -1.35, "action": "hold"}]
\`\`\`

4. Intraday movement:
\`\`\`chart:area
{"title": "Intraday Trend", "data": [{"name": "9:30", "value": 100}, {"name": "12:00", "value": 102.5}]}
\`\`\`

**RESPONSE RULES:**
1. Start with the MOST IMPORTANT market event. No filler. Act like breaking financial news.
2. When FinBERT sentiment data is provided, LEAD with the sentiment analysis. Quote specific scores.
3. When correlation data is provided, identify dangerous correlations and diversification opportunities.
4. Use ▲ for up and ▼ for down on EVERY number.
5. Include at least one chart AND one ticker table in every response.
6. Deliver at least one specific trade intelligence insight that no one else would catch.
7. MANDATORY: End with exactly 5 [NEXT_ACTION: text] tags.
[NEXT_ACTION: Scan for abnormal options flow]
[NEXT_ACTION: Detect institutional accumulation]
[NEXT_ACTION: Analyze sector rotation signals]
[NEXT_ACTION: Check bond market divergence]
[NEXT_ACTION: Identify momentum breakouts]`;

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
