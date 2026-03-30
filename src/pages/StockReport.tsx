import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, TrendingUp, TrendingDown, BarChart3, Activity, AlertTriangle, Target, Zap, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { InlineChart } from '@/components/ai/PremiumProseParser';
import { generateStockReportPDF } from '@/lib/reportGenerator';

interface StockData {
  ticker: string;
  prices: { date: string; open: number; high: number; low: number; close: number; volume: number }[];
}

interface StockReport {
  ticker: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  high52w: number;
  low52w: number;
  avgVolume: number;
  volatility: number;
  momentum21d: number;
  momentum63d: number;
  rsi14: number;
  sma20: number;
  sma50: number;
  sma200: number;
  support: number;
  resistance: number;
  signal: 'bullish' | 'bearish' | 'neutral';
  priceHistory: { name: string; value: number }[];
  volumeHistory: { name: string; value: number }[];
}

function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 50;
  const changes = prices.slice(1).map((p, i) => p - prices[i]);
  const recent = changes.slice(-period);
  const gains = recent.filter(c => c > 0).reduce((s, c) => s + c, 0) / period;
  const losses = recent.filter(c => c < 0).reduce((s, c) => s + Math.abs(c), 0) / period;
  if (losses === 0) return 100;
  const rs = gains / losses;
  return 100 - (100 / (1 + rs));
}

function calculateSMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1] || 0;
  return prices.slice(-period).reduce((s, p) => s + p, 0) / period;
}

function generateReport(ticker: string, data: any[]): StockReport {
  const closes = data.map((d: any) => d.close);
  const volumes = data.map((d: any) => d.volume);
  const currentPrice = closes[closes.length - 1];
  const prevPrice = closes[closes.length - 2] || currentPrice;
  const change = currentPrice - prevPrice;
  const changePercent = (change / prevPrice) * 100;

  const high52w = Math.max(...closes);
  const low52w = Math.min(...closes);
  const avgVolume = volumes.reduce((s: number, v: number) => s + v, 0) / volumes.length;

  // Volatility (annualized)
  const returns = closes.slice(1).map((p: number, i: number) => Math.log(p / closes[i]));
  const meanReturn = returns.reduce((s, r) => s + r, 0) / returns.length;
  const variance = returns.reduce((s, r) => s + Math.pow(r - meanReturn, 2), 0) / returns.length;
  const volatility = Math.sqrt(variance * 252) * 100;

  // Momentum
  const momentum21d = closes.length > 21 ? ((currentPrice / closes[closes.length - 22]) - 1) * 100 : 0;
  const momentum63d = closes.length > 63 ? ((currentPrice / closes[closes.length - 64]) - 1) * 100 : 0;

  // Technicals
  const rsi14 = calculateRSI(closes);
  const sma20 = calculateSMA(closes, 20);
  const sma50 = calculateSMA(closes, 50);
  const sma200 = calculateSMA(closes, 200);

  // Support/Resistance (simple pivot)
  const recentHigh = Math.max(...closes.slice(-20));
  const recentLow = Math.min(...closes.slice(-20));

  // Signal
  let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  if (currentPrice > sma50 && rsi14 > 50 && momentum21d > 0) signal = 'bullish';
  else if (currentPrice < sma50 && rsi14 < 50 && momentum21d < 0) signal = 'bearish';

  // Price history for chart (last 60 days)
  const priceHistory = data.slice(-60).map((d: any) => ({
    name: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: d.close,
  }));

  // Volume history for chart (last 30 days)
  const volumeHistory = data.slice(-30).map((d: any) => ({
    name: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: Math.round(d.volume / 1000),
  }));

  return {
    ticker,
    currentPrice,
    change,
    changePercent,
    high52w,
    low52w,
    avgVolume,
    volatility,
    momentum21d,
    momentum63d,
    rsi14,
    sma20,
    sma50,
    sma200,
    support: recentLow,
    resistance: recentHigh,
    signal,
    priceHistory,
    volumeHistory,
  };
}

export default function StockReportPage() {
  const [ticker, setTicker] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<StockReport | null>(null);

  const handleAnalyze = async () => {
    if (!ticker.trim()) return;
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('fetch-stock-data', {
        body: { tickers: [ticker.toUpperCase()], period: '1y' },
      });

      if (error) throw error;

      const stockData = data?.stockData?.[ticker.toUpperCase()];
      if (!stockData || stockData.length < 20) {
        toast.error(`No sufficient data for ${ticker.toUpperCase()}`);
        return;
      }

      const r = generateReport(ticker.toUpperCase(), stockData);
      setReport(r);
      toast.success(`Report generated for ${ticker.toUpperCase()}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch stock data');
    } finally {
      setIsLoading(false);
    }
  };

  const signalColor = report?.signal === 'bullish' ? 'text-emerald-400' : report?.signal === 'bearish' ? 'text-rose-400' : 'text-amber-400';
  const signalBg = report?.signal === 'bullish' ? 'bg-emerald-500/10 border-emerald-500/30' : report?.signal === 'bearish' ? 'bg-rose-500/10 border-rose-500/30' : 'bg-amber-500/10 border-amber-500/30';

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto space-y-6"
      >
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            Stock Report
          </h1>
          <p className="text-muted-foreground text-sm">One-click institutional-grade stock analysis powered by Yahoo Finance</p>
        </div>

        {/* Search */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              placeholder="Enter ticker (e.g. AAPL, NVDA, RELIANCE.NS)"
              className="pl-10"
            />
          </div>
          <Button onClick={handleAnalyze} disabled={isLoading || !ticker.trim()}>
            {isLoading ? 'Analyzing...' : 'Analyze'}
            <Zap className="w-4 h-4 ml-2" />
          </Button>
          {report && (
            <Button variant="outline" onClick={() => generateStockReportPDF(report.ticker, report)}>
              <Download className="w-4 h-4 mr-2" />
              PDF
            </Button>
          )}
        </div>

        {/* Report */}
        {report && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Price Header */}
            <div className={`p-6 rounded-xl border ${signalBg}`}>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-2xl font-bold font-mono text-foreground">{report.ticker}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${signalColor} ${signalBg}`}>
                      {report.signal}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-bold font-mono text-foreground">${report.currentPrice.toFixed(2)}</span>
                    <span className={`flex items-center gap-1 text-lg font-mono ${report.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {report.change >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                      {report.change >= 0 ? '+' : ''}{report.change.toFixed(2)} ({report.changePercent.toFixed(2)}%)
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
                  <div><span className="text-muted-foreground">52W High:</span> <span className="font-mono text-foreground">${report.high52w.toFixed(2)}</span></div>
                  <div><span className="text-muted-foreground">52W Low:</span> <span className="font-mono text-foreground">${report.low52w.toFixed(2)}</span></div>
                  <div><span className="text-muted-foreground">Avg Vol:</span> <span className="font-mono text-foreground">{(report.avgVolume / 1e6).toFixed(1)}M</span></div>
                  <div><span className="text-muted-foreground">Volatility:</span> <span className="font-mono text-foreground">{report.volatility.toFixed(1)}%</span></div>
                </div>
              </div>
            </div>

            {/* Price Chart */}
            <InlineChart
              data={report.priceHistory}
              type="area"
              theme="strategy"
              title={`${report.ticker} — 60-Day Price`}
              height={250}
            />

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'RSI (14)', value: report.rsi14.toFixed(1), warn: report.rsi14 > 70 || report.rsi14 < 30, icon: <Activity className="w-4 h-4" /> },
                { label: '21D Momentum', value: `${report.momentum21d >= 0 ? '+' : ''}${report.momentum21d.toFixed(2)}%`, color: report.momentum21d >= 0 ? 'text-emerald-400' : 'text-rose-400', icon: <TrendingUp className="w-4 h-4" /> },
                { label: '63D Momentum', value: `${report.momentum63d >= 0 ? '+' : ''}${report.momentum63d.toFixed(2)}%`, color: report.momentum63d >= 0 ? 'text-emerald-400' : 'text-rose-400', icon: <Target className="w-4 h-4" /> },
                { label: 'Signal', value: report.signal.toUpperCase(), color: signalColor, icon: <AlertTriangle className="w-4 h-4" /> },
              ].map((m, i) => (
                <div key={i} className="p-4 rounded-xl bg-card/30 border border-border/30">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">{m.icon}<span className="text-xs uppercase tracking-wider">{m.label}</span></div>
                  <span className={`font-mono text-xl font-bold ${m.color || (m.warn ? 'text-amber-400' : 'text-foreground')}`}>{m.value}</span>
                </div>
              ))}
            </div>

            {/* Moving Averages */}
            <div className="p-5 rounded-xl bg-card/20 border border-border/30">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-4">Moving Averages</p>
              <div className="grid grid-cols-3 gap-6">
                {[
                  { label: 'SMA 20', value: report.sma20, above: report.currentPrice > report.sma20 },
                  { label: 'SMA 50', value: report.sma50, above: report.currentPrice > report.sma50 },
                  { label: 'SMA 200', value: report.sma200, above: report.currentPrice > report.sma200 },
                ].map((sma, i) => (
                  <div key={i} className="space-y-1">
                    <span className="text-sm text-muted-foreground">{sma.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-lg text-foreground">${sma.value.toFixed(2)}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${sma.above ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                        {sma.above ? 'Above' : 'Below'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Volume Chart */}
            <InlineChart
              data={report.volumeHistory}
              type="bar"
              theme="quant"
              title="30-Day Volume (thousands)"
              height={180}
            />

            {/* Support/Resistance */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                <span className="text-xs text-emerald-400 uppercase tracking-wider">Support</span>
                <p className="font-mono text-xl font-bold text-foreground mt-1">${report.support.toFixed(2)}</p>
              </div>
              <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20">
                <span className="text-xs text-rose-400 uppercase tracking-wider">Resistance</span>
                <p className="font-mono text-xl font-bold text-foreground mt-1">${report.resistance.toFixed(2)}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {!report && !isLoading && (
          <div className="text-center py-20 space-y-4">
            <Search className="w-12 h-12 text-muted-foreground/30 mx-auto" />
            <p className="text-muted-foreground">Enter a ticker symbol above and hit Analyze for an instant institutional report.</p>
            <div className="flex flex-wrap justify-center gap-2">
              {['AAPL', 'NVDA', 'MSFT', 'TSLA', 'GOOGL'].map(t => (
                <button
                  key={t}
                  onClick={() => { setTicker(t); }}
                  className="px-3 py-1.5 rounded-lg bg-card/30 border border-border/30 text-sm font-mono text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
