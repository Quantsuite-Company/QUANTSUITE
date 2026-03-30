import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ParameterInput } from './ParameterInput';
import { ResultsPanel } from './ResultsPanel';
import { UniversalExplanationPanel } from './UniversalExplanationPanel';
import { StockAutocomplete } from '@/components/StockAutocomplete';
import { BlackScholesParams, calculateBlackScholes, BlackScholesResult } from '@/lib/blackScholes';
import { alphaVantageService } from '@/lib/alphaVantageApi';
import { Calculator, RefreshCircle, TrendUp } from 'iconsax-react';
import { useToast } from '@/hooks/use-toast';

const defaultParams: BlackScholesParams = {
  S: 100,    // Stock price
  K: 100,    // Strike price
  T: 1,      // Time to expiration (years)
  r: 0.05,   // Risk-free rate (5%)
  sigma: 0.2, // Volatility (20%)
  q: 0,      // Dividend yield (0%)
};

export const BlackScholesCalculator: React.FC = () => {
  const [ticker, setTicker] = useState('AAPL');
  const [params, setParams] = useState<BlackScholesParams>(defaultParams);
  const [isLoaded, setIsLoaded] = useState(false);
  const { toast } = useToast();

  // Enhanced fetch using centralized API service
  const fetchStockPrice = async (symbol: string) => {
    try {
      const quote = await alphaVantageService.getQuote(symbol);
      
      if (quote) {
        setParams(prev => ({ ...prev, S: quote.price }));
        
        toast({
          title: "Stock Price Updated",
          description: `${symbol}: $${quote.price.toFixed(2)} (${quote.changePercent})`,
        });
      } else {
        throw new Error('Failed to fetch quote');
      }
    } catch (error) {
      toast({
        title: "Failed to fetch stock price",
        description: "Using current value or cached data",
        variant: "destructive",
      });
    }
  };

  // Memoize the calculation to avoid unnecessary recalculations
  const result = useMemo(() => {
    try {
      return calculateBlackScholes(params);
    } catch (error) {
      console.error('Calculation error:', error);
      return null;
    }
  }, [params]);

  // Show error toast when calculation fails
  useEffect(() => {
    if (result === null && isLoaded) {
      toast({
        title: "Calculation Error",
        description: "There was an error calculating the option prices. Please check your inputs.",
        variant: "destructive",
      });
    }
  }, [result, toast, isLoaded]);

  // Load saved parameters from localStorage (only once on mount)
  useEffect(() => {
    const saved = localStorage.getItem('blackScholesParams');
    if (saved) {
      try {
        const parsedParams = JSON.parse(saved);
        setParams({ ...defaultParams, ...parsedParams });
      } catch (error) {
        console.error('Error loading saved parameters:', error);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save parameters to localStorage (debounced)
  useEffect(() => {
    if (!isLoaded) return; // Don't save during initial load
    
    const timeoutId = setTimeout(() => {
      localStorage.setItem('blackScholesParams', JSON.stringify(params));
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [params, isLoaded]);

  const updateParam = useCallback(<K extends keyof BlackScholesParams>(
    key: K,
    value: BlackScholesParams[K]
  ) => {
    setParams(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetToDefaults = useCallback(() => {
    setParams(defaultParams);
    toast({
      title: "Parameters Reset",
      description: "All parameters have been reset to default values.",
    });
  }, [toast]);

  const parameterConfigs = [
    {
      key: 'S' as const,
      label: 'Stock Price',
      min: 0.01,
      max: 10000,
      step: 0.01,
      suffix: '$',
      tooltip: 'Current market price of the underlying stock',
      color: 'param-stock' as const
    },
    {
      key: 'K' as const,
      label: 'Strike Price',
      min: 0.01,
      max: 10000,
      step: 0.01,
      suffix: '$',
      tooltip: 'The price at which the option can be exercised',
      color: 'param-strike' as const
    },
    {
      key: 'T' as const,
      label: 'Time to Expiration',
      min: 0.01,
      max: 5,
      step: 0.01,
      suffix: ' years',
      tooltip: 'Time remaining until option expiration in years',
      color: 'param-time' as const
    },
    {
      key: 'r' as const,
      label: 'Risk-Free Rate',
      min: 0,
      max: 0.5,
      step: 0.001,
      suffix: '%',
      tooltip: 'Current risk-free interest rate (e.g., Treasury bill rate)',
      color: 'param-rate' as const
    },
    {
      key: 'sigma' as const,
      label: 'Volatility',
      min: 0.001,
      max: 2,
      step: 0.001,
      suffix: '%',
      tooltip: 'Expected price volatility of the underlying stock',
      color: 'param-volatility' as const
    },
    {
      key: 'q' as const,
      label: 'Dividend Yield',
      min: 0,
      max: 0.2,
      step: 0.001,
      suffix: '%',
      tooltip: 'Annual dividend yield of the stock',
      color: 'param-dividend' as const
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto space-y-6 p-4 md:p-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Black-Scholes Calculator
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Professional option pricing with real-time calculations and plain-language explanations
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Input Parameters */}
          <Card className="terminal-panel terminal-glow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold text-primary flex items-center gap-2">
                  <Calculator className="w-6 h-6" />
                  Input Parameters
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetToDefaults}
                  className="text-xs"
                >
                  <RefreshCircle size={12} className="mr-1" />
                  Reset
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Stock Symbol Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Stock Symbol
                </label>
                <div className="flex gap-2">
                  <StockAutocomplete
                    value={ticker}
                    onChange={(newTicker) => {
                      setTicker(newTicker);
                      fetchStockPrice(newTicker);
                    }}
                    placeholder="Search stocks..."
                    className="flex-1"
                  />
                  <Button 
                    onClick={() => fetchStockPrice(ticker)}
                    variant="outline"
                    size="sm"
                  >
                    <TrendUp size={16} className="mr-1" />
                    Get Price
                  </Button>
                </div>
              </div>
              
              {parameterConfigs.map((config) => (
                <ParameterInput
                  key={config.key}
                  id={config.key}
                  label={config.label}
                  value={config.key === 'r' || config.key === 'sigma' || config.key === 'q' 
                    ? params[config.key] * 100 // Convert to percentage for display
                    : params[config.key]
                  }
                  onChange={(value) => {
                    const actualValue = config.key === 'r' || config.key === 'sigma' || config.key === 'q'
                      ? value / 100 // Convert back to decimal
                      : value;
                    updateParam(config.key, actualValue);
                  }}
                  min={config.key === 'r' || config.key === 'sigma' || config.key === 'q'
                    ? config.min * 100 // Convert min to percentage
                    : config.min
                  }
                  max={config.key === 'r' || config.key === 'sigma' || config.key === 'q'
                    ? config.max * 100 // Convert max to percentage
                    : config.max
                  }
                  step={config.key === 'r' || config.key === 'sigma' || config.key === 'q'
                    ? config.step * 100 // Convert step to percentage
                    : config.step
                  }
                  suffix={config.suffix}
                  tooltip={config.tooltip}
                  color={config.color}
                />
              ))}
            </CardContent>
          </Card>

          {/* Results */}
          <div className="space-y-6">
            {result && <ResultsPanel result={result} params={params} />}
          </div>
        </div>

        {/* Universal Explanation Panel */}
        {result && (
          <UniversalExplanationPanel
            modelName="BlackScholes"
            inputs={params}
            outputs={{
              delta: result.greeks.delta.call,
              gamma: result.greeks.gamma,
              theta: result.greeks.theta.call,
              vega: result.greeks.vega,
              rho: result.greeks.rho.call,
              optionPrice: result.prices.call
            }}
          />
        )}
      </div>
    </div>
  );
};