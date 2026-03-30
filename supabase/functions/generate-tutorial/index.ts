import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { modelName, userLevel = "beginner" } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Generating tutorial for:', modelName, 'Level:', userLevel);

    const systemPrompt = `You are an expert financial educator who creates interactive, engaging tutorials for options traders. 
Your goal is to make complex financial concepts accessible and fun to learn.

Generate a comprehensive interactive tutorial in JSON format with the following structure:
{
  "title": "Tutorial title",
  "duration": "5 min",
  "description": "Brief description",
  "learningObjectives": ["objective 1", "objective 2", "objective 3"],
  "steps": [
    {
      "title": "Step title",
      "content": "Detailed explanation (markdown supported)",
      "visualDescription": "Description of what visual/diagram should show",
      "interactiveElement": {
        "type": "quiz" | "tryit" | "comparison" | "scenario",
        "data": { /* type-specific data */ }
      },
      "keyTakeaway": "Main point to remember"
    }
  ],
  "practiceScenarios": [
    {
      "title": "Scenario title",
      "description": "Scenario description",
      "parameters": { /* preset values */ },
      "expectedOutcome": "What should happen",
      "teachingPoint": "What this demonstrates"
    }
  ],
  "nextSteps": ["Suggestion 1", "Suggestion 2"],
  "glossaryTerms": [
    { "term": "Term", "definition": "Plain English definition", "formula": "Math formula if applicable" }
  ]
}

Make it conversational, use analogies, include real trading examples with actual numbers.`;

    const userPrompts = {
      "Black-Scholes Calculator": `Create an interactive 5-minute tutorial for the Black-Scholes Options Pricing Model for ${userLevel} traders.

Cover:
1. What is Black-Scholes and why it matters
2. The 5 inputs explained (Stock Price, Strike, Time, Risk-Free Rate, Volatility)
3. How to interpret the option price
4. Introduction to Greeks (Delta, Gamma, Theta, Vega, Rho)
5. Common mistakes and how to avoid them

Include:
- A quiz on identifying input impacts
- A "Try It" scenario with AAPL call option
- A comparison table showing how volatility affects price
- Practice scenarios: earnings play, income strategy, hedging`,

      "Monte Carlo Simulation": `Create an interactive 5-minute tutorial for Monte Carlo Options Simulation for ${userLevel} traders.

Cover:
1. What is Monte Carlo simulation and when to use it
2. How it models thousands of possible price paths
3. Understanding probability distributions
4. Interpreting results: probability of profit, expected value
5. Why it's better than simple formulas for complex options

Include:
- Visual explanation of random walks
- Interactive: "Guess the probability" quiz
- Try It: Simulate a binary event (earnings, FDA approval)
- Comparison: 1,000 vs 10,000 vs 50,000 simulations
- Practice scenario: Short put spread probability`,

      "Binomial Tree Model": `Create an interactive 5-minute tutorial for the Binomial Tree Options Model for ${userLevel} traders.

Cover:
1. What is a binomial tree and how it works
2. Up and down movements at each step
3. Working backwards from expiration
4. Early exercise for American options
5. When to use Binomial vs Black-Scholes

Include:
- Interactive tree visualization explanation
- Quiz: "Which node would you exercise?"
- Try It: 5-step American put option
- Comparison: European vs American option values
- Practice scenario: Deep ITM put exercise decision`,

      "Advanced Greeks Dashboard": `Create an interactive 5-minute tutorial for Advanced Options Greeks for ${userLevel} traders.

Cover:
1. Beyond basic Greeks: Vanna, Charm, Vomma, Veta
2. What each Greek tells you about your position
3. How Greeks change as market moves
4. Building a Greeks-balanced portfolio
5. Real trading strategies using Greeks

Include:
- Greek sensitivity comparisons (which matters most when)
- Interactive quiz: "What happens if..."
- Try It: Create a delta-neutral position
- Scenario: Managing a strangle's Greeks
- Practice: Adjusting position for earnings`,

      "Arbitrage Detector": `Create an interactive 5-minute tutorial for Options Arbitrage Detection for ${userLevel} traders.

Cover:
1. What is options arbitrage (Put-Call Parity)
2. How to spot mispricing opportunities
3. Transaction costs and execution risk
4. Conversion and reversal arbitrage
5. Why arbitrage is rare but valuable to understand

Include:
- Put-Call Parity formula breakdown
- Quiz: "Is this an arbitrage opportunity?"
- Try It: Calculate arbitrage profit
- Real example with transaction costs
- Practice: SPY options arbitrage scan`,

      "SVI Model": `Create an interactive 5-minute tutorial for the Stochastic Volatility Inspired (SVI) Model for ${userLevel} traders.

Cover:
1. What is the volatility smile/skew
2. Why Black-Scholes doesn't capture it
3. How SVI fits the smile curve
4. Parameters: a, b, ρ, m, σ
5. Using SVI for pricing exotic options

Include:
- Visual: Different smile shapes
- Quiz: "Match the market condition to smile shape"
- Try It: Fit SVI to real SPY options
- Comparison: SVI vs flat volatility pricing
- Practice: Post-earnings smile prediction`
    };

    const prompt = userPrompts[modelName as keyof typeof userPrompts] || 
      `Create a comprehensive interactive tutorial for ${modelName} suitable for ${userLevel} traders.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const tutorialContent = JSON.parse(data.choices[0].message.content);

    return new Response(
      JSON.stringify({ tutorial: tutorialContent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating tutorial:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error generating tutorial' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
