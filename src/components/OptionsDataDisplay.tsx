import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { alphaVantageService, OptionChain, OptionContract } from '@/lib/alphaVantageApi';
import { useToast } from '@/hooks/use-toast';
import { TrendingUp, TrendingDown, DollarSign, Activity, Target } from 'lucide-react';

interface OptionsDataDisplayProps {
  symbol: string;
  currentPrice?: number;
}

export const OptionsDataDisplay: React.FC<OptionsDataDisplayProps> = ({
  symbol,
  currentPrice = 0
}) => {
  const [optionChains, setOptionChains] = useState<OptionChain[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedExpiry, setSelectedExpiry] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    if (symbol) {
      fetchOptionsData();
    }
  }, [symbol]);

  const fetchOptionsData = async () => {
    setLoading(true);
    try {
      const chains = await alphaVantageService.getOptionChain(symbol);
      
      if (chains && chains.length > 0) {
        setOptionChains(chains);
        setSelectedExpiry(chains[0].expiration);
        
        toast({
          title: "Options Data Loaded",
          description: `Found ${chains.length} expiration dates for ${symbol}`,
        });
      } else {
        toast({
          title: "No Options Data",
          description: `No options data available for ${symbol}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Failed to fetch options data",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedChain = optionChains.find(chain => chain.expiration === selectedExpiry);

  const getMoneyness = (strike: number) => {
    if (!currentPrice) return 'ATM';
    const ratio = currentPrice / strike;
    if (ratio > 1.05) return 'ITM';
    if (ratio < 0.95) return 'OTM';
    return 'ATM';
  };

  const getMoneynessColor = (moneyness: string) => {
    switch (moneyness) {
      case 'ITM': return 'text-green-600';
      case 'OTM': return 'text-red-600';
      default: return 'text-yellow-600';
    }
  };

  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;
  const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;

  const OptionTable: React.FC<{ contracts: OptionContract[], type: 'call' | 'put' }> = ({ contracts, type }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Strike</TableHead>
          <TableHead>Bid/Ask</TableHead>
          <TableHead>IV</TableHead>
          <TableHead>Volume</TableHead>
          <TableHead>OI</TableHead>
          <TableHead>Greeks</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {contracts.map((contract, index) => {
          const moneyness = getMoneyness(contract.strike);
          return (
            <TableRow key={index} className={moneyness === 'ATM' ? 'bg-muted/50' : ''}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <span>{formatCurrency(contract.strike)}</span>
                  <Badge variant="outline" className={getMoneynessColor(moneyness)}>
                    {moneyness}
                  </Badge>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  <div>{formatCurrency(contract.bid)} / {formatCurrency(contract.ask)}</div>
                  <div className="text-muted-foreground text-xs">
                    Spread: {formatCurrency(contract.ask - contract.bid)}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={contract.impliedVolatility > 0.3 ? 'destructive' : 'secondary'}>
                  {formatPercent(contract.impliedVolatility)}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Activity className="h-3 w-3 text-muted-foreground" />
                  {contract.volume.toLocaleString()}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Target className="h-3 w-3 text-muted-foreground" />
                  {contract.openInterest.toLocaleString()}
                </div>
              </TableCell>
              <TableCell>
                <div className="text-xs space-y-1">
                  <div>Δ: {contract.delta.toFixed(3)}</div>
                  <div>Γ: {contract.gamma.toFixed(3)}</div>
                  <div>Θ: {contract.theta.toFixed(3)}</div>
                  <div>ν: {contract.vega.toFixed(3)}</div>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Loading options data for {symbol}...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!optionChains.length) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-3">
            <div className="text-muted-foreground">No options data available</div>
            <Button onClick={fetchOptionsData} variant="outline">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Options Chain: {symbol}
          {currentPrice > 0 && (
            <Badge variant="outline">Spot: {formatCurrency(currentPrice)}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Expiry Selection */}
        <div className="flex gap-2 flex-wrap">
          {optionChains.map((chain) => (
            <Button
              key={chain.expiration}
              variant={selectedExpiry === chain.expiration ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedExpiry(chain.expiration)}
            >
              {new Date(chain.expiration).toLocaleDateString()}
            </Button>
          ))}
        </div>

        <Separator />

        {/* Options Tables */}
        {selectedChain && (
          <Tabs defaultValue="calls" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="calls" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Calls ({selectedChain.calls.length})
              </TabsTrigger>
              <TabsTrigger value="puts" className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                Puts ({selectedChain.puts.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="calls" className="mt-4">
              <div className="rounded-md border max-h-96 overflow-y-auto">
                <OptionTable contracts={selectedChain.calls} type="call" />
              </div>
            </TabsContent>
            
            <TabsContent value="puts" className="mt-4">
              <div className="rounded-md border max-h-96 overflow-y-auto">
                <OptionTable contracts={selectedChain.puts} type="put" />
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* Summary Stats */}
        {selectedChain && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <div className="text-sm text-muted-foreground">Total Volume</div>
              <div className="font-semibold">
                {(selectedChain.calls.reduce((sum, c) => sum + c.volume, 0) +
                  selectedChain.puts.reduce((sum, p) => sum + p.volume, 0)).toLocaleString()}
              </div>
            </div>
            
            <div>
              <div className="text-sm text-muted-foreground">Call/Put Ratio</div>
              <div className="font-semibold">
                {(selectedChain.calls.reduce((sum, c) => sum + c.volume, 0) /
                  selectedChain.puts.reduce((sum, p) => sum + p.volume, 1)).toFixed(2)}
              </div>
            </div>
            
            <div>
              <div className="text-sm text-muted-foreground">Avg IV (Calls)</div>
              <div className="font-semibold">
                {formatPercent(selectedChain.calls.reduce((sum, c) => sum + c.impliedVolatility, 0) / selectedChain.calls.length)}
              </div>
            </div>
            
            <div>
              <div className="text-sm text-muted-foreground">Avg IV (Puts)</div>
              <div className="font-semibold">
                {formatPercent(selectedChain.puts.reduce((sum, p) => sum + p.impliedVolatility, 0) / selectedChain.puts.length)}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};