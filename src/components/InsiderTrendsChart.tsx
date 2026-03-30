import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface Trade {
  date: string;
  value: number;
  type: string;
}

interface InsiderTrendsChartProps {
  trades: Trade[];
  title: string;
}

export function InsiderTrendsChart({ trades, title }: InsiderTrendsChartProps) {
  const chartData = useMemo(() => {
    const dateMap = new Map<string, { date: string; buyValue: number; sellValue: number; buyCount: number; sellCount: number }>();
    
    trades.forEach(trade => {
      const existing = dateMap.get(trade.date) || { date: trade.date, buyValue: 0, sellValue: 0, buyCount: 0, sellCount: 0 };
      
      if (trade.type === "Buy") {
        existing.buyValue += trade.value;
        existing.buyCount += 1;
      } else if (trade.type === "Sell") {
        existing.sellValue += trade.value;
        existing.sellCount += 1;
      }
      
      dateMap.set(trade.date, existing);
    });
    
    return Array.from(dateMap.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30);
  }, [trades]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-medium mb-4">Transaction Value ($)</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Legend />
                <Bar dataKey="buyValue" fill="hsl(var(--primary))" name="Buy Value" />
                <Bar dataKey="sellValue" fill="hsl(var(--destructive))" name="Sell Value" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-4">Transaction Count</h4>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="buyCount" stroke="hsl(var(--primary))" name="Buys" />
                <Line type="monotone" dataKey="sellCount" stroke="hsl(var(--destructive))" name="Sells" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
