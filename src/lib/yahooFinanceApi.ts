// Yahoo Finance API Service for Real-Time Market Data
import { supabase } from "@/integrations/supabase/client";

export interface MarketIndex {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

class YahooFinanceService {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 60000; // 1 minute cache

  // Market index symbols
  private readonly indexSymbols = {
    nifty: '^NSEI',      // Nifty 50
    sensex: '^BSESN',    // BSE Sensex
    sp500: '^GSPC',      // S&P 500
    nasdaq: '^IXIC'      // NASDAQ Composite
  };

  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  async getMarketIndices(): Promise<{
    nifty: number;
    sensex: number;
    sp500: number;
    nasdaq: number;
  }> {
    const cacheKey = 'market_indices';
    const cached = this.getFromCache(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const { data, error } = await supabase.functions.invoke('fetch-market-data');

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      const result = data as {
        nifty: number;
        sensex: number;
        sp500: number;
        nasdaq: number;
      };

      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Market data fetch error:', error);
      // Return fallback values if API fails
      return {
        nifty: 24850,
        sensex: 81100,
        sp500: 6450,
        nasdaq: 22755
      };
    }
  }

  // Additional methods can be added here as needed for specific stock quotes
  // These would also call edge functions for backend data fetching

  clearCache(): void {
    this.cache.clear();
  }
}

export const yahooFinanceService = new YahooFinanceService();
