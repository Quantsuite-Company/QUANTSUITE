import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Position } from '@/lib/csvParser';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

interface TradeAnalysisProps {
  positions: Position[];
}

export function TradeAnalysis({ positions }: TradeAnalysisProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const sortedByPnL = [...positions].sort((a, b) => b.pnl - a.pnl);
  const topWinners = sortedByPnL.slice(0, 5);
  const topLosers = sortedByPnL.slice(-5).reverse();

  const sortedByCapital = [...positions].sort((a, b) => 
    (b.quantity * b.avgPrice) - (a.quantity * a.avgPrice)
  );
  const largestPositions = sortedByCapital.slice(0, 5);

  // Detect averaging
  const instrumentGroups = positions.reduce((acc, p) => {
    if (!acc[p.instrument]) acc[p.instrument] = [];
    acc[p.instrument].push(p);
    return acc;
  }, {} as Record<string, Position[]>);

  const averagingDetected = Object.entries(instrumentGroups)
    .filter(([_, positions]) => positions.length > 1)
    .map(([instrument, positions]) => {
      const prices = positions.map(p => p.avgPrice);
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      const totalQty = positions.reduce((sum, p) => sum + p.quantity, 0);
      const totalCost = positions.reduce((sum, p) => sum + (p.quantity * p.avgPrice), 0);
      const weightedAvg = totalCost / totalQty;
      
      return {
        instrument,
        entries: positions.length,
        priceRange: `${formatCurrency(min)} - ${formatCurrency(max)}`,
        weightedAvg: formatCurrency(weightedAvg),
        totalQty,
        type: positions[positions.length - 1].avgPrice < positions[0].avgPrice ? 'DOWN ⬇️' : 'UP ⬆️'
      };
    });

  const renderTable = (title: string, data: Position[], highlightPnL = true) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {title}
          {highlightPnL && (
            <Badge variant="outline" className="ml-auto">
              {data.length} positions
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Instrument</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Avg Price</TableHead>
              <TableHead className="text-right">LTP</TableHead>
              <TableHead className="text-right">P&L</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((position, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{position.instrument}</TableCell>
                <TableCell>
                  <Badge variant="outline">{position.type}</Badge>
                </TableCell>
                <TableCell className="text-right">{position.quantity}</TableCell>
                <TableCell className="text-right">{formatCurrency(position.avgPrice)}</TableCell>
                <TableCell className="text-right">{formatCurrency(position.lastPrice)}</TableCell>
                <TableCell className="text-right">
                  <span className={position.pnl >= 0 ? 'text-green-500 font-semibold' : 'text-red-500 font-semibold'}>
                    {formatCurrency(position.pnl)}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-6 h-6 text-green-500" />
        <h2 className="text-2xl font-bold">Position-Level Analysis</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderTable('🏆 Top 5 Winners', topWinners)}
        {renderTable('📉 Top 5 Losers', topLosers)}
      </div>

      {renderTable('💰 Largest Positions by Capital', largestPositions)}

      {averagingDetected.length > 0 && (
        <Card className="border-yellow-500/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              Averaging Detected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Instrument</TableHead>
                  <TableHead className="text-center">Entries</TableHead>
                  <TableHead>Price Range</TableHead>
                  <TableHead>Weighted Avg</TableHead>
                  <TableHead className="text-right">Total Qty</TableHead>
                  <TableHead className="text-center">Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {averagingDetected.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item.instrument}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{item.entries}x</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{item.priceRange}</TableCell>
                    <TableCell className="font-semibold">{item.weightedAvg}</TableCell>
                    <TableCell className="text-right">{item.totalQty}</TableCell>
                    <TableCell className="text-center">{item.type}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
