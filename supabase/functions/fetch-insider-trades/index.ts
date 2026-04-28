import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InsiderTrade {
  filer: string;
  ticker: string;
  type: string;
  shares: number;
  price: number;
  value: number;
  date: string;
  formUrl: string;
}

async function fetchForm4XML(url: string, linkHref: string): Promise<InsiderTrade | null> {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; QuantSuite/1.0; admin@quantsuite.com)' }
    });
    if (!response.ok) return null;
    
    const xml = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, "text/xml");
    if (!doc) return null;

    const ticker = doc.querySelector("issuerTradingSymbol")?.textContent || "UNKNOWN";
    const filer = doc.querySelector("rptOwnerName")?.textContent || "Insider";
    
    // Attempt to find a non-derivative transaction
    const tx = doc.querySelector("nonDerivativeTransaction");
    if (!tx) return null; // Only parsing non-derivative for now
    
    const sharesStr = tx.querySelector("transactionShares value")?.textContent;
    const priceStr = tx.querySelector("transactionPricePerShare value")?.textContent;
    const adCode = tx.querySelector("transactionAcquiredDisposedCode value")?.textContent; // 'A' for acquired (buy), 'D' for disposed (sell)
    
    if (!sharesStr || !priceStr || !adCode) return null;
    
    const shares = parseFloat(sharesStr);
    const price = parseFloat(priceStr);
    if (isNaN(shares) || isNaN(price)) return null;

    // A = Acquired (Buy), D = Disposed (Sell). Note: gifts might be D with 0 price. Let's filter price == 0.
    if (price === 0) return null;

    const isBuy = adCode === 'A';
    
    return {
      filer,
      ticker,
      type: isBuy ? "Buy" : "Sell",
      shares,
      price,
      value: shares * price,
      date: new Date().toISOString().split('T')[0], // Using today's date or we could parse the periodOfReport
      formUrl: linkHref
    };
  } catch (error) {
    console.error("XML parse error:", error);
    return null;
  }
}

async function fetchIndexAndXML(linkHref: string): Promise<InsiderTrade | null> {
  try {
     const pageRes = await fetch(linkHref, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; QuantSuite/1.0; admin@quantsuite.com)' }
     });
     if (!pageRes.ok) return null;
     
     const pageHtml = await pageRes.text();
     const xmlMatch = pageHtml.match(/\/Archives\/edgar\/data\/[0-9]+\/[0-9]+\/[a-zA-Z0-9_\-]+\.xml/);
     
     if (xmlMatch) {
        const xmlUrl = "https://www.sec.gov" + xmlMatch[0];
        return await fetchForm4XML(xmlUrl, linkHref);
     }
     return null;
  } catch (err) {
     return null;
  }
}

async function fetchSECRSS(): Promise<InsiderTrade[]> {
  console.log("Fetching SEC EDGAR RSS feed for Form 4 filings...");
  
  try {
    const rssUrl = "https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&CIK=&type=4&company=&dateb=&owner=include&start=0&count=40&output=atom";
    
    const response = await fetch(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; QuantSuite/1.0; admin@quantsuite.com)',
        'Accept': 'application/atom+xml,application/xml,text/xml',
      }
    });

    if (!response.ok) {
      throw new Error(`SEC fetch failed: ${response.status}`);
    }

    const xmlText = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, "text/xml");
    
    if (!doc) throw new Error("XML parsing failed");

    const entries = doc.querySelectorAll("entry");
    console.log(`Found ${entries.length} Form 4 entries in RSS feed. Proceeding to deep parse...`);
    
    const validTrades: InsiderTrade[] = [];
    
    // We will process them sequentially to avoid getting blocked by SEC (max 10 requsts/sec)
    // We only need ~15 good trades for the display
    for (const entry of entries) {
      if (validTrades.length >= 15) break;
      
      const link = entry.querySelector("link")?.getAttribute("href");
      if (!link) continue;
      
      const trade = await fetchIndexAndXML(link);
      if (trade) {
        validTrades.push(trade);
      }
      
      // Throttle: 100ms
      await new Promise(r => setTimeout(r, 100));
    }

    console.log(`Successfully parsed ${validTrades.length} pure factual Form 4 filings`);
    return validTrades;
  } catch (error) {
    console.error("Error fetching SEC Form 4s:", error);
    return [];
  }
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting insider trades fetch...");
    
    const trades = await fetchSECRSS();
    console.log(`Returning ${trades.length} insider trades`);

    return new Response(
      JSON.stringify({ 
        success: true,
        trades: trades,
        source: "SEC EDGAR Form 4",
        lastUpdated: new Date().toISOString(),
        count: trades.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error: any) {
    console.error('Insider trades fetch error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to fetch insider trades',
        trades: [],
        success: false
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
