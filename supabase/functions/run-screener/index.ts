import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Expanded S&P 500 stock universe (top 50 by market cap)
const STOCK_UNIVERSE = [
  { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'Consumer' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', sector: 'Technology' },
  { symbol: 'META', name: 'Meta Platforms Inc.', sector: 'Technology' },
  { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Consumer' },
  { symbol: 'BRK.B', name: 'Berkshire Hathaway', sector: 'Finance' },
  { symbol: 'JPM', name: 'JPMorgan Chase', sector: 'Finance' },
  { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare' },
  { symbol: 'V', name: 'Visa Inc.', sector: 'Finance' },
  { symbol: 'PG', name: 'Procter & Gamble', sector: 'Consumer' },
  { symbol: 'UNH', name: 'UnitedHealth Group', sector: 'Healthcare' },
  { symbol: 'MA', name: 'Mastercard', sector: 'Finance' },
  { symbol: 'HD', name: 'Home Depot', sector: 'Consumer' },
  { symbol: 'XOM', name: 'Exxon Mobil', sector: 'Energy' },
  { symbol: 'CVX', name: 'Chevron', sector: 'Energy' },
  { symbol: 'BAC', name: 'Bank of America', sector: 'Finance' },
  { symbol: 'ABBV', name: 'AbbVie Inc.', sector: 'Healthcare' },
  { symbol: 'WMT', name: 'Walmart Inc.', sector: 'Consumer' },
  { symbol: 'LLY', name: 'Eli Lilly', sector: 'Healthcare' },
  { symbol: 'AVGO', name: 'Broadcom', sector: 'Technology' },
  { symbol: 'PFE', name: 'Pfizer Inc.', sector: 'Healthcare' },
  { symbol: 'ORCL', name: 'Oracle Corporation', sector: 'Technology' },
  { symbol: 'KO', name: 'Coca-Cola', sector: 'Consumer' },
  { symbol: 'PEP', name: 'PepsiCo', sector: 'Consumer' },
  { symbol: 'COST', name: 'Costco', sector: 'Consumer' },
  { symbol: 'AMD', name: 'Advanced Micro Devices', sector: 'Technology' },
  { symbol: 'NFLX', name: 'Netflix', sector: 'Technology' },
  { symbol: 'DIS', name: 'Walt Disney', sector: 'Consumer' },
  { symbol: 'INTC', name: 'Intel Corporation', sector: 'Technology' },
  { symbol: 'CSCO', name: 'Cisco Systems', sector: 'Technology' },
  { symbol: 'QCOM', name: 'Qualcomm', sector: 'Technology' },
  { symbol: 'ADBE', name: 'Adobe Inc.', sector: 'Technology' },
  { symbol: 'CRM', name: 'Salesforce', sector: 'Technology' },
  { symbol: 'TXN', name: 'Texas Instruments', sector: 'Technology' },
  { symbol: 'IBM', name: 'IBM', sector: 'Technology' },
  { symbol: 'GS', name: 'Goldman Sachs', sector: 'Finance' },
  { symbol: 'MS', name: 'Morgan Stanley', sector: 'Finance' },
  { symbol: 'C', name: 'Citigroup', sector: 'Finance' },
  { symbol: 'WFC', name: 'Wells Fargo', sector: 'Finance' },
  { symbol: 'AXP', name: 'American Express', sector: 'Finance' },
  { symbol: 'BA', name: 'Boeing', sector: 'Consumer' },
  { symbol: 'CAT', name: 'Caterpillar', sector: 'Consumer' },
  { symbol: 'MMM', name: '3M Company', sector: 'Consumer' },
  { symbol: 'MRK', name: 'Merck & Co.', sector: 'Healthcare' },
  { symbol: 'ABT', name: 'Abbott Laboratories', sector: 'Healthcare' },
  { symbol: 'TMO', name: 'Thermo Fisher Scientific', sector: 'Healthcare' },
  { symbol: 'DHR', name: 'Danaher Corporation', sector: 'Healthcare' },
  { symbol: 'NEE', name: 'NextEra Energy', sector: 'Energy' },
];

// Calculate RSI
const calculateRSI = (prices: number[], period: number = 14): number => {
  if (prices.length < period + 1) return 50;
  
  const changes = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }
  
  const recentChanges = changes.slice(-period);
  const gains = recentChanges.filter(c => c > 0);
  const losses = recentChanges.filter(c => c < 0).map(c => Math.abs(c));
  
  const avgGain = gains.length > 0 ? gains.reduce((a, b) => a + b, 0) / period : 0;
  const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / period : 0;
  
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
};

// Calculate MACD signal
const calculateMACD = (prices: number[]): 'bullish' | 'bearish' | 'neutral' => {
  if (prices.length < 26) return 'neutral';
  
  // Simple EMA calculation
  const ema12 = prices.slice(-12).reduce((a, b) => a + b, 0) / 12;
  const ema26 = prices.slice(-26).reduce((a, b) => a + b, 0) / 26;
  const macd = ema12 - ema26;
  
  return macd > 0 ? 'bullish' : macd < 0 ? 'bearish' : 'neutral';
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check with proper JWT validation
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub;
    console.log(`Screener request from user: ${userId}`);

    const { filters } = await req.json();
    console.log('Running screener with filters:', filters);

    // Use service role client for cache operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check cache first - now using proper user_id from validated JWT
    const { data: cachedResults } = await supabase
      .from('screener_results')
      .select('results')
      .eq('user_id', userId)
      .eq('filters', JSON.stringify(filters))
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (cachedResults) {
      console.log('Returning cached results');
      return new Response(
        JSON.stringify({ results: cachedResults.results, count: cachedResults.results.length, cached: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = [];
    const batchSize = 10; // Increased batch size for better performance

    // Process stocks in batches
    for (let i = 0; i < STOCK_UNIVERSE.length; i += batchSize) {
      const batch = STOCK_UNIVERSE.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (stock) => {
        try {
          // Fetch stock data via fetch-stock-data edge function
          const { data: stockData, error } = await supabase.functions.invoke('fetch-stock-data', {
            body: { symbol: stock.symbol, period: '3mo' }
          });

          if (error || !stockData?.chartData || stockData.chartData.length === 0) {
            console.log(`No data for ${stock.symbol}`);
            return null;
          }

          const chartData = stockData.chartData;
          const latestData = chartData[chartData.length - 1];
          const previousData = chartData[chartData.length - 2] || latestData;
          
          const price = latestData.close;
          const change = price - previousData.close;
          const changePercent = (change / previousData.close) * 100;
          const volume = latestData.volume;
          
          // Calculate indicators
          const prices = chartData.map((d: any) => d.close);
          const rsi = calculateRSI(prices);
          const macd = calculateMACD(prices);

          // Apply filters
          if (filters.priceMin !== undefined && price < filters.priceMin) return null;
          if (filters.priceMax !== undefined && price > filters.priceMax) return null;
          if (filters.volumeMin !== undefined && volume < filters.volumeMin) return null;
          if (filters.changePercentMin !== undefined && changePercent < filters.changePercentMin) return null;
          if (filters.changePercentMax !== undefined && changePercent > filters.changePercentMax) return null;
          if (filters.rsiMin !== undefined && rsi < filters.rsiMin) return null;
          if (filters.rsiMax !== undefined && rsi > filters.rsiMax) return null;
          if (filters.macdSignal !== undefined && filters.macdSignal !== 'any' && macd !== filters.macdSignal) return null;
          if (filters.sector !== undefined && stock.sector !== filters.sector) return null;

          return {
            symbol: stock.symbol,
            name: stock.name,
            price,
            change,
            changePercent,
            volume,
            rsi,
            macd,
            sector: stock.sector,
          };
        } catch (err) {
          console.error(`Error processing ${stock.symbol}:`, err);
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults.filter(r => r !== null));
    }

    console.log(`Screener found ${results.length} matching stocks`);

    // Cache results with validated user_id
    try {
      await supabase.from('screener_results').insert({
        user_id: userId,
        filters: filters,
        results: results,
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes
      });
    } catch (cacheError) {
      console.log('Cache insertion failed (non-critical):', cacheError);
    }

    return new Response(
      JSON.stringify({ results, count: results.length, cached: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Screener error:', error);
    return new Response(
      JSON.stringify({ error: error.message, results: [] }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
