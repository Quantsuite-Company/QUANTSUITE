import React from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { InfoCircle } from 'iconsax-react';

interface MetricTooltipProps {
  children: React.ReactNode;
  tooltip: string;
  indicator?: 'higher-better' | 'lower-better' | 'neutral';
}

export function MetricTooltip({ children, tooltip, indicator }: MetricTooltipProps) {
  return (
    <div className="flex items-center gap-1.5">
      {children}
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="text-muted-foreground hover:text-foreground transition-colors">
            <InfoCircle size={14} />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[250px]">
          <p className="text-xs">{tooltip}</p>
          {indicator && (
            <p className="text-xs mt-1 text-muted-foreground">
              {indicator === 'higher-better' && '↑ Higher = Safer'}
              {indicator === 'lower-better' && '↓ Lower = Safer'}
              {indicator === 'neutral' && '◯ Context-dependent'}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

interface DeltaIndicatorProps {
  current: number;
  previous: number | null;
  higherIsBetter?: boolean;
  format?: 'percent' | 'decimal' | 'bps';
}

export function DeltaIndicator({ current, previous, higherIsBetter = false, format = 'decimal' }: DeltaIndicatorProps) {
  if (previous === null || previous === undefined) return null;
  
  const delta = current - previous;
  if (Math.abs(delta) < 0.001) return null;
  
  const isPositiveChange = delta > 0;
  const isGoodChange = higherIsBetter ? isPositiveChange : !isPositiveChange;
  
  let displayDelta = '';
  if (format === 'percent') {
    displayDelta = `${Math.abs(delta).toFixed(2)}%`;
  } else if (format === 'bps') {
    displayDelta = `${Math.abs(delta).toFixed(0)}bps`;
  } else {
    displayDelta = Math.abs(delta).toFixed(2);
  }
  
  return (
    <span className={`text-xs ml-1.5 font-medium ${isGoodChange ? 'text-green-500' : 'text-red-500'}`}>
      {isPositiveChange ? '↑' : '↓'} {displayDelta}
    </span>
  );
}

export function RiskLegend() {
  return (
    <div className="flex items-center gap-4 text-xs text-muted-foreground">
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 rounded-full bg-green-500" />
        <span>Good/Safe</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 rounded-full bg-amber-500" />
        <span>Monitor</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 rounded-full bg-red-500" />
        <span>Warning</span>
      </div>
    </div>
  );
}
