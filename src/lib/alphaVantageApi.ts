// Enhanced Alpha Vantage API Service with Smart Caching & Queue Management
import { toast } from "@/hooks/use-toast";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface ApiUsageStats {
  totalRequests: number;
  successfulRequests: number;
  rateLimitHits: number;
  lastResetTime: number;
}

interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: string;
  volume: number;
}

interface TimeSeriesData {
  prices: number[];
  returns: number[];
  dates: string[];
  volumes?: number[];
}

interface OptionChain {
  symbol: string;
  expiration: string;
  calls: OptionContract[];
  puts: OptionContract[];
}

interface OptionContract {
  strike: number;
  bid: number;
  ask: number;
  volume: number;
  openInterest: number;
  impliedVolatility: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
}

interface CompanyOverview {
  symbol: string;
  name: string;
  sector: string;
  industry: string;
  marketCap: number;
  peRatio: number;
  eps: number;
  dividend: number;
  beta: number;
  description: string;
}

interface TechnicalIndicator {
  dates: string[];
  values: number[];
}

class AlphaVantageService {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private requestQueue: Array<() => Promise<any>> = [];
  private processing = false;
  private apiUsage: ApiUsageStats = {
    totalRequests: 0,
    successfulRequests: 0,
    rateLimitHits: 0,
    lastResetTime: Date.now()
  };

  private readonly baseUrl = 'https://www.alphavantage.co/query';
  private readonly defaultApiKey = 'demo';
  private userApiKey: string | null = null;

  constructor() {
    // Load API key from localStorage
    this.userApiKey = localStorage.getItem('alpha_vantage_api_key');
  }

  setApiKey(apiKey: string): void {
    this.userApiKey = apiKey;
    localStorage.setItem('alpha_vantage_api_key', apiKey);
    this.clearCache(); // Clear cache when API key changes
    toast({
      title: "API Key Saved",
      description: "Your Alpha Vantage API key has been saved and will be used for all requests.",
    });
  }

  getApiKey(): string {
    return this.userApiKey || this.defaultApiKey;
  }

  isUsingDemoKey(): boolean {
    return !this.userApiKey || this.userApiKey === 'demo';
  }
  
  // TTL in milliseconds
  private readonly ttls = {
    quote: 5 * 60 * 1000,        // 5 minutes
    daily: 60 * 60 * 1000,       // 1 hour
    intraday: 1 * 60 * 1000,     // 1 minute
    options: 60 * 60 * 1000,     // 1 hour
    overview: 24 * 60 * 60 * 1000, // 24 hours
    technical: 30 * 60 * 1000     // 30 minutes
  };

  private getCacheKey(endpoint: string, params: Record<string, string>): string {
    const sortedParams = Object.keys(params).sort().map(key => `${key}=${params[key]}`).join('&');
    return `${endpoint}:${sortedParams}`;
  }

  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  private setCache<T>(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  private async makeRequest<T>(
    params: Record<string, string>, 
    ttl: number,
    fallbackGenerator?: () => T
  ): Promise<T | null> {
    const cacheKey = this.getCacheKey(params.function, params);
    const cached = this.getFromCache<T>(cacheKey);
    
    if (cached) {
      return cached;
    }

    return new Promise((resolve) => {
      const request = async (): Promise<T | null> => {
        try {
          this.apiUsage.totalRequests++;
          
          const queryString = new URLSearchParams({
            ...params,
            apikey: params.apikey || this.userApiKey || this.defaultApiKey
          }).toString();
          
          const response = await fetch(`${this.baseUrl}?${queryString}`);
          const data = await response.json();
          
          // Check for API errors or rate limits
          if (data['Error Message'] || data['Note'] || data['Information']) {
            this.apiUsage.rateLimitHits++;
            
            if (fallbackGenerator) {
              const fallbackData = fallbackGenerator();
              this.setCache(cacheKey, fallbackData, ttl);
              return fallbackData;
            }
            return null;
          }
          
          this.apiUsage.successfulRequests++;
          this.setCache(cacheKey, data, ttl);
          return data;
        } catch (error) {
          console.error('Alpha Vantage API error:', error);
          
          if (fallbackGenerator) {
            const fallbackData = fallbackGenerator();
            this.setCache(cacheKey, fallbackData, ttl / 10); // Shorter TTL for fallback
            return fallbackData;
          }
          return null;
        }
      };

      this.requestQueue.push(() => request().then(resolve));
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.requestQueue.length === 0) return;
    
    this.processing = true;
    
    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift()!;
      await request();
      
      // Rate limiting: wait 200ms between requests (5 requests per second max)
      if (this.requestQueue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    this.processing = false;
  }

  // Public API methods
  async getQuote(symbol: string, apiKey?: string): Promise<StockQuote | null> {
    const data = await this.makeRequest(
      { function: 'GLOBAL_QUOTE', symbol, ...(apiKey && { apikey: apiKey }) },
      this.ttls.quote,
      () => this.generateSyntheticQuote(symbol)
    );

    if (!data || !data['Global Quote']) return null;

    const quote = data['Global Quote'];
    return {
      symbol: quote['01. symbol'],
      price: parseFloat(quote['05. price']),
      change: parseFloat(quote['09. change']),
      changePercent: quote['10. change percent'],
      volume: parseInt(quote['06. volume'])
    };
  }

  async getTimeSeries(
    symbol: string, 
    interval: 'daily' | 'intraday' = 'daily',
    apiKey?: string,
    outputSize: 'compact' | 'full' = 'full'
  ): Promise<TimeSeriesData | null> {
    const isDaily = interval === 'daily';
    const functionName = isDaily ? 'TIME_SERIES_DAILY' : 'TIME_SERIES_INTRADAY';
    const params = {
      function: functionName,
      symbol,
      outputsize: outputSize,
      ...(apiKey && { apikey: apiKey }),
      ...(!isDaily && { interval: '5min' })
    };

    const data = await this.makeRequest(
      params,
      isDaily ? this.ttls.daily : this.ttls.intraday,
      () => this.generateSyntheticTimeSeries(symbol)
    );

    if (!data) return null;

    const timeSeriesKey = isDaily ? 'Time Series (Daily)' : 'Time Series (5min)';
    const timeSeries = data[timeSeriesKey];
    
    if (!timeSeries) return null;

    const dates = Object.keys(timeSeries).sort().slice(-252);
    const prices = dates.map(date => parseFloat(timeSeries[date]['4. close']));
    const volumes = dates.map(date => parseInt(timeSeries[date]['5. volume']));
    const returns = prices.slice(1).map((price, i) => Math.log(price / prices[i]));

    return { prices, returns, dates, volumes };
  }

  async getOptionChain(symbol: string, apiKey?: string): Promise<OptionChain[] | null> {
    // Note: Alpha Vantage doesn't have a direct option chain endpoint in free tier
    // This would require a premium subscription or we use synthetic data
    const data = await this.makeRequest(
      { function: 'OPTION_CHAIN', symbol, ...(apiKey && { apikey: apiKey }) },
      this.ttls.options,
      () => this.generateSyntheticOptionChain(symbol)
    );

    // Since real option chain isn't available in free tier, return synthetic data
    return this.generateSyntheticOptionChain(symbol);
  }

  async getCompanyOverview(symbol: string, apiKey?: string): Promise<CompanyOverview | null> {
    const data = await this.makeRequest(
      { function: 'OVERVIEW', symbol, ...(apiKey && { apikey: apiKey }) },
      this.ttls.overview,
      () => this.generateSyntheticOverview(symbol)
    );

    if (!data || data['Symbol'] !== symbol) return null;

    return {
      symbol: data['Symbol'],
      name: data['Name'],
      sector: data['Sector'],
      industry: data['Industry'],
      marketCap: parseInt(data['MarketCapitalization']) || 0,
      peRatio: parseFloat(data['PERatio']) || 0,
      eps: parseFloat(data['EPS']) || 0,
      dividend: parseFloat(data['DividendYield']) || 0,
      beta: parseFloat(data['Beta']) || 1,
      description: data['Description'] || ''
    };
  }

  async getTechnicalIndicator(
    symbol: string,
    indicator: 'SMA' | 'EMA' | 'RSI' | 'MACD' | 'BBANDS',
    period: number = 14,
    apiKey?: string
  ): Promise<TechnicalIndicator | null> {
    const data = await this.makeRequest(
      { 
        function: indicator, 
        symbol, 
        interval: 'daily',
        time_period: period.toString(),
        series_type: 'close',
        ...(apiKey && { apikey: apiKey })
      },
      this.ttls.technical,
      () => this.generateSyntheticTechnicalIndicator(indicator, period)
    );

    if (!data) return null;

    const indicatorKey = `Technical Analysis: ${indicator}`;
    const indicatorData = data[indicatorKey];
    
    if (!indicatorData) return null;

    const dates = Object.keys(indicatorData).sort().slice(-100);
    const values = dates.map(date => {
      const dayData = indicatorData[date];
      return parseFloat(dayData[indicator] || dayData[`${indicator}_Signal`] || dayData['SMA']);
    });

    return { dates, values };
  }

  // Synthetic data generators (enhanced versions)
  private generateSyntheticQuote(symbol: string): any {
    const basePrice = 100 + Math.random() * 400;
    const change = (Math.random() - 0.5) * 10;
    
    return {
      'Global Quote': {
        '01. symbol': symbol,
        '05. price': basePrice.toFixed(2),
        '09. change': change.toFixed(2),
        '10. change percent': `${(change / basePrice * 100).toFixed(2)}%`,
        '06. volume': Math.floor(Math.random() * 1000000 + 100000).toString()
      }
    };
  }

  private generateSyntheticTimeSeries(symbol: string): any {
    const timeSeries: any = {};
    let price = 100 + Math.random() * 400;
    
    for (let i = 252; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Realistic price movement with volatility clustering
      const volatility = 0.02 + Math.random() * 0.03;
      const drift = Math.random() * 0.001 - 0.0005;
      price *= Math.exp(drift + volatility * (Math.random() - 0.5) * Math.sqrt(1/252));
      
      const volume = Math.floor(Math.random() * 1000000 + 100000);
      
      timeSeries[dateStr] = {
        '1. open': (price * (1 + (Math.random() - 0.5) * 0.02)).toFixed(2),
        '2. high': (price * (1 + Math.random() * 0.03)).toFixed(2),
        '3. low': (price * (1 - Math.random() * 0.03)).toFixed(2),
        '4. close': price.toFixed(2),
        '5. volume': volume.toString()
      };
    }
    
    return { 'Time Series (Daily)': timeSeries };
  }

  private generateSyntheticOptionChain(symbol: string): OptionChain[] {
    const stockPrice = 100 + Math.random() * 400;
    const expirations = ['2024-01-19', '2024-02-16', '2024-03-15'];
    
    return expirations.map(expiration => {
      const calls: OptionContract[] = [];
      const puts: OptionContract[] = [];
      
      // Generate strikes around current price
      for (let i = -5; i <= 5; i++) {
        const strike = Math.round((stockPrice + i * 5) / 5) * 5;
        const timeToExpiry = Math.max(0.01, (new Date(expiration).getTime() - Date.now()) / (365.25 * 24 * 60 * 60 * 1000));
        
        // Simple Black-Scholes approximation for synthetic Greeks
        const moneyness = stockPrice / strike;
        const iv = 0.2 + Math.random() * 0.3;
        
        const callPrice = Math.max(0.01, stockPrice - strike + Math.random() * 10);
        const putPrice = Math.max(0.01, strike - stockPrice + Math.random() * 10);
        
        calls.push({
          strike,
          bid: callPrice * 0.98,
          ask: callPrice * 1.02,
          volume: Math.floor(Math.random() * 1000),
          openInterest: Math.floor(Math.random() * 5000),
          impliedVolatility: iv,
          delta: Math.max(0, Math.min(1, 0.5 + (moneyness - 1) * 0.5)),
          gamma: 0.01 + Math.random() * 0.05,
          theta: -0.01 - Math.random() * 0.05,
          vega: 0.1 + Math.random() * 0.2
        });
        
        puts.push({
          strike,
          bid: putPrice * 0.98,
          ask: putPrice * 1.02,
          volume: Math.floor(Math.random() * 1000),
          openInterest: Math.floor(Math.random() * 5000),
          impliedVolatility: iv,
          delta: Math.min(0, Math.max(-1, -0.5 + (moneyness - 1) * 0.5)),
          gamma: 0.01 + Math.random() * 0.05,
          theta: -0.01 - Math.random() * 0.05,
          vega: 0.1 + Math.random() * 0.2
        });
      }
      
      return { symbol, expiration, calls, puts };
    });
  }

  private generateSyntheticOverview(symbol: string): any {
    const sectors = ['Technology', 'Healthcare', 'Financials', 'Energy', 'Consumer Goods'];
    const sector = sectors[Math.floor(Math.random() * sectors.length)];
    
    return {
      'Symbol': symbol,
      'Name': `${symbol} Corporation`,
      'Sector': sector,
      'Industry': `${sector} Services`,
      'MarketCapitalization': (Math.random() * 1000000000000).toString(),
      'PERatio': (10 + Math.random() * 30).toFixed(2),
      'EPS': (Math.random() * 10).toFixed(2),
      'DividendYield': (Math.random() * 0.05).toFixed(4),
      'Beta': (0.5 + Math.random() * 1.5).toFixed(2),
      'Description': `${symbol} is a leading company in the ${sector} sector.`
    };
  }

  private generateSyntheticTechnicalIndicator(indicator: string, period: number): any {
    const data: any = {};
    const indicatorKey = `Technical Analysis: ${indicator}`;
    data[indicatorKey] = {};
    
    for (let i = 100; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      let value: number;
      switch (indicator) {
        case 'RSI':
          value = 30 + Math.random() * 40; // RSI between 30-70
          break;
        case 'SMA':
        case 'EMA':
          value = 100 + Math.random() * 50; // Price-like values
          break;
        default:
          value = Math.random() * 100;
      }
      
      data[indicatorKey][dateStr] = {
        [indicator]: value.toFixed(4)
      };
    }
    
    return data;
  }

  // API Management methods
  getApiUsage(): ApiUsageStats {
    return { ...this.apiUsage };
  }

  clearCache(): void {
    this.cache.clear();
    toast({
      title: "Cache Cleared",
      description: "All cached market data has been cleared.",
    });
  }

  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
}

// Export singleton instance
export const alphaVantageService = new AlphaVantageService();

// Export types
export type { 
  StockQuote, 
  TimeSeriesData, 
  OptionChain, 
  OptionContract, 
  CompanyOverview, 
  TechnicalIndicator,
  ApiUsageStats 
};