import React from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface PercentileBarProps {
  label: string;
  value: number;
  unit?: string;
  p10: number;
  p50: number;
  p90: number;
  higherIsBetter?: boolean;
}

export function PercentileBar({
  label,
  value,
  unit = '%',
  p10,
  p50,
  p90,
  higherIsBetter = false,
}: PercentileBarProps) {
  // Calculate position on the bar (0-100%)
  const range = p90 - p10;
  const clampedValue = Math.max(p10, Math.min(p90, value));
  const position = range > 0 ? ((clampedValue - p10) / range) * 100 : 50;
  
  // Determine color based on position and whether higher is better
  const getPositionColor = () => {
    if (higherIsBetter) {
      if (position > 66) return 'hsl(var(--qs-profit))';
      if (position > 33) return 'hsl(45, 93%, 47%)';
      return 'hsl(var(--qs-loss))';
    } else {
      if (position < 33) return 'hsl(var(--qs-profit))';
      if (position < 66) return 'hsl(45, 93%, 47%)';
      return 'hsl(var(--qs-loss))';
    }
  };
  
  const formatValue = (v: number) => {
    if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(1)}K`;
    if (Math.abs(v) >= 100) return v.toFixed(0);
    if (Math.abs(v) >= 10) return v.toFixed(1);
    return v.toFixed(2);
  };

  return (
    <div className="grid grid-cols-[180px_70px_70px_1fr_70px] gap-2 items-center py-2 border-b border-qs-glass-border/50">
      {/* Label */}
      <span className="text-sm text-muted-foreground truncate">{label}</span>
      
      {/* Company Value */}
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="text-sm font-mono font-medium text-foreground cursor-help">
            {formatValue(value)}{unit}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>Your company's value: {value.toFixed(2)}{unit}</p>
        </TooltipContent>
      </Tooltip>
      
      {/* 10th Percentile */}
      <span className="text-xs font-mono text-muted-foreground">
        {formatValue(p10)}
      </span>
      
      {/* Progress Bar */}
      <div className="relative h-3 bg-muted/30 rounded-full overflow-hidden">
        {/* Range indicator */}
        <div className="absolute inset-0 bg-gradient-to-r from-qs-profit/20 via-amber-500/20 to-qs-loss/20" />
        
        {/* Median marker */}
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-amber-500/60"
          style={{ left: '50%' }}
        />
        
        {/* Company position marker */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-background shadow-lg cursor-pointer transition-transform hover:scale-125"
              style={{ 
                left: `${position}%`, 
                transform: `translateX(-50%) translateY(-50%)`,
                backgroundColor: getPositionColor(),
              }}
            />
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm">
              <p className="font-medium">{label}: {value.toFixed(2)}{unit}</p>
              <p className="text-muted-foreground">
                {higherIsBetter 
                  ? position > 50 ? 'Above sector median' : 'Below sector median'
                  : position < 50 ? 'Better than median' : 'Worse than median'
                }
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
      
      {/* 90th Percentile */}
      <span className="text-xs font-mono text-muted-foreground text-right">
        {formatValue(p90)}
      </span>
    </div>
  );
}
