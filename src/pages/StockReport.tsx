import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { 
  Search, TrendingUp, TrendingDown, Activity, Target, Zap, 
  Download, Crosshair, BarChart3, Clock, AlertTriangle 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { generateStockReportPDF } from '@/lib/reportGenerator';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, CartesianGrid, ReferenceLine
} from 'recharts';

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
  priceHistory: { date: string; close: number; volume: number; isUp: boolean }[];
  lastUpdated: string;
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

  const returns = closes.slice(1).map((p: number, i: number) => Math.log(p / closes[i]));
  const meanReturn = returns.reduce((s, r) => s + r, 0) / returns.length;
  const variance = returns.reduce((s, r) => s + Math.pow(r - meanReturn, 2), 0) / returns.length;
  const volatility = Math.sqrt(variance * 252) * 100;

  const momentum21d = closes.length > 21 ? ((currentPrice / closes[closes.length - 22]) - 1) * 100 : 0;
  const momentum63d = closes.length > 63 ? ((currentPrice / closes[closes.length - 64]) - 1) * 100 : 0;

  const rsi14 = calculateRSI(closes);
  const sma20 = calculateSMA(closes, 20);
  const sma50 = calculateSMA(closes, 50);
  const sma200 = calculateSMA(closes, 200);

  const recentHigh = Math.max(...closes.slice(-20));
  const recentLow = Math.min(...closes.slice(-20));

  let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  if (currentPrice > sma50 && rsi14 > 40 && momentum21d > 0) signal = 'bullish';
  else if (currentPrice < sma50 && rsi14 < 60 && momentum21d < 0) signal = 'bearish';

  const priceHistory = data.slice(-90).map((d: any, i: number, arr: any[]) => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    close: d.close,
    volume: d.volume,
    isUp: i === 0 || d.close >= arr[i - 1].close
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
    lastUpdated: new Date().toISOString()
  };
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    // Basic heuristic since ticker isn't explicitly passed to tooltip easily without prop drilling
    // We can just omit the currency symbol here or pass it if possible.
    // Given the structure, we can just use the value without the hardcoded $
    return (
      <div className="bg-black/90 border border-white/20 p-3 rounded shadow-xl font-mono backdrop-blur-md">
        <p className="text-white/60 text-xs mb-2">{label}</p>
        <p className="text-white font-bold text-lg">
          {payload[0].value.toFixed(2)}
        </p>
        {payload[1] && (
          <p className="text-white/60 text-xs mt-1">
            Vol: {(payload[1].value / 1e6).toFixed(2)}M
          </p>
        )}
      </div>
    );
  }
  return null;
};

export default function StockReportPage() {
  const [ticker, setTicker] = useState('NVDA');
  const [inputTicker, setInputTicker] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<StockReport | null>(null);

  const currencySymbol = report?.ticker.endsWith('.NS') || report?.ticker.endsWith('.BO') ? '₹' : '$';

  const handleAnalyze = async (symbol: string) => {
    const target = symbol.trim().toUpperCase();
    if (!target) return;
    
    setIsLoading(true);
    setTicker(target);
    
    try {
      const { data, error } = await supabase.functions.invoke('fetch-stock-data', {
        body: { tickers: [target], period: '1y' },
      });

      if (error) throw error;

      const stockData = data?.stockData?.[target];
      if (!stockData || stockData.length < 20) {
        toast.error(`No sufficient robust data found for ${target}`);
        setReport(null);
        return;
      }

      const r = generateReport(target, stockData);
      setReport(r);
      toast.success(`Data integrity verified. Loaded ${target}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch stock data');
    } finally {
      setIsLoading(false);
    }
  };

  const [searchParams] = useSearchParams();

  // Load default on mount
  useEffect(() => {
    const t = searchParams.get('ticker') || 'NVDA';
    handleAnalyze(t);
  }, [searchParams]);

  return (
    <div className="relative h-screen w-full bg-[#09090b] text-white overflow-hidden font-mono flex flex-col">
      {/* TOP COMMAND DECK */}
      <div className="flex-none bg-black/80 border-b border-white/10 px-6 py-3 z-20 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 border-r border-white/10 pr-6">
            <BarChart3 className="w-5 h-5 text-emerald-500" />
            <div className="text-[11px] font-bold tracking-widest leading-tight uppercase">
              Asset Report <br/>
              <span className="text-white/40 font-light">Institutional Grade</span>
            </div>
          </div>
          
          <div className="relative w-[300px] flex items-center gap-3">
            <span className="text-[10px] text-white/50 tracking-widest font-bold uppercase shrink-0">
              TARGET_ID {'>'}
            </span>
            <input
              type="text"
              value={inputTicker}
              onChange={(e) => setInputTicker(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAnalyze(inputTicker);
                  setInputTicker('');
                }
              }}
              disabled={isLoading}
              placeholder="e.g. AAPL, TSLA"
              className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/20 text-xs px-3 py-1.5 rounded focus:outline-none focus:border-emerald-500/50 transition-colors uppercase tracking-widest"
            />
          </div>
          
          {isLoading && (
            <div className="flex items-center gap-2 text-emerald-500 text-xs animate-pulse tracking-widest uppercase">
              <Zap className="w-3 h-3" /> Fetching Market Data...
            </div>
          )}
        </div>

        {report && (
          <button 
            onClick={() => generateStockReportPDF(report.ticker, report)}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-xs transition-colors tracking-widest uppercase"
          >
            <Download className="w-3 h-3" /> PDF Export
          </button>
        )}
      </div>

      {/* MAIN HUD AREA */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL: KEY METRICS */}
        <div className="w-[320px] bg-black/40 border-r border-white/5 overflow-y-auto flex flex-col hide-scrollbar">
          {report ? (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-5 space-y-6"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h1 className="text-4xl font-bold tracking-tighter">{report.ticker}</h1>
                  <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 border ${
                    report.signal === 'bullish' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' :
                    report.signal === 'bearish' ? 'text-rose-400 border-rose-500/30 bg-rose-500/10' :
                    'text-amber-400 border-amber-500/30 bg-amber-500/10'
                  }`}>
                    SIG: {report.signal}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-light">{currencySymbol}{report.currentPrice.toFixed(2)}</p>
                  <p className={`text-sm tracking-wider ${report.change >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {report.change >= 0 ? '+' : ''}{report.change.toFixed(2)} ({report.changePercent.toFixed(2)}%)
                  </p>
                </div>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-2 gap-px bg-white/5 border border-white/5">
                {[
                  { label: "52W HIGH", value: `${currencySymbol}${report.high52w.toFixed(2)}` },
                  { label: "52W LOW", value: `${currencySymbol}${report.low52w.toFixed(2)}` },
                  { label: "AVG VOL", value: `${(report.avgVolume / 1e6).toFixed(2)}M` },
                  { label: "VOLATILITY", value: `${report.volatility.toFixed(1)}%` },
                  { label: "RSI(14)", value: report.rsi14.toFixed(1), color: report.rsi14 > 70 ? 'text-rose-400' : report.rsi14 < 30 ? 'text-emerald-400' : 'text-white' },
                  { label: "MOM(21D)", value: `${report.momentum21d > 0 ? '+' : ''}${report.momentum21d.toFixed(1)}%`, color: report.momentum21d > 0 ? 'text-emerald-400' : 'text-rose-400' },
                ].map((item, i) => (
                  <div key={i} className="bg-[#09090b] p-3 flex flex-col justify-center">
                    <span className="text-[9px] text-white/40 tracking-widest uppercase mb-1">{item.label}</span>
                    <span className={`text-sm font-medium ${item.color || 'text-white'}`}>{item.value}</span>
                  </div>
                ))}
              </div>

              {/* Moving Averages */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[10px] text-white/50 tracking-widest uppercase border-b border-white/10 pb-2">
                  <Activity className="w-3 h-3" /> Moving Averages Matrix
                </div>
                {[
                  { label: 'SMA 20', val: report.sma20 },
                  { label: 'SMA 50', val: report.sma50 },
                  { label: 'SMA 200', val: report.sma200 },
                ].map((sma, i) => {
                  const isAbove = report.currentPrice > sma.val;
                  return (
                    <div key={i} className="flex items-center justify-between text-sm py-1">
                      <span className="text-white/60">{sma.label}</span>
                      <div className="flex items-center gap-3">
                        <span>{currencySymbol}{sma.val.toFixed(2)}</span>
                        <div className={`w-1.5 h-1.5 rounded-full ${isAbove ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Support/Resistance */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[10px] text-white/50 tracking-widest uppercase border-b border-white/10 pb-2">
                  <Crosshair className="w-3 h-3" /> Technical Boundaries
                </div>
                <div className="bg-emerald-500/5 border border-emerald-500/20 p-3 rounded">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] text-emerald-500/70 tracking-widest">RESISTANCE</span>
                  </div>
                  <div className="text-lg text-emerald-400">{currencySymbol}{report.resistance.toFixed(2)}</div>
                </div>
                <div className="bg-rose-500/5 border border-rose-500/20 p-3 rounded">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] text-rose-500/70 tracking-widest">SUPPORT</span>
                  </div>
                  <div className="text-lg text-rose-400">{currencySymbol}{report.support.toFixed(2)}</div>
                </div>
              </div>

            </motion.div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-6 text-center text-white/20">
              {isLoading ? 'AWAITING DATA...' : 'ENTER TICKER ABOVE'}
            </div>
          )}
        </div>

        {/* RIGHT PANEL: FULLSCREEN CHARTS */}
        <div className="flex-1 flex flex-col p-6 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/[0.02] via-transparent to-transparent">
          {report ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex-1 flex flex-col space-y-6"
            >
              {/* Header Info */}
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-4">
                  <span className="text-xs text-white/70 tracking-widest uppercase">90-Day Price Discovery</span>
                  <div className="flex gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] text-white/40 tracking-widest">LIVE SYNC</span>
                  </div>
                </div>
              </div>

              {/* Price Chart */}
              <div className="flex-1 min-h-0 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={report.priceHistory} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={report.change >= 0 ? '#10b981' : '#f43f5e'} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={report.change >= 0 ? '#10b981' : '#f43f5e'} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      stroke="#ffffff40" 
                      fontSize={11} 
                      tickMargin={10}
                      minTickGap={30}
                    />
                    <YAxis 
                      domain={['auto', 'auto']} 
                      stroke="#ffffff40" 
                      fontSize={11}
                      tickFormatter={(val) => `${currencySymbol}${val}`}
                      orientation="right"
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine y={report.sma50} stroke="#eab308" strokeDasharray="3 3" opacity={0.5} />
                    <Area 
                      type="monotone" 
                      dataKey="close" 
                      stroke={report.change >= 0 ? '#10b981' : '#f43f5e'} 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorPrice)" 
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Volume Indicator */}
              <div className="h-[120px] relative border-t border-white/5 pt-4">
                <span className="absolute top-2 left-0 text-[10px] text-white/40 tracking-widest z-10">VOLUME HISTOGRAM</span>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={report.priceHistory} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <YAxis hide domain={[0, 'auto']} />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-black/80 px-2 py-1 border border-white/10 text-xs">
                              {(payload[0].value / 1e6).toFixed(2)}M
                            </div>
                          );
                        }
                        return null;
                      }}
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }} 
                    />
                    <Bar 
                      dataKey="volume" 
                      isAnimationActive={false}
                    >
                      {
                        report.priceHistory.map((entry, index) => (
                          <cell key={`cell-${index}`} fill={entry.isUp ? '#10b98140' : '#f43f5e40'} />
                        ))
                      }
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center opacity-20">
              <BarChart3 className="w-32 h-32 mb-6" />
              <p className="text-xl tracking-widest font-light">SYSTEM STANDBY</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
