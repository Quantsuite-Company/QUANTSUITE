import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { motion } from 'framer-motion';
import { ChartContainer } from './ChartContainer';
import { TerminalTooltip } from './TerminalTooltip';
import { 
  chartColors, 
  seriesColors, 
  gradients, 
  chartDimensions,
  formatters,
} from './chartTheme';

interface DataPoint {
  [key: string]: string | number;
}

interface LineConfig {
  dataKey: string;
  name?: string;
  color?: string;
  strokeWidth?: number;
  dot?: boolean;
  showArea?: boolean;
  dashed?: boolean;
}

interface TerminalLineChartProps {
  data: DataPoint[];
  lines: LineConfig[];
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
}

/**
 * Premium terminal-style line chart with gradients and glow effects
 */
export function TerminalLineChart({
  data,
  lines,
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
}: TerminalLineChartProps) {
  // Generate gradient IDs for each line
  const lineGradients = useMemo(() => {
    return lines.map((line, index) => {
      const color = line.color || seriesColors[index % seriesColors.length];
      return {
        id: `line-gradient-${index}`,
        color,
      };
    });
  }, [lines]);

  return (
    <ChartContainer
      title={title}
      subtitle={subtitle}
      height={height}
      className={className}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          {/* Additional gradient definitions for area fills */}
          <defs>
            {lineGradients.map((grad, idx) => (
              <linearGradient
                key={grad.id}
                id={grad.id}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={grad.color} stopOpacity={0.3} />
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
                colorByValue={lines.length === 1}
              />
            }
            cursor={{
              stroke: chartColors.cyan,
              strokeOpacity: 0.3,
              strokeWidth: 1,
            }}
          />

          {/* Lines */}
          {lines.map((line, index) => {
            const color = line.color || seriesColors[index % seriesColors.length];
            
            return (
              <Line
                key={line.dataKey}
                type="monotone"
                dataKey={line.dataKey}
                name={line.name || line.dataKey}
                stroke={color}
                strokeWidth={line.strokeWidth || chartDimensions.lineStrokeWidth}
                strokeDasharray={line.dashed ? '8 4' : undefined}
                dot={line.dot ? {
                  fill: color,
                  stroke: chartColors.panelBg,
                  strokeWidth: 2,
                  r: 4,
                } : false}
                activeDot={{
                  fill: color,
                  stroke: chartColors.foreground,
                  strokeWidth: 2,
                  r: 6,
                  style: {
                    filter: `drop-shadow(0 0 6px ${color})`,
                  },
                }}
                // Area fill for gradient effect
                fill={line.showArea ? `url(#${lineGradients[index].id})` : 'none'}
                fillOpacity={line.showArea ? 1 : 0}
                // Animation
                isAnimationActive={animate}
                animationDuration={800}
                animationEasing="ease-out"
                // Glow effect via filter
                style={{
                  filter: `drop-shadow(0 0 4px ${color})`,
                }}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

export default TerminalLineChart;
