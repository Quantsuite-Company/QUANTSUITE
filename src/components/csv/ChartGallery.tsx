import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import { Position, UnifiedPosition } from '@/lib/csvParser';
import { EquityVsOptions } from '@/lib/portfolioCalculator';
import { TrendingUp, TrendingDown, PieChart as PieChartIcon, BarChart3 } from 'lucide-react';

interface ChartGalleryProps {
  positions: Position[] | UnifiedPosition[];
  equityVsOptions: EquityVsOptions;
  currency?: '₹' | '$';
  isPortfolioBuilder?: boolean;
}

export function ChartGallery({ positions, equityVsOptions, currency = '₹', isPortfolioBuilder = false }: ChartGalleryProps) {
  const formatCurrency = (value: number) => {
    if (currency === '$') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    } else {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    }
  };

  const formatCompact = (value: number) => {
    const symbol = currency;
    if (currency === '$') {
      if (Math.abs(value) >= 1000000) return `${symbol}${(value / 1000000).toFixed(2)}M`;
      if (Math.abs(value) >= 1000) return `${symbol}${(value / 1000).toFixed(1)}K`;
      return `${symbol}${value.toFixed(0)}`;
    } else {
      if (Math.abs(value) >= 10000000) return `${symbol}${(value / 10000000).toFixed(2)}Cr`;
      if (Math.abs(value) >= 100000) return `${symbol}${(value / 100000).toFixed(2)}L`;
      if (Math.abs(value) >= 1000) return `${symbol}${(value / 1000).toFixed(1)}K`;
      return `${symbol}${value.toFixed(0)}`;
    }
  };

  // P&L by position - use symbol for unified format
  // For Portfolio Builder, show position VALUE instead of P&L (no market prices without API)
  const pnlData = positions
    .sort((a, b) => {
      // Sort by P&L for CSV, by value for Portfolio Builder
      return isPortfolioBuilder ? (b.value - a.value) : (b.pnl - a.pnl);
    })
    .slice(0, 10)
    .map(p => {
      const name = 'symbol' in p ? p.symbol : p.instrument;
      return {
        name: name.length > 15 ? name.substring(0, 12) + '...' : name,
        // Use value for Portfolio Builder, pnl for CSV
        pnl: isPortfolioBuilder ? p.value : p.pnl,
        fill: (isPortfolioBuilder ? p.value : p.pnl) >= 0 ? '#10b981' : '#ef4444'
      };
    });

  // Equity vs Options
  const totalCapital = equityVsOptions.equity.capital + equityVsOptions.options.capital;
  const equityVsOptionsData = [
    { 
      name: 'Equity', 
      value: equityVsOptions.equity.capital, 
      fill: '#3b82f6',
      percentage: ((equityVsOptions.equity.capital / totalCapital) * 100).toFixed(1)
    },
    { 
      name: 'Options', 
      value: equityVsOptions.options.capital, 
      fill: '#a855f7',
      percentage: ((equityVsOptions.options.capital / totalCapital) * 100).toFixed(1)
    }
  ];

  // Winners vs Losers count
  const winnersCount = positions.filter(p => p.pnl > 0).length;
  const losersCount = positions.filter(p => p.pnl < 0).length;
  const totalCount = winnersCount + losersCount;
  
  const winnersLosersData = [
    { 
      name: 'Winners', 
      count: winnersCount,
      fill: '#10b981',
      percentage: ((winnersCount / totalCount) * 100).toFixed(1)
    },
    { 
      name: 'Losers', 
      count: losersCount,
      fill: '#ef4444',
      percentage: ((losersCount / totalCount) * 100).toFixed(1)
    }
  ];

  // Position Size Distribution - use symbol for unified format
  const positionSizeData = positions
    .map(p => {
      const name = 'symbol' in p ? p.symbol : p.instrument;
      return {
        name: name.length > 12 ? name.substring(0, 10) + '...' : name,
        capital: p.quantity * p.avgPrice
      };
    })
    .sort((a, b) => b.capital - a.capital)
    .slice(0, 10);

  const CustomLabel = (props: any) => {
    const { x, y, width, height, value } = props;
    const radius = 10;
    return (
      <g>
        <text 
          x={x + width / 2} 
          y={y - radius} 
          fill="#fff" 
          textAnchor="middle" 
          fontSize={11}
          fontWeight="600"
        >
          {formatCompact(value)}
        </text>
      </g>
    );
  };

  const renderCustomPieLabel = (entry: any) => {
    return `${entry.name}: ${entry.percentage}%`;
  };

  return (
    <div className="space-y-6" data-pdf-section="charts">
      <div className="flex items-center gap-3">
        <BarChart3 className="h-8 w-8 text-primary" />
        <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          Visual Analysis
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* P&L by Position */}
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
              <CardTitle className="text-white">
                {isPortfolioBuilder ? 'Position Value (Top 10)' : 'P&L by Position (Top 10)'}
              </CardTitle>
            </div>
            <CardDescription className="text-slate-400">
              {isPortfolioBuilder 
                ? 'Position values at entry price (no real-time P&L without market data)' 
                : 'Performance breakdown of your best and worst positions'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={pnlData} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={80} 
                  fontSize={11}
                  stroke="#94a3b8"
                />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Bar dataKey="pnl" radius={[8, 8, 0, 0]}>
                  <LabelList content={<CustomLabel />} position="top" />
                  {pnlData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Capital Allocation */}
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
          <CardHeader>
            <div className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-blue-400" />
              <CardTitle className="text-white">Capital Allocation</CardTitle>
            </div>
            <CardDescription className="text-slate-400">
              Distribution of capital between equity and options
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={equityVsOptionsData}
                  cx="50%"
                  cy="50%"
                  labelLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
                  label={renderCustomPieLabel}
                  outerRadius={110}
                  dataKey="value"
                  stroke="#1e293b"
                  strokeWidth={2}
                >
                  {equityVsOptionsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ color: '#94a3b8' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Winners vs Losers */}
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-rose-400" />
              <CardTitle className="text-white">Winners vs Losers</CardTitle>
            </div>
            <CardDescription className="text-slate-400">
              Ratio of profitable to unprofitable trades
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={winnersLosersData}
                  cx="50%"
                  cy="50%"
                  labelLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
                  label={renderCustomPieLabel}
                  outerRadius={110}
                  dataKey="count"
                  stroke="#1e293b"
                  strokeWidth={2}
                >
                  {winnersLosersData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ color: '#94a3b8' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Position Size Distribution */}
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-400" />
              <CardTitle className="text-white">Position Size Distribution</CardTitle>
            </div>
            <CardDescription className="text-slate-400">
              Capital deployed across top 10 positions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={positionSizeData} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorCapital" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.9}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.6}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={80} 
                  fontSize={11}
                  stroke="#94a3b8"
                />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Bar dataKey="capital" fill="url(#colorCapital)" radius={[8, 8, 0, 0]}>
                  <LabelList content={<CustomLabel />} position="top" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
