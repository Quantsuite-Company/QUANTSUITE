import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, ExternalLink, TrendingUp } from "lucide-react";
import { toast } from "sonner";
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

  // Table columns obsolete and removed

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
    <div className="container mx-auto p-6 space-y-6 max-w-screen-xl overflow-x-hidden">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 pb-4 border-b border-border/20">
          <div>
            <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wide mb-1">
              <Ticket className="w-4 h-4" /> Live Intelligence Feed
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Insider Street<span className="text-primary">.</span>
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Institutional Alpha Tracking — SEC Form 4 & Congressional Disclosures
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground font-mono">{new Date().toUTCString().split(' ')[4]} UTC</span>
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`w-3 h-3 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Ticker Tape — contained with overflow-hidden */}
      <div className="w-full bg-muted/5 border border-border/10 rounded-lg py-2 overflow-hidden relative">
        <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-background to-transparent z-10" />
        <motion.div
          className="flex gap-8 whitespace-nowrap"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        >
          {[...insiderTrades, ...insiderTrades].slice(0, 30).map((t, i) => (
            <span key={i} className="inline-flex items-center gap-2 text-sm shrink-0">
              <span className="font-mono font-bold text-foreground">{t.ticker}</span>
              <span className={`font-mono font-semibold ${t.type === 'Buy' ? 'text-emerald-500' : 'text-red-500'}`}>
                {t.type === 'Buy' ? '▲' : '▼'} ${(t.value / 1e6).toFixed(1)}M
              </span>
            </span>
          ))}
        </motion.div>
      </div>

      {/* Search */}
      <Input
        placeholder="Search by ticker or name..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="max-w-md"
      />

      {/* Gauge + Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <InsiderConvictionGauge trades={insiderTrades} />
        </div>
        <div className="lg:col-span-2">
          <CongressLeaderboard trades={congressTrades} />
        </div>
      </div>

      {/* SEC Form 4 Trades */}
      <div>
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          SEC Form 4 — C-Suite / Whale Activity
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredInsider.slice(0, 30).map((trade, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="relative bg-card/30 backdrop-blur border border-border/20 rounded-lg p-4 hover:border-border/50 transition-colors group"
            >
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline" className={`font-mono ${trade.type === 'Buy' ? 'text-emerald-500 border-emerald-500/30' : 'text-red-500 border-red-500/30'}`}>
                  {trade.ticker} · {trade.type}
                </Badge>
                <span className="text-xs text-muted-foreground">{trade.date}</span>
              </div>
              <p className="text-sm font-medium truncate mb-3">
                {trade.filer.split(' at ')[0]?.split(' - ')[0] || trade.filer}
              </p>
              <div className="flex items-end justify-between pt-2 border-t border-border/10">
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Value</div>
                  <div className={`font-mono text-lg font-bold ${trade.type === 'Sell' ? 'text-red-500' : 'text-emerald-500'}`}>
                    ${trade.value.toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Shares</div>
                  <div className="font-mono text-sm">{trade.shares.toLocaleString()} @ ${trade.price.toFixed(2)}</div>
                </div>
              </div>
              <a href={trade.formUrl} target="_blank" rel="noreferrer" className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
              </a>
            </motion.div>
          ))}
        </div>
        {filteredInsider.length === 0 && (
          <p className="text-muted-foreground text-center py-8">No insider trades match your search.</p>
        )}
      </div>

      {/* Congressional Trades */}
      <div>
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-fuchsia-500" />
          Congressional Disclosures
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredCongress.slice(0, 30).map((trade, i) => {
            const isDem = trade.party === 'Democrat';
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="relative bg-card/30 backdrop-blur border border-border/20 rounded-lg p-4 hover:border-border/50 transition-colors group"
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="font-mono">{trade.ticker}</Badge>
                  <Badge variant="outline" className={`text-xs ${isDem ? 'text-cyan-400 border-cyan-500/30' : 'text-fuchsia-400 border-fuchsia-500/30'}`}>
                    {trade.party} · {trade.chamber}
                  </Badge>
                </div>
                <p className="text-sm font-medium truncate mb-1">{trade.member}</p>
                <p className="text-xs text-muted-foreground mb-3">{trade.date}</p>
                <div className="flex items-end justify-between pt-2 border-t border-border/10">
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Action</div>
                    <div className={`font-mono text-sm font-bold ${trade.action === 'Purchase' ? 'text-emerald-500' : 'text-amber-400'}`}>
                      {trade.action}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Amount</div>
                    <div className="font-mono text-sm">{trade.amount}</div>
                  </div>
                </div>
                <a href={trade.disclosure_url} target="_blank" rel="noreferrer" className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                </a>
              </motion.div>
            );
          })}
        </div>
        {filteredCongress.length === 0 && (
          <p className="text-muted-foreground text-center py-8">No congressional trades match your search.</p>
        )}
      </div>
    </div>
  );
}

