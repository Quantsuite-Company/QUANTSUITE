import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { StockAutocomplete } from './StockAutocomplete';
import { alphaVantageService, StockQuote, CompanyOverview } from '@/lib/alphaVantageApi';
import { useToast } from '@/hooks/use-toast';
import { TrendUp, TrendDown, Building, DollarCircle, ChartSquare, Warning2 } from 'iconsax-react';

interface EnhancedStockSelectorProps {
  ticker: string;
  onTickerChange: (ticker: string) => void;
  onPriceUpdate?: (price: number) => void;
  showCompanyInfo?: boolean;
  showTechnicalData?: boolean;
}

export const EnhancedStockSelector: React.FC<EnhancedStockSelectorProps> = ({
  ticker,
  onTickerChange,
  onPriceUpdate,
  showCompanyInfo = true,
  showTechnicalData = false
}) => {
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [overview, setOverview] = useState<CompanyOverview | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState(alphaVantageService.getApiKey());
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [usingSyntheticData, setUsingSyntheticData] = useState(false);
  const { toast } = useToast();

  const fetchStockData = useCallback(async (symbol: string) => {
    if (!symbol) return;
    
    setLoading(true);
    setUsingSyntheticData(false);
    try {
      // Fetch quote and overview in parallel
      const [quoteData, overviewData] = await Promise.all([
        alphaVantageService.getQuote(symbol),
        showCompanyInfo ? alphaVantageService.getCompanyOverview(symbol) : Promise.resolve(null)
      ]);

      // Check if we got synthetic data by looking at the cache stats
      const stats = alphaVantageService.getApiUsage();
      if (stats.rateLimitHits > 0 && alphaVantageService.isUsingDemoKey()) {
        setUsingSyntheticData(true);
      }

      setQuote(quoteData);
      setOverview(overviewData);

      if (quoteData && onPriceUpdate) {
        onPriceUpdate(quoteData.price);
      }

      if (quoteData && !usingSyntheticData) {
        toast({
          title: "Stock Data Updated",
          description: `${symbol}: $${quoteData.price.toFixed(2)} (${quoteData.changePercent})`,
        });
      }
    } catch (error) {
      setUsingSyntheticData(true);
      toast({
        title: "Failed to fetch stock data",
        description: "Using synthetic data. Add your API key for real market data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [onPriceUpdate, showCompanyInfo, toast, usingSyntheticData]);

  const handleTickerChange = (newTicker: string) => {
    onTickerChange(newTicker);
    fetchStockData(newTicker);
  };

  const handleSaveApiKey = () => {
    if (apiKey && apiKey !== 'demo') {
      alphaVantageService.setApiKey(apiKey);
      setShowApiKeyInput(false);
      if (ticker) {
        fetchStockData(ticker);
      }
    }
  };

  const formatMarketCap = (marketCap: number) => {
    if (marketCap >= 1e12) return `$${(marketCap / 1e12).toFixed(1)}T`;
    if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(1)}B`;
    if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(1)}M`;
    return `$${marketCap.toFixed(0)}`;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ChartSquare className="h-5 w-5" />
          Stock Selection & Market Data
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stock Selector */}
        <div className="flex gap-2">
          <div className="flex-1">
            <StockAutocomplete
              value={ticker}
              onChange={handleTickerChange}
              placeholder="Search stocks (e.g., AAPL, TSLA, GOOGL)..."
              className="w-full"
            />
          </div>
          <Button
            onClick={() => fetchStockData(ticker)}
            variant="outline"
            size="default"
            disabled={loading || !ticker}
          >
            {loading ? "Loading..." : "Refresh"}
          </Button>
        </div>

        {/* Real-time Quote */}
        {quote && (
          <div className="space-y-3">
            <Separator />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Current Price</div>
                <div className="text-2xl font-bold">${quote.price.toFixed(2)}</div>
              </div>
              
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Change</div>
                <div className={`text-lg font-semibold flex items-center gap-1 ${
                  quote.change >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {quote.change >= 0 ? <TrendUp className="h-4 w-4" /> : <TrendDown className="h-4 w-4" />}
                  {quote.change >= 0 ? '+' : ''}{quote.change.toFixed(2)} ({quote.changePercent})
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Volume</div>
                <div className="text-lg font-semibold">{quote.volume.toLocaleString()}</div>
              </div>
              
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Symbol</div>
                <Badge variant="outline" className="text-lg font-mono">{quote.symbol}</Badge>
              </div>
            </div>
          </div>
        )}

        {/* Company Overview */}
        {showCompanyInfo && overview && (
          <div className="space-y-3">
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                <span className="font-medium">{overview.name}</span>
                <Badge variant="secondary">{overview.sector}</Badge>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Market Cap</div>
                  <div className="font-medium">{formatMarketCap(overview.marketCap)}</div>
                </div>
                
                <div>
                  <div className="text-muted-foreground">P/E Ratio</div>
                  <div className="font-medium">{overview.peRatio.toFixed(2)}</div>
                </div>
                
                <div>
                  <div className="text-muted-foreground">EPS</div>
                  <div className="font-medium">${overview.eps.toFixed(2)}</div>
                </div>
                
                <div>
                  <div className="text-muted-foreground">Beta</div>
                  <div className="font-medium">{overview.beta.toFixed(2)}</div>
                </div>
              </div>
              
              <div>
                <div className="text-sm text-muted-foreground mb-1">Industry</div>
                <div className="text-sm">{overview.industry}</div>
              </div>
            </div>
          </div>
        )}

        {/* API Key Section */}
        <div className="space-y-3">
          <Separator />
          
          {usingSyntheticData && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-destructive font-semibold">
                <Warning2 size={16} variant="Bold" />
                Currently Using Synthetic Data
              </div>
              <div className="text-sm text-muted-foreground">
                The demo API key doesn't provide real data. Get a <strong>FREE</strong> Alpha Vantage API key for actual market prices.
              </div>
              <Button
                onClick={() => window.open('https://www.alphavantage.co/support/#api-key', '_blank')}
                variant="destructive"
                size="sm"
                className="w-full"
              >
                Get Free API Key (20 seconds)
              </Button>
            </div>
          )}
          
          <div className="space-y-2">
            <Button
              onClick={() => setShowApiKeyInput(!showApiKeyInput)}
              variant="outline"
              size="sm"
              className="w-full"
            >
              {showApiKeyInput ? 'Hide' : 'Add'} API Key
            </Button>
            
            {showApiKeyInput && (
              <div className="flex gap-2">
                <Input
                  placeholder="Paste your Alpha Vantage API key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="text-sm"
                />
                <Button
                  onClick={handleSaveApiKey}
                  size="sm"
                  disabled={!apiKey || apiKey === 'demo'}
                >
                  Save
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};