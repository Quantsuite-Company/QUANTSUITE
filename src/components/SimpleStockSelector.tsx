import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Popular stocks for easy selection
const POPULAR_STOCKS = [
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.' },
  { symbol: 'MSFT', name: 'Microsoft Corporation' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.' },
  { symbol: 'TSLA', name: 'Tesla Inc.' },
  { symbol: 'META', name: 'Meta Platforms Inc.' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation' },
  { symbol: 'NFLX', name: 'Netflix Inc.' },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.' },
  { symbol: 'JNJ', name: 'Johnson & Johnson' },
  { symbol: 'V', name: 'Visa Inc.' },
  { symbol: 'WMT', name: 'Walmart Inc.' },
  { symbol: 'PG', name: 'Procter & Gamble Co.' },
  { symbol: 'MA', name: 'Mastercard Inc.' },
  { symbol: 'HD', name: 'Home Depot Inc.' },
  { symbol: 'BAC', name: 'Bank of America Corp.' },
  { symbol: 'XOM', name: 'Exxon Mobil Corporation' },
  { symbol: 'KO', name: 'Coca-Cola Company' },
  { symbol: 'PFE', name: 'Pfizer Inc.' },
  { symbol: 'INTC', name: 'Intel Corporation' },
  { symbol: 'DIS', name: 'Walt Disney Company' },
  { symbol: 'ADBE', name: 'Adobe Inc.' },
  { symbol: 'CRM', name: 'Salesforce Inc.' },
  { symbol: 'PYPL', name: 'PayPal Holdings Inc.' },
  { symbol: 'NKE', name: 'Nike Inc.' }
];

interface SimpleStockSelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const SimpleStockSelector: React.FC<SimpleStockSelectorProps> = ({ 
  value, 
  onChange, 
  className = ""
}) => {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={`w-full ${className}`}>
        <SelectValue placeholder="Select a stock...">
          {value && (
            <span className="flex items-center justify-between w-full">
              <span className="font-medium">{value}</span>
              <span className="text-sm text-muted-foreground">
                {POPULAR_STOCKS.find(stock => stock.symbol === value)?.name}
              </span>
            </span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-60">
        {POPULAR_STOCKS.map(stock => (
          <SelectItem key={stock.symbol} value={stock.symbol}>
            <div className="flex items-center justify-between w-full">
              <span className="font-medium">{stock.symbol}</span>
              <span className="text-sm text-muted-foreground ml-2">
                {stock.name}
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};