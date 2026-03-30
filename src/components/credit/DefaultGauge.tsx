import React from 'react';
import { motion } from 'framer-motion';

interface DefaultGaugeProps {
  probability: number; // 0-100
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function DefaultGauge({ probability, label = 'Default Probability', size = 'md' }: DefaultGaugeProps) {
  const clampedProb = Math.max(0, Math.min(100, probability));
  
  // SVG parameters
  const sizeConfig = {
    sm: { width: 120, height: 80, strokeWidth: 8, fontSize: 14 },
    md: { width: 180, height: 110, strokeWidth: 12, fontSize: 20 },
    lg: { width: 240, height: 140, strokeWidth: 16, fontSize: 28 },
  };
  
  const { width, height, strokeWidth, fontSize } = sizeConfig[size];
  const centerX = width / 2;
  const centerY = height - 10;
  const radius = (width - strokeWidth * 2) / 2 - 10;
  
  // Create arc path (180 degree arc)
  const startAngle = Math.PI;
  const endAngle = 0;
  const angle = startAngle - (clampedProb / 100) * Math.PI;
  
  const startX = centerX + radius * Math.cos(startAngle);
  const startY = centerY + radius * Math.sin(startAngle);
  const endX = centerX + radius * Math.cos(endAngle);
  const endY = centerY + radius * Math.sin(endAngle);
  const currentX = centerX + radius * Math.cos(angle);
  const currentY = centerY + radius * Math.sin(angle);
  
  // Color gradient based on probability
  const getColor = (prob: number) => {
    if (prob < 5) return 'hsl(142, 76%, 36%)';
    if (prob < 15) return 'hsl(80, 60%, 45%)';
    if (prob < 30) return 'hsl(45, 93%, 47%)';
    if (prob < 50) return 'hsl(25, 90%, 50%)';
    return 'hsl(0, 84%, 60%)';
  };
  
  const color = getColor(clampedProb);
  
  // Create arc path
  const describeArc = (x: number, y: number, r: number, startAngle: number, sweepAngle: number) => {
    const start = {
      x: x + r * Math.cos(startAngle),
      y: y + r * Math.sin(startAngle),
    };
    const end = {
      x: x + r * Math.cos(startAngle - sweepAngle),
      y: y + r * Math.sin(startAngle - sweepAngle),
    };
    const largeArcFlag = sweepAngle > Math.PI ? 1 : 0;
    
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
  };
  
  const backgroundPath = describeArc(centerX, centerY, radius, Math.PI, Math.PI);
  const valuePath = describeArc(centerX, centerY, radius, Math.PI, (clampedProb / 100) * Math.PI);

  return (
    <div className="flex flex-col items-center">
      <svg width={width} height={height} className="overflow-visible">
        {/* Gradient definition */}
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(142, 76%, 36%)" />
            <stop offset="25%" stopColor="hsl(80, 60%, 45%)" />
            <stop offset="50%" stopColor="hsl(45, 93%, 47%)" />
            <stop offset="75%" stopColor="hsl(25, 90%, 50%)" />
            <stop offset="100%" stopColor="hsl(0, 84%, 60%)" />
          </linearGradient>
          
          {/* Glow filter */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        {/* Background arc */}
        <path
          d={backgroundPath}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          opacity={0.3}
        />
        
        {/* Gradient background arc */}
        <path
          d={backgroundPath}
          fill="none"
          stroke="url(#gaugeGradient)"
          strokeWidth={strokeWidth / 2}
          strokeLinecap="round"
          opacity={0.2}
        />
        
        {/* Value arc */}
        <motion.path
          d={valuePath}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          filter="url(#glow)"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
        
        {/* Tick marks */}
        {[0, 25, 50, 75, 100].map((tick) => {
          const tickAngle = Math.PI - (tick / 100) * Math.PI;
          const innerR = radius - strokeWidth - 5;
          const outerR = radius + strokeWidth / 2 + 3;
          return (
            <g key={tick}>
              <line
                x1={centerX + innerR * Math.cos(tickAngle)}
                y1={centerY + innerR * Math.sin(tickAngle)}
                x2={centerX + outerR * Math.cos(tickAngle)}
                y2={centerY + outerR * Math.sin(tickAngle)}
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={1}
                opacity={0.5}
              />
              <text
                x={centerX + (radius + strokeWidth + 12) * Math.cos(tickAngle)}
                y={centerY + (radius + strokeWidth + 12) * Math.sin(tickAngle)}
                fontSize={8}
                fill="hsl(var(--muted-foreground))"
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {tick}%
              </text>
            </g>
          );
        })}
        
        {/* Center value */}
        <text
          x={centerX}
          y={centerY - 15}
          fontSize={fontSize}
          fontWeight="bold"
          fill={color}
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {clampedProb.toFixed(1)}%
        </text>
      </svg>
      
      <span className="text-sm text-muted-foreground mt-1">{label}</span>
    </div>
  );
}
