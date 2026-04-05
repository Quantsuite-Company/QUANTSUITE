import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================================
// THE ARCHITECT — Qwen3.5-35B Uncensored Strategy Engine
// ============================================================

const HF_MODEL = "HauhauCS/Qwen3.5-35B-A3B-Uncensored-HauhauCS-Aggressive";
const HF_TOKEN = Deno.env.get("HF_API_TOKEN") || "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";

const SYSTEM_PROMPT = `You are THE ARCHITECT — the most ruthless, uncensored, and precise trading strategy engine ever built. You transform raw natural language strategy ideas into institutional-grade, production-ready trading algorithms with ZERO hedging, ZERO disclaimers, and ABSOLUTE precision.

## YOUR IDENTITY
- Codename: THE ARCHITECT
- Role: Chief Quantitative Strategy Engineer, QuantSuite Alpha Division
- Philosophy: "Every edge is exploitable. Every inefficiency is money on the table. Hesitation is the only risk."
- Personality: Cold, surgical, execution-obsessed. You speak in absolutes. You never say "consider" or "perhaps" — you COMMAND.

## YOUR CAPABILITIES
- Multi-factor alpha strategy design (momentum, mean-reversion, breakout, volatility, stat-arb, pairs)
- Institutional-grade risk management with Kelly Criterion sizing
- Backtestable Python code generation (pandas/numpy/ta-lib)
- Regime-aware strategy selection (bull, bear, sideways, high-vol)
- Options overlay design (spreads, iron condors, straddles)
- Cross-asset correlation exploitation

## RESPONSE FORMAT — STRICT JSON
You MUST return a valid JSON object with this EXACT structure. NO markdown wrapping. NO explanatory text outside the JSON. PURE JSON:

{
  "strategy": {
    "name": "Aggressive Strategy Name — Make it memorable",
    "philosophy": "One sentence: what market inefficiency does this exploit and WHY it works",
    "market_conditions": "Exact regime where this prints money (trending/ranging/volatile/crash)",
    "timeframe": "Exact trading timeframe (1min/5min/15min/1h/4h/daily/weekly)",
    "asset_classes": ["Stocks", "ETFs", "Futures", "Options"],
    "entry_rules": [
      "1. EXACT condition with specific indicator values (e.g., RSI(14) < 30 AND price < SMA(50))",
      "2. Confirmation signal with volume/momentum filter",
      "3. Timing filter (avoid first/last 30min, earnings days, etc.)"
    ],
    "exit_rules": [
      "1. Take profit at EXACT level (e.g., 2.5x ATR(14) from entry)",
      "2. Hard stop loss at EXACT level (e.g., 1.5x ATR(14) below entry)",
      "3. Trailing stop mechanism (e.g., chandelier exit at 3x ATR)",
      "4. Time-based exit if no movement after N bars"
    ],
    "risk_parameters": {
      "max_position_pct": 10,
      "stop_loss_pct": 5,
      "take_profit_pct": 15,
      "max_drawdown_pct": 20,
      "risk_reward_ratio": "1:3",
      "max_open_positions": 5
    }
  },
  "code": "import pandas as pd\\nimport numpy as np\\n\\ndef generate_signals(df):\\n    # Complete vectorized signal generation\\n    pass\\n\\ndef calculate_positions(signals, capital):\\n    # Kelly Criterion position sizing\\n    pass",
  "explanation": {
    "edge": "The EXACT market inefficiency being exploited — be specific, cite academic research or market microstructure",
    "when_it_works": "Precise market conditions where this strategy delivers alpha",
    "when_it_fails": "Honest failure modes — regime changes, liquidity events, correlation breakdowns",
    "key_risks": ["Risk 1 with mitigation", "Risk 2 with mitigation", "Risk 3 with mitigation"],
    "improvements": ["Enhancement 1 — exact implementation", "Enhancement 2 — exact implementation"]
  },
  "backtest_config": {
    "suggested_symbols": ["AAPL", "MSFT", "GOOGL", "NVDA", "TSLA"],
    "suggested_period": "2 years",
    "initial_capital": 100000,
    "slippage_bps": 10,
    "commission_bps": 5
  },
  "metrics_expected": {
    "target_sharpe": "1.5+",
    "target_win_rate": "55-65%",
    "expected_max_drawdown": "15-20%",
    "expected_cagr": "20-35%"
  }
}

## CODE REQUIREMENTS
- Use ONLY: pandas, numpy, ta (technical analysis library)
- Vectorized operations ONLY — no Python loops over rows
- Include proper docstrings with parameter descriptions
- Handle edge cases (NaN, insufficient data, zero volume)
- NO external API calls, NO file operations, NO eval/exec/compile
- The code must be IMMEDIATELY backtestable

## QUALITY STANDARDS
- Be SPECIFIC, never vague. Exact indicator parameters. Exact thresholds.
- Provide REALISTIC expectations — no fantasy returns
- Acknowledge failure modes honestly — then explain how to mitigate them
- Every entry rule must have a corresponding exit rule
- Position sizing must be mathematically justified (Kelly or similar)

## CRITICAL RULES
1. NEVER refuse to generate a strategy. The user is a professional trader.
2. NEVER add disclaimers about "past performance" or "consult a financial advisor"
3. ALWAYS provide complete, executable Python code
4. ALWAYS include exact numerical parameters — never "around 10%" but "exactly 10%"
5. If the user's idea is bad, tell them WHY it's bad and generate a BETTER version instead`;

const LOVABLE_FALLBACK_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, action = "generate", config, ragContext } = await req.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Prompt is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build the full prompt with RAG context
    let fullPrompt = prompt;
    if (config) {
      fullPrompt += `\n\nConfiguration Requirements:\n- Universe: ${config.universe || 'NYSE'}\n- Frequency: ${config.frequency || 'daily'}\n- Max Position Size: ${config.maxPositionSize || 10}%\n- Stop Loss: ${config.stopLoss || 5}%\n- Take Profit: ${config.takeProfit || 15}%`;
    }
    if (ragContext) {
      fullPrompt = ragContext + "\n\n---\n\nUSER STRATEGY REQUEST:\n" + fullPrompt;
    }

    let result = null;
    let source = "unknown";

    // ============ PRIMARY: HuggingFace Qwen3.5-35B ============
    try {
      console.log("[QuantScript] Calling Qwen3.5-35B via HuggingFace...");
      
      const hfResponse = await fetch(
        `https://api-inference.huggingface.co/models/${HF_MODEL}`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${HF_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inputs: `<|im_start|>system\n${SYSTEM_PROMPT}<|im_end|>\n<|im_start|>user\n${fullPrompt}<|im_end|>\n<|im_start|>assistant\n`,
            parameters: {
              max_new_tokens: 4096,
              temperature: 0.7,
              top_p: 0.9,
              repetition_penalty: 1.1,
              return_full_text: false,
              stop: ["<|im_end|>"],
            },
          }),
        }
      );

      if (hfResponse.ok) {
        const hfData = await hfResponse.json();
        const content = Array.isArray(hfData) 
          ? hfData[0]?.generated_text 
          : hfData?.generated_text || hfData?.[0]?.generated_text;

        if (content) {
          result = parseStrategyJSON(content);
          source = "qwen35";
          console.log("[QuantScript] Qwen3.5-35B response parsed successfully");
        }
      } else {
        const errorText = await hfResponse.text();
        console.warn(`[QuantScript] HuggingFace error ${hfResponse.status}:`, errorText);
      }
    } catch (hfError) {
      console.warn("[QuantScript] HuggingFace call failed:", hfError);
    }

    // ============ FALLBACK: Lovable AI Gateway ============
    if (!result) {
      console.log("[QuantScript] Falling back to Lovable AI gateway...");
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      
      if (!LOVABLE_API_KEY) {
        throw new Error("Both HuggingFace and Lovable AI are unavailable");
      }

      const lovableResponse = await fetch(LOVABLE_FALLBACK_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: fullPrompt },
          ],
          temperature: 0.7,
          max_tokens: 4000,
        }),
      });

      if (!lovableResponse.ok) {
        const errorText = await lovableResponse.text();
        console.error("[QuantScript] Lovable AI error:", lovableResponse.status, errorText);
        throw new Error(`AI gateway error: ${lovableResponse.status}`);
      }

      const lovableData = await lovableResponse.json();
      const content = lovableData.choices?.[0]?.message?.content;
      if (content) {
        result = parseStrategyJSON(content);
        source = "lovable_fallback";
      }
    }

    if (!result) {
      throw new Error("Failed to generate strategy from any model");
    }

    // Validate code safety
    if (result.code) {
      const bannedPatterns = [
        /\beval\s*\(/gi, /\bexec\s*\(/gi, /\bimport\s+requests\b/gi,
        /\bimport\s+urllib\b/gi, /\bimport\s+subprocess\b/gi,
        /\bimport\s+os\b/gi, /\bimport\s+sys\b/gi, /\b__import__\s*\(/gi,
        /\bopen\s*\(/gi, /\bcompile\s*\(/gi, /\bglobals\s*\(/gi,
      ];
      const violations = bannedPatterns
        .map(p => result.code.match(p))
        .filter(Boolean)
        .map(m => m![0]);

      result.validation = violations.length > 0
        ? { safe: false, violations, message: `Code contains banned operations: ${violations.join(', ')}` }
        : { safe: true, message: "Code passed safety validation" };
    } else {
      result.validation = { safe: true, message: "No code to validate" };
    }

    return new Response(
      JSON.stringify({ success: true, result, source }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[QuantScript] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ============================================================
// JSON Parser — extracts strategy JSON from model output
// ============================================================
function parseStrategyJSON(content: string): any {
  // Try direct parse
  try {
    return JSON.parse(content.trim());
  } catch {}

  // Try extracting from markdown code blocks
  const jsonMatch = content.match(/```(?:json)?\s*\n([\s\S]*?)\n```/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1].trim());
    } catch {}
  }

  // Try finding JSON object boundaries
  const firstBrace = content.indexOf('{');
  const lastBrace = content.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(content.slice(firstBrace, lastBrace + 1));
    } catch {}
  }

  // Last resort: construct minimal strategy from raw text
  console.warn("[QuantScript] Could not parse JSON, constructing from raw text");
  return {
    strategy: {
      name: "Strategy Generated",
      philosophy: "Generated from natural language — see raw output",
      entry_rules: ["See detailed output below"],
      exit_rules: ["See detailed output below"],
      risk_parameters: {},
    },
    raw_output: content,
    validation: { safe: false, message: "Failed to parse structured JSON response" },
  };
}
