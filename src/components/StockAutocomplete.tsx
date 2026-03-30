import React, { useState, useEffect, useMemo } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Search, TrendingUp, Building } from "lucide-react";

// Popular stocks database - expandable
const POPULAR_STOCKS = [
  { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'Consumer Discretionary' },
  { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Consumer Discretionary' },
  { symbol: 'META', name: 'Meta Platforms Inc.', sector: 'Technology' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', sector: 'Technology' },
  { symbol: 'NFLX', name: 'Netflix Inc.', sector: 'Communication Services' },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', sector: 'Financials' },
  { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare' },
  { symbol: 'V', name: 'Visa Inc.', sector: 'Financials' },
  { symbol: 'WMT', name: 'Walmart Inc.', sector: 'Consumer Staples' },
  { symbol: 'PG', name: 'Procter & Gamble Co.', sector: 'Consumer Staples' },
  { symbol: 'MA', name: 'Mastercard Inc.', sector: 'Financials' },
  { symbol: 'HD', name: 'Home Depot Inc.', sector: 'Consumer Discretionary' },
  { symbol: 'BAC', name: 'Bank of America Corp.', sector: 'Financials' },
  { symbol: 'XOM', name: 'Exxon Mobil Corporation', sector: 'Energy' },
  { symbol: 'KO', name: 'Coca-Cola Company', sector: 'Consumer Staples' },
  { symbol: 'PFE', name: 'Pfizer Inc.', sector: 'Healthcare' },
  { symbol: 'INTC', name: 'Intel Corporation', sector: 'Technology' },
  { symbol: 'DIS', name: 'Walt Disney Company', sector: 'Communication Services' },
  { symbol: 'ADBE', name: 'Adobe Inc.', sector: 'Technology' },
  { symbol: 'CRM', name: 'Salesforce Inc.', sector: 'Technology' },
  { symbol: 'PYPL', name: 'PayPal Holdings Inc.', sector: 'Financials' },
  { symbol: 'NKE', name: 'Nike Inc.', sector: 'Consumer Discretionary' },
  { symbol: 'CMCSA', name: 'Comcast Corporation', sector: 'Communication Services' },
  { symbol: 'ABT', name: 'Abbott Laboratories', sector: 'Healthcare' },
  { symbol: 'TMO', name: 'Thermo Fisher Scientific', sector: 'Healthcare' },
  { symbol: 'CVX', name: 'Chevron Corporation', sector: 'Energy' },
  { symbol: 'COST', name: 'Costco Wholesale Corp.', sector: 'Consumer Staples' }
];

interface StockAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const StockAutocomplete: React.FC<StockAutocompleteProps> = ({ 
  value, 
  onChange, 
  placeholder = "Search stocks...",
  className = ""
}) => {
  const [searchTerm, setSearchTerm] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [recentStocks, setRecentStocks] = useState<string[]>([]);

  // Load recent stocks from localStorage
  useEffect(() => {
    const recent = localStorage.getItem('recentStocks');
    if (recent) {
      setRecentStocks(JSON.parse(recent));
    }
  }, []);

  // Update search term when value changes
  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  // Filter stocks based on search term
  const filteredStocks = useMemo(() => {
    if (!searchTerm) return POPULAR_STOCKS.slice(0, 10);
    
    const term = searchTerm.toLowerCase();
    return POPULAR_STOCKS.filter(stock => 
      stock.symbol.toLowerCase().includes(term) ||
      stock.name.toLowerCase().includes(term) ||
      stock.sector.toLowerCase().includes(term)
    ).slice(0, 8);
  }, [searchTerm]);

  // Get recent stocks data
  const recentStocksData = useMemo(() => {
    return recentStocks.map(symbol => 
      POPULAR_STOCKS.find(stock => stock.symbol === symbol)
    ).filter(Boolean) as typeof POPULAR_STOCKS;
  }, [recentStocks]);

  const handleStockSelect = (symbol: string) => {
    onChange(symbol);
    setSearchTerm(symbol);
    setIsOpen(false);
    
    // Add to recent stocks
    const newRecent = [symbol, ...recentStocks.filter(s => s !== symbol)].slice(0, 5);
    setRecentStocks(newRecent);
    localStorage.setItem('recentStocks', JSON.stringify(newRecent));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.toUpperCase();
    setSearchTerm(newValue);
    onChange(newValue);
    setIsOpen(true);
  };

  const getSectorColor = (sector: string) => {
    const colors: Record<string, string> = {
      'Technology': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      'Healthcare': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      'Financials': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      'Consumer Discretionary': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      'Consumer Staples': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      'Energy': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      'Communication Services': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300'
    };
    return colors[sector] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            className={`pl-10 ${className}`}
          />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="start">
        <div className="max-h-96 overflow-y-auto">
          {/* Recent Stocks */}
          {recentStocksData.length > 0 && (
            <div className="p-3 border-b">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Recent</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {recentStocksData.map(stock => (
                  <Button
                    key={stock.symbol}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleStockSelect(stock.symbol)}
                    className="h-6 px-2 text-xs"
                  >
                    {stock.symbol}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Filtered Results */}
          <div className="p-3">
            <div className="flex items-center gap-2 mb-3">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">
                {searchTerm ? `Results for "${searchTerm}"` : 'Popular Stocks'}
              </span>
            </div>
            
            {filteredStocks.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <p>No stocks found matching "{searchTerm}"</p>
                <p className="text-xs mt-1">Try searching by symbol, company name, or sector</p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredStocks.map(stock => (
                  <Button
                    key={stock.symbol}
                    variant="ghost"
                    onClick={() => handleStockSelect(stock.symbol)}
                    className="w-full justify-start h-auto p-3 hover:bg-accent"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="text-left">
                        <div className="font-medium">{stock.symbol}</div>
                        <div className="text-sm text-muted-foreground truncate max-w-48">
                          {stock.name}
                        </div>
                      </div>
                      <Badge variant="secondary" className={`text-xs ${getSectorColor(stock.sector)}`}>
                        {stock.sector}
                      </Badge>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};