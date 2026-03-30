import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Yahoo Finance symbols for comprehensive market coverage
const SYMBOLS = {
  indices: [
    { symbol: '^GSPC', name: 'S&P 500', region: 'Americas' },
    { symbol: '^IXIC', name: 'NASDAQ', region: 'Americas' },
    { symbol: '^DJI', name: 'Dow Jones', region: 'Americas' },
    { symbol: '^RUT', name: 'Russell 2000', region: 'Americas' },
    { symbol: '^FTSE', name: 'FTSE 100', region: 'Europe' },
    { symbol: '^GDAXI', name: 'DAX 40', region: 'Europe' },
    { symbol: '^FCHI', name: 'CAC 40', region: 'Europe' },
    { symbol: '^N225', name: 'Nikkei 225', region: 'Asia' },
    { symbol: '^HSI', name: 'Hang Seng', region: 'Asia' },
    { symbol: '000001.SS', name: 'Shanghai', region: 'Asia' },
    { symbol: '^NSEI', name: 'NIFTY 50', region: 'Asia' },
    { symbol: '^BSESN', name: 'SENSEX', region: 'Asia' },
  ],
  commodities: [
    { symbol: 'CL=F', name: 'Crude Oil', region: 'Global' },
    { symbol: 'GC=F', name: 'Gold', region: 'Global' },
    { symbol: 'SI=F', name: 'Silver', region: 'Global' },
    { symbol: 'NG=F', name: 'Nat Gas', region: 'Global' },
  ],
  crypto: [
    { symbol: 'BTC-USD', name: 'Bitcoin', region: 'Global' },
    { symbol: 'ETH-USD', name: 'Ethereum', region: 'Global' },
  ],
  forex: [
    { symbol: 'DX-Y.NYB', name: 'US Dollar', region: 'Global' },
    { symbol: '^TNX', name: '10Y Yield', region: 'Americas' },
    { symbol: '^VIX', name: 'VIX', region: 'Americas' },
  ],
};

async function fetchYahooQuote(symbol: string): Promise<{ price: number; change: number; changePercent: number } | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1d`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta) return null;
    
    const price = meta.regularMarketPrice ?? 0;
    const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? price;
    const change = price - prevClose;
    const changePercent = prevClose !== 0 ? (change / prevClose) * 100 : 0;
    
    return {
      price: parseFloat(price.toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      changePercent: parseFloat(changePercent.toFixed(2)),
    };
  } catch (e) {
    console.error(`Failed to fetch ${symbol}:`, e);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const allSymbols = [
      ...SYMBOLS.indices.map(s => ({ ...s, type: 'index' })),
      ...SYMBOLS.commodities.map(s => ({ ...s, type: 'commodity' })),
      ...SYMBOLS.crypto.map(s => ({ ...s, type: 'crypto' })),
      ...SYMBOLS.forex.map(s => ({ ...s, type: 'forex' })),
    ];

    // Fetch all quotes in parallel
    const results = await Promise.allSettled(
      allSymbols.map(async (s) => {
        const quote = await fetchYahooQuote(s.symbol);
        return quote ? { ...s, ...quote } : null;
      })
    );

    const quotes = results
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled' && r.value !== null)
      .map(r => r.value);

    return new Response(JSON.stringify({
      success: true,
      quotes,
      timestamp: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Market quotes error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch market quotes',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
