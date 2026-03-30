import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function validateSymbol(symbol: string): boolean {
  if (!symbol || typeof symbol !== 'string') return false;
  return /^[A-Za-z0-9.\-^]{1,15}$/.test(symbol);
}

interface EarningsEvent {
  symbol: string;
  companyName: string;
  earningsDate: string;
  epsEstimate: number | null;
  epsActual: number | null;
  revenueEstimate: number | null;
  revenueActual: number | null;
  surprise: number | null;
  surprisePercent: number | null;
  timing: string | null;
}

// Cache
const cache: Map<string, { data: any; timestamp: number }> = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

function getCached(key: string): any | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

// Step 1: Get crumb and cookies from Yahoo Finance
async function getYahooCrumb(): Promise<{ crumb: string; cookie: string } | null> {
  try {
    // First, get cookies by visiting the consent/main page
    const initRes = await fetch('https://fc.yahoo.com', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      redirect: 'manual',
    });
    await initRes.text();

    const cookies = initRes.headers.get('set-cookie') || '';
    
    // Then get crumb
    const crumbRes = await fetch('https://query2.finance.yahoo.com/v1/test/getcrumb', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Cookie': cookies,
      },
    });

    if (!crumbRes.ok) {
      console.error('Failed to get crumb:', crumbRes.status);
      await crumbRes.text();
      return null;
    }

    const crumb = await crumbRes.text();
    return { crumb, cookie: cookies };
  } catch (error) {
    console.error('Error getting Yahoo crumb:', error);
    return null;
  }
}

// Step 2: Fetch earnings data using quoteSummary with crumb
async function fetchEarningsWithCrumb(
  symbol: string,
  crumb: string,
  cookie: string
): Promise<EarningsEvent | null> {
  try {
    const modules = 'calendarEvents,earningsHistory,price';
    const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=${modules}&crumb=${encodeURIComponent(crumb)}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Cookie': cookie,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`quoteSummary error for ${symbol}: ${response.status} - ${text.substring(0, 150)}`);
      return null;
    }

    const data = await response.json();
    const result = data?.quoteSummary?.result?.[0];
    if (!result) return null;

    const price = result.price || {};
    const calendar = result.calendarEvents || {};
    const earningsHistory = result.earningsHistory?.history || [];
    const companyName = price.longName || price.shortName || symbol;

    // Next earnings date
    const earningsDates = calendar.earnings?.earningsDate || [];
    let earningsDate: string | null = null;
    if (earningsDates.length > 0) {
      const rawDate = earningsDates[0]?.raw;
      if (rawDate) {
        earningsDate = new Date(rawDate * 1000).toISOString().split('T')[0];
      }
    }

    // EPS/Revenue estimates
    const epsEstimate = calendar.earnings?.earningsAverage?.raw ?? null;
    const revenueEstimate = calendar.earnings?.revenueAverage?.raw
      ? Math.round(calendar.earnings.revenueAverage.raw / 1e9 * 100) / 100
      : null;

    // Most recent actual from history
    let lastEpsActual: number | null = null;
    let lastEpsEstimate: number | null = null;
    let lastSurprise: number | null = null;
    let lastSurprisePct: number | null = null;
    let lastReportDate: string | null = null;

    if (earningsHistory.length > 0) {
      const latest = earningsHistory[earningsHistory.length - 1];
      lastEpsActual = latest.epsActual?.raw ?? null;
      lastEpsEstimate = latest.epsEstimate?.raw ?? null;
      lastSurprise = latest.epsDifference?.raw ?? null;
      lastSurprisePct = latest.surprisePercent?.raw != null
        ? Math.round(latest.surprisePercent.raw * 10000) / 100
        : null;
      if (latest.quarter?.raw) {
        lastReportDate = new Date(latest.quarter.raw * 1000).toISOString().split('T')[0];
      }
    }

    const now = new Date();

    // Build event for upcoming earnings
    if (earningsDate) {
      const isUpcoming = new Date(earningsDate + 'T23:59:59') >= now;
      return {
        symbol,
        companyName,
        earningsDate,
        epsEstimate: isUpcoming ? epsEstimate : lastEpsEstimate,
        epsActual: isUpcoming ? null : lastEpsActual,
        revenueEstimate: isUpcoming ? revenueEstimate : null,
        revenueActual: null,
        surprise: isUpcoming ? null : lastSurprise,
        surprisePercent: isUpcoming ? null : lastSurprisePct,
        timing: null,
      };
    }

    // No upcoming date — show last reported if available
    if (lastReportDate && lastEpsActual !== null) {
      return {
        symbol,
        companyName,
        earningsDate: lastReportDate,
        epsEstimate: lastEpsEstimate,
        epsActual: lastEpsActual,
        revenueEstimate: null,
        revenueActual: null,
        surprise: lastSurprise,
        surprisePercent: lastSurprisePct,
        timing: null,
      };
    }

    return null;
  } catch (error) {
    console.error(`Error fetching earnings for ${symbol}:`, error);
    return null;
  }
}

// Fallback: use v8 chart API to get basic company info + approximate earnings
async function fetchBasicInfo(symbol: string): Promise<EarningsEvent | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=1d&interval=1d`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (!res.ok) { await res.text(); return null; }
    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta) return null;

    return {
      symbol,
      companyName: meta.longName || meta.shortName || symbol,
      earningsDate: '', // Unknown
      epsEstimate: null,
      epsActual: null,
      revenueEstimate: null,
      revenueActual: null,
      surprise: null,
      surprisePercent: null,
      timing: null,
    };
  } catch {
    return null;
  }
}

const TRACKED_SYMBOLS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA', 'NFLX',
  'JPM', 'BAC', 'GS', 'MS',
  'JNJ', 'UNH', 'PFE',
  'WMT', 'KO', 'PG', 'DIS', 'MCD',
  'BA', 'CAT',
  'AMD', 'AVGO', 'INTC',
  'XOM', 'CVX',
  'CRM', 'ORCL', 'ADBE',
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let body: any = {};
    try { body = await req.json(); } catch { /* empty body OK */ }

    const { symbols: customSymbols } = body;
    const symbolsToFetch = (customSymbols && Array.isArray(customSymbols) && customSymbols.length > 0)
      ? customSymbols.filter((s: string) => validateSymbol(s))
      : TRACKED_SYMBOLS;

    // Check cache
    const cacheKey = `earnings_v2_${symbolsToFetch.sort().join(',')}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return new Response(
        JSON.stringify(cached),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Try to get crumb for authenticated requests
    console.log('Attempting to get Yahoo crumb...');
    const auth = await getYahooCrumb();

    const events: EarningsEvent[] = [];
    const batchSize = 5;

    for (let i = 0; i < symbolsToFetch.length; i += batchSize) {
      const batch = symbolsToFetch.slice(i, i + batchSize);

      const results = await Promise.all(
        batch.map(async (symbol: string) => {
          // Try crumb-authenticated request first
          if (auth) {
            const result = await fetchEarningsWithCrumb(symbol, auth.crumb, auth.cookie);
            if (result) return result;
          }
          // Fallback to basic info
          return await fetchBasicInfo(symbol);
        })
      );

      for (const result of results) {
        if (result && result.earningsDate) events.push(result);
      }

      if (i + batchSize < symbolsToFetch.length) {
        await new Promise(r => setTimeout(r, 300));
      }
    }

    // Sort by earnings date
    events.sort((a, b) => a.earningsDate.localeCompare(b.earningsDate));

    const responseData = {
      events,
      generated_at: new Date().toISOString(),
      source: 'yahoo_finance',
      count: events.length,
      authenticated: !!auth,
    };

    cache.set(cacheKey, { data: responseData, timestamp: Date.now() });

    return new Response(
      JSON.stringify(responseData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in fetch-earnings:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
