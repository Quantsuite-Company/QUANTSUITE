import React, { useState, useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Sector,
} from 'recharts';
import { motion } from 'framer-motion';
import { ChartContainer } from './ChartContainer';
import { TerminalTooltip } from './TerminalTooltip';
import { 
  chartColors, 
  pieColors, 
  chartDimensions,
  formatters,
} from './chartTheme';

interface DataPoint {
  name: string;
  value: number;
  color?: string;
}

interface TerminalPieChartProps {
  data: DataPoint[];
  title?: string;
  subtitle?: string;
  height?: number;
  innerRadius?: string | number;
  outerRadius?: string | number;
  showLabels?: boolean;
  showLegend?: boolean;
  legendPosition?: 'right' | 'bottom';
  valueFormatter?: (value: number) => string;
  animate?: boolean;
  className?: string;
  centerLabel?: React.ReactNode;
}

// Active shape renderer for hover state
const renderActiveShape = (props: any) => {
  const {
    cx,
    cy,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
    payload,
    value,
    percent,
  } = props;

  return (
    <g>
      {/* Outer glow ring */}
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={outerRadius + 4}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        opacity={0.3}
        style={{
          filter: `drop-shadow(0 0 8px ${fill})`,
        }}
      />
      {/* Main sector - slightly expanded */}
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 4}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        style={{
          filter: `drop-shadow(0 0 12px ${fill})`,
        }}
      />
      {/* Inner ring highlight */}
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius - 2}
        outerRadius={innerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        opacity={0.6}
      />
    </g>
  );
};

/**
 * Premium terminal-style donut/pie chart with glow effects
 */
export function TerminalPieChart({
  data,
  title,
  subtitle,
  height = 300,
  innerRadius = chartDimensions.donutInnerRadius,
  outerRadius = chartDimensions.donutOuterRadius,
  showLabels = false,
  showLegend = true,
  legendPosition = 'right',
  valueFormatter = formatters.percentSimple,
  animate = true,
  className,
  centerLabel,
}: TerminalPieChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const total = useMemo(() => data.reduce((sum, item) => sum + item.value, 0), [data]);

  const handleMouseEnter = (_: unknown, index: number) => {
    setActiveIndex(index);
  };

  const handleMouseLeave = () => {
    setActiveIndex(null);
  };

  const isBottomLegend = legendPosition === 'bottom';

  return (
    <ChartContainer
      title={title}
      subtitle={subtitle}
      height={isBottomLegend ? height + 80 : height}
      className={className}
    >
      <div className={`flex ${isBottomLegend ? 'flex-col' : 'flex-row'} h-full`}>
        {/* Chart */}
        <div className={`${showLegend && !isBottomLegend ? 'flex-1' : 'w-full'} relative`}>
          <ResponsiveContainer width="100%" height={isBottomLegend ? height - 80 : '100%'}>
            <PieChart>
              <defs>
                {/* Gradient definitions for each segment */}
                {data.map((entry, index) => {
                  const color = entry.color || pieColors[index % pieColors.length].fill;
                  return (
                    <linearGradient
                      key={`pie-gradient-${index}`}
                      id={`pie-gradient-${index}`}
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="1"
                    >
                      <stop offset="0%" stopColor={color} stopOpacity={1} />
                      <stop offset="100%" stopColor={color} stopOpacity={0.7} />
                    </linearGradient>
                  );
                })}
              </defs>

              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={innerRadius}
                outerRadius={outerRadius}
                paddingAngle={2}
                dataKey="value"
                activeIndex={activeIndex ?? undefined}
                activeShape={renderActiveShape}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                isAnimationActive={animate}
                animationDuration={600}
                animationEasing="ease-out"
              >
                {data.map((entry, index) => {
                  const colors = pieColors[index % pieColors.length];
                  const customColor = entry.color;
                  
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={customColor || `url(#pie-gradient-${index})`}
                      stroke={customColor || colors.stroke}
                      strokeWidth={1}
                      style={{
                        filter: activeIndex === index 
                          ? `drop-shadow(0 0 12px ${customColor || colors.fill})`
                          : `drop-shadow(0 0 4px ${customColor || colors.fill})`,
                        transition: 'filter 0.2s ease',
                      }}
                    />
                  );
                })}
              </Pie>

              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const item = payload[0];
                  const percent = ((item.value as number) / total) * 100;
                  
                  return (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="px-4 py-3 rounded-lg"
                      style={{
                        background: 'hsl(220 20% 8% / 0.95)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid hsl(198 93% 60% / 0.2)',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ 
                            backgroundColor: item.payload.color || pieColors[payload.indexOf(item) % pieColors.length].fill,
                            boxShadow: `0 0 8px ${item.payload.color || pieColors[payload.indexOf(item) % pieColors.length].fill}`,
                          }}
                        />
                        <span className="text-sm font-medium text-foreground">
                          {item.name}
                        </span>
                      </div>
                      <div className="text-lg font-mono font-bold text-primary">
                        {valueFormatter(item.value as number)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {percent.toFixed(1)}% of total
                      </div>
                    </motion.div>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Center label */}
          {centerLabel && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                {centerLabel}
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        {showLegend && (
          <div className={`
            ${isBottomLegend 
              ? 'flex flex-wrap justify-center gap-4 pt-4' 
              : 'w-40 pl-4 flex flex-col justify-center gap-2'
            }
          `}>
            {data.map((entry, index) => {
              const colors = pieColors[index % pieColors.length];
              const color = entry.color || colors.fill;
              const percent = (entry.value / total) * 100;
              const isActive = activeIndex === index;
              
              return (
                <motion.div
                  key={entry.name}
                  className={`
                    flex items-center gap-2 cursor-pointer rounded-md px-2 py-1
                    ${isBottomLegend ? '' : 'w-full'}
                    transition-colors duration-200
                  `}
                  style={{
                    backgroundColor: isActive ? 'hsl(220 20% 12%)' : 'transparent',
                  }}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                  whileHover={{ x: isBottomLegend ? 0 : 4 }}
                >
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ 
                      backgroundColor: color,
                      boxShadow: isActive ? `0 0 8px ${color}` : 'none',
                      transition: 'box-shadow 0.2s ease',
                    }}
                  />
                  <div className={`${isBottomLegend ? 'flex items-center gap-2' : ''}`}>
                    <span 
                      className="text-xs truncate"
                      style={{ color: isActive ? chartColors.foreground : chartColors.muted }}
                    >
                      {entry.name}
                    </span>
                    {!isBottomLegend && (
                      <span className="text-xs font-mono text-muted-foreground">
                        {percent.toFixed(1)}%
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </ChartContainer>
  );
}

export default TerminalPieChart;
