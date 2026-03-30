import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Position } from '@/lib/csvParser';
import { parseOptionSymbol, detectStrategy } from '@/lib/portfolioCalculator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface OptionsAnalyzerProps {
  positions: Position[];
}

export function OptionsAnalyzer({ positions }: OptionsAnalyzerProps) {
  const optionPositions = positions.filter(p => {
    const parsed = parseOptionSymbol(p.instrument);
    return parsed !== null;
  });

  if (optionPositions.length === 0) {
    return null;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const parsedOptions = optionPositions.map(p => ({
    ...p,
    parsed: parseOptionSymbol(p.instrument)!
  }));

  const callCount = parsedOptions.filter(p => p.parsed.type === 'CE').length;
  const putCount = parsedOptions.filter(p => p.parsed.type === 'PE').length;

  const strategies = detectStrategy(positions);

  const byIndex = parsedOptions.reduce((acc, p) => {
    if (!acc[p.parsed.index]) acc[p.parsed.index] = [];
    acc[p.parsed.index].push(p);
    return acc;
  }, {} as Record<string, typeof parsedOptions>);

  const byExpiry = parsedOptions.reduce((acc, p) => {
    if (!acc[p.parsed.expiry]) acc[p.parsed.expiry] = [];
    acc[p.parsed.expiry].push(p);
    return acc;
  }, {} as Record<string, typeof parsedOptions>);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-6 h-6 text-purple-500" />
        <h2 className="text-2xl font-bold">Options Deep Dive</h2>
        <Badge className="ml-auto bg-purple-500">{optionPositions.length} contracts</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Call vs Put</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">{callCount}</div>
                <div className="text-xs text-muted-foreground">Calls (CE)</div>
              </div>
              <div className="text-muted-foreground">vs</div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-500">{putCount}</div>
                <div className="text-xs text-muted-foreground">Puts (PE)</div>
              </div>
            </div>
            {callCount > putCount * 2 && (
              <p className="text-xs text-green-500 mt-2">📈 Bullish positioning</p>
            )}
            {putCount > callCount * 2 && (
              <p className="text-xs text-red-500 mt-2">📉 Bearish positioning</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Indices</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.entries(byIndex).map(([index, positions]) => (
              <div key={index} className="flex justify-between items-center mb-2">
                <Badge variant="outline">{index}</Badge>
                <span className="text-sm">{positions.length} contracts</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Expiries</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.entries(byExpiry).map(([expiry, positions]) => (
              <div key={expiry} className="flex justify-between items-center mb-2">
                <Badge variant="secondary">{expiry}</Badge>
                <span className="text-sm">{positions.length} contracts</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {strategies.length > 0 && (
        <Card className="border-purple-500/50">
          <CardHeader>
            <CardTitle>🎯 Detected Strategies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {strategies.map((strategy, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-purple-500/10">
                    {strategy}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Options Positions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contract</TableHead>
                <TableHead>Index</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead className="text-right">Strike</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">P&L</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parsedOptions.map((position, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium text-sm">{position.instrument}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{position.parsed.index}</Badge>
                  </TableCell>
                  <TableCell>{position.parsed.expiry}</TableCell>
                  <TableCell className="text-right font-mono">{position.parsed.strike}</TableCell>
                  <TableCell>
                    <Badge variant={position.parsed.type === 'CE' ? 'default' : 'secondary'}>
                      {position.parsed.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{position.quantity}</TableCell>
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
    </div>
  );
}
