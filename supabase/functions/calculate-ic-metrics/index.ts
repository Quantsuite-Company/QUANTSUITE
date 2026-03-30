import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Calculate Information Coefficient (IC) - Spearman rank correlation
 */
function calculateIC(signals: number[], returns: number[]): number {
  if (signals.length !== returns.length || signals.length < 2) return 0;

  const n = signals.length;
  const signalRanks = rankArray(signals);
  const returnRanks = rankArray(returns);

  let sumDiffSquared = 0;
  for (let i = 0; i < n; i++) {
    const diff = signalRanks[i] - returnRanks[i];
    sumDiffSquared += diff * diff;
  }

  return 1 - (6 * sumDiffSquared) / (n * (n * n - 1));
}

function rankArray(arr: number[]): number[] {
  const sorted = arr.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
  const ranks = new Array(arr.length);
  sorted.forEach((item, rank) => {
    ranks[item.i] = rank + 1;
  });
  return ranks;
}

/**
 * Calculate signal decay (half-life in days)
 */
function calculateHalfLife(ics: number[]): number {
  if (ics.length < 5) return 0;

  // Fit exponential decay: IC(t) = IC(0) * exp(-λ*t)
  let sumLogIC = 0;
  let count = 0;

  for (let i = 0; i < ics.length; i++) {
    if (ics[i] > 0) {
      sumLogIC += Math.log(ics[i]);
      count++;
    }
  }

  if (count < 2) return 0;

  const avgLogIC = sumLogIC / count;
  const decayRate = -avgLogIC / count; // λ
  
  if (decayRate <= 0) return 999;
  
  return Math.log(2) / decayRate; // Half-life = ln(2) / λ
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { alphaId, lookbackDays = 60 } = await req.json();

    console.log(`Calculating IC metrics for ${alphaId} with ${lookbackDays} days lookback`);

    // Get user ID from auth
    const authHeader = req.headers.get('Authorization');
    let userId = null;
    
    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser(
        authHeader.replace('Bearer ', '')
      );
      userId = user?.id;
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch alpha signals history
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - lookbackDays);

    const { data: signals, error: signalsError } = await supabase
      .from('alpha_signals')
      .select('date, ticker, zscore')
      .eq('user_id', userId)
      .eq('alpha_id', alphaId)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (signalsError || !signals || signals.length === 0) {
      console.log(`No historical signals found for alpha ${alphaId}. IC metrics require data from 2+ dates.`);
      return new Response(
        JSON.stringify({ 
          error: 'No historical signals found',
          message: 'IC metrics calculation requires signals from at least 2 different dates. Generate signals daily to build history.'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Group by date
    const dateGroups: { [date: string]: { ticker: string; signal: number }[] } = {};
    signals.forEach(s => {
      if (!dateGroups[s.date]) dateGroups[s.date] = [];
      dateGroups[s.date].push({ ticker: s.ticker, signal: s.zscore });
    });

    const dates = Object.keys(dateGroups).sort();
    
    // Calculate forward returns and IC for each date
    const rollingICs: number[] = [];
    
    for (let i = 0; i < dates.length - 1; i++) {
      const currentDate = dates[i];
      const nextDate = dates[i + 1];
      
      const currentSignals = dateGroups[currentDate];
      const nextSignals = dateGroups[nextDate];
      
      // Match tickers and calculate returns
      const matchedData: { signal: number; return: number }[] = [];
      
      currentSignals.forEach(curr => {
        const next = nextSignals.find(n => n.ticker === curr.ticker);
        if (next) {
          // Return = (next_signal - curr_signal) as proxy for price return
          // In production, use actual price returns from market data
          matchedData.push({
            signal: curr.signal,
            return: next.signal - curr.signal
          });
        }
      });

      if (matchedData.length >= 5) {
        const ic = calculateIC(
          matchedData.map(d => d.signal),
          matchedData.map(d => d.return)
        );
        rollingICs.push(ic);
      }
    }

    if (rollingICs.length === 0) {
      console.log(`Insufficient data for IC calculation for alpha ${alphaId}. Need at least 2 dates with 5+ stocks each.`);
      return new Response(
        JSON.stringify({ 
          error: 'Insufficient data for IC calculation',
          message: `Found ${dates.length} date(s) but need at least 2 dates with 5+ matching stocks to compute IC.`
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate IC statistics
    const ic = rollingICs.reduce((sum, ic) => sum + ic, 0) / rollingICs.length;
    const icVariance = rollingICs.reduce((sum, ic_val) => sum + Math.pow(ic_val - ic, 2), 0) / rollingICs.length;
    const icStd = Math.sqrt(icVariance);
    const icSharpe = icStd === 0 ? 0 : ic / icStd;
    const halfLife = calculateHalfLife(rollingICs);
    const isHealthy = ic > 0.02 && icSharpe > 0.5 && halfLife > 5;

    const metricsData = {
      user_id: userId,
      alpha_id: alphaId,
      date: endDate.toISOString().split('T')[0],
      ic,
      ic_sharpe: icSharpe,
      half_life_days: halfLife,
      is_healthy: isHealthy,
      lookback_days: lookbackDays
    };

    // Save to database
    const { data: savedMetrics, error: saveError } = await supabase
      .from('alpha_metrics')
      .upsert(metricsData, {
        onConflict: 'user_id,alpha_id,date',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving metrics:', saveError);
      throw saveError;
    }

    console.log(`IC metrics calculated: IC=${ic.toFixed(4)}, IC Sharpe=${icSharpe.toFixed(2)}, Half-life=${halfLife.toFixed(1)} days`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        metrics: savedMetrics,
        rollingICs: rollingICs.slice(-21) // Return last 21 for visualization
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in calculate-ic-metrics:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
