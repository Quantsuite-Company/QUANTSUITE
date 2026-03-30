import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Play, RotateCcw } from 'lucide-react';

interface TryItParameter {
  name: string;
  label: string;
  defaultValue: number;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

interface TryItData {
  description?: string;
  parameters?: TryItParameter[];
  expectedOutcome?: string;
  calculation?: string;
}

interface TryItComponentProps {
  data: TryItData;
}

export const TryItComponent = ({ data }: TryItComponentProps) => {
  const [values, setValues] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    data.parameters?.forEach(param => {
      initial[param.name] = param.defaultValue;
    });
    return initial;
  });
  const [hasCalculated, setHasCalculated] = useState(false);

  const handleValueChange = (name: string, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setValues(prev => ({ ...prev, [name]: numValue }));
    }
  };

  const handleCalculate = () => {
    setHasCalculated(true);
  };

  const handleReset = () => {
    const initial: Record<string, number> = {};
    data.parameters?.forEach(param => {
      initial[param.name] = param.defaultValue;
    });
    setValues(initial);
    setHasCalculated(false);
  };

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          🎯 Try It Yourself
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.description && (
          <p className="text-sm text-muted-foreground">{data.description}</p>
        )}

        {/* Parameters */}
        {data.parameters && (
          <div className="space-y-3">
            {data.parameters.map((param) => (
              <div key={param.name} className="space-y-2">
                <Label htmlFor={param.name} className="text-sm font-medium">
                  {param.label}
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id={param.name}
                    type="number"
                    value={values[param.name] || param.defaultValue}
                    onChange={(e) => handleValueChange(param.name, e.target.value)}
                    min={param.min}
                    max={param.max}
                    step={param.step || 0.01}
                    className="flex-1"
                  />
                  {param.unit && (
                    <span className="text-sm text-muted-foreground min-w-[40px]">
                      {param.unit}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button 
            onClick={handleCalculate} 
            className="flex-1"
            disabled={hasCalculated}
          >
            <Play className="h-4 w-4 mr-2" />
            Calculate
          </Button>
          {hasCalculated && (
            <Button onClick={handleReset} variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          )}
        </div>

        {/* Result */}
        {hasCalculated && (
          <div className="mt-4 p-4 bg-primary/10 border border-primary/20 rounded-lg space-y-2">
            {data.expectedOutcome && (
              <div>
                <p className="text-sm font-semibold mb-1">Expected Outcome:</p>
                <p className="text-sm">{data.expectedOutcome}</p>
              </div>
            )}
            {data.calculation && (
              <div>
                <p className="text-sm font-semibold mb-1">Calculation:</p>
                <code className="text-xs bg-muted px-2 py-1 rounded block">
                  {data.calculation}
                </code>
              </div>
            )}
            <div className="mt-3 pt-3 border-t border-primary/20">
              <p className="text-xs text-muted-foreground">
                💡 Try changing the values above to see how they affect the outcome!
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
