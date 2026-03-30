import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Search, TrendingUp, DollarSign, Activity, Zap, Download, Sparkles } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

interface ScreenerResult {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  rsi?: number;
  macd?: number;
  sector?: string;
}

interface ScreenerFilters {
  priceMin?: number;
  priceMax?: number;
  volumeMin?: number;
  changePercentMin?: number;
  changePercentMax?: number;
  rsiMin?: number;
  rsiMax?: number;
  macdSignal?: 'bullish' | 'bearish' | 'any';
  sector?: string;
}

const Screener = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ScreenerResult[]>([]);
  const [aiQuery, setAiQuery] = useState('');
  const [filters, setFilters] = useState<ScreenerFilters>({});
  const [sortBy, setSortBy] = useState<keyof ScreenerResult>('changePercent');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const presetScreens = [
    {
      name: 'Momentum Breakouts',
      description: 'RSI > 60, Volume surge',
      icon: <TrendingUp className="h-4 w-4" />,
      filters: { rsiMin: 60, volumeMin: 1000000, changePercentMin: 2 }
    },
    {
      name: 'Oversold Value',
      description: 'RSI < 30, Undervalued',
      icon: <DollarSign className="h-4 w-4" />,
      filters: { rsiMax: 30, changePercentMax: -2 }
    },
    {
      name: 'High Volume',
      description: 'Volume > 2M',
      icon: <Activity className="h-4 w-4" />,
      filters: { volumeMin: 2000000 }
    },
    {
      name: 'Strong Gainers',
      description: 'Change > 5%',
      icon: <Zap className="h-4 w-4" />,
      filters: { changePercentMin: 5 }
    }
  ];

  const runScreen = async (customFilters?: ScreenerFilters) => {
    setLoading(true);
    const screenFilters = customFilters || filters;
    
    try {
      const { data, error } = await supabase.functions.invoke('run-screener', {
        body: { filters: screenFilters }
      });

      if (error) throw error;

      setResults(data.results || []);
      toast({
        title: 'Screen Complete',
        description: `Found ${data.results?.length || 0} matching stocks`,
      });
    } catch (error) {
      console.error('Screener error:', error);
      toast({
        title: 'Screener Error',
        description: 'Failed to run screen. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const runAIScreen = async () => {
    if (!aiQuery.trim()) {
      toast({
        title: 'Empty Query',
        description: 'Please enter a screening request',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-screener', {
        body: { query: aiQuery }
      });

      if (error) throw error;

      if (data.filters) {
        setFilters(data.filters);
        await runScreen(data.filters);
        
        toast({
          title: 'AI Screen Complete',
          description: data.explanation || 'Filters applied successfully',
        });
      }
    } catch (error) {
      console.error('AI screener error:', error);
      toast({
        title: 'AI Screener Error',
        description: 'Failed to parse query. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const applyPreset = (preset: typeof presetScreens[0]) => {
    setFilters(preset.filters);
    runScreen(preset.filters);
  };

  const exportResults = () => {
    const csv = [
      ['Symbol', 'Name', 'Price', 'Change %', 'Volume', 'RSI', 'Sector'].join(','),
      ...results.map(r => [
        r.symbol,
        r.name,
        r.price,
        r.changePercent.toFixed(2),
        r.volume,
        r.rsi?.toFixed(2) || 'N/A',
        r.sector || 'N/A'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `screener-results-${Date.now()}.csv`;
    a.click();
  };

  const sortedResults = [...results].sort((a, b) => {
    const aVal = a[sortBy] || 0;
    const bVal = b[sortBy] || 0;
    return sortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
  });

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Stock Screener
            </h1>
            <p className="text-muted-foreground mt-2">
              AI-powered stock screening with 20+ technical indicators
            </p>
          </div>
          {results.length > 0 && (
            <Button onClick={exportResults} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          )}
        </motion.div>

        {/* AI Natural Language Screener */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <Card className="bg-card/40 backdrop-blur-xl border-border/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Sparkles className="h-5 w-5 text-primary" />
                AI-Powered Screening
              </CardTitle>
              <CardDescription>
                Describe what you're looking for in natural language
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., 'Find tech stocks with RSI below 30 and above their 200-day MA'"
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && runAIScreen()}
                  className="flex-1"
                />
                <Button onClick={runAIScreen} disabled={loading}>
                  {loading ? 'Analyzing...' : 'Screen'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Try: "momentum stocks", "oversold value stocks", "high volume gainers"
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <Tabs defaultValue="filters" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="filters">Custom Filters</TabsTrigger>
            <TabsTrigger value="presets">Preset Screens</TabsTrigger>
          </TabsList>

          {/* Custom Filters Tab */}
          <TabsContent value="filters">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="bg-card/40 backdrop-blur-xl border-border/30">
                <CardHeader>
                  <CardTitle className="text-foreground">Filter Builder</CardTitle>
                  <CardDescription>Customize your screening criteria</CardDescription>
                </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Price Range */}
                  <div className="space-y-2">
                    <Label>Price Range</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={filters.priceMin || ''}
                        onChange={(e) => setFilters({ ...filters, priceMin: parseFloat(e.target.value) })}
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={filters.priceMax || ''}
                        onChange={(e) => setFilters({ ...filters, priceMax: parseFloat(e.target.value) })}
                      />
                    </div>
                  </div>

                  {/* Volume */}
                  <div className="space-y-2">
                    <Label>Minimum Volume</Label>
                    <Input
                      type="number"
                      placeholder="e.g., 1000000"
                      value={filters.volumeMin || ''}
                      onChange={(e) => setFilters({ ...filters, volumeMin: parseFloat(e.target.value) })}
                    />
                  </div>

                  {/* Change Percent */}
                  <div className="space-y-2">
                    <Label>Change % Range</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={filters.changePercentMin || ''}
                        onChange={(e) => setFilters({ ...filters, changePercentMin: parseFloat(e.target.value) })}
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={filters.changePercentMax || ''}
                        onChange={(e) => setFilters({ ...filters, changePercentMax: parseFloat(e.target.value) })}
                      />
                    </div>
                  </div>

                  {/* RSI Range */}
                  <div className="space-y-2">
                    <Label>RSI Range (0-100)</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        min={0}
                        max={100}
                        value={filters.rsiMin || ''}
                        onChange={(e) => setFilters({ ...filters, rsiMin: parseFloat(e.target.value) })}
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        min={0}
                        max={100}
                        value={filters.rsiMax || ''}
                        onChange={(e) => setFilters({ ...filters, rsiMax: parseFloat(e.target.value) })}
                      />
                    </div>
                  </div>

                  {/* MACD Signal */}
                  <div className="space-y-2">
                    <Label>MACD Signal</Label>
                    <Select
                      value={filters.macdSignal || 'any'}
                      onValueChange={(value: 'bullish' | 'bearish' | 'any') =>
                        setFilters({ ...filters, macdSignal: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any</SelectItem>
                        <SelectItem value="bullish">Bullish</SelectItem>
                        <SelectItem value="bearish">Bearish</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sector */}
                  <div className="space-y-2">
                    <Label>Sector</Label>
                    <Select
                      value={filters.sector || 'any'}
                      onValueChange={(value) => setFilters({ ...filters, sector: value === 'any' ? undefined : value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any Sector</SelectItem>
                        <SelectItem value="Technology">Technology</SelectItem>
                        <SelectItem value="Finance">Finance</SelectItem>
                        <SelectItem value="Healthcare">Healthcare</SelectItem>
                        <SelectItem value="Energy">Energy</SelectItem>
                        <SelectItem value="Consumer">Consumer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button onClick={() => runScreen()} disabled={loading} className="w-full">
                  <Search className="h-4 w-4 mr-2" />
                  {loading ? 'Running Screen...' : 'Run Custom Screen'}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
          </TabsContent>

          {/* Preset Screens Tab */}
          <TabsContent value="presets">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {presetScreens.map((preset, index) => (
                <motion.div
                  key={preset.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                >
                <Card
                  className="cursor-pointer bg-card/40 backdrop-blur-xl border-border/30 hover:border-border/60 transition-all"
                  onClick={() => applyPreset(preset)}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-foreground">
                      {preset.icon}
                      {preset.name}
                    </CardTitle>
                    <CardDescription>{preset.description}</CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Results Table */}
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <Card className="bg-card/40 backdrop-blur-xl border-border/30">
              <CardHeader>
                <CardTitle className="text-foreground">Results ({results.length} stocks)</CardTitle>
                <CardDescription>
                  <div className="flex items-center gap-4 mt-2">
                    <Label>Sort by:</Label>
                    <Select value={sortBy} onValueChange={(val) => setSortBy(val as keyof ScreenerResult)}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="changePercent">Change %</SelectItem>
                        <SelectItem value="volume">Volume</SelectItem>
                        <SelectItem value="price">Price</SelectItem>
                        <SelectItem value="rsi">RSI</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    >
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </Button>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/30">
                        <th className="text-left p-2 text-foreground">Symbol</th>
                        <th className="text-left p-2 text-foreground">Name</th>
                        <th className="text-right p-2 text-foreground">Price</th>
                        <th className="text-right p-2 text-foreground">Change %</th>
                        <th className="text-right p-2 text-foreground">Volume</th>
                        <th className="text-right p-2 text-foreground">RSI</th>
                        <th className="text-left p-2 text-foreground">Sector</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedResults.map((result) => (
                        <tr key={result.symbol} className="border-b border-border/20 hover:bg-card/60 transition-colors">
                          <td className="p-2 font-semibold text-foreground">{result.symbol}</td>
                          <td className="p-2 text-sm text-muted-foreground">{result.name}</td>
                          <td className="p-2 text-right text-foreground">${result.price.toFixed(2)}</td>
                          <td className="p-2 text-right">
                            <Badge variant={result.changePercent >= 0 ? 'default' : 'destructive'}>
                              {result.changePercent >= 0 ? '+' : ''}
                              {result.changePercent.toFixed(2)}%
                            </Badge>
                          </td>
                          <td className="p-2 text-right text-sm text-foreground">
                            {(result.volume / 1000000).toFixed(2)}M
                          </td>
                          <td className="p-2 text-right">
                            {result.rsi ? (
                              <Badge
                                variant={result.rsi < 30 ? 'destructive' : result.rsi > 70 ? 'default' : 'outline'}
                              >
                                {result.rsi.toFixed(1)}
                              </Badge>
                            ) : (
                              'N/A'
                            )}
                          </td>
                          <td className="p-2 text-sm text-foreground">{result.sector || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {results.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <Card className="bg-card/40 backdrop-blur-xl border-border/30 text-center py-12">
              <CardContent>
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                </motion.div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No Results Yet</h3>
                <p className="text-muted-foreground">
                  Run a screen or use AI to find stocks matching your criteria
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Screener;
