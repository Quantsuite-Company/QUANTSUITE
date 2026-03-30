import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle, Shield, Activity } from "lucide-react";
import { ChartContainer, TerminalPieChart, chartColors } from "@/components/charts";

export default function RiskAnalysis() {
  const { user } = useAuth();
  const [selectedPortfolio, setSelectedPortfolio] = useState<string>("");

  const { data: portfolios, isLoading: loadingPortfolios } = useQuery({
    queryKey: ["portfolios", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("portfolios")
        .select("*")
        .eq("user_id", user?.id);

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: portfolio } = useQuery({
    queryKey: ["portfolio", selectedPortfolio],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("portfolios")
        .select("*")
        .eq("id", selectedPortfolio)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!selectedPortfolio,
  });

  const calculateRiskMetrics = () => {
    if (!portfolio || !portfolio.positions) return null;

    const positions = Array.isArray(portfolio.positions) ? portfolio.positions : [];
    if (positions.length === 0) return null;

    const withValues = positions.map((p: any) => {
      // Handle multiple field naming conventions
      const qty = Number(p.quantity ?? p.shares ?? p.qty ?? 0);
      const last = Number(p.lastPrice ?? p.last_price ?? p.currentPrice ?? p.price ?? p.avgPrice ?? p.entryPrice ?? 100);
      const avg = Number(p.avgPrice ?? p.avg_price ?? p.entryPrice ?? p.entry_price ?? last);
      const pnl = Number(p.pnl ?? p.profit ?? (qty * (last - avg)));
      const value = Number(p.value ?? (qty * last));
      const ticker = p.ticker || p.symbol || p.instrument || 'Unknown';
      return { qty, last, avg, pnl, value, ticker };
    }).filter((p: any) => p.value > 0 && p.qty > 0);

    if (withValues.length === 0) return null;

    const totalValue = withValues.reduce((sum: number, p: any) => sum + p.value, 0);
    const weights = withValues.map((p: any) => (p.value / (totalValue || 1)));

    // Calculate concentration (Herfindahl index approach - max weight)
    const concentration = withValues.length > 0
      ? Math.max(...weights) * 100
      : 0;

    // Calculate portfolio return metrics
    const posReturns = withValues.map((p: any) => 
      p.avg > 0 ? ((p.last - p.avg) / p.avg) : 0
    );
    
    const mean = posReturns.length > 0 
      ? posReturns.reduce((a: number, b: number) => a + b, 0) / posReturns.length 
      : 0;
    
    const variance = posReturns.length > 1
      ? posReturns.reduce((a: number, r: number) => a + Math.pow(r - mean, 2), 0) / (posReturns.length - 1)
      : 0;
    
    const std = Math.sqrt(variance);

    // Annualized volatility estimate (scale daily to annual)
    const volatility = Math.abs(std) * Math.sqrt(252) * 100;
    
    // Risk-free rate assumption: 4.5%
    const riskFreeRate = 0.045;
    const annualizedReturn = mean * 252;
    const sharpeRatio = std > 0.001 ? ((annualizedReturn - riskFreeRate) / (std * Math.sqrt(252))) : 0;
    
    // Max drawdown from P&L
    const totalPnL = withValues.reduce((sum: number, p: any) => sum + p.pnl, 0);
    const maxDrawdown = totalPnL < 0 ? (Math.abs(totalPnL) / totalValue) * 100 : 0;

    // Prepare allocation data for pie chart (top 8 holdings)
    const sortedPositions = [...withValues].sort((a, b) => b.value - a.value);
    const allocationData = sortedPositions.slice(0, 8).map((p: any) => ({
      name: p.ticker,
      value: p.value,
    }));

    return {
      concentration,
      volatility: Math.min(volatility, 100), // Cap at 100% for display
      sharpeRatio: Math.max(-5, Math.min(5, sharpeRatio)), // Cap between -5 and 5
      maxDrawdown: Math.min(maxDrawdown, 100), // Cap at 100%
      positions: withValues.length,
      totalValue,
      allocationData,
    };
  };

  const riskMetrics = calculateRiskMetrics();

  const getRiskLevel = (value: number, type: string) => {
    if (type === "concentration") {
      if (value > 50) return { level: "High", color: "destructive" };
      if (value > 30) return { level: "Medium", color: "default" };
      return { level: "Low", color: "secondary" };
    }
    if (type === "volatility") {
      if (value > 30) return { level: "High", color: "destructive" };
      if (value > 20) return { level: "Medium", color: "default" };
      return { level: "Low", color: "secondary" };
    }
    return { level: "Unknown", color: "secondary" };
  };

  if (loadingPortfolios) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Risk Analysis
        </h1>
        <p className="text-muted-foreground mt-2">Comprehensive portfolio risk assessment</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <ChartContainer title="Select Portfolio" subtitle="Choose a portfolio to analyze its risk profile" height="auto">
          <div className="p-2">
            <Select value={selectedPortfolio} onValueChange={setSelectedPortfolio}>
              <SelectTrigger className="max-w-md bg-background/50">
                <SelectValue placeholder="Select a portfolio" />
              </SelectTrigger>
              <SelectContent>
                {portfolios?.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </ChartContainer>
      </motion.div>

      {riskMetrics && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Portfolio Concentration",
                icon: AlertTriangle,
                value: `${riskMetrics.concentration.toFixed(1)}%`,
                showProgress: true,
                progressValue: riskMetrics.concentration,
                badge: getRiskLevel(riskMetrics.concentration, "concentration"),
                badgeText: `${getRiskLevel(riskMetrics.concentration, "concentration").level} Risk`,
              },
              {
                title: "Volatility",
                icon: Activity,
                value: `${riskMetrics.volatility.toFixed(1)}%`,
                showProgress: true,
                progressValue: riskMetrics.volatility,
                badge: getRiskLevel(riskMetrics.volatility, "volatility"),
                badgeText: `${getRiskLevel(riskMetrics.volatility, "volatility").level} Volatility`,
              },
              {
                title: "Sharpe Ratio",
                icon: Shield,
                value: riskMetrics.sharpeRatio.toFixed(2),
                description: "Risk-adjusted return metric",
                isProfit: riskMetrics.sharpeRatio > 0,
              },
              {
                title: "Max Drawdown",
                icon: AlertTriangle,
                value: `-${riskMetrics.maxDrawdown.toFixed(1)}%`,
                valueClass: "text-destructive",
                description: "Largest peak-to-trough decline",
              },
              {
                title: "Total Positions",
                icon: Activity,
                value: riskMetrics.positions.toString(),
                description: "Number of holdings",
              },
              {
                title: "Portfolio Value",
                icon: Shield,
                value: `$${riskMetrics.totalValue.toLocaleString()}`,
                description: "Total portfolio value",
                isProfit: true,
              },
            ].map((metric, index) => (
              <motion.div
                key={metric.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                transition={{ delay: 0.2 + index * 0.05, duration: 0.3 }}
              >
                <ChartContainer height="auto" className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">{metric.title}</span>
                    <metric.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div 
                    className={`text-2xl font-bold ${metric.valueClass || 'text-foreground'}`}
                    style={metric.isProfit ? { color: chartColors.profit } : undefined}
                  >
                    {metric.value}
                  </div>
                  {metric.showProgress && (
                    <Progress value={metric.progressValue} className="mt-2" />
                  )}
                  {metric.badge && (
                    <Badge variant={metric.badge.color as any} className="mt-2">
                      {metric.badgeText}
                    </Badge>
                  )}
                  {metric.description && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {metric.description}
                    </p>
                  )}
                </ChartContainer>
              </motion.div>
            ))}
          </div>

          {/* Allocation Chart */}
          {riskMetrics.allocationData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              <TerminalPieChart
                data={riskMetrics.allocationData}
                title="Portfolio Allocation"
                subtitle="Distribution of holdings by value"
                height={350}
                valueFormatter={(val) => `$${val.toLocaleString()}`}
              />
            </motion.div>
          )}
        </>
      )}

      {!selectedPortfolio && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <ChartContainer title="" height={200}>
            <div className="flex flex-col items-center justify-center h-full">
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <Shield className="w-12 h-12 text-muted-foreground mb-4" />
              </motion.div>
              <p className="text-muted-foreground">Select a portfolio to view risk analysis</p>
            </div>
          </ChartContainer>
        </motion.div>
      )}
    </div>
  );
}
