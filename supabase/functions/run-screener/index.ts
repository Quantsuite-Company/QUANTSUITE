import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const STOCK_UNIVERSE = [
  { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology', basePrice: 170 },
  { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology', basePrice: 420 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology', basePrice: 140 },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'Consumer', basePrice: 175 },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', sector: 'Technology', basePrice: 880 },
  { symbol: 'META', name: 'Meta Platforms Inc.', sector: 'Technology', basePrice: 500 },
  { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Consumer', basePrice: 170 },
  { symbol: 'BRK.B', name: 'Berkshire Hathaway', sector: 'Finance', basePrice: 400 },
  { symbol: 'JPM', name: 'JPMorgan Chase', sector: 'Finance', basePrice: 195 },
  { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare', basePrice: 155 },
  { symbol: 'V', name: 'Visa Inc.', sector: 'Finance', basePrice: 280 },
  { symbol: 'PG', name: 'Procter & Gamble', sector: 'Consumer', basePrice: 160 },
  { symbol: 'UNH', name: 'UnitedHealth Group', sector: 'Healthcare', basePrice: 470 },
  { symbol: 'MA', name: 'Mastercard', sector: 'Finance', basePrice: 470 },
  { symbol: 'HD', name: 'Home Depot', sector: 'Consumer', basePrice: 380 },
  { symbol: 'XOM', name: 'Exxon Mobil', sector: 'Energy', basePrice: 110 },
  { symbol: 'CVX', name: 'Chevron', sector: 'Energy', basePrice: 150 },
  { symbol: 'BAC', name: 'Bank of America', sector: 'Finance', basePrice: 37 },
  { symbol: 'ABBV', name: 'AbbVie Inc.', sector: 'Healthcare', basePrice: 170 },
  { symbol: 'WMT', name: 'Walmart Inc.', sector: 'Consumer', basePrice: 60 },
  { symbol: 'LLY', name: 'Eli Lilly', sector: 'Healthcare', basePrice: 750 },
  { symbol: 'AVGO', name: 'Broadcom', sector: 'Technology', basePrice: 1300 },
  { symbol: 'PFE', name: 'Pfizer Inc.', sector: 'Healthcare', basePrice: 27 },
  { symbol: 'ORCL', name: 'Oracle Corporation', sector: 'Technology', basePrice: 125 },
  { symbol: 'KO', name: 'Coca-Cola', sector: 'Consumer', basePrice: 60 },
  { symbol: 'PEP', name: 'PepsiCo', sector: 'Consumer', basePrice: 170 },
  { symbol: 'COST', name: 'Costco', sector: 'Consumer', basePrice: 730 },
  { symbol: 'AMD', name: 'Advanced Micro Devices', sector: 'Technology', basePrice: 180 },
  { symbol: 'NFLX', name: 'Netflix', sector: 'Technology', basePrice: 600 },
  { symbol: 'DIS', name: 'Walt Disney', sector: 'Consumer', basePrice: 115 },
  { symbol: 'INTC', name: 'Intel Corporation', sector: 'Technology', basePrice: 40 },
  { symbol: 'CSCO', name: 'Cisco Systems', sector: 'Technology', basePrice: 50 },
  { symbol: 'QCOM', name: 'Qualcomm', sector: 'Technology', basePrice: 170 },
  { symbol: 'ADBE', name: 'Adobe Inc.', sector: 'Technology', basePrice: 500 },
  { symbol: 'CRM', name: 'Salesforce', sector: 'Technology', basePrice: 300 },
  { symbol: 'TXN', name: 'Texas Instruments', sector: 'Technology', basePrice: 170 },
  { symbol: 'IBM', name: 'IBM', sector: 'Technology', basePrice: 190 },
  { symbol: 'GS', name: 'Goldman Sachs', sector: 'Finance', basePrice: 400 },
  { symbol: 'MS', name: 'Morgan Stanley', sector: 'Finance', basePrice: 90 },
  { symbol: 'C', name: 'Citigroup', sector: 'Finance', basePrice: 60 },
  { symbol: 'WFC', name: 'Wells Fargo', sector: 'Finance', basePrice: 55 },
  { symbol: 'AXP', name: 'American Express', sector: 'Finance', basePrice: 220 },
  { symbol: 'BA', name: 'Boeing', sector: 'Consumer', basePrice: 190 },
  { symbol: 'CAT', name: 'Caterpillar', sector: 'Consumer', basePrice: 350 },
  { symbol: 'MMM', name: '3M Company', sector: 'Consumer', basePrice: 100 },
  { symbol: 'MRK', name: 'Merck & Co.', sector: 'Healthcare', basePrice: 125 },
  { symbol: 'ABT', name: 'Abbott Laboratories', sector: 'Healthcare', basePrice: 110 },
  { symbol: 'TMO', name: 'Thermo Fisher Scientific', sector: 'Healthcare', basePrice: 580 },
  { symbol: 'DHR', name: 'Danaher Corporation', sector: 'Healthcare', basePrice: 240 },
  { symbol: 'NEE', name: 'NextEra Energy', sector: 'Energy', basePrice: 60 },
];

function pseudoRandomGen(seed: number) {
  let value = seed;
  return function() {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { filters } = await req.json();
    console.log('Running robust screener with filters:', filters);

    // Using a dynamic but stable seed (changes every hour) to simulate real-time data
    const hourSeed = Math.floor(Date.now() / (1000 * 60 * 60));
    const prng = pseudoRandomGen(hourSeed);

    const generatedData = STOCK_UNIVERSE.map((stock, idx) => {
      // Deterministic randomness per stock
      const noise1 = prng();
      const noise2 = prng();
      const noise3 = prng();

      const changePercent = (noise1 * 10) - 5; // -5% to +5%
      const price = stock.basePrice * (1 + (changePercent / 100));
      const change = price - stock.basePrice;
      const volume = 500000 + (noise2 * 10000000); // 500k to 10.5M
      const rsi = 20 + (noise3 * 60); // 20 to 80
      const macd = noise1 > 0.6 ? 'bullish' : noise1 < 0.4 ? 'bearish' : 'neutral';

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
    });

    // Apply explicit filters
    const results = generatedData.filter((stock) => {
      if (filters.priceMin !== undefined && stock.price < filters.priceMin) return false;
      if (filters.priceMax !== undefined && stock.price > filters.priceMax) return false;
      if (filters.volumeMin !== undefined && stock.volume < filters.volumeMin) return false;
      if (filters.changePercentMin !== undefined && stock.changePercent < filters.changePercentMin) return false;
      if (filters.changePercentMax !== undefined && stock.changePercent > filters.changePercentMax) return false;
      if (filters.rsiMin !== undefined && stock.rsi < filters.rsiMin) return false;
      if (filters.rsiMax !== undefined && stock.rsi > filters.rsiMax) return false;
      if (filters.macdSignal !== undefined && filters.macdSignal !== 'any' && stock.macd !== filters.macdSignal) return false;
      
      // Exact sector match logic
      if (filters.sector !== undefined && filters.sector !== '' && filters.sector !== 'any') {
        if (stock.sector.toLowerCase() !== filters.sector.toLowerCase()) return false;
      }

      return true;
    });

    console.log(`Robust screener found ${results.length} matching stocks`);

    return new Response(
      JSON.stringify({ results, count: results.length, cached: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Screener error:', error);
    return new Response(
      JSON.stringify({ error: error.message, results: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
