import React from 'react';
import { DEFAULT_RATINGS, DefaultRatingInfo } from '@/lib/creditRisk';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { motion } from 'framer-motion';

interface RatingBadgeProps {
  rating: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
  animate?: boolean;
}

export function RatingBadge({ rating, size = 'md', showLabel = true, animate = true }: RatingBadgeProps) {
  const ratingInfo = DEFAULT_RATINGS.find(r => r.rating === rating) || DEFAULT_RATINGS[4];
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-lg px-4 py-2 font-bold',
    xl: 'text-2xl px-6 py-3 font-bold tracking-wide',
  };
  
  const baseClassName = `
    inline-flex flex-col items-center justify-center rounded-lg cursor-help
    border-2 shadow-lg transition-all hover:scale-105
    ${sizeClasses[size]}
  `;
  
  const baseStyle = {
    backgroundColor: `${ratingInfo.color}20`,
    borderColor: ratingInfo.color,
    color: ratingInfo.color,
    boxShadow: `0 0 20px ${ratingInfo.color}40`,
  };
  
  const content = (
    <>
      <span className="font-mono font-bold">{rating}</span>
      {showLabel && size !== 'sm' && (
        <span className="text-xs opacity-80 mt-0.5">{ratingInfo.label.split(' - ')[0]}</span>
      )}
    </>
  );
  
  const tooltipContent = (
    <TooltipContent side="right" className="max-w-xs">
      <div className="space-y-1">
        <p className="font-semibold" style={{ color: ratingInfo.color }}>{ratingInfo.label}</p>
        <p className="text-sm text-muted-foreground">{ratingInfo.description}</p>
        <p className="text-xs text-muted-foreground">
          PD Range: {ratingInfo.pdRange[0]}% - {ratingInfo.pdRange[1]}%
        </p>
      </div>
    </TooltipContent>
  );

  if (animate) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className={baseClassName}
            style={baseStyle}
          >
            {content}
          </motion.div>
        </TooltipTrigger>
        {tooltipContent}
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={baseClassName} style={baseStyle}>
          {content}
        </div>
      </TooltipTrigger>
      {tooltipContent}
    </Tooltip>
  );
}

// Mini rating scale visualization
export function RatingScale({ currentRating }: { currentRating: string }) {
  return (
    <div className="flex items-center gap-1">
      {DEFAULT_RATINGS.map((r) => (
        <Tooltip key={r.rating}>
          <TooltipTrigger asChild>
            <div
              className={`h-2 w-6 rounded-sm transition-all cursor-pointer ${
                r.rating === currentRating ? 'ring-2 ring-foreground ring-offset-2 ring-offset-background' : 'opacity-60 hover:opacity-100'
              }`}
              style={{ backgroundColor: r.color }}
            />
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-mono">{r.rating}: {r.label}</p>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
