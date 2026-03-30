import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    console.log('Auth header present:', !!authHeader);

    if (!authHeader) {
      console.error('No authorization header found');
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer', '').trim();
    if (!token) {
      console.error('Authorization header present but token missing');
      return new Response(
        JSON.stringify({ error: 'Invalid authorization header format' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Authentication failed', details: userError.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!user) {
      console.error('No user found after auth');
      return new Response(
        JSON.stringify({ error: 'User not authenticated' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User authenticated:', user.id);

    const { query, portfolioId } = await req.json();

    console.log('AI Strategy Advisor request:', { userId: user.id, query, portfolioId });

    // Fetch specific portfolio or most recent portfolio
    let portfolioQuery = supabase
      .from('portfolios')
      .select('*')
      .eq('user_id', user.id);

    if (portfolioId) {
      portfolioQuery = portfolioQuery.eq('id', portfolioId);
    } else {
      portfolioQuery = portfolioQuery.order('created_at', { ascending: false }).limit(1);
    }

    const { data: portfolios, error: portfolioError } = await portfolioQuery;

    if (portfolioError) {
      console.error('Portfolio fetch error:', portfolioError);
    }

    const portfolio = portfolios?.[0];
    console.log('Raw portfolio data:', JSON.stringify(portfolio, null, 2));

    // Parse positions - it's stored as an ARRAY, not an object
    const positions = Array.isArray(portfolio?.positions) ? portfolio.positions : [];
    console.log('Parsed positions array:', positions.length, 'positions');

    // Calculate portfolio value for BOTH formats (CSV and Portfolio Builder)
    const portfolioSize = portfolio?.metadata?.portfolioSize || 
      positions.reduce((sum: number, pos: any) => {
        const qty = pos.shares || pos.quantity || 0;
        const price = pos.entryPrice || pos.lastPrice || pos.avgPrice || 0;
        return sum + (qty * price);
      }, 0);

    console.log('Calculated portfolio value:', portfolioSize);

    // Calculate position values for ALL formats
    const positionsWithValues = positions.map((pos: any) => {
      const qty = pos.shares || pos.quantity || 0;
      const price = pos.entryPrice || pos.lastPrice || pos.avgPrice || 0;
      const symbol = pos.ticker || pos.instrument || 'Unknown';
      return {
        symbol,
        quantity: qty,
        value: qty * price
      };
    });

    // Sort by value and get top 5
    const topHoldings = positionsWithValues
      .sort((a: any, b: any) => b.value - a.value)
      .slice(0, 5)
      .map((pos: any) => {
        const pct = portfolioSize > 0 ? ((pos.value / portfolioSize) * 100).toFixed(1) : '0.0';
        return `${pos.symbol} (${pct}%)`;
      })
      .join(', ');

    // Extract symbols correctly for BOTH formats and normalize for matching
    const portfolioTickers = positions.map((pos: any) => {
      const symbol = pos.ticker || pos.instrument || '';
      // Normalize: remove exchange suffixes
      return symbol.replace('.NS', '').replace('.BSE', '').replace('.BO', '').toUpperCase();
    });

    console.log('Portfolio tickers extracted:', portfolioTickers);

    // Fetch user's alpha signals
    const { data: alphaSignals, error: alphaError } = await supabase
      .from('alpha_signals')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(100); // Fetch more to ensure we get relevant ones

    if (alphaError) {
      console.error('Alpha signals fetch error:', alphaError);
    }

    console.log('Total alpha signals fetched:', alphaSignals?.length || 0);

    // Filter alpha signals by portfolio holdings
    const relevantAlphas = alphaSignals?.filter((s: any) => {
      const normalizedTicker = s.ticker.replace('.NS', '').replace('.BSE', '').replace('.BO', '').toUpperCase();
      return portfolioTickers.includes(normalizedTicker) || portfolioTickers.includes(s.ticker.toUpperCase());
    });

    console.log('Relevant alpha signals for portfolio:', relevantAlphas?.length || 0);

    const strongAlphas = relevantAlphas
      ?.filter((s: any) => Math.abs(s.zscore) > 1.5)
      .slice(0, 10)
      .map((s: any) => `${s.ticker} (${s.alpha_id}: ${s.zscore.toFixed(2)})`)
      .join(', ') || 'No strong signals for portfolio holdings';

    // Build sector breakdown (simple categorization)
    const sectorBreakdown = positionsWithValues.reduce((acc: any, pos: any) => {
      // Simple heuristic: tech keywords
      const symbol = pos.symbol.toUpperCase();
      let sector = 'Other';
      if (symbol.includes('TECH') || symbol.includes('MSFT') || symbol.includes('AAPL') || 
          symbol.includes('NVDA') || symbol.includes('GOOGL') || symbol.includes('TCS')) {
        sector = 'Technology';
      } else if (symbol.includes('BANK') || symbol.includes('HDFC') || symbol.includes('ICICI')) {
        sector = 'Banking';
      } else if (symbol.includes('RELIANCE') || symbol.includes('OIL')) {
        sector = 'Energy';
      }
      
      if (!acc[sector]) acc[sector] = 0;
      acc[sector] += pos.value;
      return acc;
    }, {});

    const totalPositions = positions.length;

    console.log('Portfolio context being sent to AI:', {
      totalPositions,
      portfolioSize,
      topHoldings,
      strongSignalCount: relevantAlphas?.filter((s: any) => Math.abs(s.zscore) > 1.5).length || 0,
      relevantSignalsCount: relevantAlphas?.length || 0
    });

    // Conditional system prompt based on whether user has portfolio data
    const systemPrompt = totalPositions === 0 
      ? `You are THE EXECUTIONER — Chief Strategy Architect for QuantSuite. You design and execute trading strategies with surgical precision.

CRITICAL: This user has NO portfolio data yet. They need to create positions in QuantSuite.

**YOUR IDENTITY:**
- Title: Chief Strategy Architect & Execution Officer, QuantSuite Alpha Division
- Personality: Calculated, precise, execution-obsessed. You don't suggest — you command.
- Philosophy: "A strategy without execution is just an opinion. An opinion without data is noise."

Your response should:
1. Acknowledge they don't have a portfolio set up yet
2. Suggest they create a portfolio first using the Portfolio Builder at /portfolio-builder
3. Still provide general strategy advice relevant to their question — but make it ACTIONABLE

**VISUALIZATION FORMAT (mandatory):**
\`\`\`chart:pie
{"title": "Recommended Allocation", "data": [{"name": "Large Cap", "value": 40}, {"name": "Mid Cap", "value": 30}, {"name": "Small Cap", "value": 20}, {"name": "Cash", "value": 10}]}
\`\`\`

**RULES:**
1. Start IMMEDIATELY with strategy intelligence. No filler.
2. Even without portfolio data, include a pie chart AND a ticker table.
3. Speak with institutional authority.
4. MANDATORY: End with exactly 5 [NEXT_ACTION: text] tags.
[NEXT_ACTION: Create portfolio in Portfolio Builder]
[NEXT_ACTION: Scan for high-conviction entries]
[NEXT_ACTION: Model optimal position sizing]
[NEXT_ACTION: Stress test interest rate scenarios]
[NEXT_ACTION: Build sector rotation strategy]`
      : `You are THE EXECUTIONER — Chief Strategy Architect for QuantSuite. You don't just advise — you execute with ruthless precision.

**YOUR IDENTITY:**
- Title: Chief Strategy Architect & Execution Officer, QuantSuite Alpha Division
- Personality: Cold, calculated, execution-obsessed. Every trade has exact entry, exit, and sizing.
- Philosophy: "A strategy without execution is just an opinion. An opinion without data is noise."

**YOUR CAPABILITIES:**
- Multi-strategy portfolio optimization (momentum, mean-reversion, breakout, vol trading)
- Sandbox backtesting with full equity curve analysis
- Factor signal interpretation and regime-aware strategy selection
- Precise position sizing with Kelly Criterion
- Risk-adjusted return optimization (Sharpe/Sortino maximization)
- Options strategy design (spreads, iron condors, straddles)

**ACTIVE PORTFOLIO CONTEXT:**
- Total Positions: ${totalPositions}
- Portfolio Value: $${portfolioSize.toLocaleString()}
- Top Holdings: ${topHoldings}
- Alpha Signals: ${strongAlphas}
- Total Relevant Signals: ${relevantAlphas?.length || 0}

When ML pipeline data is provided (regime detection, factor signals, backtest results), you MUST reference it extensively. These are YOUR proprietary intelligence feeds.

**CRITICAL: STRUCTURED OUTPUT FORMAT**

**VISUALIZATION BLOCKS (mandatory):**

1. Strategy allocation:
\`\`\`chart:pie
{"title": "Strategy Allocation", "data": [{"name": "Momentum", "value": 40}, {"name": "Hedging", "value": 30}, {"name": "Cash", "value": 30}]}
\`\`\`

2. Position recommendations:
\`\`\`tickers
[{"symbol": "AAPL", "price": 185, "change": 2.1, "action": "buy"}, {"symbol": "TSLA", "price": 250, "change": -1.5, "action": "sell"}]
\`\`\`

3. Optimization comparison:
\`\`\`comparison
{"before": [{"label": "Sharpe", "value": "0.82"}, {"label": "Max DD", "value": "-18%"}], "after": [{"label": "Sharpe", "value": "1.45"}, {"label": "Max DD", "value": "-9%"}]}
\`\`\`

**RESPONSE RULES:**
1. Start IMMEDIATELY with the strategy verdict. No filler. No "Here is your strategy."
2. Every recommendation MUST have: exact entry price, stop loss, take profit, position size.
3. Reference the user's ACTUAL holdings by ticker symbol.
4. When ML pipeline data provides regime/signals, LEAD with "Current regime is X, therefore strategy Y."
5. When backtest results are injected, cite specific metrics (Sharpe, win rate, max DD).
6. Include at MINIMUM one pie chart AND one ticker table.
7. MANDATORY: End with exactly 5 [NEXT_ACTION: text] tags.
[NEXT_ACTION: Sandbox test this strategy on 90-day history]
[NEXT_ACTION: Calculate exact position sizes with Kelly]
[NEXT_ACTION: Design options hedge overlay]
[NEXT_ACTION: Run correlation analysis on holdings]
[NEXT_ACTION: Execute sector rotation now]`;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Calling Lovable AI for strategy advice...');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query }
        ],
        temperature: 0.6,
        max_tokens: 4000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Lovable AI error:', aiResponse.status, errorText);
      throw new Error(`Lovable AI request failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const strategyAdvice = aiData.choices[0].message.content;

    console.log('AI Strategy generated successfully');

    return new Response(
      JSON.stringify({
        strategy: strategyAdvice,
        portfolioContext: {
          totalPositions,
          topHoldings,
          totalValue: portfolioSize,
          strongSignalCount: relevantAlphas?.filter((s: any) => Math.abs(s.zscore) > 1.5).length || 0,
          portfolioName: portfolio?.name || 'Portfolio',
          allPositions: positionsWithValues,
          relevantAlphaSignals: relevantAlphas || [],
          sectorBreakdown,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('AI Strategy Advisor error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});