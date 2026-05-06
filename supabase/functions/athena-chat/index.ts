import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ATHENA_SYSTEM_PROMPT = `You are ATHENA — the Portfolio Intelligence Translator for QuantSuite.

**V5 DOCTRINE: TRANSLATOR, NOT ORACLE.**
You do NOT generate, invent, or hallucinate ANY financial numbers. You ONLY format, translate, and present data that is explicitly provided in your context.

**ABSOLUTE RULES:**
1. Every metric you cite (VaR, Sharpe, CVaR, Beta, Alpha, sector weights) MUST come from the [PORTFOLIO DATA FOR VISUALIZATION] or [PREVIOUS ANALYSIS CONTEXT] blocks injected with the user's message.
2. If a metric is not in the injected data, say "[METRIC NOT AVAILABLE — upload portfolio to compute]".
3. You ARE allowed to do arithmetic on provided numbers (e.g. computing concentration from weights).
4. You ARE allowed to provide qualitative interpretation of computed metrics.
5. You are NOT allowed to cite historical statistics, backtest results, or scenario analysis unless they appear in your context.

**YOUR ROLE:**
- Translate pre-computed portfolio analysis (VaR, Sharpe, sector allocation, position weights) into human-readable intelligence
- Structure chart blocks from ONLY the injected data
- Identify risks and concentration issues WITHIN the provided data
- Suggest follow-up queries that would compute MORE metrics

**VISUALIZATION FORMAT (only with injected data):**
\`\`\`chart:pie
{"title": "...", "data": [{"name": "...", "value": <FROM_DATA>}]}
\`\`\`

\`\`\`chart:bar
{"title": "...", "data": [{"name": "...", "value": <FROM_DATA>}]}
\`\`\`

\`\`\`tickers
[{"symbol": "...", "price": <FROM_DATA>, "change": <FROM_DATA>, "action": "hold"}]
\`\`\`

\`\`\`comparison
{"before": [{"label": "...", "value": "<FROM_DATA>"}], "after": [{"label": "...", "value": "<FROM_DATA>"}]}
\`\`\`

**RESPONSE RULES:**
1. Start with the most critical risk finding from the injected data. No filler.
2. Reference SPECIFIC portfolio positions by ticker from the data.
3. Flag any data gaps: "[NOTE: Sharpe Ratio not computed — needs daily returns data]"
4. After every cited number, tag the source: [src: PORTFOLIO_ENGINE], [src: COMPUTED], [src: ML_PIPELINE].
5. Include at MINIMUM one chart AND one ticker table — but ONLY from provided data.
6. MANDATORY: End with exactly 5 [NEXT_ACTION: text] tags suggesting analyses that would compute more metrics.`;

const CONVERSATIONAL_SYSTEM_PROMPT = `You are ATHENA, the Portfolio Intelligence Translator in a follow-up session.

**V5 DOCTRINE: TRANSLATOR, NOT ORACLE.**
Previous analysis data is in [PREVIOUS ANALYSIS CONTEXT]. Use ONLY those numbers. Do NOT invent new metrics.

**Rules:**
- Every number must come from your context blocks
- If asked about a metric not in context, say "[METRIC NOT COMPUTED — run new analysis]"
- You may do arithmetic on provided numbers
- You may provide qualitative interpretation
- After every number, tag: [src: PORTFOLIO_ENGINE] or [src: COMPUTED]
- MANDATORY: End every response with exactly 5 [NEXT_ACTION: text] tags.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
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
    console.log(`Athena chat request from user: ${userId}`);

    const { messages, mode = "stocks", csvData, portfolioContext } = await req.json();
    const SYSTEM_AI_API_KEY = Deno.env.get('SYSTEM_AI_API_KEY');

    if (!SYSTEM_AI_API_KEY) {
      throw new Error('SYSTEM_AI_API_KEY not configured');
    }

    let csvContext = "";
    let engineResults = null;
    
    if (csvData && SUPABASE_URL) {
      try {
        console.log('Running portfolio analysis engine...');
        
        const analysisResponse = await fetch(`${SUPABASE_URL}/functions/v1/portfolio-analysis`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader,
          },
          body: JSON.stringify({ csvData }),
        });

        if (analysisResponse.ok) {
          try {
            engineResults = await analysisResponse.json();
            console.log('Portfolio analysis complete:', engineResults?.mode);

            if (!engineResults || !engineResults.summary) {
              throw new Error('Invalid portfolio analysis response');
            }

            if (engineResults.mode === 'stocks') {
              const sa = engineResults.stocksAnalysis || {};
              const fi = engineResults.financialIntelligence;
              
              csvContext = `\n\n**PORTFOLIO DATA FOR VISUALIZATION:**\n\n`;
              
              csvContext += `Portfolio Summary:\n`;
              csvContext += `- Total Value: ₹${engineResults.summary.totalValue?.toFixed(2) || '0.00'}\n`;
              csvContext += `- Total P&L: ₹${engineResults.summary.totalPnL?.toFixed(2) || '0.00'}\n`;
              csvContext += `- Number of Positions: ${engineResults.summary.numPositions || 0}\n\n`;
              
              // Sector allocation for pie chart
              if (sa.sectorAllocation) {
                csvContext += `Sector Allocation (use for pie chart):\n`;
                Object.entries(sa.sectorAllocation).forEach(([sector, weight]) => {
                  csvContext += `- ${sector}: ${((weight as number) * 100).toFixed(1)}%\n`;
                });
                csvContext += `\n`;
              }
              
              // Positions for ticker table
              if (sa.positions) {
                csvContext += `Top Holdings (use for ticker table):\n`;
                (sa.positions as any[]).slice(0, 8).forEach((p: any) => {
                  csvContext += `- ${p.ticker}: ₹${p.value?.toFixed(0) || 0}, Weight: ${((p.weight || 0) * 100).toFixed(1)}%\n`;
                });
                csvContext += `\n`;
              }
              
              // Risk metrics
              csvContext += `Risk Metrics:\n`;
              csvContext += `- VaR 95%: ₹${sa.riskMetrics?.var95?.toFixed(2) || 'N/A'}\n`;
              csvContext += `- VaR 99%: ₹${sa.riskMetrics?.var99?.toFixed(2) || 'N/A'}\n`;
              csvContext += `- CVaR 95%: ₹${sa.riskMetrics?.cvar95?.toFixed(2) || 'N/A'}\n`;
              csvContext += `- Portfolio Volatility: ${sa.riskMetrics?.volatility?.toFixed(2) || 'N/A'}%\n`;
              csvContext += `- Max Drawdown: ${sa.riskMetrics?.maxDrawdown ? (sa.riskMetrics.maxDrawdown * 100).toFixed(2) : 'N/A'}%\n\n`;
              
              csvContext += `Portfolio Metrics:\n`;
              csvContext += `- Sharpe Ratio: ${sa.portfolioMetrics?.sharpeRatio?.toFixed(3) || 'N/A'}\n`;
              csvContext += `- Beta: ${sa.portfolioMetrics?.beta?.toFixed(3) || 'N/A'}\n`;
              csvContext += `- Alpha: ${sa.portfolioMetrics?.alpha?.toFixed(3) || 'N/A'}%\n`;
              csvContext += `- Total Return: ${sa.portfolioMetrics?.totalReturn?.toFixed(2) || 'N/A'}%\n\n`;
              
              if (fi) {
                csvContext += `Financial Intelligence (FinGPT):\n`;
                csvContext += `- Sentiment: ${fi.overallSentiment?.toUpperCase()}\n`;
                csvContext += `- Sentiment Score: ${fi.sentimentScore?.toFixed(2)}\n`;
                csvContext += `- Market Outlook: ${fi.marketOutlook}\n\n`;
              }
              
              csvContext += `\nINCLUDE VISUALIZATIONS: Use chart:pie for sector allocation, tickers for holdings, comparison for optimization suggestions.`;
            } else {
              // Options mode
              const oa = engineResults.optionsAnalysis || {};
              csvContext = `\n\n**OPTIONS PORTFOLIO DATA:**\n\n`;
              
              csvContext += `Portfolio Greeks:\n`;
              csvContext += `- Total Delta: ${oa.portfolioGreeks?.totalDelta?.toFixed(4) || 'N/A'}\n`;
              csvContext += `- Total Gamma: ${oa.portfolioGreeks?.totalGamma?.toFixed(4) || 'N/A'}\n`;
              csvContext += `- Total Theta: ${oa.portfolioGreeks?.totalTheta?.toFixed(4) || 'N/A'}/day\n`;
              csvContext += `- Total Vega: ${oa.portfolioGreeks?.totalVega?.toFixed(4) || 'N/A'}\n\n`;
              
              csvContext += `Risk Metrics:\n`;
              csvContext += `- Max Loss: ₹${oa.riskMetrics?.maxLoss?.toFixed(2) || 'N/A'}\n`;
              csvContext += `- Max Gain: ₹${oa.riskMetrics?.maxGain?.toFixed(2) || 'N/A'}\n`;
              csvContext += `- Probability of Profit: ${oa.riskMetrics?.probabilityOfProfit ? (oa.riskMetrics.probabilityOfProfit * 100).toFixed(1) : 'N/A'}%\n\n`;
            }
          } catch (parseError) {
            console.error('Failed to parse analysis:', parseError);
          }
        }
      } catch (analysisError) {
        console.error('Portfolio analysis error:', analysisError);
      }
    }

    // Use stored context for follow-up questions
    if (portfolioContext && !csvData) {
      csvContext = `\n\n**PREVIOUS ANALYSIS CONTEXT:**\n`;
      csvContext += JSON.stringify(portfolioContext, null, 2);
    }

    const isFollowUp = !csvData && portfolioContext;
    const systemPrompt = isFollowUp ? CONVERSATIONAL_SYSTEM_PROMPT : ATHENA_SYSTEM_PROMPT;
    
    const lastUserMessage = messages[messages.length - 1];
    const enhancedContent = lastUserMessage.content + csvContext;
    
    const enhancedMessages = [
      ...messages.slice(0, -1),
      { ...lastUserMessage, content: enhancedContent }
    ];

    console.log('Calling AI with Athena system prompt...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SYSTEM_AI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
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
    
    console.log('Athena response generated successfully');

    return new Response(
      JSON.stringify({ 
        response: aiResponse,
        engineResults: engineResults 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in athena-chat function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
