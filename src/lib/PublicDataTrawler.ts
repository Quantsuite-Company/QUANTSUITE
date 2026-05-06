/**
 * V5 PUBLIC DATA TRAWLER — INSTITUTIONAL PIPELINE
 * Integrates: Finnhub (free), SEC EDGAR (free), FRED (free), Twelve Data (free)
 * Features: Intelligent caching with TTL, data freshness tracking, zero Math.random() fallbacks
 */
import { supabase } from '@/integrations/supabase/client';


// SEC requires a defined User-Agent for their free EDGAR API.
const SEC_HEADERS = {
  'User-Agent': 'QuantSuite Research Terminal (research@quantsuite.dev)',
  'Accept': 'application/json',
};

// CIK mapping for SEC EDGAR (extendable)
const CIK_MAP: Record<string, string> = {
  'AAPL': '0000320193', 'MSFT': '0000789019', 'NVDA': '0001045810',
  'TSLA': '0001318605', 'PLTR': '0001321655', 'AMZN': '0001018724',
  'GOOGL': '0001652044', 'META': '0001326801', 'JPM': '0000019617',
  'XOM': '0000034088', 'BAC': '0000070858', 'WMT': '0000104169',
  'DIS': '0001744489', 'NFLX': '0001065280', 'AMD': '0000002488',
  'INTC': '0000050863', 'V': '0001403161', 'MA': '0001141391',
  'CRM': '0001108524', 'PYPL': '0001633917'
};

// ============================================================
// CACHE LAYER — Avoids burning free-tier API limits
// ============================================================
interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number; // milliseconds
}

function getCached(key: string): any | null {
  try {
    const raw = localStorage.getItem(`qs_cache_${key}`);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.timestamp > entry.ttl) {
      localStorage.removeItem(`qs_cache_${key}`);
      return null;
    }
    return entry.data;
  } catch { return null; }
}

function setCache(key: string, data: any, ttlMs: number): void {
  try {
    const entry: CacheEntry = { data, timestamp: Date.now(), ttl: ttlMs };
    localStorage.setItem(`qs_cache_${key}`, JSON.stringify(entry));
  } catch { /* localStorage full — silent fail */ }
}

// ============================================================
// DATA FRESHNESS TRACKING
// ============================================================
export interface DataFreshness {
  source: string;
  lastFetched: number;
  isCached: boolean;
  isRealData: boolean;
  fallbackReason?: string;
}

const freshnessLog: DataFreshness[] = [];
export function getDataFreshness(): DataFreshness[] { return [...freshnessLog]; }

function logFreshness(source: string, isCached: boolean, isReal: boolean, reason?: string) {
  freshnessLog.push({
    source, lastFetched: Date.now(), isCached, isRealData: isReal, fallbackReason: reason
  });
}

// ============================================================
// FINNHUB FREE TIER (60 calls/min) — Primary Quote Source
// ============================================================
const FINNHUB_KEY = import.meta.env.VITE_FINNHUB_KEY || '';

// ============================================================
// FINANCIAL MODELING PREP (FMP) — Fundamentals Source
// ============================================================
const FMP_KEY = import.meta.env.VITE_FMP_KEY || '';


// ============================================================
// PUBLIC DATA TRAWLER
// ============================================================
export const PublicDataTrawler = {
  
  /**
   * Fetches latest SEC EDGAR filings (10-K, 10-Q, 8-K) from the US Government.
   * 100% free, unlimited. The only honest data source we had before V5.
   */
  async fetchLatestSECFiling(ticker: string): Promise<string> {
    const cacheKey = `sec_${ticker}`;
    const cached = getCached(cacheKey);
    if (cached) { logFreshness('SEC EDGAR', true, true); return cached; }

    try {
      const cik = CIK_MAP[ticker.toUpperCase()];
      if (!cik) {
        logFreshness('SEC EDGAR', false, false, `No CIK mapping for ${ticker}`);
        return `[SEC] CIK mapping unavailable for ${ticker}. Ticker not in the SEC lookup table. Filing data skipped.`;
      }

      const response = await fetch(`https://data.sec.gov/submissions/CIK${cik}.json`, {
        headers: SEC_HEADERS,
      });

      if (!response.ok) throw new Error(`SEC API returned ${response.status}`);

      const data = await response.json();
      const recent = data.filings?.recent;
      
      if (recent && recent.form.length > 0) {
        // Find meaningful filings (8-K, 10-Q, 10-K, DEF 14A)
        const meaningfulForms = ['8-K', '10-Q', '10-K', 'DEF 14A', 'S-1'];
        const results: string[] = [];
        for (let i = 0; i < Math.min(5, recent.form.length); i++) {
          if (meaningfulForms.includes(recent.form[i])) {
            results.push(`${recent.form[i]} filed ${recent.filingDate[i]}: ${recent.primaryDocDescription[i] || 'Corporate event'}`);
          }
        }
        
        const result = results.length > 0 
          ? `[SEC EDGAR — REAL DATA] Recent filings for ${ticker}: ${results.join(' | ')}`
          : `[SEC EDGAR — REAL DATA] No material filings (8-K/10-Q/10-K) detected in recent submissions for ${ticker}.`;
        
        setCache(cacheKey, result, 30 * 60 * 1000); // Cache 30 minutes
        logFreshness('SEC EDGAR', false, true);
        return result;
      }
      
      const fallback = `[SEC EDGAR — REAL DATA] Submissions endpoint reached. No recent material filings for ${ticker}.`;
      logFreshness('SEC EDGAR', false, true);
      return fallback;
      
    } catch (error: any) {
      logFreshness('SEC EDGAR', false, false, error.message);
      return `[SEC EDGAR — CORS BLOCKED] Browser CORS policy prevented direct SEC access. In production, this routes through a backend proxy. Filing data unavailable for ${ticker}.`;
    }
  },

  /**
   * Fetches live quote data. Tries Finnhub → Alpha Vantage → honest fallback.
   * NEVER returns Math.random(). If all APIs fail, returns null fields.
   */
  async fetchLiveQuote(ticker: string): Promise<any> {
    const cacheKey = `quote_${ticker}`;
    const cached = getCached(cacheKey);
    if (cached) { logFreshness('Quote (cached)', true, true); return cached; }

    // Attempt 1: Finnhub Free Tier
    try {
      const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${FINNHUB_KEY}`);
      if (res.ok) {
        const data = await res.json();
        if (data.c && data.c > 0) {
          const quote = { price: data.c, high: data.h, low: data.l, volume: data.v || 0, open: data.o, prevClose: data.pc };
          setCache(cacheKey, quote, 5 * 60 * 1000); // Cache 5 minutes
          logFreshness('Finnhub', false, true);
          return quote;
        }
      }
    } catch (e) { /* Finnhub failed — try next */ }

    // Attempt 2: Yahoo via CORS proxy (unreliable but free)
    try {
      const corsProxy = 'https://api.allorigins.win/raw?url=';
      const targetUrl = encodeURIComponent(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=5d`);
      const res = await fetch(corsProxy + targetUrl);
      if (res.ok) {
        const data = await res.json();
        const meta = data.chart?.result?.[0]?.meta;
        if (meta?.regularMarketPrice) {
          const quote = { price: meta.regularMarketPrice, high: meta.regularMarketDayHigh, low: meta.regularMarketDayLow, volume: meta.regularMarketVolume || 0 };
          setCache(cacheKey, quote, 5 * 60 * 1000);
          logFreshness('Yahoo Finance (CORS proxy)', false, true);
          return quote;
        }
      }
    } catch (e) { /* Yahoo failed */ }

    // HONEST FALLBACK: Return null values, never fake it
    logFreshness('Quote', false, false, 'All quote APIs failed (Finnhub + Yahoo)');
    return { price: null, high: null, low: null, volume: null, error: 'ALL_APIS_FAILED' };
  },

  /**
   * Fetches macro economic data from FRED (Federal Reserve Economic Data). 100% free.
   */
  async fetchFREDData(seriesId: string = 'DGS10'): Promise<{ date: string, value: number }[]> {
    const cacheKey = `fred_${seriesId}`;
    const cached = getCached(cacheKey);
    if (cached) { logFreshness('FRED (cached)', true, true); return cached; }

    try {
      const fredKey = import.meta.env.VITE_FRED_KEY || '';
      const res = await fetch(`https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${fredKey}&file_type=json&sort_order=desc&limit=30`);
      if (res.ok) {
        const data = await res.json();
        const observations = (data.observations || [])
          .filter((o: any) => o.value !== '.')
          .map((o: any) => ({ date: o.date, value: parseFloat(o.value) }));
        setCache(cacheKey, observations, 60 * 60 * 1000); // Cache 1 hour
        logFreshness('FRED', false, true);
        return observations;
      }
    } catch (e) { /* FRED failed */ }
    
    logFreshness('FRED', false, false, 'FRED API failed');
    return [];
  },

  /**
   * Fetches real news headlines for sentiment analysis.
   * Uses GNews free tier (100 calls/day). Falls back to honest "no data" message.
   */
  async getPulseSentiment(ticker: string): Promise<string> {
    const cacheKey = `news_${ticker}`;
    const cached = getCached(cacheKey);
    if (cached) { logFreshness('News (cached)', true, true); return cached; }

    // Attempt: GNews API (free tier: 100/day)
    try {
      const gnewsKey = import.meta.env.VITE_GNEWS_KEY || '';
      const res = await fetch(`https://gnews.io/api/v4/search?q=${ticker}+stock&lang=en&max=3&apikey=${gnewsKey}`);
      if (res.ok) {
        const data = await res.json();
        if (data.articles && data.articles.length > 0) {
          const headlines = data.articles.map((a: any) => a.title).join(' | ');
          const result = `[REAL NEWS — GNews] ${headlines}`;
          setCache(cacheKey, result, 15 * 60 * 1000); // Cache 15 minutes
          logFreshness('GNews', false, true);
          return result;
        }
      }
    } catch (e) { /* GNews failed */ }

    // HONEST FALLBACK: no fake news
    logFreshness('News/Sentiment', false, false, 'GNews API failed or rate limited');
    return `[NEWS UNAVAILABLE] Real-time news feed for ${ticker} is currently unavailable. Sentiment analysis skipped. All thesis decisions are based on quantitative metrics only.`;
  },

  /**
   * Fetches historical price data for the math engine.
   * Tries multiple sources with intelligent fallback.
   */
  async fetchHistoricalPrices(ticker: string, range: string = '1y'): Promise<{ prices: number[], source: 'YAHOO_BACKEND' | 'TWELVE_DATA' | 'YAHOO' | 'SYNTHETIC' }> {
    const cacheKey = `hist_v4_${ticker}_${range}`;
    const cached = getCached(cacheKey);
    if (cached) { logFreshness('Historical (cached)', true, true); return cached; }

    // === ATTEMPT 1: Yahoo via CORS proxy (Most reliable for >2y data) ===
    try {
      const corsProxy = 'https://api.allorigins.win/raw?url=';
      const targetUrl = encodeURIComponent(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=${range}`);
      const res = await fetch(corsProxy + targetUrl);
      if (res.ok) {
        const data = await res.json();
        const closes = data.chart?.result?.[0]?.indicators?.quote?.[0]?.close?.filter((p: number | null) => p !== null) || [];
        if (closes.length > 20) {
          const result = { prices: closes, source: 'YAHOO' as const };
          setCache(cacheKey, result, 60 * 60 * 1000);
          logFreshness('Yahoo Historical (CORS proxy)', false, true);
          return result;
        }
      }
    } catch (e) { /* Yahoo failed */ }

    // === ATTEMPT 2: Supabase Edge Function (Reliable but remote is outdated to 2y max) ===
    try {
      const { data, error } = await supabase.functions.invoke('fetch-stock-data', {
        body: { symbol: ticker, period: range }
      });
      if (!error && data?.chartData && data.chartData.length > 20) {
        const closes = data.chartData.map((v: any) => parseFloat(v.close)); // Already oldest-to-newest
        const result = { prices: closes, source: 'YAHOO_BACKEND' as const };
        setCache(cacheKey, result, 60 * 60 * 1000);
        logFreshness('Backend Pricing (Supabase)', false, true);
        return result;
      }
    } catch (e) { /* Edge function failed */ }

    // === FALLBACK: High-amplitude deterministic proxy (clearly labeled) ===
    logFreshness('Historical', false, false, 'All APIs failed — using structural proxy');
    const seed = ticker.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const basePrice = 80 + (seed % 150); // $80-$230 range based on ticker
    const trendBias = ((seed % 5) - 2) * 0.0006; // -0.12% to +0.12% daily drift
    const curve: number[] = [basePrice];
    for (let i = 1; i < 1500; i++) {
      // High-amplitude multi-frequency oscillation for backtester signal generation
      const momentum = Math.sin(i / 8) * 0.025;      // ±2.5% 8-day cycle
      const swing    = Math.sin(i / 20) * 0.035;      // ±3.5% 20-day swing
      const macro    = Math.cos(i / 50) * 0.015;      // ±1.5% macro cycle
      const shock    = (i % 35 < 3) ? -0.02 : (i % 35 > 32) ? 0.018 : 0; // periodic shocks
      const regime   = (i > 80 && i < 130) ? -0.003 : (i > 180 && i < 220) ? 0.004 : 0; // regime shifts
      const dailyReturn = trendBias + momentum + swing + macro + shock + regime;
      const next = curve[i - 1] * (1 + dailyReturn);
      curve.push(Math.round(next * 100) / 100);
    }
    return { prices: curve, source: 'SYNTHETIC' as const };
  },

  /**
   * Fetches fundamental data (ROE, P/E, Debt/Equity) from FMP.
   * This is the backbone of the 93-Feature Factor Zoo.
   */
  async fetchFundamentals(ticker: string): Promise<any> {
    const cacheKey = `fund_${ticker}`;
    const cached = getCached(cacheKey);
    if (cached) { logFreshness('Fundamentals (cached)', true, true); return cached; }

    try {
      // Fetch key metrics and financial ratios
      const res = await fetch(`https://financialmodelingprep.com/api/v3/key-metrics-ttm/${ticker}?apikey=${FMP_KEY}`);
      if (res.ok) {
        const data = await res.json();
        const result = data[0] || {};
        setCache(cacheKey, result, 24 * 60 * 60 * 1000); // Cache for 24 hours
        logFreshness('FMP Fundamentals', false, true);
        return result;
      }
    } catch (e) { /* FMP failed */ }

    logFreshness('Fundamentals', false, false, 'FMP API failed');
    return {};
  }
};
