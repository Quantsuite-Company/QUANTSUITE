import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, ExternalLink, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { InsiderAdvancedFilters } from "@/components/InsiderAdvancedFilters";
import { StockSummaryView } from "@/components/StockSummaryView";
import { InsiderDashboardMetrics } from "@/components/InsiderDashboardMetrics";
import { TerminalTable, ColumnDef } from "@/components/tables";
import { TerminalBarChart, ChartContainer, chartColors } from "@/components/charts";
import { InsiderConvictionGauge } from "@/components/ai/InsiderConvictionGauge";
import { CongressLeaderboard } from "@/components/ai/CongressLeaderboard";
import { GlassCard } from "@/components/ui/glass-card";
import { Separator } from "@/components/ui/separator";
import { Ticket } from "lucide-react";

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

interface CongressTrade {
  member: string;
  party: string;
  chamber: string;
  ticker: string;
  action: string;
  amount: string;
  date: string;
  disclosure_url: string;
}

export default function InsiderStreet() {
  const [query, setQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState({
    type: "all",
    minValue: "",
    maxValue: "",
    dateFrom: "",
    dateTo: ""
  });

  const { data: insiderData, isLoading: insiderLoading, refetch: refetchInsider, error: insiderError } = useQuery({
    queryKey: ["insider-trades"],
    queryFn: async () => {
      console.log("Fetching insider trades...");
      const { data, error } = await supabase.functions.invoke("fetch-insider-trades");
      if (error) {
        console.error("Insider trades error:", error);
        throw error;
      }
      console.log("Insider trades data:", data);
      return data;
    },
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  const { data: congressData, isLoading: congressLoading, refetch: refetchCongress, error: congressError } = useQuery({
    queryKey: ["congress-trades"],
    queryFn: async () => {
      console.log("Fetching congress trades...");
      const { data, error } = await supabase.functions.invoke("fetch-congress-trades");
      if (error) {
        console.error("Congress trades error:", error);
        throw error;
      }
      console.log("Congress trades data:", data);
      return data;
    },
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchInsider(), refetchCongress()]);
      toast.success("Data refreshed from live sources");
    } catch (error) {
      toast.error("Failed to refresh data");
    } finally {
      setRefreshing(false);
    }
  };

  const insiderTrades: InsiderTrade[] = insiderData?.trades || [];
  const congressTrades: CongressTrade[] = congressData?.trades || [];

  const filteredInsider = useMemo(() => {
    return insiderTrades.filter((t) => {
      const matchesQuery = t.ticker.toLowerCase().includes(query.toLowerCase()) ||
                          t.filer.toLowerCase().includes(query.toLowerCase());
      const matchesType = filters.type === "all" || t.type === filters.type;
      const matchesMinValue = !filters.minValue || t.value >= Number(filters.minValue);
      const matchesMaxValue = !filters.maxValue || t.value <= Number(filters.maxValue);
      const matchesDateFrom = !filters.dateFrom || new Date(t.date) >= new Date(filters.dateFrom);
      const matchesDateTo = !filters.dateTo || new Date(t.date) <= new Date(filters.dateTo);
      
      return matchesQuery && matchesType && matchesMinValue && matchesMaxValue && matchesDateFrom && matchesDateTo;
    });
  }, [insiderTrades, query, filters]);

  const filteredCongress = useMemo(() => {
    return congressTrades.filter((t) =>
      t.ticker.toLowerCase().includes(query.toLowerCase()) ||
      t.member.toLowerCase().includes(query.toLowerCase())
    );
  }, [congressTrades, query]);

  const resetFilters = () => {
    setFilters({
      type: "all",
      minValue: "",
      maxValue: "",
      dateFrom: "",
      dateTo: ""
    });
  };

  // Prepare chart data for trends
  const trendsChartData = useMemo(() => {
    const dateMap = new Map<string, { date: string; buyValue: number; sellValue: number }>();
    
    insiderTrades.forEach(trade => {
      const existing = dateMap.get(trade.date) || { date: trade.date, buyValue: 0, sellValue: 0 };
      
      if (trade.type === "Buy") {
        existing.buyValue += trade.value / 1000000; // Convert to millions
      } else if (trade.type === "Sell") {
        existing.sellValue += trade.value / 1000000;
      }
      
      dateMap.set(trade.date, existing);
    });
    
    return Array.from(dateMap.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-20);
  }, [insiderTrades]);

  // Table columns for insider trades
  const insiderColumns: ColumnDef<InsiderTrade>[] = [
    { key: 'filer', header: 'Filer', sortable: true },
    { 
      key: 'ticker', 
      header: 'Ticker', 
      sortable: true,
      render: (_, row) => (
        <Badge variant="outline" className="font-mono">{row.ticker}</Badge>
      )
    },
    { 
      key: 'type', 
      header: 'Type', 
      sortable: true,
      render: (_, row) => (
        <Badge 
          variant={row.type === "Buy" ? "default" : "destructive"}
          className={row.type === "Buy" ? "bg-chart-profit text-white" : ""}
        >
          {row.type}
        </Badge>
      )
    },
    { 
      key: 'shares', 
      header: 'Shares', 
      sortable: true, 
      align: 'right',
      render: (val) => val > 0 ? val.toLocaleString() : "-"
    },
    { 
      key: 'price', 
      header: 'Price', 
      sortable: true, 
      align: 'right',
      render: (val) => val > 0 ? `$${val.toFixed(2)}` : "-"
    },
    { 
      key: 'value', 
      header: 'Value', 
      sortable: true, 
      align: 'right',
      render: (val) => val > 0 ? `$${val.toLocaleString()}` : "-"
    },
    { key: 'date', header: 'Date', sortable: true },
    { 
      key: 'formUrl', 
      header: 'Form',
      render: (_, row) => (
        <a
          href={row.formUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline flex items-center gap-1"
        >
          View <ExternalLink className="w-3 h-3" />
        </a>
      )
    },
  ];

  // Table columns for congress trades
  const congressColumns: ColumnDef<CongressTrade>[] = [
    { key: 'member', header: 'Member', sortable: true },
    { 
      key: 'party', 
      header: 'Party', 
      sortable: true,
      render: (val) => (
        <Badge 
          variant="outline"
          className={val === "Democrat" ? "border-blue-500 text-blue-400" : "border-red-500 text-red-400"}
        >
          {val}
        </Badge>
      )
    },
    { key: 'chamber', header: 'Chamber', sortable: true },
    { 
      key: 'ticker', 
      header: 'Ticker', 
      sortable: true,
      render: (val) => <Badge variant="outline" className="font-mono">{val}</Badge>
    },
    { 
      key: 'action', 
      header: 'Action', 
      sortable: true,
      render: (val) => (
        <Badge variant={val === "Purchase" ? "default" : "secondary"}>
          {val}
        </Badge>
      )
    },
    { key: 'amount', header: 'Amount', sortable: true },
    { key: 'date', header: 'Date', sortable: true },
  ];

  if (insiderLoading || congressLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading insider trading data...</p>
        </div>
      </div>
    );
  }

  if (insiderError || congressError) {
    return (
      <div className="container mx-auto p-6">
        <Card className="bg-card/40 backdrop-blur-xl border-border/30">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <p className="text-destructive">Error loading data. Please try refreshing.</p>
              <Button onClick={handleRefresh}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8 min-h-screen bg-transparent">
      {/* Top Level Desk / Institutional Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="space-y-6"
      >
        <div className="flex items-end justify-between border-b border-border/20 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary font-bold tracking-[0.2em] text-[10px] uppercase">
              <Ticket className="w-3 h-3" /> Live Intelligence Feed
            </div>
            <h1 className="text-5xl font-extrabold font-serif tracking-tight text-foreground">
              Insider Street<span className="text-primary">.</span>
            </h1>
            <p className="text-muted-foreground font-serif italic text-sm">
              "The Secret Holy Grail of Institutional Alpha Tracking"
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Global Synchronization</p>
              <p className="text-xs font-mono text-primary">{new Date().toUTCString().split(' ')[4]} UTC</p>
            </div>
            <Button 
              onClick={handleRefresh} 
              disabled={refreshing} 
              variant="outline"
              className="border-primary/20 hover:bg-primary/5 font-bold uppercase text-[10px] tracking-widest h-10 px-6 rounded-none border-2"
            >
              <RefreshCw className={`w-3 h-3 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Sync Terminals
            </Button>
          </div>
        </div>

        {/* Live Disclosure Ticker Tape */}
        <div className="w-full bg-muted/10 border-y border-border/10 py-2 overflow-hidden relative group">
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent z-10" />
          
          <motion.div 
            className="flex whitespace-nowrap gap-8"
            animate={{ x: [0, -2000] }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          >
            {[...insiderTrades, ...insiderTrades].slice(0, 20).map((t, i) => (
              <div key={i} className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-[10px] bg-background/50">{t.ticker}</Badge>
                <span className={`text-[10px] font-bold ${t.type === 'Buy' ? 'text-chart-profit' : 'text-chart-loss'}`}>
                  {t.type === 'Buy' ? '▲' : '▼'} {t.type}
                </span>
                <span className="text-[10px] text-muted-foreground font-serif">${(t.value / 1000).toFixed(0)}k</span>
                <Separator orientation="vertical" className="h-3 mx-2 bg-border/30" />
              </div>
            ))}
          </motion.div>
        </div>

        {/* The "Desk" - Grid of high-impact visuals */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <InsiderConvictionGauge trades={insiderTrades} />
          </div>
          <div className="lg:col-span-2">
            <CongressLeaderboard trades={congressTrades} />
          </div>
        </div>
      </motion.div>

      <Tabs defaultValue="openinsider" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-muted/10 border-border/20 p-1">
          <TabsTrigger value="openinsider" className="font-bold tracking-tight py-2">SEC Form 4</TabsTrigger>
          <TabsTrigger value="quiver" className="font-bold tracking-tight py-2">Congress Disclosures</TabsTrigger>
          <TabsTrigger value="trends" className="font-bold tracking-tight py-2">Historical Trends</TabsTrigger>
          <TabsTrigger value="summary" className="font-bold tracking-tight py-2">Asset Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="openinsider" className="space-y-4">
          <InsiderAdvancedFilters 
            filters={filters}
            onFilterChange={setFilters}
            onReset={resetFilters}
          />
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
          >
            <ChartContainer 
              title="Insider Filings (SEC Form 4)"
              subtitle={`Latest Form 4 transactions from SEC EDGAR • Updated: ${insiderData?.lastUpdated ? new Date(insiderData.lastUpdated).toLocaleString() : "N/A"}`}
              height="auto"
            >
              <div className="space-y-4">
                <Input
                  placeholder="Filter by ticker or filer..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="max-w-md bg-background/50"
                />
                <TerminalTable
                  data={filteredInsider.slice(0, 50)}
                  columns={insiderColumns}
                  emptyMessage="No insider trades found"
                  pageSize={15}
                />
              </div>
            </ChartContainer>
          </motion.div>
        </TabsContent>

        <TabsContent value="quiver" className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
          >
            <ChartContainer 
              title="Congress Trades"
              subtitle={`Recent trades from House & Senate members • Source: ${congressData?.source || "N/A"}`}
              height="auto"
            >
              <div className="space-y-4">
                <Input
                  placeholder="Filter by ticker or member..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="max-w-md bg-background/50"
                />
                <TerminalTable
                  data={filteredCongress}
                  columns={congressColumns}
                  emptyMessage="No congress trades found"
                  pageSize={15}
                />
              </div>
            </ChartContainer>
          </motion.div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
          >
            <TerminalBarChart
              data={trendsChartData}
              bars={[
                { dataKey: 'buyValue', name: 'Buy Volume ($M)', color: chartColors.profit },
                { dataKey: 'sellValue', name: 'Sell Volume ($M)', color: chartColors.loss },
              ]}
              xAxisKey="date"
              title="Insider Transaction Volume"
              subtitle="Daily buy vs sell volume in millions"
              height={350}
              yAxisFormatter={(val) => `$${val.toFixed(1)}M`}
            />
          </motion.div>
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
          >
            <StockSummaryView trades={insiderTrades} />
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
