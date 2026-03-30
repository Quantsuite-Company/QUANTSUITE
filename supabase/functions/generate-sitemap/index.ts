import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SitemapPage {
  loc: string;
  priority: number;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  lastmod?: string;
}

const pages: SitemapPage[] = [
  // Homepage
  { loc: '/', priority: 1.0, changefreq: 'daily' },
  
  // AI Tools
  { loc: '/athena', priority: 0.9, changefreq: 'daily' },
  { loc: '/market-maw', priority: 0.9, changefreq: 'hourly' },
  { loc: '/advisor', priority: 0.8, changefreq: 'daily' },
  
  // Market & Trading
  { loc: '/command-center', priority: 1.0, changefreq: 'hourly' },
  { loc: '/market-terminal', priority: 0.9, changefreq: 'hourly' },
  { loc: '/screener', priority: 0.9, changefreq: 'hourly' },
  { loc: '/insider-street', priority: 0.8, changefreq: 'hourly' },
  
  // Portfolio Management
  { loc: '/portfolios', priority: 0.8, changefreq: 'daily' },
  { loc: '/portfolio-builder', priority: 0.8, changefreq: 'daily' },
  { loc: '/alpha-signals', priority: 0.9, changefreq: 'hourly' },
  { loc: '/walk-forward', priority: 0.8, changefreq: 'daily' },
  
  // Pricing Models
  { loc: '/pricing', priority: 0.7, changefreq: 'weekly' },
  { loc: '/black-scholes', priority: 0.7, changefreq: 'weekly' },
  { loc: '/binomial-tree', priority: 0.7, changefreq: 'weekly' },
  { loc: '/monte-carlo', priority: 0.7, changefreq: 'weekly' },
  { loc: '/volatility-solver', priority: 0.7, changefreq: 'weekly' },
  { loc: '/svi', priority: 0.6, changefreq: 'weekly' },
  
  // Analysis Tools
  { loc: '/advanced-greeks', priority: 0.7, changefreq: 'daily' },
  { loc: '/advanced-scenario', priority: 0.7, changefreq: 'daily' },
  { loc: '/risk-analysis', priority: 0.8, changefreq: 'daily' },
  { loc: '/technical-indicators', priority: 0.7, changefreq: 'daily' },
  { loc: '/csv-visualizer', priority: 0.6, changefreq: 'daily' },
  
  // Strategy & Tools
  { loc: '/strategy-builder', priority: 0.8, changefreq: 'daily' },
  { loc: '/quant-engine', priority: 0.8, changefreq: 'daily' },
  { loc: '/arbitrage', priority: 0.7, changefreq: 'hourly' },
  { loc: '/toolkit', priority: 0.6, changefreq: 'weekly' },
  
  // Learning
  { loc: '/tutorial', priority: 0.7, changefreq: 'weekly' },
  { loc: '/educational-insights', priority: 0.7, changefreq: 'weekly' },
  
  // Info Pages
  { loc: '/about', priority: 0.5, changefreq: 'monthly' },
  { loc: '/faq', priority: 0.6, changefreq: 'monthly' },
  { loc: '/privacy', priority: 0.4, changefreq: 'yearly' },
  { loc: '/products', priority: 0.6, changefreq: 'monthly' },
  { loc: '/insights', priority: 0.7, changefreq: 'weekly' },
];

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const baseUrl = 'https://quantsuite.app';
    const today = new Date().toISOString().split('T')[0];

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${pages.map(page => `  <url>
    <loc>${baseUrl}${page.loc}</loc>
    <lastmod>${page.lastmod || today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    console.log(`[QuantSuite] Generated sitemap with ${pages.length} pages`);

    return new Response(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600',
      },
    });

  } catch (error) {
    console.error('[QuantSuite] Sitemap generation error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate sitemap' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
