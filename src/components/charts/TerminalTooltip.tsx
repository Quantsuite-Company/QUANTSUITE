import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { chartColors, formatters, getValueColor } from './chartTheme';

interface TooltipPayloadItem {
  name?: string;
  value?: number;
  color?: string;
  dataKey?: string;
  payload?: Record<string, unknown>;
}

interface TerminalTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
  formatter?: (value: number, name: string) => string;
  labelFormatter?: (label: string) => string;
  valuePrefix?: string;
  valueSuffix?: string;
  showColorIndicator?: boolean;
  colorByValue?: boolean;
}

/**
 * Premium glassmorphic tooltip for Recharts
 */
export function TerminalTooltip({
  active,
  payload,
  label,
  formatter,
  labelFormatter,
  valuePrefix = '',
  valueSuffix = '',
  showColorIndicator = true,
  colorByValue = false,
}: TerminalTooltipProps) {
  if (!active || !payload?.length) return null;

  const formattedLabel = labelFormatter ? labelFormatter(label || '') : label;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 5 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        className="relative z-50"
        style={{
          background: 'hsl(220 20% 8% / 0.95)',
          backdropFilter: 'blur(12px)',
          border: '1px solid hsl(198 93% 60% / 0.2)',
          borderRadius: '8px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px hsl(198 93% 60% / 0.1)',
          padding: '12px 16px',
          minWidth: '140px',
        }}
      >
        {/* Subtle top accent */}
        <div 
          className="absolute inset-x-0 top-0 h-px rounded-t-lg"
          style={{
            background: 'linear-gradient(90deg, transparent, hsl(198 93% 60% / 0.4), transparent)',
          }}
        />

        {/* Label */}
        {formattedLabel && (
          <div 
            className="text-xs font-medium mb-2 pb-2"
            style={{ 
              color: chartColors.muted,
              borderBottom: '1px solid hsl(220 20% 15%)',
            }}
          >
            {formattedLabel}
          </div>
        )}

        {/* Values */}
        <div className="space-y-1.5">
          {payload.map((entry, index) => {
            const value = entry.value ?? 0;
            const displayValue = formatter 
              ? formatter(value, entry.name || '') 
              : `${valuePrefix}${formatters.number(value)}${valueSuffix}`;
            
            const color = colorByValue 
              ? getValueColor(value) 
              : (entry.color || chartColors.cyan);

            return (
              <div key={index} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  {showColorIndicator && (
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ 
                        backgroundColor: color,
                        boxShadow: `0 0 6px ${color}`,
                      }}
                    />
                  )}
                  <span 
                    className="text-xs"
                    style={{ color: chartColors.muted }}
                  >
                    {entry.name || entry.dataKey}
                  </span>
                </div>
                <span 
                  className="text-sm font-mono font-semibold"
                  style={{ 
                    color: colorByValue ? color : chartColors.foreground,
                    textShadow: colorByValue ? `0 0 8px ${color}` : 'none',
                  }}
                >
                  {displayValue}
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Simple single-value tooltip
 */
interface SimpleTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
  valueKey?: string;
  format?: 'currency' | 'percent' | 'number';
}

export function SimpleTooltip({
  active,
  payload,
  label,
  valueKey = 'value',
  format = 'number',
}: SimpleTooltipProps) {
  if (!active || !payload?.length) return null;

  const data = payload[0]?.payload as Record<string, unknown> | undefined;
  const value = (data?.[valueKey] as number) ?? payload[0]?.value ?? 0;
  
  const formatValue = () => {
    switch (format) {
      case 'currency': return formatters.currency(value);
      case 'percent': return formatters.percentSimple(value);
      default: return formatters.number(value);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-3 py-2 rounded-lg"
      style={{
        background: 'hsl(220 20% 8% / 0.95)',
        backdropFilter: 'blur(12px)',
        border: '1px solid hsl(198 93% 60% / 0.2)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
      }}
    >
      <div className="text-xs text-muted-foreground">{label}</div>
      <div 
        className="text-sm font-mono font-semibold mt-0.5"
        style={{ color: getValueColor(value) }}
      >
        {formatValue()}
      </div>
    </motion.div>
  );
}

export default TerminalTooltip;
