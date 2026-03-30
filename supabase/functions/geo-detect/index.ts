import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GeoConfig {
  region: 'US' | 'EU' | 'IN' | 'APAC';
  country: string;
  currency: string;
  markets: string[];
  locale: string;
  timezone: string;
  exchangeHours: {
    open: string;
    close: string;
  };
}

const geoConfigs: Record<string, GeoConfig> = {
  'US': {
    region: 'US',
    country: 'United States',
    currency: 'USD',
    markets: ['NYSE', 'NASDAQ', 'AMEX'],
    locale: 'en-US',
    timezone: 'America/New_York',
    exchangeHours: { open: '09:30', close: '16:00' },
  },
  'IN': {
    region: 'IN',
    country: 'India',
    currency: 'INR',
    markets: ['NSE', 'BSE'],
    locale: 'en-IN',
    timezone: 'Asia/Kolkata',
    exchangeHours: { open: '09:15', close: '15:30' },
  },
  'GB': {
    region: 'EU',
    country: 'United Kingdom',
    currency: 'GBP',
    markets: ['LSE'],
    locale: 'en-GB',
    timezone: 'Europe/London',
    exchangeHours: { open: '08:00', close: '16:30' },
  },
  'DE': {
    region: 'EU',
    country: 'Germany',
    currency: 'EUR',
    markets: ['XETRA', 'FWB'],
    locale: 'de-DE',
    timezone: 'Europe/Berlin',
    exchangeHours: { open: '09:00', close: '17:30' },
  },
  'FR': {
    region: 'EU',
    country: 'France',
    currency: 'EUR',
    markets: ['EURONEXT'],
    locale: 'fr-FR',
    timezone: 'Europe/Paris',
    exchangeHours: { open: '09:00', close: '17:30' },
  },
  'JP': {
    region: 'APAC',
    country: 'Japan',
    currency: 'JPY',
    markets: ['TSE', 'OSE'],
    locale: 'ja-JP',
    timezone: 'Asia/Tokyo',
    exchangeHours: { open: '09:00', close: '15:00' },
  },
  'CN': {
    region: 'APAC',
    country: 'China',
    currency: 'CNY',
    markets: ['SSE', 'SZSE'],
    locale: 'zh-CN',
    timezone: 'Asia/Shanghai',
    exchangeHours: { open: '09:30', close: '15:00' },
  },
  'AU': {
    region: 'APAC',
    country: 'Australia',
    currency: 'AUD',
    markets: ['ASX'],
    locale: 'en-AU',
    timezone: 'Australia/Sydney',
    exchangeHours: { open: '10:00', close: '16:00' },
  },
  'SG': {
    region: 'APAC',
    country: 'Singapore',
    currency: 'SGD',
    markets: ['SGX'],
    locale: 'en-SG',
    timezone: 'Asia/Singapore',
    exchangeHours: { open: '09:00', close: '17:00' },
  },
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Try to get country from Cloudflare header
    const cfCountry = req.headers.get('cf-ipcountry') || 
                     req.headers.get('x-vercel-ip-country') ||
                     'US';

    console.log(`[QuantSuite] Geo-detect: ${cfCountry}`);

    // Get geo configuration
    const geoConfig = geoConfigs[cfCountry] || geoConfigs['US'];

    // Add additional market metadata
    const response = {
      ...geoConfig,
      detectedCountry: cfCountry,
      timestamp: new Date().toISOString(),
      marketStatus: getMarketStatus(geoConfig),
    };

    return new Response(JSON.stringify(response), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('[QuantSuite] Geo-detect error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to detect geo location',
        fallback: geoConfigs['US'],
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function getMarketStatus(config: GeoConfig): 'open' | 'closed' | 'pre-market' | 'post-market' {
  const now = new Date();
  const timeString = now.toLocaleTimeString('en-US', { 
    hour12: false, 
    timeZone: config.timezone,
    hour: '2-digit',
    minute: '2-digit',
  });

  const currentTime = timeString.replace(':', '');
  const openTime = config.exchangeHours.open.replace(':', '');
  const closeTime = config.exchangeHours.close.replace(':', '');

  // Check if weekend
  const dayOfWeek = now.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return 'closed';
  }

  if (currentTime >= openTime && currentTime <= closeTime) {
    return 'open';
  } else if (currentTime < openTime) {
    return 'pre-market';
  } else if (currentTime > closeTime) {
    return 'post-market';
  }

  return 'closed';
}
