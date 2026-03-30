import { useState, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Send, Sparkles, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, Tooltip,
  LineChart, Line, AreaChart, Area
} from 'recharts';

// ================================
// INLINE CHART COMPONENTS
// ================================

interface InlineChartProps {
  data: any[];
  type: 'pie' | 'bar' | 'line' | 'area';
  height?: number;
  colors?: string[];
  dataKey?: string;
  nameKey?: string;
}

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(198 93% 60%)',
  'hsl(152 69% 45%)',
  'hsl(280 60% 55%)',
  'hsl(45 93% 55%)',
  'hsl(0 84% 60%)',
];

export function InlineChart({ data, type, height = 180, colors = CHART_COLORS, dataKey = 'value', nameKey = 'name' }: InlineChartProps) {
  const chartTooltipStyle = {
    backgroundColor: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '8px',
    fontSize: '12px',
  };

  if (type === 'pie') {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="my-6 mx-auto max-w-sm"
      >
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={data}
              dataKey={dataKey}
              nameKey={nameKey}
              cx="50%"
              cy="50%"
              outerRadius={70}
              innerRadius={35}
              paddingAngle={2}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              labelLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 }}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={chartTooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
      </motion.div>
    );
  }

  if (type === 'bar') {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="my-6"
      >
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <XAxis dataKey={nameKey} stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={chartTooltipStyle} />
            <Bar dataKey={dataKey} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    );
  }

  if (type === 'line') {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="my-6"
      >
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <XAxis dataKey={nameKey} stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={chartTooltipStyle} />
            <Line type="monotone" dataKey={dataKey} stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>
    );
  }

  // Area chart
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="my-6"
    >
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey={nameKey} stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={chartTooltipStyle} />
          <Area type="monotone" dataKey={dataKey} stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#colorGradient)" />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

// ================================
// INLINE TICKER TABLE (Bloomberg-style)
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
}

export function InlineTickerTable({ tickers, title, showAction = false, currency = '$' }: InlineTickerTableProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="my-6 overflow-hidden rounded-lg border border-border/30"
    >
      {title && (
        <div className="px-4 py-2 bg-muted/20 border-b border-border/30">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</span>
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
              <span className="font-mono font-bold text-foreground">{ticker.symbol}</span>
              {ticker.name && <span className="text-sm text-muted-foreground">{ticker.name}</span>}
            </div>
            <div className="flex items-center gap-4">
              {ticker.weight !== undefined && (
                <span className="text-sm text-muted-foreground">{(ticker.weight * 100).toFixed(1)}%</span>
              )}
              {ticker.price !== undefined && (
                <span className="font-mono text-sm text-foreground">{currency}{ticker.price.toFixed(2)}</span>
              )}
              {ticker.change !== undefined && (
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
// INLINE METRIC HIGHLIGHT
// ================================

interface InlineMetricProps {
  label: string;
  value: string | number;
  subtext?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export function InlineMetric({ label, value, subtext, trend }: InlineMetricProps) {
  return (
    <span className="inline-flex items-baseline gap-1.5 mx-1">
      <span className="text-muted-foreground">{label}:</span>
      <span className={`font-semibold font-mono ${
        trend === 'up' ? 'text-emerald-400' : 
        trend === 'down' ? 'text-rose-400' : 
        'text-foreground'
      }`}>
        {value}
      </span>
      {subtext && <span className="text-xs text-muted-foreground">({subtext})</span>}
    </span>
  );
}

// ================================
// COMPARISON BEFORE/AFTER
// ================================

interface ComparisonProps {
  before: { label: string; value: string | number }[];
  after: { label: string; value: string | number }[];
}

export function InlineComparison({ before, after }: ComparisonProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="my-6 grid grid-cols-2 gap-4"
    >
      <div className="p-4 rounded-lg bg-rose-500/5 border border-rose-500/20">
        <div className="text-xs font-medium text-rose-400 uppercase tracking-wider mb-3">Before</div>
        <div className="space-y-2">
          {before.map((item, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{item.label}</span>
              <span className="font-mono text-foreground">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
        <div className="text-xs font-medium text-emerald-400 uppercase tracking-wider mb-3">After</div>
        <div className="space-y-2">
          {after.map((item, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{item.label}</span>
              <span className="font-mono text-emerald-400">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ================================
// PROSE PARAGRAPH WITH HIGHLIGHT
// ================================

interface ProseParagraphProps {
  children: ReactNode;
  highlight?: boolean;
  delay?: number;
}

export function ProseParagraph({ children, highlight = false, delay = 0 }: ProseParagraphProps) {
  return (
    <motion.p
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className={`text-base leading-relaxed mb-4 ${
        highlight 
          ? 'text-foreground font-medium pl-4 border-l-2 border-primary/50' 
          : 'text-foreground/85'
      }`}
    >
      {children}
    </motion.p>
  );
}

// ================================
// FOLLOW-UP INPUT COMPONENT
// ================================

interface FollowUpInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  placeholder?: string;
}

export function FollowUpInput({ onSend, isLoading = false, placeholder = "Ask a follow-up question..." }: FollowUpInputProps) {
  const [input, setInput] = useState('');

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
      className="mt-8 pt-6 border-t border-border/30"
    >
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            disabled={isLoading}
            className="bg-card/30 border-border/30 pr-12 h-12 text-base placeholder:text-muted-foreground/50"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 w-9 rounded-lg bg-primary hover:bg-primary/90"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.form>
  );
}

// ================================
// PROSE RESPONSE CONTAINER
// ================================

interface ProseResponseProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  badge?: string;
  onFollowUp?: (message: string) => void;
  isLoading?: boolean;
  theme?: 'athena' | 'market' | 'strategy' | 'quant';
}

const themeGradients = {
  athena: 'from-violet-500/10 via-purple-500/5 to-fuchsia-500/10',
  market: 'from-teal-500/10 via-emerald-500/5 to-green-500/10',
  strategy: 'from-cyan-500/10 via-blue-500/5 to-indigo-500/10',
  quant: 'from-amber-500/10 via-orange-500/5 to-yellow-500/10',
};

export function ProseResponse({ 
  children, 
  title, 
  subtitle, 
  badge,
  onFollowUp, 
  isLoading = false,
  theme = 'athena'
}: ProseResponseProps) {
  return (
    <div className="relative min-h-screen bg-background">
      {/* Subtle background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${themeGradients[theme]} opacity-50 pointer-events-none`} />
      
      <div className="relative z-10 max-w-3xl mx-auto px-6 py-8">
        {/* Header */}
        {(title || subtitle || badge) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            {badge && (
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">{badge}</span>
              </div>
            )}
            {title && (
              <h1 className="text-2xl font-semibold text-foreground mb-2">{title}</h1>
            )}
            {subtitle && (
              <p className="text-muted-foreground">{subtitle}</p>
            )}
          </motion.div>
        )}

        {/* Main prose content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="prose-response"
        >
          {children}
        </motion.div>

        {/* Follow-up input */}
        {onFollowUp && (
          <FollowUpInput 
            onSend={onFollowUp} 
            isLoading={isLoading} 
            placeholder={
              theme === 'athena' ? "Ask about your portfolio, risk, or optimization..." :
              theme === 'market' ? "Ask about market trends, sectors, or sentiment..." :
              theme === 'strategy' ? "Ask about strategy refinement or execution..." :
              "Continue the analysis..."
            }
          />
        )}

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12 pt-6 border-t border-border/20 flex items-center justify-center gap-2 text-xs text-muted-foreground/50"
        >
          <Sparkles className="w-3 h-3" />
          <span>QuantSuite Intelligence</span>
        </motion.div>
      </div>
    </div>
  );
}

export default ProseResponse;
