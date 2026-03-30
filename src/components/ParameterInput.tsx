import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';

// Optimized color mapping to avoid inline calculations
const parameterColors = {
  'param-stock': '#3B9EF0',
  'param-strike': '#22C55E', 
  'param-time': '#EAB308',
  'param-volatility': '#A855F7',
  'param-rate': '#F97316',
  'param-dividend': '#EC4899'
} as const;

interface ParameterInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  tooltip: string;
  id: string;
  color?: keyof typeof parameterColors;
}

export const ParameterInput: React.FC<ParameterInputProps> = ({
  label,
  value,
  onChange,
  min,
  max,
  step,
  suffix = '',
  tooltip,
  id,
  color = 'param-stock',
}) => {
  const colorValue = parameterColors[color];

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseFloat(e.target.value));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    if (!isNaN(newValue)) {
      onChange(Math.max(min, Math.min(max, newValue)));
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Label htmlFor={id} className="text-sm font-semibold" style={{ color: colorValue }}>
          {label}
        </Label>
        {tooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-full p-1 text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <HelpCircle className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs leading-relaxed">
                {tooltip}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      <div className="space-y-3">
        <div className="relative">
          <Input
            id={id}
            type="number"
            value={value.toFixed(step < 1 ? 4 : step < 0.1 ? 2 : 0)}
            onChange={handleInputChange}
            min={min}
            max={max}
            step={step}
            className="terminal-input pr-12"
          />
          {suffix && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <span className="text-sm" style={{ color: colorValue }}>{suffix}</span>
            </div>
          )}
        </div>

        <input
          type="range"
          value={value}
          onChange={handleSliderChange}
          min={min}
          max={max}
          step={step}
          className="terminal-slider w-full"
          style={{
            background: `linear-gradient(to right, ${colorValue}22 0%, ${colorValue}22 ${((value - min) / (max - min)) * 100}%, #374151 ${((value - min) / (max - min)) * 100}%, #374151 100%)`
          }}
        />

        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{min}{suffix}</span>
          <span>{max}{suffix}</span>
        </div>
      </div>
    </div>
  );
};