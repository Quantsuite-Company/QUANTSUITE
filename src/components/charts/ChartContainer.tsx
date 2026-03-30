import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { gradients } from './chartTheme';

interface ChartContainerProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  height?: number | string;
  showGradients?: boolean;
  variant?: 'default' | 'compact' | 'fullWidth';
}

/**
 * Premium terminal-style chart container with glassmorphism and gradients
 */
export function ChartContainer({
  children,
  title,
  subtitle,
  className,
  height = 300,
  showGradients = true,
  variant = 'default',
}: ChartContainerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        // Base container styling
        'relative rounded-xl overflow-hidden',
        // Glassmorphism background
        'bg-gradient-to-b from-[hsl(220_20%_8%)] to-[hsl(220_26%_4%)]',
        // Border with subtle glow
        'border border-border/30',
        // Shadow
        'shadow-[0_0_30px_hsl(198_93%_60%/0.08)]',
        // Variants
        variant === 'compact' && 'p-4',
        variant === 'default' && 'p-6',
        variant === 'fullWidth' && 'p-6 w-full',
        className
      )}
    >
      {/* Subtle top gradient accent */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      
      {/* Header */}
      {(title || subtitle) && (
        <div className="mb-4">
          {title && (
            <h3 className="text-sm font-semibold text-foreground tracking-wide">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Chart area */}
      <div 
        style={{ height: typeof height === 'number' ? `${height}px` : height }}
        className="relative"
      >
        {/* SVG Gradient Definitions (rendered once, used by charts) */}
        {showGradients && (
          <svg width="0" height="0" className="absolute">
            <defs>
              {Object.values(gradients).map((gradient) => (
                <linearGradient
                  key={gradient.id}
                  id={gradient.id}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  {gradient.stops.map((stop, idx) => (
                    <stop
                      key={idx}
                      offset={stop.offset}
                      stopColor={stop.color}
                      stopOpacity={stop.opacity}
                    />
                  ))}
                </linearGradient>
              ))}
              
              {/* Glow filters */}
              <filter id="glow-cyan" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              
              <filter id="glow-profit" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              
              <filter id="glow-loss" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
          </svg>
        )}
        
        {children}
      </div>
    </motion.div>
  );
}

export default ChartContainer;
