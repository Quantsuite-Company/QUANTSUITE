import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { StrategyPosition } from '@/lib/payoffCalculator';

interface StrategyLegsPanelProps {
  position: StrategyPosition;
}

export const StrategyLegsPanel = ({ position }: StrategyLegsPanelProps) => {
  const formatGreek = (value: number, decimals: number = 3) => {
    return value.toFixed(decimals);
  };

  const getActionColor = (action: 'buy' | 'sell') => {
    return action === 'buy' ? 'bg-success text-success-foreground' : 'bg-destructive text-destructive-foreground';
  };

  const getStrikeExplanation = (strike: number, spotPrice: number) => {
    const diff = strike - spotPrice;
    if (Math.abs(diff) < 0.01) return 'at current price';
    if (diff > 0) return `₹${Math.abs(diff).toFixed(2)} above current price`;
    return `₹${Math.abs(diff).toFixed(2)} below current price`;
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Strategy Legs</h2>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Action</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Strike</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Premium</TableHead>
              <TableHead className="text-right">Delta</TableHead>
              <TableHead className="text-right">Gamma</TableHead>
              <TableHead className="text-right">Theta</TableHead>
              <TableHead className="text-right">Vega</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {position.legs.map((leg, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Badge className={getActionColor(leg.action)}>
                    {leg.action.toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {leg.type.toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-medium">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help">₹{leg.strike.toFixed(2)}</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{getStrikeExplanation(leg.strike, position.spotPrice)}</p>
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
                <TableCell className="text-right">{leg.quantity}</TableCell>
                <TableCell className="text-right font-medium">₹{leg.premium.toFixed(2)}</TableCell>
                <TableCell className="text-right">{formatGreek(leg.delta)}</TableCell>
                <TableCell className="text-right">{formatGreek(leg.gamma, 4)}</TableCell>
                <TableCell className="text-right">{formatGreek(leg.theta)}</TableCell>
                <TableCell className="text-right">{formatGreek(leg.vega)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      <div className="mt-4 p-4 bg-muted rounded-lg">
        <h3 className="font-medium mb-2">Total Premium Flow</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-muted-foreground">Premium Paid (Debit)</div>
            <div className="text-lg font-bold text-destructive">
              ₹{position.legs
                .filter(l => l.action === 'buy')
                .reduce((sum, l) => sum + (l.premium * l.quantity), 0)
                .toFixed(2)}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Premium Received (Credit)</div>
            <div className="text-lg font-bold text-success">
              ₹{position.legs
                .filter(l => l.action === 'sell')
                .reduce((sum, l) => sum + (l.premium * l.quantity), 0)
                .toFixed(2)}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
