import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { generatePayoffCurve, StrategyPosition } from '@/lib/payoffCalculator';

interface PayoffDiagramProps {
  position: StrategyPosition;
}

export const PayoffDiagram = ({ position }: PayoffDiagramProps) => {
  const chartData = useMemo(() => {
    const curve = generatePayoffCurve(position, 150);
    return curve.map(point => ({
      price: point.price,
      'At Expiration': point.atExpiration,
      '30 Days': point.days30,
      '60 Days': point.days60
    }));
  }, [position]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border p-3 rounded-lg shadow-lg">
          <p className="font-semibold mb-2">Price: ₹{Number(label).toFixed(2)}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: ₹{Number(entry.value).toFixed(2)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Payoff Diagram</h2>
      <div className="w-full h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="price" 
              label={{ value: 'Underlying Price (₹)', position: 'insideBottom', offset: -5 }}
              className="text-xs"
            />
            <YAxis 
              label={{ value: 'P&L (₹)', angle: -90, position: 'insideLeft' }}
              className="text-xs"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            {/* Zero line */}
            <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
            
            {/* Current spot price line */}
            <ReferenceLine 
              x={position.spotPrice} 
              stroke="hsl(var(--primary))" 
              strokeDasharray="3 3"
              label={{ value: 'Current', position: 'top' }}
            />
            
            {/* Payoff curves */}
            <Line 
              type="monotone" 
              dataKey="At Expiration" 
              stroke="hsl(var(--chart-1))" 
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="30 Days" 
              stroke="hsl(var(--chart-2))" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
            <Line 
              type="monotone" 
              dataKey="60 Days" 
              stroke="hsl(var(--chart-3))" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 text-sm text-muted-foreground">
        <p>• Solid line shows P&L at expiration</p>
        <p>• Dashed lines show P&L at 30 and 60 days before expiration (time value included)</p>
        <p>• Vertical line indicates current spot price</p>
      </div>
    </Card>
  );
};
