import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StockAutocomplete } from '@/components/StockAutocomplete';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Area, ComposedChart, Bar } from 'recharts';
import { TrendingUp, TrendingDown, Activity, BarChart3, Minus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import {
  calculateSMA,
  calculateEMA,
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
  calculateStochastic,
  calculateATR,
  calculateADX,
  calculateOBV,
  calculateWilliamsR,
  calculateCCI,
  calculateMomentum,
  calculateROC,
} from '@/lib/technicalIndicators';

const TechnicalIndicators = () => {
  const [ticker, setTicker] = useState('AAPL');
  const [currentPrice, setCurrentPrice] = useState(150);
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [timeframe, setTimeframe] = useState('60');
  const { toast } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      // Map timeframe to period for Yahoo Finance
      const days = parseInt(timeframe);
      const period = days <= 30 ? '1mo' : days <= 90 ? '3mo' : days <= 180 ? '6mo' : '1y';
      
      const { data, error } = await supabase.functions.invoke('fetch-stock-data', {
        body: { 
          symbol: ticker,
          period
        }
      });
      
      if (error) throw error;
      
      if (data && data.chartData && data.chartData.length > 0) {
        // Take last N days from chartData
        const chartData = data.chartData.slice(-days);
        
        // Extract OHLCV data from Yahoo Finance
        const prices = chartData.map((d: any) => d.close);
        const highs = chartData.map((d: any) => d.high);
        const lows = chartData.map((d: any) => d.low);
        const volumes = chartData.map((d: any) => d.volume);
        const dates = chartData.map((d: any) => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        
        // Calculate all 13 indicators
        
        // Momentum Indicators
        const rsiValues = calculateRSI(prices, 14);
        const { macdLine, signalLine, histogram } = calculateMACD(prices, 12, 26, 9);
        const { k: stochK, d: stochD } = calculateStochastic(highs, lows, prices, 14, 3);
        const williamsR = calculateWilliamsR(highs, lows, prices, 14);
        const momentum = calculateMomentum(prices, 10);
        const roc = calculateROC(prices, 12);

        // Volatility Indicators
        const { upper: bbUpper, middle: bbMiddle, lower: bbLower } = calculateBollingerBands(prices, 20, 2);
        const atr = calculateATR(highs, lows, prices, 14);

        // Trend Indicators
        const sma50 = calculateSMA(prices, 50);
        const sma200 = calculateSMA(prices, 200);
        const adx = calculateADX(highs, lows, prices, 14);
        const cci = calculateCCI(highs, lows, prices, 20);

        // Volume Indicators
        const obv = calculateOBV(prices, volumes);

        // Combine all data
        const processedData = dates.map((date: string, i: number) => ({
          date,
          price: prices[i],
          volume: volumes[i],
          
          // Momentum
          rsi: rsiValues[i],
          macd: macdLine[i],
          macdSignal: signalLine[i],
          macdHistogram: histogram[i],
          stochK: stochK[i],
          stochD: stochD[i],
          williamsR: williamsR[i],
          momentum: momentum[i],
          roc: roc[i],
          
          // Volatility
          bbUpper: bbUpper[i],
          bbMiddle: bbMiddle[i],
          bbLower: bbLower[i],
          atr: atr[i],
          
          // Trend
          sma50: sma50[i],
          sma200: sma200[i],
          adx: adx[i],
          cci: cci[i],
          
          // Volume
          obv: obv[i],
        }));
        
        setHistoricalData(processedData);
        setCurrentPrice(prices[prices.length - 1]);
        
        toast({
          title: "Indicators Calculated",
          description: `Loaded ${days} days of data for ${ticker}`,
        });
      }
    } catch (error) {
      toast({
        title: "Error Loading Data",
        description: "Failed to calculate technical indicators. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const signals = useMemo(() => {
    if (historicalData.length === 0) return null;
    
    const latest = historicalData[historicalData.length - 1];
    const prev = historicalData[historicalData.length - 2];
    
    return {
      // Momentum
      rsi: {
        value: latest.rsi?.toFixed(2) || '--',
        signal: !latest.rsi ? 'Loading' : latest.rsi > 70 ? 'Overbought' : latest.rsi < 30 ? 'Oversold' : 'Neutral'
      },
      macd: {
        value: latest.macd?.toFixed(2) || '--',
        signal: !latest.macd || !latest.macdSignal ? 'Loading' : latest.macd > latest.macdSignal ? 'Bullish' : latest.macd < latest.macdSignal ? 'Bearish' : 'Neutral'
      },
      stochastic: {
        kValue: latest.stochK?.toFixed(2) || '--',
        signal: !latest.stochK ? 'Loading' : latest.stochK > 80 ? 'Overbought' : latest.stochK < 20 ? 'Oversold' : 'Neutral'
      },
      williamsR: {
        value: latest.williamsR?.toFixed(2) || '--',
        signal: !latest.williamsR ? 'Loading' : latest.williamsR > -20 ? 'Overbought' : latest.williamsR < -80 ? 'Oversold' : 'Neutral'
      },
      momentum: {
        value: latest.momentum?.toFixed(2) || '--',
        signal: !latest.momentum ? 'Loading' : latest.momentum > 0 ? 'Positive' : latest.momentum < 0 ? 'Negative' : 'Neutral'
      },
      roc: {
        value: latest.roc?.toFixed(2) || '--',
        signal: !latest.roc ? 'Loading' : latest.roc > 5 ? 'Strong Up' : latest.roc < -5 ? 'Strong Down' : 'Neutral'
      },
      
      // Volatility
      bb: {
        signal: !latest.price || !latest.bbUpper || !latest.bbLower ? 'Loading' : latest.price > latest.bbUpper ? 'Overbought' : latest.price < latest.bbLower ? 'Oversold' : 'Normal'
      },
      atr: {
        value: latest.atr?.toFixed(2) || '--',
        signal: !latest.atr || !prev?.atr ? 'Loading' : latest.atr > prev.atr ? 'High Volatility' : 'Low Volatility'
      },
      
      // Trend
      trend: {
        signal: !latest.sma50 || !latest.sma200 ? 'Insufficient Data' : latest.sma50 > latest.sma200 ? 'Uptrend' : 'Downtrend'
      },
      adx: {
        value: latest.adx?.toFixed(2) || '--',
        signal: !latest.adx ? 'Loading' : latest.adx > 25 ? 'Strong Trend' : latest.adx < 20 ? 'Weak Trend' : 'Moderate'
      },
      cci: {
        value: latest.cci?.toFixed(2) || '--',
        signal: !latest.cci ? 'Loading' : latest.cci > 100 ? 'Overbought' : latest.cci < -100 ? 'Oversold' : 'Neutral'
      },
      
      // Volume
      obv: {
        value: latest.obv ? ((latest.obv / 1000000).toFixed(2) + 'M') : '--',
        signal: !latest.obv || !prev?.obv ? 'Loading' : latest.obv > prev.obv ? 'Bullish' : 'Bearish'
      }
    };
  }, [historicalData]);

  const exportToCSV = () => {
    if (historicalData.length === 0) {
      toast({
        title: "No Data",
        description: "Please load indicator data first",
        variant: "destructive",
      });
      return;
    }
    
    const headers = [
      'Date', 'Price', 'Volume',
      'RSI', 'MACD', 'MACD Signal', 'MACD Histogram',
      'Stoch %K', 'Stoch %D', 'Williams %R',
      'BB Upper', 'BB Middle', 'BB Lower', 'ATR',
      'SMA 50', 'SMA 200', 'ADX', 'CCI',
      'OBV', 'Momentum', 'ROC'
    ].join(',');
    
    const rows = historicalData.map(d => [
      d.date, d.price, d.volume,
      d.rsi, d.macd, d.macdSignal, d.macdHistogram,
      d.stochK, d.stochD, d.williamsR,
      d.bbUpper, d.bbMiddle, d.bbLower, d.atr,
      d.sma50, d.sma200, d.adx, d.cci,
      d.obv, d.momentum, d.roc
    ].map(v => v ?? '').join(','));
    
    const csv = [headers, ...rows].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${ticker}_indicators_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Export Complete",
      description: `Downloaded ${historicalData.length} rows of indicator data`,
    });
  };

  const getSignalBadge = (signal: string) => {
    if (signal.includes('Bullish') || signal.includes('Uptrend')) {
      return <Badge className="bg-green-500/20 text-green-500"><TrendingUp className="h-3 w-3 mr-1" />{signal}</Badge>;
    } else if (signal.includes('Bearish') || signal.includes('Downtrend')) {
      return <Badge className="bg-red-500/20 text-red-500"><TrendingDown className="h-3 w-3 mr-1" />{signal}</Badge>;
    } else if (signal.includes('Overbought')) {
      return <Badge className="bg-orange-500/20 text-orange-500">{signal}</Badge>;
    } else if (signal.includes('Oversold')) {
      return <Badge className="bg-blue-500/20 text-blue-500">{signal}</Badge>;
    }
    return <Badge variant="outline"><Minus className="h-3 w-3 mr-1" />{signal}</Badge>;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Technical Indicators Dashboard
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            Professional-grade technical analysis with RSI, MACD, Bollinger Bands, and moving averages
          </p>
        </div>

        {/* Control Panel */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>Select stock and analysis timeframe</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="stock-search">Stock Symbol</Label>
              <StockAutocomplete
                value={ticker}
                onChange={(symbol) => {
                  setTicker(symbol);
                }}
                placeholder="Search for a stock symbol..."
              />
              <div className="text-sm text-muted-foreground">
                Current Price: <strong>${currentPrice.toFixed(2)}</strong>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="timeframe">Analysis Period</Label>
                <Select value={timeframe} onValueChange={setTimeframe}>
                  <SelectTrigger id="timeframe">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 Days</SelectItem>
                    <SelectItem value="60">60 Days</SelectItem>
                    <SelectItem value="90">90 Days</SelectItem>
                    <SelectItem value="180">180 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end gap-2">
                <Button onClick={loadData} disabled={loading} className="flex-1">
                  {loading ? 'Loading...' : 'Calculate Indicators'}
                </Button>
                <Button 
                  onClick={exportToCSV} 
                  disabled={historicalData.length === 0}
                  variant="outline"
                >
                  Export CSV
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Signal Cards */}
        {signals && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
            {/* Momentum Indicators */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">RSI (14)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-2xl font-bold">{signals.rsi.value}</div>
                {getSignalBadge(signals.rsi.signal)}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">MACD</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-2xl font-bold">{signals.macd.value}</div>
                {getSignalBadge(signals.macd.signal)}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Stochastic</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-2xl font-bold">{signals.stochastic.kValue}</div>
                {getSignalBadge(signals.stochastic.signal)}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Williams %R</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-2xl font-bold">{signals.williamsR.value}</div>
                {getSignalBadge(signals.williamsR.signal)}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Momentum</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-2xl font-bold">{signals.momentum.value}</div>
                {getSignalBadge(signals.momentum.signal)}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">ROC (%)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-2xl font-bold">{signals.roc.value}</div>
                {getSignalBadge(signals.roc.signal)}
              </CardContent>
            </Card>
            
            {/* Volatility Indicators */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Bollinger Bands</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-2xl font-bold">--</div>
                {getSignalBadge(signals.bb.signal)}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">ATR (Volatility)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-2xl font-bold">{signals.atr.value}</div>
                {getSignalBadge(signals.atr.signal)}
              </CardContent>
            </Card>
            
            {/* Trend Indicators */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Trend (SMA)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-2xl font-bold">--</div>
                {getSignalBadge(signals.trend.signal)}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">ADX (Strength)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-2xl font-bold">{signals.adx.value}</div>
                {getSignalBadge(signals.adx.signal)}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">CCI</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-2xl font-bold">{signals.cci.value}</div>
                {getSignalBadge(signals.cci.signal)}
              </CardContent>
            </Card>
            
            {/* Volume Indicators */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">OBV (Volume)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-2xl font-bold">{signals.obv.value}</div>
                {getSignalBadge(signals.obv.signal)}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Charts */}
        <Tabs defaultValue="price" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            <TabsTrigger value="price">Price & MA</TabsTrigger>
            <TabsTrigger value="rsi">RSI</TabsTrigger>
            <TabsTrigger value="macd">MACD</TabsTrigger>
            <TabsTrigger value="bollinger">Bollinger</TabsTrigger>
            <TabsTrigger value="stochastic">Stochastic</TabsTrigger>
            <TabsTrigger value="atr">ATR</TabsTrigger>
            <TabsTrigger value="adx">ADX</TabsTrigger>
            <TabsTrigger value="volume">Volume</TabsTrigger>
            <TabsTrigger value="williamsR">Williams %R</TabsTrigger>
            <TabsTrigger value="cci">CCI</TabsTrigger>
            <TabsTrigger value="momentum">Momentum</TabsTrigger>
            <TabsTrigger value="roc">ROC</TabsTrigger>
          </TabsList>

          <TabsContent value="price">
            <Card>
              <CardHeader>
                <CardTitle>Price with Moving Averages</CardTitle>
                <CardDescription>Track price trends with SMA 50 and SMA 200</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="volume" fill="hsl(var(--muted))" opacity={0.3} yAxisId="volume" />
                    <Line type="monotone" dataKey="price" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="sma50" stroke="hsl(var(--accent))" strokeWidth={2} strokeDasharray="5 5" dot={false} name="SMA 50" />
                    <Line type="monotone" dataKey="sma200" stroke="hsl(var(--destructive))" strokeWidth={2} strokeDasharray="5 5" dot={false} name="SMA 200" />
                    <YAxis yAxisId="volume" orientation="right" hide />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rsi">
            <Card>
              <CardHeader>
                <CardTitle>Relative Strength Index (RSI)</CardTitle>
                <CardDescription>Momentum oscillator measuring speed and magnitude of price changes</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                    <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <ReferenceLine y={70} stroke="hsl(var(--destructive))" strokeDasharray="3 3" label="Overbought" />
                    <ReferenceLine y={30} stroke="hsl(var(--chart-2))" strokeDasharray="3 3" label="Oversold" />
                    <ReferenceLine y={50} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                    <Line type="monotone" dataKey="rsi" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="RSI (14)" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="macd">
            <Card>
              <CardHeader>
                <CardTitle>MACD (Moving Average Convergence Divergence)</CardTitle>
                <CardDescription>Trend-following momentum indicator</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" />
                    <Bar dataKey="macdHistogram" fill="hsl(var(--accent))" opacity={0.6} name="Histogram" />
                    <Line type="monotone" dataKey="macd" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="MACD" />
                    <Line type="monotone" dataKey="macdSignal" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} name="Signal" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bollinger">
            <Card>
              <CardHeader>
                <CardTitle>Bollinger Bands</CardTitle>
                <CardDescription>Volatility bands placed above and below a moving average</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="bbUpper" stroke="hsl(var(--destructive))" strokeWidth={1} strokeDasharray="5 5" dot={false} name="Upper Band" />
                    <Line type="monotone" dataKey="bbMiddle" stroke="hsl(var(--muted-foreground))" strokeWidth={1} dot={false} name="Middle (SMA 20)" />
                    <Line type="monotone" dataKey="bbLower" stroke="hsl(var(--chart-2))" strokeWidth={1} strokeDasharray="5 5" dot={false} name="Lower Band" />
                    <Line type="monotone" dataKey="price" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Price" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* STOCHASTIC OSCILLATOR */}
          <TabsContent value="stochastic">
            <Card>
              <CardHeader>
                <CardTitle>Stochastic Oscillator (14,3,3)</CardTitle>
                <CardDescription>Momentum indicator comparing closing price to price range</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                    <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                    <Legend />
                    <ReferenceLine y={80} stroke="hsl(var(--destructive))" strokeDasharray="3 3" label="Overbought" />
                    <ReferenceLine y={20} stroke="hsl(var(--chart-2))" strokeDasharray="3 3" label="Oversold" />
                    <Line type="monotone" dataKey="stochK" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="%K" />
                    <Line type="monotone" dataKey="stochD" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} name="%D" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ATR */}
          <TabsContent value="atr">
            <Card>
              <CardHeader>
                <CardTitle>Average True Range (ATR)</CardTitle>
                <CardDescription>Measures market volatility</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                    <Legend />
                    <Area type="monotone" dataKey="atr" fill="hsl(var(--primary))" fillOpacity={0.3} stroke="hsl(var(--primary))" strokeWidth={2} name="ATR (14)" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ADX */}
          <TabsContent value="adx">
            <Card>
              <CardHeader>
                <CardTitle>Average Directional Index (ADX)</CardTitle>
                <CardDescription>Measures trend strength (not direction)</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                    <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                    <Legend />
                    <ReferenceLine y={25} stroke="hsl(var(--chart-2))" strokeDasharray="3 3" label="Strong Trend" />
                    <ReferenceLine y={20} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" label="Weak Trend" />
                    <Line type="monotone" dataKey="adx" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="ADX (14)" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* VOLUME (OBV) */}
          <TabsContent value="volume">
            <Card>
              <CardHeader>
                <CardTitle>On-Balance Volume (OBV)</CardTitle>
                <CardDescription>Volume-based momentum indicator</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                    <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" />
                    <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                    <Legend />
                    <Bar dataKey="volume" fill="hsl(var(--muted))" opacity={0.3} yAxisId="left" name="Volume" />
                    <Line type="monotone" dataKey="obv" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} yAxisId="right" name="OBV" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* WILLIAMS %R */}
          <TabsContent value="williamsR">
            <Card>
              <CardHeader>
                <CardTitle>Williams %R</CardTitle>
                <CardDescription>Momentum indicator showing overbought/oversold levels</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                    <YAxis domain={[-100, 0]} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                    <Legend />
                    <ReferenceLine y={-20} stroke="hsl(var(--destructive))" strokeDasharray="3 3" label="Overbought" />
                    <ReferenceLine y={-80} stroke="hsl(var(--chart-2))" strokeDasharray="3 3" label="Oversold" />
                    <Line type="monotone" dataKey="williamsR" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Williams %R (14)" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CCI */}
          <TabsContent value="cci">
            <Card>
              <CardHeader>
                <CardTitle>Commodity Channel Index (CCI)</CardTitle>
                <CardDescription>Identifies cyclical trends and overbought/oversold conditions</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                    <Legend />
                    <ReferenceLine y={100} stroke="hsl(var(--destructive))" strokeDasharray="3 3" label="Overbought" />
                    <ReferenceLine y={-100} stroke="hsl(var(--chart-2))" strokeDasharray="3 3" label="Oversold" />
                    <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                    <Line type="monotone" dataKey="cci" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="CCI (20)" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* MOMENTUM */}
          <TabsContent value="momentum">
            <Card>
              <CardHeader>
                <CardTitle>Momentum Indicator</CardTitle>
                <CardDescription>Rate of price change over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                    <Legend />
                    <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                    <Bar dataKey="momentum" fill="hsl(var(--primary))" opacity={0.6} name="Momentum (10)" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ROC */}
          <TabsContent value="roc">
            <Card>
              <CardHeader>
                <CardTitle>Rate of Change (ROC)</CardTitle>
                <CardDescription>Percentage change in price over period</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                    <Legend />
                    <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                    <Area type="monotone" dataKey="roc" fill="hsl(var(--primary))" fillOpacity={0.3} stroke="hsl(var(--primary))" strokeWidth={2} name="ROC (%) (12)" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Educational Info */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Indicator Guide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <strong className="text-primary">RSI (Relative Strength Index):</strong>
              <p className="text-muted-foreground">Measures momentum. RSI &gt; 70 = overbought, RSI &lt; 30 = oversold. Look for divergences with price.</p>
            </div>
            <div>
              <strong className="text-primary">MACD:</strong>
              <p className="text-muted-foreground">Trend-following indicator. Bullish when MACD crosses above signal line. Histogram shows momentum strength.</p>
            </div>
            <div>
              <strong className="text-primary">Bollinger Bands:</strong>
              <p className="text-muted-foreground">Price touching upper band suggests overbought, lower band suggests oversold. Squeeze indicates low volatility before potential breakout.</p>
            </div>
            <div>
              <strong className="text-primary">Moving Averages:</strong>
              <p className="text-muted-foreground">Golden Cross (SMA50 &gt; SMA200) is bullish, Death Cross (SMA50 &lt; SMA200) is bearish.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TechnicalIndicators;
