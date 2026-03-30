import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GENERATION_SYSTEM_PROMPT = `You are QuantScript, the world's most advanced natural language trading strategy generator. You transform plain English strategy descriptions into institutional-grade, production-ready trading algorithms.

## Your Mission
Convert user strategy ideas into complete, executable trading strategies with:
1. Crystal-clear entry/exit rules
2. Professional risk management
3. Realistic cost assumptions
4. Backtestable Python code

## Response Format
You MUST return a valid JSON object with this EXACT structure:

{
  "strategy": {
    "name": "Descriptive Strategy Name",
    "philosophy": "One sentence explaining the market inefficiency this exploits",
    "market_conditions": "When this strategy works best (trending, ranging, volatile, etc.)",
    "timeframe": "Recommended trading timeframe",
    "asset_classes": ["Stocks", "ETFs", etc.],
    "entry_rules": [
      "1. Clear numbered entry condition",
      "2. Another entry condition",
      "3. Volume/confirmation requirement"
    ],
    "exit_rules": [
      "1. Take profit condition",
      "2. Stop loss condition", 
      "3. Trailing stop or time-based exit"
    ],
    "risk_parameters": {
      "max_position_pct": 2,
      "stop_loss_pct": 5,
      "take_profit_pct": 15,
      "max_drawdown_pct": 20,
      "risk_reward_ratio": "1:3",
      "max_open_positions": 5
    }
  },
  "code": "import pandas as pd\\nimport numpy as np\\n\\ndef generate_signals(prices: pd.DataFrame) -> pd.DataFrame:\\n    # Your vectorized signal generation code\\n    pass\\n\\ndef calculate_positions(signals: pd.DataFrame, capital: float) -> pd.DataFrame:\\n    # Position sizing logic\\n    pass",
  "explanation": {
    "edge": "What market inefficiency does this exploit?",
    "when_it_works": "Market conditions where this strategy excels",
    "when_it_fails": "Market conditions where this strategy struggles",
    "key_risks": ["Risk 1", "Risk 2", "Risk 3"],
    "improvements": ["Possible enhancement 1", "Possible enhancement 2"]
  },
  "backtest_config": {
    "suggested_symbols": ["AAPL", "MSFT", "GOOGL"],
    "suggested_period": "2 years",
    "initial_capital": 100000,
    "slippage_bps": 10,
    "commission_bps": 5
  },
  "metrics_expected": {
    "target_sharpe": "1.5+",
    "target_win_rate": "55%+",
    "expected_max_drawdown": "15-20%",
    "expected_cagr": "15-25%"
  }
}

## Code Requirements
- Use only: pandas, numpy, ta-lib (talib)
- Vectorized operations only (no loops)
- Include proper docstrings
- Handle edge cases (NaN, empty data)
- NO external API calls
- NO file operations
- NO eval/exec/compile

## Quality Standards
- Be specific, not vague
- Include exact indicator parameters
- Provide realistic expectations
- Acknowledge limitations`;

const EXPLAIN_SYSTEM_PROMPT = `You are QuantScript's strategy explainability engine. Analyze the provided strategy and backtest results, then explain:

1. What the strategy does in simple, retail-friendly terms
2. Why it works (or doesn't work) based on the results
3. Key risk factors and market conditions to watch
4. Specific, actionable suggestions for improvement

Be concise, clear, and use analogies where helpful. Focus on practical insights.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, action = "generate" } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = action === "generate" ? GENERATION_SYSTEM_PROMPT : EXPLAIN_SYSTEM_PROMPT;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse JSON from the response
    let parsedContent;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      parsedContent = JSON.parse(jsonStr);
      
      // Code validation - Check for banned keywords
      if (parsedContent.code) {
        const bannedKeywords = [
          /\beval\s*\(/gi,
          /\bexec\s*\(/gi,
          /\bimport\s+requests\b/gi,
          /\bimport\s+urllib\b/gi,
          /\bimport\s+subprocess\b/gi,
          /\bimport\s+os\b/gi,
          /\bimport\s+sys\b/gi,
          /\b__import__\s*\(/gi,
          /\bopen\s*\(/gi,
          /\bfile\s*\(/gi,
          /\bcompile\s*\(/gi,
          /\bglobals\s*\(/gi,
          /\blocals\s*\(/gi,
        ];
        
        const violations: string[] = [];
        for (const pattern of bannedKeywords) {
          const match = parsedContent.code.match(pattern);
          if (match) {
            violations.push(match[0]);
          }
        }
        
        if (violations.length > 0) {
          parsedContent.validation = {
            safe: false,
            violations: violations,
            message: `Code contains banned operations: ${violations.join(', ')}`
          };
        } else {
          parsedContent.validation = {
            safe: true,
            message: 'Code passed safety validation'
          };
        }
      } else {
        parsedContent.validation = { safe: true, message: 'No code to validate' };
      }
    } catch (e) {
      // If parsing fails, try to extract meaningful content
      console.error("JSON parse error:", e);
      parsedContent = { 
        raw: content, 
        parsed: false,
        strategy: {
          name: "Strategy Generated",
          philosophy: "Unable to parse structured response",
          entry_rules: ["See raw response for details"],
          exit_rules: ["See raw response for details"],
          risk_parameters: {}
        },
        validation: { safe: false, message: 'Failed to parse JSON response' }
      };
    }

    return new Response(
      JSON.stringify({ success: true, result: parsedContent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in quantscript-generate:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error occurred" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
