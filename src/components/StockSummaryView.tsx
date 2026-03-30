import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Trade {
  ticker: string;
  type: string;
  value: number;
  shares: number;
}

interface StockSummaryViewProps {
  trades: Trade[];
}

interface Summary {
  ticker: string;
  totalBuys: number;
  totalSells: number;
  buyValue: number;
  sellValue: number;
  netValue: number;
  sentiment: "bullish" | "bearish" | "neutral";
}

export function StockSummaryView({ trades }: StockSummaryViewProps) {
  const summaries = useMemo(() => {
    const map = new Map<string, Summary>();
    
    trades.forEach(trade => {
      const existing = map.get(trade.ticker) || {
        ticker: trade.ticker,
        totalBuys: 0,
        totalSells: 0,
        buyValue: 0,
        sellValue: 0,
        netValue: 0,
        sentiment: "neutral" as const
      };
      
      if (trade.type === "Buy") {
        existing.totalBuys += 1;
        existing.buyValue += trade.value;
      } else if (trade.type === "Sell") {
        existing.totalSells += 1;
        existing.sellValue += trade.value;
      }
      
      existing.netValue = existing.buyValue - existing.sellValue;
      
      if (existing.netValue > existing.buyValue * 0.3) {
        existing.sentiment = "bullish";
      } else if (existing.netValue < -existing.sellValue * 0.3) {
        existing.sentiment = "bearish";
      } else {
        existing.sentiment = "neutral";
      }
      
      map.set(trade.ticker, existing);
    });
    
    return Array.from(map.values())
      .sort((a, b) => Math.abs(b.netValue) - Math.abs(a.netValue))
      .slice(0, 20);
  }, [trades]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticker</TableHead>
                <TableHead className="text-right">Buys</TableHead>
                <TableHead className="text-right">Sells</TableHead>
                <TableHead className="text-right">Buy Value</TableHead>
                <TableHead className="text-right">Sell Value</TableHead>
                <TableHead className="text-right">Net Value</TableHead>
                <TableHead>Sentiment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summaries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No data available
                  </TableCell>
                </TableRow>
              ) : (
                summaries.map((summary) => (
                  <TableRow key={summary.ticker}>
                    <TableCell>
                      <Badge variant="outline">{summary.ticker}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{summary.totalBuys}</TableCell>
                    <TableCell className="text-right">{summary.totalSells}</TableCell>
                    <TableCell className="text-right">${summary.buyValue.toLocaleString()}</TableCell>
                    <TableCell className="text-right">${summary.sellValue.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <span className={summary.netValue >= 0 ? "text-primary" : "text-destructive"}>
                        ${summary.netValue.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        summary.sentiment === "bullish" ? "default" : 
                        summary.sentiment === "bearish" ? "destructive" : 
                        "secondary"
                      }>
                        {summary.sentiment}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
