/**
 * ═══════════════════════════════════════════════════════════
 * QUANTSUITE NEWS TERMINAL
 * Live financial news from top sources via free RSS feeds.
 * Auto-refreshes every 15 minutes. Zero API keys required.
 * ═══════════════════════════════════════════════════════════
 */

export interface NewsItem {
  id: string;
  title: string;
  description: string;
  source: string;
  sourceIcon: string;
  url: string;
  publishedAt: Date;
  category: 'markets' | 'economy' | 'geopolitics' | 'earnings' | 'crypto' | 'commodities' | 'central_bank' | 'general';
  sentiment: 'bullish' | 'bearish' | 'neutral';
  impact: 'high' | 'medium' | 'low';
}

/* ═══ RSS Feed sources ═══ */
interface FeedSource {
  name: string;
  icon: string;
  url: string;
  corsProxy: string;
}

const FEEDS: FeedSource[] = [
  {
    name: 'CNBC',
    icon: '📺',
    url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100003114',
    corsProxy: 'https://api.allorigins.win/raw?url=',
  },
  {
    name: 'Reuters',
    icon: '🔵',
    url: 'https://news.google.com/rss/search?q=Reuters+finance+markets&hl=en-US&gl=US&ceid=US:en',
    corsProxy: 'https://api.allorigins.win/raw?url=',
  },
  {
    name: 'MarketWatch',
    icon: '📊',
    url: 'https://feeds.content.dowjones.io/public/rss/mw_topstories',
    corsProxy: 'https://api.allorigins.win/raw?url=',
  },
  {
    name: 'Yahoo Finance',
    icon: '💰',
    url: 'https://news.google.com/rss/search?q=Yahoo+Finance+stock+market&hl=en-US&gl=US&ceid=US:en',
    corsProxy: 'https://api.allorigins.win/raw?url=',
  },
  {
    name: 'Bloomberg',
    icon: '🟧',
    url: 'https://news.google.com/rss/search?q=Bloomberg+markets+economy&hl=en-US&gl=US&ceid=US:en',
    corsProxy: 'https://api.allorigins.win/raw?url=',
  },
];

/* ═══ Category detection ═══ */
const CATEGORY_KEYWORDS: Record<NewsItem['category'], string[]> = {
  markets: ['stock', 'market', 'dow', 'nasdaq', 's&p', 'rally', 'sell-off', 'bull', 'bear', 'index', 'wall street', 'equit', 'share', 'nifty', 'sensex', 'ftse', 'dax'],
  economy: ['gdp', 'inflation', 'unemployment', 'jobs', 'economic', 'recession', 'growth', 'consumer', 'retail sales', 'pmi', 'manufacturing'],
  geopolitics: ['war', 'conflict', 'sanction', 'tariff', 'trade war', 'geopolit', 'nato', 'military', 'nuclear', 'tension', 'crisis', 'deploy'],
  earnings: ['earnings', 'revenue', 'profit', 'quarterly', 'eps', 'beat', 'miss', 'guidance', 'results', 'q1', 'q2', 'q3', 'q4', 'forecast'],
  crypto: ['bitcoin', 'crypto', 'ethereum', 'blockchain', 'btc', 'defi', 'nft', 'token', 'coin'],
  commodities: ['oil', 'gold', 'silver', 'crude', 'commodity', 'copper', 'natural gas', 'wheat', 'opec', 'brent', 'wti'],
  central_bank: ['fed', 'federal reserve', 'ecb', 'boj', 'rbi', 'rate hike', 'rate cut', 'interest rate', 'monetary policy', 'powell', 'lagarde', 'central bank', 'fomc'],
  general: [],
};

const BULLISH_WORDS = ['rally', 'surge', 'gain', 'rise', 'jump', 'soar', 'bull', 'record', 'high', 'beat', 'boost', 'growth', 'optimis', 'upbeat', 'strong'];
const BEARISH_WORDS = ['crash', 'plunge', 'fall', 'drop', 'decline', 'sell', 'bear', 'low', 'miss', 'fear', 'warn', 'risk', 'concern', 'slump', 'weak', 'loss'];

function categorize(text: string): NewsItem['category'] {
  const lower = text.toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (cat === 'general') continue;
    if (keywords.some(kw => lower.includes(kw))) return cat as NewsItem['category'];
  }
  return 'general';
}

function detectSentiment(text: string): NewsItem['sentiment'] {
  const lower = text.toLowerCase();
  const bullScore = BULLISH_WORDS.filter(w => lower.includes(w)).length;
  const bearScore = BEARISH_WORDS.filter(w => lower.includes(w)).length;
  if (bullScore > bearScore + 1) return 'bullish';
  if (bearScore > bullScore + 1) return 'bearish';
  return 'neutral';
}

function detectImpact(text: string): NewsItem['impact'] {
  const lower = text.toLowerCase();
  const highImpact = ['breaking', 'urgent', 'emergency', 'crash', 'surge', 'record', 'war', 'federal reserve', 'fomc', 'rate', 'crisis'];
  const medImpact = ['report', 'data', 'quarterly', 'forecast', 'warning', 'concern'];
  if (highImpact.some(w => lower.includes(w))) return 'high';
  if (medImpact.some(w => lower.includes(w))) return 'medium';
  return 'low';
}

/* ═══ RSS Parser ═══ */
function parseRSSXML(xml: string, source: FeedSource): NewsItem[] {
  const items: NewsItem[] = [];
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');
    const entries = doc.querySelectorAll('item');
    entries.forEach((entry, i) => {
      if (i >= 8) return; // Max 8 per source
      const title = entry.querySelector('title')?.textContent?.trim() || '';
      const desc = entry.querySelector('description')?.textContent?.trim() || '';
      const link = entry.querySelector('link')?.textContent?.trim() || '';
      const pubDate = entry.querySelector('pubDate')?.textContent?.trim() || '';

      // Clean HTML from description
      const cleanDesc = desc.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').substring(0, 300);

      if (!title) return;

      const fullText = `${title} ${cleanDesc}`;
      items.push({
        id: `${source.name}-${i}-${Date.now()}`,
        title,
        description: cleanDesc || title,
        source: source.name,
        sourceIcon: source.icon,
        url: link,
        publishedAt: pubDate ? new Date(pubDate) : new Date(),
        category: categorize(fullText),
        sentiment: detectSentiment(fullText),
        impact: detectImpact(fullText),
      });
    });
  } catch (e) {
    console.warn(`[NewsTerminal] Failed to parse ${source.name}:`, e);
  }
  return items;
}

/* ═══ Fetch all feeds ═══ */
export async function fetchAllNews(): Promise<NewsItem[]> {
  const allItems: NewsItem[] = [];

  const fetchPromises = FEEDS.map(async (feed) => {
    try {
      const proxyUrl = `${feed.corsProxy}${encodeURIComponent(feed.url)}`;
      const response = await fetch(proxyUrl, { 
        signal: AbortSignal.timeout(8000),
        headers: { 'Accept': 'application/xml, text/xml, application/rss+xml' }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();
      return parseRSSXML(text, feed);
    } catch (e) {
      console.warn(`[NewsTerminal] Failed to fetch ${feed.name}:`, e);
      return [];
    }
  });

  const results = await Promise.allSettled(fetchPromises);
  results.forEach(r => {
    if (r.status === 'fulfilled') allItems.push(...r.value);
  });

  // Sort by date (newest first), deduplicate by similar titles
  allItems.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());

  // Deduplicate: remove items with very similar titles
  const seen = new Set<string>();
  const deduped: NewsItem[] = [];
  for (const item of allItems) {
    const key = item.title.toLowerCase().substring(0, 40);
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(item);
    }
  }

  return deduped;
}

/* ═══ Fallback news (used when RSS fetch fails) ═══ */
export function getFallbackNews(): NewsItem[] {
  const now = Date.now();
  const templates = [
    { title: 'Markets react to latest Federal Reserve policy signals', source: 'CNBC', icon: '📺', cat: 'central_bank' as const, sent: 'neutral' as const, impact: 'high' as const, desc: 'Investors weigh the implications of the Federal Reserve\'s latest policy meeting minutes.' },
    { title: 'Tech giants lead Nasdaq to fresh highs on AI demand', source: 'Bloomberg', icon: '🟧', cat: 'markets' as const, sent: 'bullish' as const, impact: 'medium' as const, desc: 'Artificial intelligence spending continues to drive semiconductor and cloud stocks higher.' },
    { title: 'Oil prices volatile amid OPEC supply concerns', source: 'Reuters', icon: '🔵', cat: 'commodities' as const, sent: 'neutral' as const, impact: 'medium' as const, desc: 'Crude futures swing as traders assess OPEC+ production decisions and global demand outlook.' },
    { title: 'Emerging markets under pressure as dollar strengthens', source: 'MarketWatch', icon: '📊', cat: 'markets' as const, sent: 'bearish' as const, impact: 'medium' as const, desc: 'Rising U.S. Treasury yields boost the dollar, putting pressure on emerging market currencies and equities.' },
    { title: 'Global semiconductor demand exceeds forecasts', source: 'CNBC', icon: '📺', cat: 'earnings' as const, sent: 'bullish' as const, impact: 'high' as const, desc: 'Major chip makers report stronger-than-expected orders as data center and automotive demand surges.' },
    { title: 'ECB signals patience on rate decisions amid mixed data', source: 'Reuters', icon: '🔵', cat: 'central_bank' as const, sent: 'neutral' as const, impact: 'medium' as const, desc: 'European Central Bank officials suggest a cautious approach to monetary policy normalization.' },
    { title: 'Gold hits new record as geopolitical risks intensify', source: 'Bloomberg', icon: '🟧', cat: 'commodities' as const, sent: 'bullish' as const, impact: 'high' as const, desc: 'Safe-haven demand drives gold to unprecedented levels amid escalating global tensions.' },
    { title: 'Bitcoin ETFs see sustained institutional inflows', source: 'Yahoo Finance', icon: '💰', cat: 'crypto' as const, sent: 'bullish' as const, impact: 'medium' as const, desc: 'Spot Bitcoin ETFs continue to attract institutional capital, signaling growing mainstream adoption.' },
    { title: 'China trade data raises global growth concerns', source: 'Reuters', icon: '🔵', cat: 'economy' as const, sent: 'bearish' as const, impact: 'high' as const, desc: 'Weaker-than-expected Chinese exports and imports reignite fears of a global economic slowdown.' },
    { title: 'Defense stocks surge on increased NATO spending commitments', source: 'MarketWatch', icon: '📊', cat: 'geopolitics' as const, sent: 'bullish' as const, impact: 'medium' as const, desc: 'European defense companies rally after NATO members agree to accelerate military spending targets.' },
    { title: 'U.S. jobs report surprises to the upside', source: 'CNBC', icon: '📺', cat: 'economy' as const, sent: 'bullish' as const, impact: 'high' as const, desc: 'Non-farm payrolls significantly exceed expectations, complicating the Fed\'s rate cut timeline.' },
    { title: 'Earnings season kicks off with mixed bank results', source: 'Bloomberg', icon: '🟧', cat: 'earnings' as const, sent: 'neutral' as const, impact: 'medium' as const, desc: 'Major U.S. banks report quarterly results with diverging trends in net interest income and trading revenue.' },
  ];

  return templates.map((t, i) => ({
    id: `fallback-${i}`,
    title: t.title,
    description: t.desc,
    source: t.source,
    sourceIcon: t.icon,
    url: '#',
    publishedAt: new Date(now - i * 1800000), // Staggered by 30 min
    category: t.cat,
    sentiment: t.sent,
    impact: t.impact,
  }));
}

/* ═══ Category styling ═══ */
export const CATEGORY_STYLES: Record<NewsItem['category'], { color: string; bg: string; label: string }> = {
  markets: { color: '#00ff88', bg: '#00ff8810', label: 'MARKETS' },
  economy: { color: '#00d5ff', bg: '#00d5ff10', label: 'ECONOMY' },
  geopolitics: { color: '#ff4444', bg: '#ff444410', label: 'GEOPOLITICS' },
  earnings: { color: '#a855f7', bg: '#a855f710', label: 'EARNINGS' },
  crypto: { color: '#f97316', bg: '#f9731610', label: 'CRYPTO' },
  commodities: { color: '#eab308', bg: '#eab30810', label: 'COMMODITIES' },
  central_bank: { color: '#ec4899', bg: '#ec489910', label: 'CENTRAL BANK' },
  general: { color: '#94a3b8', bg: '#94a3b810', label: 'GENERAL' },
};

export const SENTIMENT_STYLES: Record<NewsItem['sentiment'], { color: string; icon: string }> = {
  bullish: { color: '#00ff88', icon: '▲' },
  bearish: { color: '#ff4444', icon: '▼' },
  neutral: { color: '#ffaa00', icon: '◆' },
};
