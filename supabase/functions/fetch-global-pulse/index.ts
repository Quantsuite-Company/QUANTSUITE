import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NewsItem {
  id: string;
  title: string;
  source: string;
  category: string;
  timestamp: string;
  url: string;
  snippet: string;
  sentiment?: 'bullish' | 'bearish' | 'neutral';
  region?: string;
  impact?: 'high' | 'medium' | 'low';
}

interface MarketEvent {
  id: string;
  type: 'economic' | 'earnings' | 'ipo' | 'dividend' | 'geopolitical' | 'natural';
  title: string;
  description: string;
  timestamp: string;
  impact: 'high' | 'medium' | 'low';
  region: string;
  relatedTickers?: string[];
  lat?: number;
  lng?: number;
}

// Fetch RSS feed and parse items
async function fetchRSS(url: string, source: string, category: string): Promise<NewsItem[]> {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'QuantSuite/1.0' },
    });

    if (!response.ok) return [];

    const xml = await response.text();
    const items: NewsItem[] = [];

    // Simple XML parsing for RSS items
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    let count = 0;

    while ((match = itemRegex.exec(xml)) !== null && count < 10) {
      const itemXml = match[1];
      const title = extractTag(itemXml, 'title');
      const link = extractTag(itemXml, 'link');
      const description = extractTag(itemXml, 'description');
      const pubDate = extractTag(itemXml, 'pubDate');

      if (title) {
        items.push({
          id: `${source}-${count}-${Date.now()}`,
          title: cleanHtml(title),
          source,
          category,
          timestamp: pubDate || new Date().toISOString(),
          url: link || '',
          snippet: cleanHtml(description || '').slice(0, 200),
          sentiment: analyzeSentiment(title),
          region: detectRegion(title),
          impact: detectImpact(title),
        });
        count++;
      }
    }

    return items;
  } catch (error) {
    console.error(`Error fetching RSS from ${source}:`, error);
    return [];
  }
}

function extractTag(xml: string, tag: string): string {
  const cdataMatch = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`).exec(xml);
  if (cdataMatch) return cdataMatch[1];
  const match = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`).exec(xml);
  return match ? match[1].trim() : '';
}

function cleanHtml(text: string): string {
  return text.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
}

function analyzeSentiment(text: string): 'bullish' | 'bearish' | 'neutral' {
  const lower = text.toLowerCase();
  const bullish = ['surge', 'rally', 'gain', 'rise', 'jump', 'soar', 'record high', 'bullish', 'upbeat', 'growth', 'profit', 'beat'];
  const bearish = ['fall', 'drop', 'crash', 'decline', 'plunge', 'loss', 'bearish', 'fear', 'recession', 'crisis', 'warn', 'cut'];

  const bullCount = bullish.filter(w => lower.includes(w)).length;
  const bearCount = bearish.filter(w => lower.includes(w)).length;

  if (bullCount > bearCount) return 'bullish';
  if (bearCount > bullCount) return 'bearish';
  return 'neutral';
}

function detectRegion(text: string): string {
  const lower = text.toLowerCase();
  if (/\b(us|america|fed|wall street|nasdaq|s&p|dow)\b/.test(lower)) return 'Americas';
  if (/\b(europe|ecb|ftse|dax|eu|uk|britain|germany|france)\b/.test(lower)) return 'Europe';
  if (/\b(china|japan|asia|nikkei|shanghai|hong kong|india|bse|nifty)\b/.test(lower)) return 'Asia';
  if (/\b(dubai|saudi|opec|middle east|mena|gcc)\b/.test(lower)) return 'MENA';
  return 'Global';
}

function detectImpact(text: string): 'high' | 'medium' | 'low' {
  const lower = text.toLowerCase();
  const highImpact = ['crash', 'crisis', 'emergency', 'war', 'fed', 'rate', 'recession', 'default', 'sanctions'];
  const medImpact = ['earnings', 'merger', 'ipo', 'upgrade', 'downgrade', 'inflation'];

  if (highImpact.some(w => lower.includes(w))) return 'high';
  if (medImpact.some(w => lower.includes(w))) return 'medium';
  return 'low';
}

// Generate dynamic market events using Gemini AI
async function generateMarketEvents(region: string): Promise<MarketEvent[]> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    console.log("No AI key found, falling back to static events");
    return getFallbackEvents(region);
  }

  try {
    const prompt = `
    Generate 4 real-time, highly significant global financial/geopolitical market events occurring right now in the ${region} region (or globally if Global).
    
    IMPORTANT: You must return the response as a pure JSON array of objects with this EXACT structure (no markdown, no backticks, just the generic JSON array):
    [
      {
        "id": "ev-uuid",
        "type": "geopolitical", // MUST be one of: economic, earnings, ipo, dividend, geopolitical, natural
        "title": "Brief urgent headline max 40 chars",
        "description": "Short description of the event, 1-2 sentences.",
        "timestamp": "ISO 8601 string of current time",
        "impact": "high", // MUST be: high, medium, low
        "region": "${region}",
        "lat": 12.345, // MUST BE A REAL GPS LATITUDE WHERE THIS IS HAPPENING
        "lng": 12.345, // MUST BE A REAL GPS LONGITUDE WHERE THIS IS HAPPENING
        "relatedTickers": ["TICKER1", "TICKER2"]
      }
    ]
    `;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      }),
    });

    if (!response.ok) throw new Error("AI Gateway Error");

    const data = await response.json();
    let content = data.choices[0].message.content.trim();
    if (content.startsWith("\`\`\`json")) content = content.replace(/\`\`\`json/g, "").replace(/\`\`\`/g, "").trim();

    return JSON.parse(content) as MarketEvent[];
  } catch (err) {
    console.error("AI Event generation failed", err);
    return getFallbackEvents(region);
  }
}

function getFallbackEvents(region: string): MarketEvent[] {
  const now = new Date();
  return [
    {
      id: 'ev-1',
      type: 'economic',
      title: 'US Non-Farm Payrolls Release',
      description: 'Bureau of Labor Statistics releases monthly employment data',
      timestamp: now.toISOString(),
      impact: 'high',
      region: 'Americas',
      lat: 38.8951,
      lng: -77.0364,
      relatedTickers: ['SPY', 'DIA', 'QQQ'],
    },
    {
      id: 'ev-2',
      type: 'economic',
      title: 'ECB Interest Rate Decision',
      description: 'European Central Bank monetary policy meeting outcome',
      timestamp: new Date(now.getTime() - 3600000).toISOString(),
      impact: 'high',
      region: 'Europe',
      relatedTickers: ['EFA', 'VGK', 'FXE'],
    },
    {
      id: 'ev-3',
      type: 'earnings',
      title: 'NVIDIA Q4 Earnings Call',
      description: 'Quarterly earnings results and forward guidance',
      timestamp: new Date(now.getTime() - 7200000).toISOString(),
      impact: 'high',
      region: 'Americas',
      relatedTickers: ['NVDA', 'AMD', 'INTC'],
    },
    {
      id: 'ev-4',
      type: 'geopolitical',
      title: 'OPEC+ Production Quota Meeting',
      description: 'Oil production targets review and adjustment',
      timestamp: new Date(now.getTime() - 14400000).toISOString(),
      impact: 'medium',
      region: 'MENA',
      relatedTickers: ['USO', 'XLE', 'OXY'],
    },
    {
      id: 'ev-5',
      type: 'economic',
      title: 'China PMI Manufacturing Data',
      description: 'Purchasing Managers Index signals factory activity trends',
      timestamp: new Date(now.getTime() - 21600000).toISOString(),
      impact: 'medium',
      region: 'Asia',
      relatedTickers: ['FXI', 'MCHI', 'BABA'],
    },
  ];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { region = 'Global' } = await req.json().catch(() => ({}));

    // Fetch from multiple RSS sources in parallel
    const feeds = [
      fetchRSS('https://feeds.bbci.co.uk/news/business/rss.xml', 'BBC Business', 'markets'),
      fetchRSS('https://rss.nytimes.com/services/xml/rss/nyt/Business.xml', 'NY Times', 'business'),
      fetchRSS('https://feeds.reuters.com/reuters/businessNews', 'Reuters', 'markets'),
      fetchRSS('https://www.cnbc.com/id/100003114/device/rss/rss.html', 'CNBC', 'markets'),
      fetchRSS('https://feeds.marketwatch.com/marketwatch/topstories/', 'MarketWatch', 'markets'),
    ];

    const results = await Promise.allSettled(feeds);
    let allNews: NewsItem[] = [];

    for (const result of results) {
      if (result.status === 'fulfilled') {
        allNews = allNews.concat(result.value);
      }
    }

    // Sort by timestamp descending
    allNews.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Filter by region if specified
    if (region !== 'Global') {
      const regionNews = allNews.filter(n => n.region === region || n.region === 'Global');
      if (regionNews.length > 5) {
        allNews = regionNews;
      }
    }

    // Limit
    allNews = allNews.slice(0, 30);

    const events = await generateMarketEvents(region);

    return new Response(JSON.stringify({
      success: true,
      news: allNews,
      events,
      timestamp: new Date().toISOString(),
      region,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Global pulse error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch global pulse data',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
