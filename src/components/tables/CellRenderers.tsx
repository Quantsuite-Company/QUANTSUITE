import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { motion } from 'framer-motion';
import { chartColors, formatters } from '../charts/chartTheme';

// ==================== Cell Renderer Types ====================

interface CellRenderProps {
  value: unknown;
  className?: string;
}

// ==================== Value Cell with Color ====================

interface ValueCellProps extends CellRenderProps {
  format?: 'number' | 'currency' | 'percent' | 'percentChange';
  showIcon?: boolean;
  animated?: boolean;
  decimals?: number;
}

export function ValueCell({
  value,
  format = 'number',
  showIcon = false,
  animated = false,
  className,
  decimals = 2,
}: ValueCellProps) {
  const numValue = typeof value === 'number' ? value : parseFloat(String(value));
  const isPositive = numValue > 0;
  const isNegative = numValue < 0;
  
  const getColor = () => {
    if (isPositive) return chartColors.profit;
    if (isNegative) return chartColors.loss;
    return chartColors.neutral;
  };
  
  const formatValue = () => {
    if (isNaN(numValue)) return String(value);
    
    switch (format) {
      case 'currency':
        return formatters.currency(numValue);
      case 'percent':
        return formatters.percentSimple(numValue);
      case 'percentChange':
        return `${numValue >= 0 ? '+' : ''}${formatters.percentSimple(numValue)}`;
      default:
        return formatters.number(numValue, decimals);
    }
  };
  
  const Icon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;
  const color = getColor();
  
  const content = (
    <span 
      className={`flex items-center gap-1.5 font-mono ${className || ''}`}
      style={{ 
        color,
        textShadow: `0 0 8px ${color}`,
      }}
    >
      {showIcon && (
        <Icon className="w-3.5 h-3.5" />
      )}
      {formatValue()}
    </span>
  );
  
  if (animated) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        {content}
      </motion.div>
    );
  }
  
  return content;
}

// ==================== Badge Cell ====================

interface BadgeCellProps extends CellRenderProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
}

export function BadgeCell({
  value,
  variant = 'default',
  size = 'sm',
  className,
}: BadgeCellProps) {
  const getStyles = () => {
    const base = {
      background: 'hsl(220 20% 15%)',
      color: chartColors.muted,
      border: '1px solid hsl(220 20% 20%)',
    };
    
    switch (variant) {
      case 'success':
        return {
          background: 'hsl(152 69% 45% / 0.15)',
          color: chartColors.profit,
          border: `1px solid ${chartColors.profit}33`,
        };
      case 'warning':
        return {
          background: 'hsl(45 93% 58% / 0.15)',
          color: chartColors.amber,
          border: `1px solid ${chartColors.amber}33`,
        };
      case 'danger':
        return {
          background: 'hsl(0 84% 60% / 0.15)',
          color: chartColors.loss,
          border: `1px solid ${chartColors.loss}33`,
        };
      case 'info':
        return {
          background: 'hsl(198 93% 60% / 0.15)',
          color: chartColors.cyan,
          border: `1px solid ${chartColors.cyan}33`,
        };
      default:
        return base;
    }
  };
  
  const styles = getStyles();
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';
  
  return (
    <span 
      className={`inline-flex items-center rounded-md font-medium tracking-wide ${sizeClasses} ${className || ''}`}
      style={styles}
    >
      {String(value)}
    </span>
  );
}

// ==================== Sparkline Cell ====================

interface SparklineCellProps {
  data: number[];
  width?: number;
  height?: number;
  className?: string;
  showDot?: boolean;
}

export function SparklineCell({
  data,
  width = 60,
  height = 20,
  className,
  showDot = true,
}: SparklineCellProps) {
  if (!data || data.length < 2) return null;
  
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');
  
  const isPositive = data[data.length - 1] >= data[0];
  const color = isPositive ? chartColors.profit : chartColors.loss;
  const lastPoint = {
    x: width,
    y: height - ((data[data.length - 1] - min) / range) * height,
  };
  
  return (
    <svg 
      width={width} 
      height={height} 
      className={className}
      style={{ overflow: 'visible' }}
    >
      {/* Gradient fill */}
      <defs>
        <linearGradient id={`sparkline-gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      
      {/* Area fill */}
      <polygon
        points={`0,${height} ${points} ${width},${height}`}
        fill={`url(#sparkline-gradient-${color})`}
      />
      
      {/* Line */}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          filter: `drop-shadow(0 0 2px ${color})`,
        }}
      />
      
      {/* End dot */}
      {showDot && (
        <circle
          cx={lastPoint.x}
          cy={lastPoint.y}
          r={2.5}
          fill={color}
          style={{
            filter: `drop-shadow(0 0 4px ${color})`,
          }}
        />
      )}
    </svg>
  );
}

// ==================== Progress Cell ====================

interface ProgressCellProps {
  value: number;
  max?: number;
  color?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function ProgressCell({
  value,
  max = 100,
  color = chartColors.cyan,
  showLabel = true,
  size = 'sm',
  className,
}: ProgressCellProps) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));
  const heightClass = size === 'sm' ? 'h-1.5' : 'h-2.5';
  
  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      <div 
        className={`flex-1 rounded-full overflow-hidden ${heightClass}`}
        style={{ background: 'hsl(220 20% 15%)' }}
      >
        <motion.div
          className={`${heightClass} rounded-full`}
          style={{ 
            background: color,
            boxShadow: `0 0 8px ${color}`,
          }}
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      {showLabel && (
        <span 
          className="text-xs font-mono"
          style={{ color, minWidth: '36px', textAlign: 'right' }}
        >
          {formatters.number(percent, 0)}%
        </span>
      )}
    </div>
  );
}

// ==================== Status Dot Cell ====================

interface StatusDotCellProps {
  status: 'active' | 'inactive' | 'pending' | 'error';
  label?: string;
  className?: string;
}

export function StatusDotCell({
  status,
  label,
  className,
}: StatusDotCellProps) {
  const getColor = () => {
    switch (status) {
      case 'active': return chartColors.profit;
      case 'inactive': return chartColors.neutral;
      case 'pending': return chartColors.amber;
      case 'error': return chartColors.loss;
      default: return chartColors.neutral;
    }
  };
  
  const color = getColor();
  
  return (
    <span className={`flex items-center gap-2 ${className || ''}`}>
      <span 
        className="w-2 h-2 rounded-full"
        style={{ 
          background: color,
          boxShadow: `0 0 6px ${color}`,
        }}
      />
      {label && (
        <span className="text-xs" style={{ color: chartColors.muted }}>
          {label}
        </span>
      )}
    </span>
  );
}
