import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { universe = 'SP500_TOP50', date } = await req.json();
    const targetDate = date || new Date().toISOString().split('T')[0];

    console.log(`Calculating alphas for ${universe} on ${targetDate}`);

    // Get stock universe
    const tickers = getStockUniverse(universe);
    console.log(`Processing ${tickers.length} stocks`);

    // Fetch historical data for all tickers in parallel
    const dataPromises = tickers.map(async (ticker) => {
      try {
        const { data, error } = await supabase.functions.invoke('fetch-stock-data', {
          body: { symbol: ticker, period: '1y' }
        });
        
        if (error || !data?.chartData) {
          console.warn(`Failed to fetch data for ${ticker}`);
          return null;
        }
        
        return { ticker, data: data.chartData };
      } catch (err) {
        console.error(`Error fetching ${ticker}:`, err);
        return null;
      }
    });

    const historicalData = (await Promise.all(dataPromises)).filter(d => d !== null);
    console.log(`Successfully fetched data for ${historicalData.length}/${tickers.length} stocks`);

    // Calculate all alphas for each stock
    const alphaSignals: any[] = [];
    
    for (const { ticker, data } of historicalData) {
      if (!data || data.length < 200) {
        console.warn(`Insufficient data for ${ticker}: only ${data?.length || 0} points`);
        continue;
      }
      
      console.log(`Processing ${ticker}: ${data.length} data points`);

      const prices = data.map((d: any) => d.close);
      const volumes = data.map((d: any) => d.volume);

      // Calculate raw alpha values
      const alphas = {
        momentum21: calculateMomentum(prices, 21),
        momentum63: calculateMomentum(prices, 63),
        meanReversion: calculateMeanReversion(prices, 20),
        liquidity: calculateLiquidity(volumes, 21),
        volatility: calculateVolatility(prices, 21),
        rsi: calculateRSI(prices, 14),
      };

      for (const [alphaId, rawValue] of Object.entries(alphas)) {
        alphaSignals.push({
          date: targetDate,
          ticker,
          alpha_id: alphaId,
          raw_value: rawValue,
          zscore: 0, // Will calculate after all stocks processed
          percentile_rank: 0,
        });
      }
    }

    // Calculate z-scores (cross-sectional normalization)
    const alphaGroups: { [key: string]: any[] } = {};
    
    alphaSignals.forEach(signal => {
      if (!alphaGroups[signal.alpha_id]) {
        alphaGroups[signal.alpha_id] = [];
      }
      alphaGroups[signal.alpha_id].push(signal);
    });

    for (const [alphaId, signals] of Object.entries(alphaGroups)) {
      const values = signals.map(s => s.raw_value);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const std = Math.sqrt(
        values.map(v => Math.pow(v - mean, 2)).reduce((a, b) => a + b, 0) / values.length
      );

      signals.forEach(signal => {
        signal.zscore = std === 0 ? 0 : (signal.raw_value - mean) / std;
        signal.percentile_rank = percentileRank(signal.raw_value, values);
      });
    }

    // Get user ID from auth
    const authHeader = req.headers.get('Authorization');
    let userId = null;
    
    if (authHeader) {
      const { data: { user }, error: authError } = await supabase.auth.getUser(
        authHeader.replace('Bearer ', '')
      );
      userId = user?.id;
    }

    if (!userId) {
      throw new Error('User not authenticated');
    }

    // Delete existing signals for this user/date/universe to prevent duplicates
    const { error: deleteError } = await supabase
      .from('alpha_signals')
      .delete()
      .eq('user_id', userId)
      .eq('date', targetDate)
      .eq('universe', universe);

    if (deleteError) {
      console.warn('Delete error (signals may not exist yet):', deleteError);
    }

    // Save to database with universe
    const { error: insertError } = await supabase
      .from('alpha_signals')
      .insert(
        alphaSignals.map(s => ({ ...s, user_id: userId, universe }))
      );

    if (insertError) {
      console.error('Insert error:', insertError);
      throw insertError;
    }

    console.log(`✓ Saved ${alphaSignals.length} alpha signals for ${universe}`);

    return new Response(JSON.stringify({ 
      success: true, 
      signals_calculated: alphaSignals.length,
      stocks_processed: historicalData.length,
      date: targetDate,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Alpha calculation error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to calculate alphas' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Stock universe definitions
function getStockUniverse(universe: string): string[] {
  const universes: { [key: string]: string[] } = {
    'SP500_TOP50': [
      'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'BRK.B', 'V', 'JNJ',
      'WMT', 'XOM', 'UNH', 'JPM', 'MA', 'PG', 'HD', 'CVX', 'MRK', 'ABBV',
      'PEP', 'KO', 'AVGO', 'COST', 'PFE', 'TMO', 'MCD', 'CSCO', 'ABT', 'ACN',
      'DHR', 'ADBE', 'NKE', 'LIN', 'VZ', 'NEE', 'CMCSA', 'TXN', 'INTC', 'CRM',
      'PM', 'UPS', 'ORCL', 'RTX', 'QCOM', 'HON', 'IBM', 'AMGN', 'INTU', 'AMD'
    ],
    'TECH': ['AAPL', 'MSFT', 'GOOGL', 'META', 'NVDA', 'TSLA', 'AMD', 'INTC', 'CRM', 'ADBE'],
    'NIFTY50': ['RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'ICICIBANK.NS']
  };

  return universes[universe] || universes['SP500_TOP50'];
}

// Alpha calculation functions
function calculateMomentum(prices: number[], period: number): number {
  if (prices.length < period + 1) return 0;
  const currentPrice = prices[prices.length - 1];
  const pastPrice = prices[prices.length - 1 - period];
  return (currentPrice - pastPrice) / pastPrice;
}

function calculateMeanReversion(prices: number[], period: number): number {
  if (prices.length < period) return 0;
  const recentPrices = prices.slice(-period);
  const mean = recentPrices.reduce((a, b) => a + b, 0) / period;
  const currentPrice = prices[prices.length - 1];
  return -(currentPrice - mean) / mean; // Negative: bet on reversion
}

function calculateLiquidity(volumes: number[], period: number): number {
  if (volumes.length < period) return 0;
  const recentVolumes = volumes.slice(-period);
  const avgVolume = recentVolumes.reduce((a, b) => a + b, 0) / period;
  return Math.log1p(avgVolume);
}

function calculateVolatility(prices: number[], period: number): number {
  if (prices.length < period + 1) return 0;
  
  const returns: number[] = [];
  for (let i = prices.length - period; i < prices.length; i++) {
    const ret = (prices[i] - prices[i - 1]) / prices[i - 1];
    returns.push(ret);
  }
  
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
  
  return -Math.sqrt(variance); // Negative: lower vol is better
}

function calculateRSI(prices: number[], period: number): number {
  if (prices.length < period + 1) return 0;
  
  const changes: number[] = [];
  for (let i = prices.length - period; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }
  
  const gains = changes.map(c => c > 0 ? c : 0);
  const losses = changes.map(c => c < 0 ? -c : 0);
  
  const avgGain = gains.reduce((a, b) => a + b, 0) / period;
  const avgLoss = losses.reduce((a, b) => a + b, 0) / period;
  
  if (avgLoss === 0) return 1;
  
  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));
  
  // Convert to signal: oversold (buy) = positive, overbought (sell) = negative
  return (50 - rsi) / 50;
}

function percentileRank(value: number, values: number[]): number {
  const sorted = values.slice().sort((a, b) => a - b);
  let rank = 0;
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i] < value) rank++;
  }
  return (rank / sorted.length) * 100;
}