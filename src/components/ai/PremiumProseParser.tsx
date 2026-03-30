import { useState, ReactNode, Fragment } from 'react';
import { motion } from 'framer-motion';
import { Send, Sparkles, TrendingUp, TrendingDown, BarChart3, PieChart as PieChartIcon, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, Tooltip,
  LineChart, Line, AreaChart, Area
} from 'recharts';

// ================================
// THEME COLOR CONFIGURATIONS
// ================================

export type ResponseTheme = 'athena' | 'market' | 'strategy' | 'quant' | 'quantscript';

const THEME_COLORS: Record<ResponseTheme, {
  primary: string;
  accent: string;
  gradient: string;
  glow: string;
  glowFilter: string;
  chartColors: string[];
  tickerBg: string;
  tickerText: string;
  headingColor: string;
  borderColor: string;
}> = {
  athena: {
    primary: 'hsl(200 90% 60%)',
    accent: 'hsl(200 85% 50%)',
    gradient: 'from-sky-500/10 via-blue-500/5 to-cyan-500/10',
    glow: 'shadow-sky-500/20',
    glowFilter: 'drop-shadow(0 0 8px hsl(200 90% 60% / 0.4))',
    chartColors: ['hsl(200 90% 60%)', 'hsl(210 80% 55%)', 'hsl(180 70% 50%)', 'hsl(220 75% 60%)', 'hsl(190 85% 55%)'],
    tickerBg: 'bg-emerald-500/10',
    tickerText: 'text-emerald-400',
    headingColor: 'text-sky-400',
    borderColor: 'border-sky-500/30',
  },
  market: {
    primary: 'hsl(152 70% 50%)',
    accent: 'hsl(152 65% 45%)',
    gradient: 'from-emerald-500/10 via-green-500/5 to-teal-500/10',
    glow: 'shadow-emerald-500/20',
    glowFilter: 'drop-shadow(0 0 8px hsl(152 70% 50% / 0.4))',
    chartColors: ['hsl(152 70% 50%)', 'hsl(160 65% 45%)', 'hsl(140 60% 50%)', 'hsl(170 70% 45%)', 'hsl(145 75% 55%)'],
    tickerBg: 'bg-emerald-500/10',
    tickerText: 'text-emerald-400',
    headingColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
  },
  strategy: {
    primary: 'hsl(190 90% 55%)',
    accent: 'hsl(195 85% 50%)',
    gradient: 'from-cyan-500/10 via-teal-500/5 to-blue-500/10',
    glow: 'shadow-cyan-500/20',
    glowFilter: 'drop-shadow(0 0 8px hsl(190 90% 55% / 0.4))',
    chartColors: ['hsl(190 90% 55%)', 'hsl(185 80% 50%)', 'hsl(200 75% 55%)', 'hsl(175 70% 50%)', 'hsl(195 85% 60%)'],
    tickerBg: 'bg-cyan-500/10',
    tickerText: 'text-cyan-400',
    headingColor: 'text-cyan-400',
    borderColor: 'border-cyan-500/30',
  },
  quant: {
    primary: 'hsl(35 95% 55%)',
    accent: 'hsl(30 90% 50%)',
    gradient: 'from-amber-500/10 via-orange-500/5 to-yellow-500/10',
    glow: 'shadow-amber-500/20',
    glowFilter: 'drop-shadow(0 0 8px hsl(35 95% 55% / 0.4))',
    chartColors: ['hsl(35 95% 55%)', 'hsl(40 90% 50%)', 'hsl(25 85% 55%)', 'hsl(45 80% 50%)', 'hsl(30 95% 60%)'],
    tickerBg: 'bg-amber-500/10',
    tickerText: 'text-amber-400',
    headingColor: 'text-amber-400',
    borderColor: 'border-amber-500/30',
  },
  quantscript: {
    primary: 'hsl(25 95% 55%)',
    accent: 'hsl(20 90% 50%)',
    gradient: 'from-orange-500/10 via-red-500/5 to-amber-500/10',
    glow: 'shadow-orange-500/20',
    glowFilter: 'drop-shadow(0 0 8px hsl(25 95% 55% / 0.4))',
    chartColors: ['hsl(25 95% 55%)', 'hsl(20 90% 50%)', 'hsl(30 85% 55%)', 'hsl(15 80% 50%)', 'hsl(35 95% 60%)'],
    tickerBg: 'bg-orange-500/10',
    tickerText: 'text-orange-400',
    headingColor: 'text-orange-400',
    borderColor: 'border-orange-500/30',
  },
};

// ================================
// PREMIUM CHART TOOLTIP
// ================================

const PremiumTooltip = ({ active, payload, label, theme }: any) => {
  if (!active || !payload?.length) return null;
  const themeConfig = THEME_COLORS[theme as ResponseTheme] || THEME_COLORS.athena;
  
  return (
    <div 
      className="px-3 py-2 rounded-lg border backdrop-blur-xl"
      style={{
        backgroundColor: 'rgba(15, 20, 30, 0.95)',
        borderColor: themeConfig.primary + '40',
        boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 20px ${themeConfig.primary}20`,
      }}
    >
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="font-mono text-sm" style={{ color: themeConfig.primary }}>
        {typeof payload[0].value === 'number' ? payload[0].value.toFixed(2) : payload[0].value}
      </p>
    </div>
  );
};

// ================================
// INLINE CHART COMPONENTS (THEMED WITH GLOW)
// ================================

interface InlineChartProps {
  data: any[];
  type: 'pie' | 'bar' | 'line' | 'area';
  height?: number;
  theme?: ResponseTheme;
  dataKey?: string;
  nameKey?: string;
  title?: string;
}

export function InlineChart({ 
  data, 
  type, 
  height = 200, 
  theme = 'athena',
  dataKey = 'value', 
  nameKey = 'name',
  title 
}: InlineChartProps) {
  const themeConfig = THEME_COLORS[theme];
  const colors = themeConfig.chartColors;

  if (!data || data.length === 0) {
    return null;
  }

  const renderChart = () => {
    if (type === 'pie') {
      return (
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <defs>
              <filter id={`glow-pie-${theme}`} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <Pie
              data={data}
              dataKey={dataKey}
              nameKey={nameKey}
              cx="50%"
              cy="50%"
              outerRadius={75}
              innerRadius={40}
              paddingAngle={2}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              labelLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 }}
              filter={`url(#glow-pie-${theme})`}
            >
              {data.map((_, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={colors[index % colors.length]}
                  stroke="transparent"
                />
              ))}
            </Pie>
            <Tooltip content={<PremiumTooltip theme={theme} />} />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    if (type === 'bar') {
      return (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id={`barGradient-${theme}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colors[0]} stopOpacity={1} />
                <stop offset="100%" stopColor={colors[0]} stopOpacity={0.6} />
              </linearGradient>
            </defs>
            <XAxis dataKey={nameKey} stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip content={<PremiumTooltip theme={theme} />} />
            <Bar 
              dataKey={dataKey} 
              fill={`url(#barGradient-${theme})`} 
              radius={[4, 4, 0, 0]}
              style={{ filter: themeConfig.glowFilter }}
            />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    if (type === 'line') {
      return (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <XAxis dataKey={nameKey} stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip content={<PremiumTooltip theme={theme} />} />
            <Line 
              type="monotone" 
              dataKey={dataKey} 
              stroke={colors[0]} 
              strokeWidth={2} 
              dot={{ fill: colors[0], strokeWidth: 0, r: 3 }}
              style={{ filter: themeConfig.glowFilter }}
            />
          </LineChart>
        </ResponsiveContainer>
      );
    }

    // Area chart
    return (
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id={`colorGradient-${theme}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={colors[0]} stopOpacity={0.4} />
              <stop offset="95%" stopColor={colors[0]} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey={nameKey} stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
          <Tooltip content={<PremiumTooltip theme={theme} />} />
          <Area 
            type="monotone" 
            dataKey={dataKey} 
            stroke={colors[0]} 
            strokeWidth={2} 
            fill={`url(#colorGradient-${theme})`}
            style={{ filter: themeConfig.glowFilter }}
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`my-6 p-4 rounded-xl bg-gradient-to-br ${themeConfig.gradient} border ${themeConfig.borderColor}`}
    >
      {title && (
        <p className={`text-sm mb-4 uppercase tracking-wider font-medium ${themeConfig.headingColor}`}>
          {title}
        </p>
      )}
      {renderChart()}
    </motion.div>
  );
}

// ================================
// TICKER HIGHLIGHT COMPONENT
// ================================

interface TickerHighlightProps {
  symbol: string;
  theme?: ResponseTheme;
}

export function TickerHighlight({ symbol, theme = 'athena' }: TickerHighlightProps) {
  const themeConfig = THEME_COLORS[theme];
  return (
    <span 
      className={`inline-flex items-center px-2 py-0.5 rounded-md ${themeConfig.tickerBg} ${themeConfig.tickerText} font-mono font-semibold text-sm mx-0.5 border border-current/20`}
      style={{ filter: themeConfig.glowFilter.replace('0.4', '0.2') }}
    >
      {symbol}
    </span>
  );
}

// ================================
// BLOOMBERG-STYLE TICKER TABLE
// ================================

interface TickerData {
  symbol: string;
  name?: string;
  price?: number;
  change?: number;
  weight?: number;
  action?: 'buy' | 'sell' | 'hold';
}

interface InlineTickerTableProps {
  tickers: TickerData[];
  title?: string;
  showAction?: boolean;
  currency?: string;
  theme?: ResponseTheme;
}

export function InlineTickerTable({ tickers, title, showAction = true, currency = '$', theme = 'athena' }: InlineTickerTableProps) {
  const themeConfig = THEME_COLORS[theme];
  
  if (!tickers || tickers.length === 0) {
    return null;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`my-6 overflow-hidden rounded-xl border ${themeConfig.borderColor} bg-card/20 backdrop-blur-sm`}
    >
      {title && (
        <div className={`px-4 py-3 border-b ${themeConfig.borderColor} bg-gradient-to-r ${themeConfig.gradient}`}>
          <span className={`text-xs font-medium uppercase tracking-wider ${themeConfig.headingColor}`}>{title}</span>
        </div>
      )}
      <div className="divide-y divide-border/20">
        {tickers.map((ticker, idx) => (
          <motion.div
            key={ticker.symbol}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="flex items-center justify-between px-4 py-3 hover:bg-muted/10 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className={`font-mono font-bold ${themeConfig.tickerText}`}>{ticker.symbol}</span>
              {ticker.name && <span className="text-sm text-muted-foreground hidden sm:inline">{ticker.name}</span>}
            </div>
            <div className="flex items-center gap-4">
              {ticker.weight !== undefined && typeof ticker.weight === 'number' && (
                <span className="text-sm text-muted-foreground font-mono">{(ticker.weight * 100).toFixed(1)}%</span>
              )}
              {ticker.price !== undefined && typeof ticker.price === 'number' && (
                <span className="font-mono text-sm text-foreground">{currency}{ticker.price.toFixed(2)}</span>
              )}
              {ticker.change !== undefined && typeof ticker.change === 'number' && (
                <span className={`flex items-center gap-1 font-mono text-sm ${ticker.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {ticker.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {ticker.change >= 0 ? '+' : ''}{ticker.change.toFixed(2)}%
                </span>
              )}
              {showAction && ticker.action && (
                <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${
                  ticker.action === 'buy' ? 'bg-emerald-500/20 text-emerald-400' :
                  ticker.action === 'sell' ? 'bg-rose-500/20 text-rose-400' :
                  'bg-muted/50 text-muted-foreground'
                }`}>
                  {ticker.action}
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ================================
// COMPARISON BEFORE/AFTER
// ================================

interface ComparisonProps {
  before: { label: string; value: string | number }[];
  after: { label: string; value: string | number }[];
  theme?: ResponseTheme;
}

export function InlineComparison({ before, after, theme = 'athena' }: ComparisonProps) {
  const themeConfig = THEME_COLORS[theme];
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="my-6 grid grid-cols-2 gap-4"
    >
      <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20">
        <div className="text-xs font-medium text-rose-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <AlertTriangle className="w-3 h-3" />
          Before
        </div>
        <div className="space-y-2">
          {before.map((item, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{item.label}</span>
              <span className="font-mono text-foreground">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
      <div className={`p-4 rounded-xl bg-gradient-to-br ${themeConfig.gradient} border ${themeConfig.borderColor}`}>
        <div className={`text-xs font-medium uppercase tracking-wider mb-3 flex items-center gap-2 ${themeConfig.headingColor}`}>
          <Sparkles className="w-3 h-3" />
          After
        </div>
        <div className="space-y-2">
          {after.map((item, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{item.label}</span>
              <span className={`font-mono ${themeConfig.tickerText}`}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ================================
// PREMIUM PROSE PARAGRAPH PARSER
// ================================

interface ParsedParagraphProps {
  content: string;
  theme?: ResponseTheme;
  delay?: number;
}

export function PremiumParagraph({ content, theme = 'athena', delay = 0 }: ParsedParagraphProps) {
  const themeConfig = THEME_COLORS[theme];
  
  const parseContent = (text: string): ReactNode[] => {
    const parts: ReactNode[] = [];
    
    // Check if this is a heading line
    const headingMatch = text.match(/^([A-Z][^:]+):/);
    if (headingMatch) {
      const [fullMatch, heading] = headingMatch;
      parts.push(
        <span key="heading" className={`font-semibold ${themeConfig.headingColor}`}>
          {heading}:
        </span>
      );
      text = text.slice(fullMatch.length);
    }
    
    // Combined pattern for tickers and numbers
    const combinedRegex = /(\b[A-Z]{2,5}\b(?!\w)|\$[\d,]+(?:\.\d{2})?|[+-]?\d+(?:\.\d+)?%|₹[\d,]+(?:\.\d{2})?)/g;
    
    const excludeWords = new Set(['THE', 'AND', 'FOR', 'NOT', 'BUT', 'ARE', 'YOU', 'CAN', 'HAS', 'HAD', 'WAS', 'ALL', 'ANY', 'HIS', 'HER', 'OUR', 'OUT', 'DAY', 'HOW', 'MAN', 'NEW', 'NOW', 'OLD', 'SEE', 'WAY', 'WHO', 'BOY', 'DID', 'GET', 'LET', 'PUT', 'SAY', 'SHE', 'TOO', 'USE', 'RSI', 'SMA', 'EMA', 'ATR', 'VAR', 'OTM', 'ITM', 'ATM', 'ETF', 'CEO', 'CFO', 'IPO', 'ROI', 'ROE', 'API', 'KEY', 'TOP', 'LOW', 'HIGH', 'STEP', 'NEXT', 'EACH', 'BOTH', 'YOUR', 'FROM', 'WILL', 'HAVE', 'THIS', 'THAT', 'WITH', 'ALSO', 'INTO', 'OVER', 'WHAT', 'WHEN', 'THEN', 'THAN', 'BEEN', 'ONLY', 'VERY', 'JUST', 'MORE', 'MOST', 'SOME', 'SUCH', 'THEM', 'WELL', 'BACK', 'MADE', 'MAKE', 'LIKE', 'TIME', 'MUCH', 'TAKE', 'EVEN', 'GOOD', 'COME', 'LOOK', 'WANT', 'GIVE', 'FIRST', 'WEEK', 'YEAR', 'RISK', 'RATE', 'TERM', 'LONG', 'SHORT', 'CALL', 'BASED']);
    
    let lastIndex = 0;
    let match;
    let keyCounter = 0;
    
    while ((match = combinedRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      
      const matchText = match[1];
      
      if (/^[A-Z]{2,5}$/.test(matchText)) {
        if (!excludeWords.has(matchText)) {
          parts.push(
            <TickerHighlight key={`ticker-${keyCounter++}`} symbol={matchText} theme={theme} />
          );
        } else {
          parts.push(matchText);
        }
      } else {
        // Number - highlight with color
        const isPositive = !matchText.includes('-');
        const isPercent = matchText.includes('%');
        parts.push(
          <span 
            key={`num-${keyCounter++}`} 
            className={`font-mono font-semibold ${isPercent ? (isPositive ? 'text-emerald-400' : 'text-rose-400') : themeConfig.tickerText}`}
          >
            {matchText}
          </span>
        );
      }
      
      lastIndex = match.index + matchText.length;
    }
    
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }
    
    return parts;
  };

  const isHeading = /^[A-Z][A-Za-z\s]+:/.test(content) || 
                    /^(Step|Phase|Section|Part|\d+\.)\s/i.test(content) ||
                    /^(###|##|#)\s/.test(content);

  // Clean markdown from the content
  const cleanedContent = content
    .replace(/^(###|##|#)\s+/, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1');

  if (isHeading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.3 }}
        className={`mt-10 mb-4 pb-2 border-b border-foreground/10`}
      >
        <h3 className={`text-xl font-bold tracking-widest uppercase ${themeConfig.headingColor}`}>
          {parseContent(cleanedContent)}
        </h3>
      </motion.div>
    );
  }

  const getTextColor = () => {
    switch (theme) {
      case 'athena': return 'text-sky-300/90 tracking-wide';
      case 'market': return 'text-emerald-100/80';
      case 'strategy': return 'text-cyan-100/80';
      default: return 'text-foreground/80';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className={`text-base leading-relaxed mb-6 whitespace-pre-wrap ${getTextColor()}`}
    >
      {parseContent(cleanedContent)}
    </motion.div>
  );
}

// ================================
// FOLLOW-UP INPUT COMPONENT
// ================================

interface FollowUpInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  theme?: ResponseTheme;
}

export function FollowUpInput({ onSend, isLoading = false, placeholder = "Ask a follow-up question...", theme = 'athena' }: FollowUpInputProps) {
  const [input, setInput] = useState('');
  const themeConfig = THEME_COLORS[theme];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSend(input.trim());
      setInput('');
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      onSubmit={handleSubmit}
      className={`mt-10 pt-6 border-t ${themeConfig.borderColor}`}
    >
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            disabled={isLoading}
            className={`bg-card/30 border ${themeConfig.borderColor} pr-12 h-12 text-base placeholder:text-muted-foreground/50`}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 w-9 rounded-lg"
            style={{ backgroundColor: themeConfig.primary }}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.form>
  );
}

// ================================
// MARKET DATA STRIP (for MarketMaw)
// ================================

interface MarketDataItem {
  symbol: string;
  price: number;
  change?: number;
  changePercent?: number;
}

interface MarketDataStripProps {
  data: MarketDataItem[];
  timestamp?: string;
  theme?: ResponseTheme;
}

export function MarketDataStrip({ data, timestamp, theme = 'market' }: MarketDataStripProps) {
  const themeConfig = THEME_COLORS[theme];
  
  if (!data || data.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center justify-between p-4 rounded-xl bg-gradient-to-r ${themeConfig.gradient} border ${themeConfig.borderColor} overflow-x-auto mb-6`}
    >
      <div className="flex items-center gap-6 min-w-max">
        {data.map((item) => (
          <div key={item.symbol} className="text-center">
            <span className="text-xs text-muted-foreground block">{item.symbol}</span>
            <span className={`font-mono text-lg ${themeConfig.tickerText}`}>
              {typeof item.price === 'number' && item.price > 0 
                ? item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) 
                : '—'}
            </span>
            {typeof item.changePercent === 'number' && item.changePercent !== 0 && (
              <span className={`text-xs font-mono block ${item.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
              </span>
            )}
          </div>
        ))}
      </div>
      {timestamp && (
        <span className="text-xs text-muted-foreground/50 ml-4">{timestamp}</span>
      )}
    </motion.div>
  );
}

// ================================
// METRICS STRIP COMPONENT
// ================================

interface MetricItem {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
}

interface MetricsStripProps {
  metrics: MetricItem[];
  theme?: ResponseTheme;
}

export function MetricsStrip({ metrics, theme = 'athena' }: MetricsStripProps) {
  const themeConfig = THEME_COLORS[theme];
  
  if (!metrics || metrics.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center justify-between p-4 rounded-xl bg-gradient-to-r ${themeConfig.gradient} border ${themeConfig.borderColor} overflow-x-auto mb-6`}
    >
      <div className="flex items-center gap-8 min-w-max">
        {metrics.map((metric, idx) => (
          <div key={idx} className="text-center">
            <span className="text-xs text-muted-foreground block">{metric.label}</span>
            <span className={`font-mono text-lg ${
              metric.trend === 'up' ? 'text-emerald-400' :
              metric.trend === 'down' ? 'text-rose-400' :
              themeConfig.tickerText
            }`}>
              {metric.value}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ================================
// FULL PREMIUM PROSE PARSER
// ================================

interface PremiumProseParserProps {
  content: string;
  theme?: ResponseTheme;
  chartData?: {
    type: 'pie' | 'bar' | 'line' | 'area';
    data: any[];
    title?: string;
    insertAfterParagraph?: number;
  }[];
  tickerTable?: {
    tickers: TickerData[];
    title?: string;
    insertAfterParagraph?: number;
  };
  comparison?: {
    before: { label: string; value: string | number }[];
    after: { label: string; value: string | number }[];
    insertAfterParagraph?: number;
  };
  marketData?: MarketDataItem[];
  marketTimestamp?: string;
  metrics?: MetricItem[];
  onActionClick?: (action: string) => void;
}

export function PremiumProseParser({
  content,
  theme = 'athena',
  chartData = [],
  tickerTable,
  comparison,
  marketData,
  marketTimestamp,
  metrics,
  onActionClick,
}: PremiumProseParserProps) {
  // Extract NEXT_ACTION tags
  const actionChips: string[] = [];
  let contentWithoutChips = content.replace(/\[NEXT_ACTION:\s*([^\]]+)\]/g, (match, action) => {
    actionChips.push(action.trim());
    return ''; // Remove from text stream
  });

  // Intercept Markdown tables and convert them to InlineTickerTable props dynamically if they exist
  let dynamicTickerTable: { tickers: TickerData[], title: string } | null = null;
  if (/\|.*\|.*\|/.test(contentWithoutChips) && contentWithoutChips.includes('---')) {
    const tableRegex = /(\|.*\|\n\|[-:| ]+\|\n(?:\|.*\|\n?)+)/m;
    const match = contentWithoutChips.match(tableRegex);
    if (match) {
        const lines = match[0].split('\n').filter(l => l.trim().startsWith('|'));
        if (lines.length > 2) {
            const tickers = lines.slice(2).map(line => {
                const cells = line.split('|').map(c => c.trim()).filter(c => c);
                return {
                    symbol: cells[0] || 'AST',
                    price: parseFloat(cells[1]?.replace(/[^0-9.-]+/g,"")) || 0,
                    change: parseFloat(cells[2]?.replace(/[^0-9.-]+/g,"")) || 0,
                    volume: cells[3] || '-',
                    signal: (cells[4]?.toUpperCase().includes('BULL') ? 'BULLISH' : cells[4]?.toUpperCase().includes('BEAR') ? 'BEARISH' : 'NEUTRAL') as any
                };
            });
            dynamicTickerTable = { tickers, title: "Data Snapshot" };
        }
        contentWithoutChips = contentWithoutChips.replace(match[0], '');
    }
  }

  // Clean markdown artifacts
  let cleanContent = contentWithoutChips
    .replace(/```json[\s\S]*?```/g, '')
    .replace(/```chart:[\s\S]*?```/g, '')
    .replace(/```tickers[\s\S]*?```/g, '')
    .replace(/```comparison[\s\S]*?```/g, '')
    .replace(/```metrics[\s\S]*?```/g, '')
    .replace(/###\s*/g, '')
    .replace(/##\s*/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .trim();

  // Split into paragraphs
  const paragraphs = cleanContent.split('\n\n').filter(p => p.trim());

  return (
    <div className="space-y-2 ai-response-prose">
      {/* Metrics Strip (if provided) */}
      {metrics && metrics.length > 0 && (
        <MetricsStrip metrics={metrics} theme={theme} />
      )}

      {/* Market Data Strip (if provided) */}
      {marketData && marketData.length > 0 && (
        <MarketDataStrip data={marketData} timestamp={marketTimestamp} theme={theme} />
      )}

      {/* Render paragraphs with inline visualizations */}
      {paragraphs.map((paragraph, idx) => (
        <Fragment key={idx}>
          <PremiumParagraph content={paragraph} theme={theme} delay={0.05 + idx * 0.03} />
          
          {/* Insert charts after specific paragraphs */}
          {chartData.filter(c => c.insertAfterParagraph === idx).map((chart, chartIdx) => (
            <InlineChart 
              key={`chart-${idx}-${chartIdx}`}
              data={chart.data}
              type={chart.type}
              theme={theme}
              title={chart.title}
            />
          ))}
          
          {/* Insert ticker table */}
          {tickerTable && tickerTable.insertAfterParagraph === idx && (
            <InlineTickerTable 
              tickers={tickerTable.tickers}
              title={tickerTable.title}
              theme={theme}
            />
          )}
          
          {/* Insert comparison */}
          {comparison && comparison.insertAfterParagraph === idx && (
            <InlineComparison 
              before={comparison.before}
              after={comparison.after}
              theme={theme}
            />
          )}
        </Fragment>
      ))}

      {/* Charts without specific insertion point go at the end */}
      {chartData.filter(c => c.insertAfterParagraph === undefined).map((chart, idx) => (
        <InlineChart 
          key={`chart-end-${idx}`}
          data={chart.data}
          type={chart.type}
          theme={theme}
          title={chart.title}
        />
      ))}
      
      {tickerTable && tickerTable.insertAfterParagraph === undefined && (
        <InlineTickerTable 
          tickers={tickerTable.tickers}
          title={tickerTable.title}
          theme={theme}
        />
      )}
      
      {comparison && comparison.insertAfterParagraph === undefined && (
        <InlineComparison 
          before={comparison.before}
          after={comparison.after}
          theme={theme}
        />
      )}

      {/* Dynamic Inline Table Interceptor */}
      {dynamicTickerTable && (
        <InlineTickerTable 
          tickers={dynamicTickerTable.tickers}
          title={dynamicTickerTable.title}
          theme={theme}
        />
      )}

      {/* Render Action Chips at the very bottom */}
      {actionChips.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-border/20"
        >
          {actionChips.map((action, idx) => (
            <button
              key={`action-${idx}`}
              onClick={() => onActionClick && onActionClick(action)}
              className={`px-4 py-2 text-sm rounded-lg font-medium transition-all ${
                theme === 'athena' ? 'bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border border-purple-500/30' :
                theme === 'market' ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30' :
                theme === 'strategy' ? 'bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/30' :
                'bg-primary/10 text-primary hover:bg-primary/20 border border-primary/30'
              }`}
            >
              {action}
            </button>
          ))}
        </motion.div>
      )}
    </div>
  );
}

export { THEME_COLORS };
export default PremiumProseParser;
