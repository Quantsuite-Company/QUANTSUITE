import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, TrendingDown, Sparkles, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer, TerminalBarChart, chartColors } from "@/components/charts";
import { TerminalTable, ColumnDef, ValueCell, BadgeCell } from "@/components/tables";

export default function AlphaSignals() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [ticker, setTicker] = useState("");
  const [universe, setUniverse] = useState("SP500_TOP50");
  const [isCalculating, setIsCalculating] = useState(false);

  const { data: alphaSignals, isLoading: signalsLoading, refetch: refetchSignals } = useQuery({
    queryKey: ["alpha-signals", user?.id, universe],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from("alpha_signals")
        .select("*")
        .eq("user_id", user?.id)
        .eq("date", today)
        .eq("universe", universe)
        .order("zscore", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: alphaMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["alpha-metrics", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alpha_metrics")
        .select("*")
        .eq("user_id", user?.id)
        .order("date", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const isLoading = signalsLoading || metricsLoading;

  const calculateAlphas = async () => {
    if (!user) {
      toast({ title: "Please log in to calculate alphas", variant: "destructive" });
      return;
    }

    setIsCalculating(true);
    try {
      const { data, error } = await supabase.functions.invoke("calculate-alphas", {
        body: { universe, date: new Date().toISOString().split("T")[0] },
      });

      if (error) throw error;

      if (!data || data.signals_calculated === 0) {
        toast({ title: "No signals generated", description: "Try a different universe or later.", variant: "destructive" });
      } else {
        toast({ 
          title: "✓ Alphas calculated successfully", 
          description: `Processed ${data.stocks_processed} stocks, generated ${data.signals_calculated} signals`
        });
      }

      if (alphaSignals && alphaSignals.length > 0) {
        const uniqueAlphas = Array.from(new Set(alphaSignals.map(s => s.alpha_id)));
        console.log(`Computing IC metrics for ${uniqueAlphas.length} alphas...`);
        
        for (const alphaId of uniqueAlphas) {
          try {
            await supabase.functions.invoke("calculate-ic-metrics", {
              body: { alphaId, lookbackDays: 60 }
            });
          } catch (e) {
            console.warn(`IC metrics calculation skipped for ${alphaId} (needs 2+ days of data)`, e);
          }
        }
      }

      refetchSignals();
    } catch (error: any) {
      toast({ 
        title: "Failed to calculate alphas", 
        description: error.message, 
        variant: "destructive" 
      });
    } finally {
      setIsCalculating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const latestMetrics = alphaMetrics?.reduce((acc, metric) => {
    if (!acc[metric.alpha_id] || new Date(metric.date) > new Date(acc[metric.alpha_id].date)) {
      acc[metric.alpha_id] = metric;
    }
    return acc;
  }, {} as Record<string, typeof alphaMetrics[0]>);

  const topSignals = alphaSignals
    ?.filter(s => Math.abs(s.zscore || 0) > 1.5)
    .sort((a, b) => Math.abs(b.zscore || 0) - Math.abs(a.zscore || 0))
    .slice(0, 20) || [];

  // Table columns for all signals
  const signalColumns: ColumnDef<typeof alphaSignals[0]>[] = [
    { 
      key: 'date', 
      header: 'Date', 
      sortable: true,
      render: (val) => new Date(val).toLocaleDateString()
    },
    { 
      key: 'ticker', 
      header: 'Ticker', 
      sortable: true,
      render: (val) => <Badge variant="outline" className="font-mono">{val}</Badge>
    },
    { key: 'alpha_id', header: 'Alpha', sortable: true },
    { 
      key: 'zscore', 
      header: 'Z-Score', 
      sortable: true, 
      align: 'right',
      colorByValue: true,
      render: (val) => <span style={{ color: (val || 0) > 0 ? chartColors.profit : chartColors.loss }}>{(val as number)?.toFixed(2)}</span>
    },
    { 
      key: 'percentile_rank', 
      header: 'Percentile', 
      sortable: true, 
      align: 'right',
      render: (val) => `${val?.toFixed(1)}%`
    },
    { 
      key: 'raw_value', 
      header: 'Raw Value', 
      sortable: true, 
      align: 'right',
      render: (val) => <span className="font-mono text-xs">{val?.toFixed(4)}</span>
    },
  ];

  // Chart data for metrics visualization
  const metricsChartData = latestMetrics ? Object.entries(latestMetrics).map(([alphaId, metric]) => ({
    name: alphaId.replace(/_/g, ' ').slice(0, 15),
    ic: metric.ic || 0,
    icSharpe: metric.ic_sharpe || 0,
  })) : [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Alpha Signals
        </h1>
        <p className="text-muted-foreground mt-2">Quantitative alpha factors and performance analytics</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <ChartContainer title="Calculate Alpha Signals" subtitle="Generate cross-sectional alpha signals for stock universe" height="auto">
          <div className="flex gap-2 p-2">
            <Select value={universe} onValueChange={setUniverse}>
              <SelectTrigger className="w-[200px] bg-background/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SP500_TOP50">S&P 500 Top 50</SelectItem>
                <SelectItem value="TECH">Tech Stocks</SelectItem>
                <SelectItem value="NIFTY50">Nifty 50</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={calculateAlphas} disabled={isCalculating}>
              {isCalculating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Calculating...
                </>
              ) : (
                <>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Calculate Alphas
                </>
              )}
            </Button>
          </div>
        </ChartContainer>
      </motion.div>

      <Tabs defaultValue="signals" className="space-y-4">
        <TabsList>
          <TabsTrigger value="signals">Top Signals</TabsTrigger>
          <TabsTrigger value="metrics">Alpha Performance</TabsTrigger>
          <TabsTrigger value="all">All Signals</TabsTrigger>
        </TabsList>

        <TabsContent value="signals" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Top Signals (|z-score| &gt; 1.5)</h2>
            <Badge variant="outline">{topSignals.length} signals</Badge>
          </div>
          {topSignals.length === 0 ? (
            <ChartContainer title="" height={200}>
              <div className="flex flex-col items-center justify-center h-full">
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Sparkles className="w-10 h-10 text-muted-foreground mb-4" />
                </motion.div>
                <p className="text-muted-foreground">No signals yet. Calculate alphas to get started!</p>
              </div>
            </ChartContainer>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {topSignals.map((signal, index) => {
                const isPositive = (signal.zscore || 0) > 0;
                return (
                  <motion.div
                    key={signal.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.02 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                  >
                    <ChartContainer height="auto" className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-foreground">{signal.ticker}</span>
                        {isPositive ? (
                          <TrendingUp className="w-4 h-4" style={{ color: chartColors.profit }} />
                        ) : (
                          <TrendingDown className="w-4 h-4" style={{ color: chartColors.loss }} />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">
                        {signal.alpha_id} • {new Date(signal.date).toLocaleDateString()}
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Z-Score</span>
                          <Badge variant={isPositive ? "default" : "destructive"}>
                            {signal.zscore?.toFixed(2)}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Percentile</span>
                          <span className="font-medium text-foreground">{signal.percentile_rank?.toFixed(1)}%</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Raw Value</span>
                          <span className="font-mono text-xs text-foreground">{signal.raw_value?.toFixed(4)}</span>
                        </div>
                      </div>
                    </ChartContainer>
                  </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Alpha Performance Metrics</h2>
            <Badge variant="outline">{Object.keys(latestMetrics || {}).length} alphas</Badge>
          </div>
          {!latestMetrics || Object.keys(latestMetrics).length === 0 ? (
            <ChartContainer title="" height={200}>
              <div className="flex flex-col items-center justify-center h-full">
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <BarChart3 className="w-10 h-10 text-muted-foreground mb-4" />
                </motion.div>
                <p className="text-muted-foreground">No metrics yet. Calculate alphas to see performance!</p>
              </div>
            </ChartContainer>
          ) : (
            <div className="space-y-6">
              <TerminalBarChart
                data={metricsChartData}
                bars={[
                  { dataKey: 'ic', name: 'IC', color: chartColors.cyan },
                  { dataKey: 'icSharpe', name: 'IC Sharpe', color: chartColors.profit },
                ]}
                xAxisKey="name"
                title="Alpha IC & IC Sharpe"
                subtitle="Information Coefficient and risk-adjusted IC"
                height={250}
              />
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Object.entries(latestMetrics).map(([alphaId, metric], index) => (
                  <motion.div
                    key={alphaId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.02 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                  >
                    <ChartContainer height="auto" className="p-4">
                      <div className="mb-2">
                        <span className="font-semibold text-foreground capitalize">{alphaId.replace(/_/g, ' ')}</span>
                        <p className="text-xs text-muted-foreground">
                          Updated {new Date(metric.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">IC</span>
                          <span className="font-medium text-foreground">{metric.ic?.toFixed(3)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">IC Sharpe</span>
                          <Badge variant={(metric.ic_sharpe || 0) > 1 ? "default" : "secondary"}>
                            {metric.ic_sharpe?.toFixed(2)}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Half Life</span>
                          <span className="font-medium text-foreground">{metric.half_life_days?.toFixed(0)} days</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Status</span>
                          <Badge variant={metric.is_healthy ? "default" : "destructive"}>
                            {metric.is_healthy ? "Healthy" : "Weak"}
                          </Badge>
                        </div>
                      </div>
                    </ChartContainer>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">All Signals</h2>
            <Badge variant="outline">{alphaSignals?.length || 0} total</Badge>
          </div>
          {!alphaSignals || alphaSignals.length === 0 ? (
            <ChartContainer title="" height={200}>
              <div className="flex flex-col items-center justify-center h-full">
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Sparkles className="w-10 h-10 text-muted-foreground mb-4" />
                </motion.div>
                <p className="text-muted-foreground">No signals yet. Calculate alphas to get started!</p>
              </div>
            </ChartContainer>
          ) : (
            <ChartContainer height="auto">
              <TerminalTable
                data={alphaSignals}
                columns={signalColumns}
                emptyMessage="No signals found"
                pageSize={20}
              />
            </ChartContainer>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
