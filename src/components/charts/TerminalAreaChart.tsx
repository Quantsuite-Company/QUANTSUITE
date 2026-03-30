import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { ChartContainer } from './ChartContainer';
import { TerminalTooltip } from './TerminalTooltip';
import { 
  chartColors, 
  seriesColors, 
  chartDimensions,
  formatters,
} from './chartTheme';

interface DataPoint {
  [key: string]: string | number;
}

interface AreaConfig {
  dataKey: string;
  name?: string;
  color?: string;
  fillOpacity?: number;
  strokeWidth?: number;
  stackId?: string;
}

interface TerminalAreaChartProps {
  data: DataPoint[];
  areas: AreaConfig[];
  xAxisKey: string;
  title?: string;
  subtitle?: string;
  height?: number;
  showGrid?: boolean;
  showZeroLine?: boolean;
  yAxisFormatter?: (value: number) => string;
  xAxisFormatter?: (value: string) => string;
  tooltipFormatter?: (value: number, name: string) => string;
  animate?: boolean;
  className?: string;
  stacked?: boolean;
}

/**
 * Premium terminal-style area chart with gradient fills
 */
export function TerminalAreaChart({
  data,
  areas,
  xAxisKey,
  title,
  subtitle,
  height = 300,
  showGrid = true,
  showZeroLine = false,
  yAxisFormatter = formatters.number,
  xAxisFormatter,
  tooltipFormatter,
  animate = true,
  className,
  stacked = false,
}: TerminalAreaChartProps) {
  // Generate gradient IDs for each area
  const areaGradients = useMemo(() => {
    return areas.map((area, index) => {
      const color = area.color || seriesColors[index % seriesColors.length];
      return {
        id: `area-gradient-${index}`,
        color,
      };
    });
  }, [areas]);

  return (
    <ChartContainer
      title={title}
      subtitle={subtitle}
      height={height}
      className={className}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          {/* Gradient definitions */}
          <defs>
            {areaGradients.map((grad) => (
              <linearGradient
                key={grad.id}
                id={grad.id}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={grad.color} stopOpacity={0.4} />
                <stop offset="50%" stopColor={grad.color} stopOpacity={0.15} />
                <stop offset="100%" stopColor={grad.color} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>

          {/* Grid */}
          {showGrid && (
            <CartesianGrid
              strokeDasharray="none"
              stroke={chartColors.grid}
              strokeOpacity={0.4}
              vertical={false}
            />
          )}

          {/* Axes */}
          <XAxis
            dataKey={xAxisKey}
            axisLine={{ stroke: chartColors.gridSubtle }}
            tickLine={{ stroke: chartColors.gridSubtle }}
            tick={{
              fill: chartColors.axisTick,
              fontSize: chartDimensions.axisFontSize,
              fontFamily: 'JetBrains Mono, monospace',
            }}
            tickFormatter={xAxisFormatter}
            dy={8}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{
              fill: chartColors.axisTick,
              fontSize: chartDimensions.axisFontSize,
              fontFamily: 'JetBrains Mono, monospace',
            }}
            tickFormatter={yAxisFormatter}
            dx={-8}
            width={60}
          />

          {/* Zero reference line */}
          {showZeroLine && (
            <ReferenceLine
              y={0}
              stroke={chartColors.neutral}
              strokeDasharray="4 4"
              strokeOpacity={0.5}
            />
          )}

          {/* Tooltip */}
          <Tooltip
            content={
              <TerminalTooltip
                formatter={tooltipFormatter}
                colorByValue={areas.length === 1}
              />
            }
            cursor={{
              stroke: chartColors.cyan,
              strokeOpacity: 0.3,
              strokeWidth: 1,
            }}
          />

          {/* Areas */}
          {areas.map((area, index) => {
            const color = area.color || seriesColors[index % seriesColors.length];
            
            return (
              <Area
                key={area.dataKey}
                type="monotone"
                dataKey={area.dataKey}
                name={area.name || area.dataKey}
                stroke={color}
                strokeWidth={area.strokeWidth || chartDimensions.lineStrokeWidth}
                fill={`url(#${areaGradients[index].id})`}
                fillOpacity={area.fillOpacity || 1}
                stackId={stacked ? 'stack' : area.stackId}
                // Animation
                isAnimationActive={animate}
                animationDuration={800}
                animationEasing="ease-out"
                // Glow effect
                style={{
                  filter: `drop-shadow(0 0 3px ${color})`,
                }}
                activeDot={{
                  fill: color,
                  stroke: chartColors.foreground,
                  strokeWidth: 2,
                  r: 5,
                  style: {
                    filter: `drop-shadow(0 0 6px ${color})`,
                  },
                }}
              />
            );
          })}
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

export default TerminalAreaChart;
