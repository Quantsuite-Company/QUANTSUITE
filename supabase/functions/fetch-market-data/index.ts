import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface IndexData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

interface MarketDataResponse {
  indices: IndexData[];
  timestamp: number;
  cached?: boolean;
}

const INDEX_CONFIG = [
  { symbol: '^NSEI', name: 'NIFTY 50' },
  { symbol: '^BSESN', name: 'SENSEX' },
  { symbol: '^GSPC', name: 'S&P 500' },
  { symbol: '^IXIC', name: 'NASDAQ' },
];

// In-memory cache with 5-minute TTL to prevent rate limiting
let marketCache: { data: MarketDataResponse; timestamp: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Sequential fetch with delays to avoid rate limiting
async function fetchWithRetry(symbol: string, retries = 3, delayMs = 1000, fetchHistory = false): Promise<{
  price: number | null;
  change: number | null;
  changePercent: number | null;
  history?: number[];
}> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      // Add random delay to spread requests
      if (attempt > 0) {
        await new Promise(resolve => setTimeout(resolve, delayMs * (attempt + 1)));
      }
      
      const range = fetchHistory ? '3mo' : '1d';
      const response = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=${range}`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json',
          },
        }
      );
      
      if (response.status === 429) {
        console.warn(`Rate limited for ${symbol}, attempt ${attempt + 1}/${retries}`);
        continue;
      }
      
      if (!response.ok) {
        console.error(`HTTP ${response.status} for ${symbol}`);
        continue;
      }
      
      const data = await response.json();
      const result = data?.chart?.result?.[0];
      const meta = result?.meta;
      
      if (!meta) {
        console.error(`No meta data for ${symbol}`);
        return { price: null, change: null, changePercent: null };
      }

      const price = meta.regularMarketPrice;
      const previousClose = meta.previousClose || meta.chartPreviousClose;
      
      let change = null;
      let changePercent = null;
      
      if (price && previousClose) {
        change = price - previousClose;
        changePercent = ((price - previousClose) / previousClose) * 100;
      }

      let history: number[] | undefined = undefined;
      if (fetchHistory && result.indicators?.quote?.[0]?.close) {
         history = result.indicators.quote[0].close.filter((c: number | null) => c !== null);
      }

      return { price, change, changePercent, history };
    } catch (error) {
      console.error(`Error fetching ${symbol} (attempt ${attempt + 1}):`, error);
    }
  }
  
  return { price: null, change: null, changePercent: null };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check cache first
    if (marketCache && (Date.now() - marketCache.timestamp) < CACHE_TTL_MS) {
      console.log('Returning cached market data');
      return new Response(
        JSON.stringify({ ...marketCache.data, cached: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching fresh market indices from Yahoo Finance...');

    // Fetch sequentially with delays to avoid rate limiting
    const results: IndexData[] = [];
    
    for (const config of INDEX_CONFIG) {
      // Small delay between requests
      if (results.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      const isSnp = config.symbol === '^GSPC';
      const quote = await fetchWithRetry(config.symbol, 3, 1000, isSnp);
      
      results.push({
        symbol: config.symbol,
        name: config.name,
        price: quote.price ?? 0,
        change: quote.change ?? 0,
        changePercent: quote.changePercent ?? 0,
        ...(isSnp && quote.history ? { history: quote.history } : {})
      });
    }

    const response: MarketDataResponse = {
      indices: results,
      timestamp: Date.now(),
    };

    // Update cache
    marketCache = { data: response, timestamp: Date.now() };

    console.log('Market data fetched:', JSON.stringify(response, null, 2));

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in fetch-market-data function:', error);
    
    // If we have stale cache, return it
    if (marketCache) {
      console.log('Returning stale cache due to error');
      return new Response(
        JSON.stringify({ ...marketCache.data, cached: true, stale: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // No cache available - return zeros
    const fallbackResponse: MarketDataResponse = {
      indices: INDEX_CONFIG.map(config => ({
        symbol: config.symbol,
        name: config.name,
        price: 0,
        change: 0,
        changePercent: 0,
      })),
      timestamp: Date.now(),
    };

    return new Response(
      JSON.stringify(fallbackResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  }
});
