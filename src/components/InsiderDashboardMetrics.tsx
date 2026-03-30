import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Activity, Users, Target } from "lucide-react";

interface InsiderTrade {
  filer: string;
  ticker: string;
  type: string;
  shares: number;
  price: number;
  value: number;
  date: string;
  formUrl: string;
}

interface InsiderDashboardMetricsProps {
  trades: InsiderTrade[];
}

export function InsiderDashboardMetrics({ trades }: InsiderDashboardMetricsProps) {
  const metrics = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    
    // Total trades today
    const tradesToday = trades.filter(t => t.date === today).length;
    
    // Biggest movers (top 3 by value)
    const biggestMovers = [...trades]
      .sort((a, b) => b.value - a.value)
      .slice(0, 3)
      .map(t => ({
        ticker: t.ticker,
        value: t.value,
        type: t.type
      }));
    
    // Most active insiders (top 3 by trade count)
    const insiderCounts = trades.reduce((acc, t) => {
      acc[t.filer] = (acc[t.filer] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const mostActiveInsiders = Object.entries(insiderCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([name, count]) => ({ name, count }));
    
    // Top trending tickers (top 5 by frequency)
    const tickerCounts = trades.reduce((acc, t) => {
      acc[t.ticker] = (acc[t.ticker] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topTickers = Object.entries(tickerCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([ticker, count]) => ({ ticker, count }));
    
    return {
      tradesToday,
      biggestMovers,
      mostActiveInsiders,
      topTickers
    };
  }, [trades]);

  const formatValue = (value: number) => {
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      {/* Total Trades Today */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Trades Today</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.tradesToday}</div>
          <p className="text-xs text-muted-foreground">
            Filed {new Date().toLocaleDateString()}
          </p>
        </CardContent>
      </Card>

      {/* Biggest Movers */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Biggest Movers</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {metrics.biggestMovers.map((mover, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="font-medium">{mover.ticker}</span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{formatValue(mover.value)}</span>
                  <Badge variant={mover.type === "Buy" ? "default" : "destructive"} className="text-xs">
                    {mover.type}
                  </Badge>
                </div>
              </div>
            ))}
            {metrics.biggestMovers.length === 0 && (
              <p className="text-xs text-muted-foreground">No data available</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Most Active Insiders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Most Active</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {metrics.mostActiveInsiders.map((insider, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="font-medium truncate max-w-[140px]" title={insider.name}>
                  {insider.name.split(" at ")[0]}
                </span>
                <Badge variant="outline" className="text-xs">
                  {insider.count} trades
                </Badge>
              </div>
            ))}
            {metrics.mostActiveInsiders.length === 0 && (
              <p className="text-xs text-muted-foreground">No data available</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Top Trending Tickers */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Trending Tickers</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {metrics.topTickers.map((ticker, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {ticker.ticker} ({ticker.count})
              </Badge>
            ))}
            {metrics.topTickers.length === 0 && (
              <p className="text-xs text-muted-foreground">No data available</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
