import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StockDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Validate stock symbol format to prevent SSRF and URL manipulation
function validateSymbol(symbol: string): boolean {
  if (!symbol || typeof symbol !== 'string') return false;
  // Allow uppercase letters, numbers, dots (for BRK.B), and hyphens (max 10 chars)
  return /^[A-Za-z0-9.\-^]{1,15}$/.test(symbol);
}

async function fetchYahooFinanceData(symbol: string, period: string = '1y'): Promise<StockDataPoint[]> {
  // Validate symbol before using in URL
  if (!validateSymbol(symbol)) {
    console.error(`Invalid symbol format: ${symbol}`);
    return [];
  }

  const periodMap: { [key: string]: { range: string; interval: string } } = {
    '1mo': { range: '1mo', interval: '1d' },
    '3mo': { range: '3mo', interval: '1d' },
    '6mo': { range: '6mo', interval: '1d' },
    '1y': { range: '1y', interval: '1d' },
    '2y': { range: '2y', interval: '1d' },
  };

  const { range, interval } = periodMap[period] || periodMap['1y'];

  console.log(`Fetching data for ${symbol} with range=${range}, interval=${interval}`);

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${range}&interval=${interval}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    });

    if (!response.ok) {
      console.error(`Yahoo Finance API error for ${symbol}: ${response.status}`);
      return [];
    }

    const data = await response.json();
    
    if (!data?.chart?.result?.[0]) {
      console.error(`No data returned for ${symbol}`);
      return [];
    }

    const result = data.chart.result[0];
    const timestamps = result.timestamp || [];
    const quotes = result.indicators?.quote?.[0];

    if (!quotes) {
      console.error(`No quote data for ${symbol}`);
      return [];
    }

    const opens = quotes.open || [];
    const highs = quotes.high || [];
    const lows = quotes.low || [];
    const closes = quotes.close || [];
    const volumes = quotes.volume || [];

    const stockData: StockDataPoint[] = [];

    for (let i = 0; i < timestamps.length; i++) {
      const open = opens[i];
      const high = highs[i];
      const low = lows[i];
      const close = closes[i];
      const volume = volumes[i];

      if (open && high && low && close && volume) {
        stockData.push({
          date: new Date(timestamps[i] * 1000).toISOString(),
          open,
          high,
          low,
          close,
          volume,
        });
      }
    }

    console.log(`Successfully fetched ${stockData.length} data points for ${symbol}`);
    return stockData;
  } catch (error) {
    console.error(`Error fetching data for ${symbol}:`, error);
    return [];
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol, tickers, period = '1y', interval = '1d' } = await req.json();

    // Handle single symbol request (for charts)
    if (symbol) {
      // Validate symbol input
      if (!validateSymbol(symbol)) {
        return new Response(
          JSON.stringify({ error: 'Invalid symbol format. Symbols must be 1-15 alphanumeric characters.' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      console.log(`Fetching data for symbol: ${symbol}, period: ${period}, interval: ${interval}`);
      const intervalMap: { [key: string]: string } = {
        '1m': '1d',
        '5m': '5d',
        '1h': '1mo',
        '1d': '1y',
        '1w': '3mo',
      };
      const mappedPeriod = intervalMap[interval] || '1y';
      const chartData = await fetchYahooFinanceData(symbol, mappedPeriod);

      // Also get current quote
      const latestData = chartData[chartData.length - 1];
      const previousData = chartData[chartData.length - 2];
      const quote = latestData ? {
        symbol,
        price: latestData.close,
        change: latestData.close - (previousData?.close || latestData.close),
        changePercent: previousData ? ((latestData.close - previousData.close) / previousData.close) * 100 : 0,
        volume: latestData.volume,
        high: latestData.high,
        low: latestData.low,
        open: latestData.open,
      } : null;

      return new Response(
        JSON.stringify({ chartData, ...quote }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Handle multiple tickers request (for portfolios)
    if (!tickers || !Array.isArray(tickers) || tickers.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid request: symbol or tickers array required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate all tickers
    const invalidTickers = tickers.filter((t: string) => !validateSymbol(t));
    if (invalidTickers.length > 0) {
      return new Response(
        JSON.stringify({ error: `Invalid ticker format: ${invalidTickers.join(', ')}` }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Fetching data for tickers: ${tickers.join(', ')}, period: ${period}`);

    // Fetch all tickers in parallel
    const results = await Promise.all(
      tickers.map(async (ticker: string) => {
        const data = await fetchYahooFinanceData(ticker, period);
        return { ticker, data };
      })
    );

    // Convert to object format
    const stockData: { [ticker: string]: StockDataPoint[] } = {};
    for (const { ticker, data } of results) {
      stockData[ticker] = data;
    }

    console.log(`Successfully fetched data for ${Object.keys(stockData).length} tickers`);

    return new Response(
      JSON.stringify({ stockData }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error in fetch-stock-data function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
