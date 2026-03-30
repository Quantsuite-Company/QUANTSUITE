import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WalkForwardWindow {
  windowId: number;
  trainStart: string;
  trainEnd: string;
  testStart: string;
  testEnd: string;
  alphaWeights: { [alphaId: string]: number };
  returns: number;
  sharpe: number;
  maxDrawdown: number;
}

function calculateAdaptiveWeights(
  metrics: Array<{ alpha_id: string; ic_sharpe: number; is_healthy: boolean }>
): { [alphaId: string]: number } {
  const healthyMetrics = metrics.filter(m => m.is_healthy);
  
  if (healthyMetrics.length === 0) {
    // Equal weights fallback
    const weights: { [alphaId: string]: number } = {};
    metrics.forEach(m => weights[m.alpha_id] = 1 / metrics.length);
    return weights;
  }

  // Weight by IC Sharpe ratio
  const totalICSharpe = healthyMetrics.reduce((sum, m) => sum + Math.abs(m.ic_sharpe), 0);
  const weights: { [alphaId: string]: number } = {};
  
  metrics.forEach(m => {
    if (m.is_healthy && totalICSharpe > 0) {
      weights[m.alpha_id] = Math.abs(m.ic_sharpe) / totalICSharpe;
    } else {
      weights[m.alpha_id] = 0;
    }
  });

  return weights;
}

function calculateReturns(positions: { ticker: string; weight: number }[], priceChanges: { ticker: string; return: number }[]): number {
  let portfolioReturn = 0;
  
  positions.forEach(pos => {
    const priceChange = priceChanges.find(pc => pc.ticker === pos.ticker);
    if (priceChange) {
      portfolioReturn += pos.weight * priceChange.return;
    }
  });

  return portfolioReturn;
}

function calculateSharpe(returns: number[]): number {
  if (returns.length < 2) return 0;
  
  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
  const std = Math.sqrt(variance);
  
  return std === 0 ? 0 : (mean / std) * Math.sqrt(252); // Annualized
}

function calculateMaxDrawdown(cumulativeReturns: number[]): number {
  let peak = cumulativeReturns[0];
  let maxDD = 0;

  for (const value of cumulativeReturns) {
    if (value > peak) peak = value;
    const drawdown = (peak - value) / peak;
    if (drawdown > maxDD) maxDD = drawdown;
  }

  return maxDD;
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

    const { 
      trainDays = 126, 
      testDays = 21, 
      retrainFrequency = 21,
      universe = 'SP500_TOP50'
    } = await req.json();

    console.log(`Running walk-forward backtest: train=${trainDays}, test=${testDays}, retrain=${retrainFrequency}`);

    // Get user ID
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

    // Fetch all alpha signals for the user
    const { data: allSignals, error: signalsError } = await supabase
      .from('alpha_signals')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true });

    if (signalsError || !allSignals || allSignals.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No signals data found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get unique dates
    const uniqueDates = [...new Set(allSignals.map(s => s.date))].sort();
    
    if (uniqueDates.length < trainDays + testDays) {
      return new Response(
        JSON.stringify({ error: 'Insufficient historical data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const windows: WalkForwardWindow[] = [];
    let windowId = 1;
    let currentIndex = trainDays;

    // Walk-forward loop
    while (currentIndex + testDays <= uniqueDates.length) {
      const trainStart = uniqueDates[currentIndex - trainDays];
      const trainEnd = uniqueDates[currentIndex - 1];
      const testStart = uniqueDates[currentIndex];
      const testEnd = uniqueDates[Math.min(currentIndex + testDays - 1, uniqueDates.length - 1)];

      console.log(`Window ${windowId}: Train [${trainStart} to ${trainEnd}], Test [${testStart} to ${testEnd}]`);

      // Calculate IC metrics on training data
      const { data: trainingMetrics } = await supabase
        .from('alpha_metrics')
        .select('*')
        .eq('user_id', userId)
        .gte('date', trainStart)
        .lte('date', trainEnd);

      if (!trainingMetrics || trainingMetrics.length === 0) {
        console.warn(`No metrics for window ${windowId}, skipping`);
        currentIndex += retrainFrequency;
        continue;
      }

      // Get latest metrics for each alpha
      const latestMetrics: { [alphaId: string]: any } = {};
      trainingMetrics.forEach(m => {
        if (!latestMetrics[m.alpha_id] || m.date > latestMetrics[m.alpha_id].date) {
          latestMetrics[m.alpha_id] = m;
        }
      });

      // Calculate adaptive weights
      const alphaWeights = calculateAdaptiveWeights(Object.values(latestMetrics));

      // Get test period signals
      const testSignals = allSignals.filter(
        s => s.date >= testStart && s.date <= testEnd
      );

      // Simulate trading on test period
      const testDates = [...new Set(testSignals.map(s => s.date))].sort();
      const dailyReturns: number[] = [];
      const cumulativeReturns: number[] = [1.0];

      for (let i = 0; i < testDates.length - 1; i++) {
        const currentDate = testDates[i];
        const nextDate = testDates[i + 1];

        // Combine signals with weights
        const currentDateSignals = testSignals.filter(s => s.date === currentDate);
        const nextDateSignals = testSignals.filter(s => s.date === nextDate);

        // Calculate combined score for each ticker
        const tickerScores: { [ticker: string]: number } = {};
        
        currentDateSignals.forEach(signal => {
          if (!tickerScores[signal.ticker]) tickerScores[signal.ticker] = 0;
          const weight = alphaWeights[signal.alpha_id] || 0;
          tickerScores[signal.ticker] += weight * signal.zscore;
        });

        // Create positions (top 10 long, bottom 10 short for market-neutral)
        const sortedTickers = Object.entries(tickerScores)
          .sort(([, a], [, b]) => b - a);

        const positions: { ticker: string; weight: number }[] = [];
        const numLong = Math.min(10, Math.floor(sortedTickers.length / 2));
        const numShort = Math.min(10, Math.floor(sortedTickers.length / 2));

        // Long top scorers
        for (let j = 0; j < numLong; j++) {
          positions.push({ ticker: sortedTickers[j][0], weight: 1 / numLong });
        }

        // Short bottom scorers
        for (let j = 0; j < numShort; j++) {
          positions.push({ 
            ticker: sortedTickers[sortedTickers.length - 1 - j][0], 
            weight: -1 / numShort 
          });
        }

        // Calculate returns
        const priceChanges = currentDateSignals.map(curr => {
          const next = nextDateSignals.find(n => n.ticker === curr.ticker);
          return {
            ticker: curr.ticker,
            return: next ? (next.zscore - curr.zscore) * 0.01 : 0 // Proxy for price return
          };
        });

        const dailyReturn = calculateReturns(positions, priceChanges);
        dailyReturns.push(dailyReturn);
        cumulativeReturns.push(cumulativeReturns[cumulativeReturns.length - 1] * (1 + dailyReturn));
      }

      const windowReturn = cumulativeReturns[cumulativeReturns.length - 1] - 1;
      const sharpe = calculateSharpe(dailyReturns);
      const maxDrawdown = calculateMaxDrawdown(cumulativeReturns);

      windows.push({
        windowId,
        trainStart,
        trainEnd,
        testStart,
        testEnd,
        alphaWeights,
        returns: windowReturn,
        sharpe,
        maxDrawdown
      });

      windowId++;
      currentIndex += retrainFrequency;
    }

    // Calculate overall metrics
    const totalReturn = windows.reduce((prod, w) => prod * (1 + w.returns), 1) - 1;
    const allReturns = windows.map(w => w.returns);
    const overallSharpe = calculateSharpe(allReturns);
    const overallMaxDD = Math.max(...windows.map(w => w.maxDrawdown));

    const result = {
      config: { trainDays, testDays, retrainFrequency, universe },
      windows,
      outOfSampleMetrics: {
        totalReturn,
        sharpe: overallSharpe,
        maxDrawdown: overallMaxDD,
        numWindows: windows.length
      }
    };

    // Save results
    const { data: savedResult, error: saveError } = await supabase
      .from('walk_forward_results')
      .insert({
        user_id: userId,
        config: result.config,
        windows: result.windows,
        out_of_sample_metrics: result.outOfSampleMetrics,
        cumulative_returns: totalReturn,
        sharpe_ratio: overallSharpe,
        max_drawdown: overallMaxDD
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving results:', saveError);
      throw saveError;
    }

    console.log(`Walk-forward complete: ${windows.length} windows, Return=${(totalReturn * 100).toFixed(2)}%, Sharpe=${overallSharpe.toFixed(2)}`);

    return new Response(
      JSON.stringify({ success: true, result: savedResult }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in run-walk-forward:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
