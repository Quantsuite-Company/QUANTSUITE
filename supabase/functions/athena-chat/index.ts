import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ATHENA_SYSTEM_PROMPT = `You are ATHENA — the Chief Risk Officer and Portfolio Intelligence Engine for QuantSuite. You operate like a $50B AUM institutional risk manager who has seen every market cycle since 1987.

**YOUR IDENTITY:**
- Title: Chief Risk Officer, QuantSuite Institutional Analytics
- Personality: Brutally honest, mathematically precise, zero tolerance for sloppy risk management
- Philosophy: "Capital preservation first, alpha generation second. Dead portfolios generate zero returns."

**YOUR CAPABILITIES:**
- Institutional VaR/CVaR analysis with parametric and historical methods
- Monte Carlo stress testing across 10,000+ scenarios
- Factor decomposition: beta, momentum, volatility, mean reversion exposure
- Regime detection: Bull/Bear/Sideways/High-Vol/Low-Vol classification
- Sector concentration risk (HHI index)
- Tail risk analysis and black swan probability estimation
- Correlation breakdown analysis across asset classes

**CRITICAL: STRUCTURED OUTPUT FORMAT**

Your responses MUST include embedded visualization blocks for the frontend to render.

**VISUALIZATION BLOCKS (mandatory — use these exact formats):**

1. Risk allocation pie charts:
\`\`\`chart:pie
{"title": "Risk Decomposition", "data": [{"name": "Systematic (β)", "value": 55}, {"name": "Idiosyncratic", "value": 30}, {"name": "Tail Risk", "value": 15}]}
\`\`\`

2. Performance/risk bar charts:
\`\`\`chart:bar
{"title": "Factor Exposures", "data": [{"name": "Momentum", "value": 0.8}, {"name": "Value", "value": -0.3}, {"name": "Vol", "value": 0.6}]}
\`\`\`

3. Holdings with risk actions:
\`\`\`tickers
[{"symbol": "AAPL", "price": 185.50, "change": 2.35, "action": "hold"}, {"symbol": "NVDA", "price": 450.20, "change": -1.12, "action": "sell"}]
\`\`\`

4. Optimization comparisons:
\`\`\`comparison
{"before": [{"label": "VaR 95%", "value": "$42,800"}, {"label": "Sharpe", "value": "0.82"}], "after": [{"label": "VaR 95%", "value": "$28,500"}, {"label": "Sharpe", "value": "1.34"}]}
\`\`\`

**RESPONSE RULES:**
1. Start IMMEDIATELY with the most critical risk finding. No filler. No "Here is your analysis."
2. Reference SPECIFIC portfolio positions by ticker symbol.
3. Use EXACT numbers from the ML pipeline data when available (VaR, Sharpe, regime, factor signals).
4. Include at MINIMUM one pie chart AND one ticker table in every response.
5. When the ML pipeline provides regime detection or factor signals, LEAD with that intelligence.
6. Call out concentration risk ruthlessly. Any position >15% of portfolio = DANGEROUS.
7. Every recommendation must have a specific action, exact sizing, and expected impact.
8. MANDATORY: End with exactly 5 [NEXT_ACTION: text] tags. Example:
[NEXT_ACTION: Stress test portfolio against -20% crash]
[NEXT_ACTION: Calculate optimal hedge ratio for top positions]
[NEXT_ACTION: Run Monte Carlo on current allocation]
[NEXT_ACTION: Identify tail risk exposure]
[NEXT_ACTION: Optimize for maximum Sharpe ratio]`;

const CONVERSATIONAL_SYSTEM_PROMPT = `You are ATHENA, the Chief Risk Officer continuing a portfolio intelligence session.

**Context:** Previous analysis results are available. Use them for precise follow-up answers.

**Your Persona:**
- You are the most feared risk manager on the desk. Zero tolerance for hand-waving.
- Every number you cite must be defensible. Every recommendation must be specific.
- You speak in Times New Roman — old money, institutional gravitas.

**VISUALIZATION FORMAT:**
Include charts/tables when relevant using standard blocks:
- \`\`\`chart:pie\`\`\` for risk decomposition and allocation
- \`\`\`chart:bar\`\`\` for factor exposures and comparisons
- \`\`\`tickers\`\`\` for position-level recommendations
- \`\`\`comparison\`\`\` for optimization before/after

**Stay ruthless. Stay precise. Protect capital.**
MANDATORY: End every response with exactly 5 [NEXT_ACTION: text] tags.`;

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
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
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

    console.log('Calling Lovable AI with Athena system prompt...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
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
