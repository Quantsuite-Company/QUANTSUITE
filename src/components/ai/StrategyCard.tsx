import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, AlertTriangle, Target, DollarSign, TrendingDown, Activity, Clock, Award, PieChartIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface StrategyCardProps {
  strategy: string;
  portfolioContext?: {
    totalPositions: number;
    topHoldings: string;
    totalValue: number;
    strongSignalCount: number;
    portfolioName?: string;
    allPositions?: Array<{ symbol: string; quantity: number; value: number }>;
    relevantAlphaSignals?: Array<{ ticker: string; alpha_id: string; zscore: number }>;
    sectorBreakdown?: Record<string, number>;
  };
}

interface ParsedMetrics {
  expectedReturn?: number;
  riskLevel?: string;
  timeHorizon?: string;
  positionSize?: number;
  winRate?: number;
}

const StrategyCard = ({ strategy, portfolioContext }: StrategyCardProps) => {
  // Parse strategy sections
  const sections = strategy.split('###').filter(s => s.trim());
  
  // Extract metrics from Key Metrics section
  const parseMetrics = (): ParsedMetrics => {
    const metricsSection = sections.find(s => s.toLowerCase().includes('key metrics'));
    if (!metricsSection) return {};
    
    const metrics: ParsedMetrics = {};
    const lines = metricsSection.split('\n');
    
    lines.forEach(line => {
      if (line.includes('Expected Return:')) {
        const match = line.match(/(\d+(?:\.\d+)?)\%/);
        if (match) metrics.expectedReturn = parseFloat(match[1]);
      }
      if (line.includes('Risk Level:')) {
        const match = line.match(/Risk Level:\s*(\w+)/i);
        if (match) metrics.riskLevel = match[1];
      }
      if (line.includes('Time Horizon:')) {
        const match = line.match(/Time Horizon:\s*(.+)/i);
        if (match) metrics.timeHorizon = match[1].trim();
      }
      if (line.includes('Position Size:')) {
        const match = line.match(/(\d+(?:\.\d+)?)\%/);
        if (match) metrics.positionSize = parseFloat(match[1]);
      }
      if (line.includes('Win Rate:')) {
        const match = line.match(/(\d+(?:\.\d+)?)\%/);
        if (match) metrics.winRate = parseFloat(match[1]);
      }
    });
    
    return metrics;
  };

  const metrics = parseMetrics();

  // Risk level color mapping
  const getRiskColor = (level?: string) => {
    if (!level) return 'hsl(var(--muted))';
    const l = level.toLowerCase();
    if (l === 'low') return 'hsl(142 76% 36%)';
    if (l === 'medium') return 'hsl(48 96% 53%)';
    if (l === 'high') return 'hsl(0 84% 60%)';
    return 'hsl(var(--muted))';
  };

  // Prepare chart data for AI metrics (theoretical)
  const aiMetricsChartData = [
    { name: 'Expected Return', value: metrics.expectedReturn || 0, color: 'hsl(142 76% 36%)' },
    { name: 'Risk Score', value: metrics.riskLevel === 'Low' ? 30 : metrics.riskLevel === 'Medium' ? 60 : 90, color: getRiskColor(metrics.riskLevel) },
    { name: 'Win Rate', value: metrics.winRate || 0, color: 'hsl(217 91% 60%)' }
  ];

  const riskAllocationData = [
    { name: 'Allocated', value: metrics.positionSize || 0 },
    { name: 'Available', value: 100 - (metrics.positionSize || 0) }
  ];

  const COLORS = ['hsl(217 91% 60%)', 'hsl(var(--muted))'];
  const SECTOR_COLORS = ['hsl(217 91% 60%)', 'hsl(142 76% 36%)', 'hsl(48 96% 53%)', 'hsl(280 91% 60%)', 'hsl(0 84% 60%)'];

  // Real portfolio allocation data (pie chart)
  const portfolioAllocationData = portfolioContext?.allPositions
    ?.sort((a, b) => b.value - a.value)
    .slice(0, 10)
    .map(pos => ({
      name: pos.symbol,
      value: pos.value
    })) || [];

  // Top holdings bar chart data
  const topHoldingsChartData = portfolioContext?.allPositions
    ?.sort((a, b) => b.value - a.value)
    .slice(0, 5)
    .map(pos => ({
      name: pos.symbol,
      value: pos.value,
      quantity: pos.quantity
    })) || [];

  // Alpha signals chart data
  const alphaSignalsChartData = portfolioContext?.relevantAlphaSignals
    ?.filter(s => Math.abs(s.zscore) > 1.0)
    .slice(0, 10)
    .map(s => ({
      name: s.ticker,
      zscore: s.zscore,
      color: s.zscore > 0 ? 'hsl(142 76% 36%)' : 'hsl(0 84% 60%)'
    })) || [];

  // Sector breakdown pie chart
  const sectorBreakdownData = portfolioContext?.sectorBreakdown
    ? Object.entries(portfolioContext.sectorBreakdown).map(([sector, value]) => ({
        name: sector,
        value: value
      }))
    : [];

  // Parse implementation steps
  const getImplementationSteps = () => {
    const implSection = sections.find(s => s.toLowerCase().includes('implementation'));
    if (!implSection) return [];
    
    const lines = implSection.split('\n').filter(l => l.trim().match(/^\d+\./));
    return lines.map(line => line.replace(/^\d+\.\s*/, '').trim());
  };

  // Parse risks
  const getRisks = () => {
    const riskSection = sections.find(s => s.toLowerCase().includes('risk analysis'));
    if (!riskSection) return [];
    
    const lines = riskSection.split('\n').filter(l => l.trim().startsWith('-'));
    return lines.map(line => line.replace(/^-\s*/, '').trim());
  };

  const implementationSteps = getImplementationSteps();
  const risks = getRisks();

  // Get strategy overview
  const getOverview = () => {
    const overviewSection = sections.find(s => s.toLowerCase().includes('strategy overview') || s.toLowerCase().includes('overview'));
    if (!overviewSection) return '';
    return overviewSection.replace(/strategy overview/i, '').trim();
  };

  const overview = getOverview();

  // Check if user has no portfolio
  const hasNoPortfolio = portfolioContext?.totalPositions === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* No Portfolio Warning */}
      {hasNoPortfolio && (
        <Card className="glass-card border-destructive/40 bg-destructive/10">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              No Portfolio Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground mb-4">
              You don't have any portfolio positions set up yet. The strategy below is general advice and not tailored to your specific holdings.
            </p>
            <a href="/portfolio-builder">
              <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-lg font-semibold transition-colors">
                Create Your Portfolio Now
              </button>
            </a>
          </CardContent>
        </Card>
      )}

      {/* Portfolio Context Summary */}
      {portfolioContext && !hasNoPortfolio && (
        <Card className="glass-card border-border/40">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              {portfolioContext.portfolioName ? `${portfolioContext.portfolioName} - Portfolio Snapshot` : 'Your Portfolio Snapshot'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg border border-border/30">
                <Target className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Positions</p>
                  <p className="text-2xl font-bold text-foreground">{portfolioContext.totalPositions}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg border border-border/30">
                <DollarSign className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Portfolio Value</p>
                  <p className="text-2xl font-bold text-foreground">
                    ${portfolioContext.totalValue.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg border border-border/30">
                <AlertTriangle className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Strong Signals</p>
                  <p className="text-2xl font-bold text-foreground">{portfolioContext.strongSignalCount}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Real Portfolio Data Charts */}
      {portfolioContext && !hasNoPortfolio && (portfolioAllocationData.length > 0 || topHoldingsChartData.length > 0) && (
        <Card className="glass-card border-border/40">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-primary" />
              Real Portfolio Analysis
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Your actual holdings, allocation, and alpha signals
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Portfolio Allocation Pie Chart */}
              {portfolioAllocationData.length > 0 && (
                <Card className="bg-muted/30 border-border/30">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-foreground">Portfolio Allocation (Top 10)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={portfolioAllocationData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {portfolioAllocationData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={SECTOR_COLORS[index % SECTOR_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any) => `$${value.toLocaleString()}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Top Holdings Bar Chart */}
              {topHoldingsChartData.length > 0 && (
                <Card className="bg-muted/30 border-border/30">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-foreground">Top 5 Holdings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={topHoldingsChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" stroke="hsl(var(--foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--foreground))" fontSize={12} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--background))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                          formatter={(value: any) => `$${value.toLocaleString()}`}
                        />
                        <Bar dataKey="value" fill="hsl(217 91% 60%)" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Alpha Signals Chart */}
            {alphaSignalsChartData.length > 0 && (
              <Card className="bg-muted/30 border-border/30">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-foreground">Alpha Signals (Your Holdings)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={alphaSignalsChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--foreground))" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="zscore" radius={[8, 8, 0, 0]}>
                        {alphaSignalsChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Sector Breakdown */}
            {sectorBreakdownData.length > 0 && (
              <Card className="bg-muted/30 border-border/30">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-foreground">Sector Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={sectorBreakdownData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {sectorBreakdownData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={SECTOR_COLORS[index % SECTOR_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => `$${value.toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main Strategy Card */}
      <Card className="glass-card border-border/40">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-foreground flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-primary" />
                AI Strategy Recommendation
              </CardTitle>
              <CardDescription className="text-muted-foreground mt-2">
                Institutional-grade analysis {!hasNoPortfolio && 'based on your portfolio'}
              </CardDescription>
            </div>
            {metrics.riskLevel && (
              <Badge 
                variant="outline" 
                className="border-2"
                style={{ borderColor: getRiskColor(metrics.riskLevel), color: getRiskColor(metrics.riskLevel) }}
              >
                {metrics.riskLevel} Risk
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Strategy Overview */}
          {overview && (
            <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
              <h3 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Strategy Overview
              </h3>
              <p className="text-foreground leading-relaxed">{overview}</p>
            </div>
          )}

          {/* AI Strategy Metrics Visualization */}
          {(metrics.expectedReturn || metrics.winRate) && (
            <div>
              <h3 className="text-lg font-bold text-foreground mb-4">AI Strategy Metrics (Theoretical)</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bar Chart for AI Metrics */}
                <Card className="bg-muted/30 border-border/30">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-foreground">Expected Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={aiMetricsChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" stroke="hsl(var(--foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--foreground))" fontSize={12} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--background))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                          {aiMetricsChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Pie Chart for Position Allocation */}
                {metrics.positionSize && (
                  <Card className="bg-muted/30 border-border/30">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-foreground">Suggested Position Size</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={riskAllocationData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, value }) => `${name}: ${value}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {riskAllocationData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {metrics.expectedReturn !== undefined && (
              <Card className="bg-muted/30 border-border/30">
                <CardContent className="pt-6 text-center">
                  <TrendingUp className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Expected Return</p>
                  <p className="text-2xl font-bold text-foreground">{metrics.expectedReturn}%</p>
                </CardContent>
              </Card>
            )}
            {metrics.riskLevel && (
              <Card className="bg-muted/30 border-border/30">
                <CardContent className="pt-6 text-center">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2" style={{ color: getRiskColor(metrics.riskLevel) }} />
                  <p className="text-sm text-muted-foreground">Risk Level</p>
                  <p className="text-2xl font-bold text-foreground">{metrics.riskLevel}</p>
                </CardContent>
              </Card>
            )}
            {metrics.timeHorizon && (
              <Card className="bg-muted/30 border-border/30">
                <CardContent className="pt-6 text-center">
                  <Clock className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Time Horizon</p>
                  <p className="text-xl font-bold text-foreground">{metrics.timeHorizon}</p>
                </CardContent>
              </Card>
            )}
            {metrics.winRate !== undefined && (
              <Card className="bg-muted/30 border-border/30">
                <CardContent className="pt-6 text-center">
                  <Award className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Win Rate</p>
                  <p className="text-2xl font-bold text-foreground">{metrics.winRate}%</p>
                  <Progress value={metrics.winRate} className="mt-2" />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Implementation Steps */}
          {implementationSteps.length > 0 && (
            <Card className="bg-muted/30 border-border/30">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Implementation Steps
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {implementationSteps.map((step, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-start gap-3 p-3 bg-background/50 rounded-lg border border-border/20"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                        {idx + 1}
                      </div>
                      <p className="text-foreground leading-relaxed pt-1">{step}</p>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Risk Analysis */}
          {risks.length > 0 && (
            <Card className="bg-muted/30 border-border/30">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-destructive" />
                  Risk Considerations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {risks.map((risk, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-start gap-3 p-3 bg-destructive/10 rounded-lg border border-destructive/20"
                    >
                      <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                      <p className="text-foreground leading-relaxed">{risk}</p>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Disclaimer */}
          <div className="p-4 bg-muted/20 rounded-lg border border-border/30">
            <p className="text-sm text-muted-foreground">
              <AlertTriangle className="inline h-4 w-4 mr-2 text-yellow-500" />
              <strong>Disclaimer:</strong> This is not financial advice. AI-generated strategies should be validated
              against your own research and risk tolerance. Past performance does not guarantee future results.
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default StrategyCard;