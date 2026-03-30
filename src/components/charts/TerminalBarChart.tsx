import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import { ChartContainer } from './ChartContainer';
import { TerminalTooltip } from './TerminalTooltip';
import { 
  chartColors, 
  seriesColors, 
  chartDimensions,
  formatters,
  getValueColor,
} from './chartTheme';

interface DataPoint {
  [key: string]: string | number;
}

interface BarConfig {
  dataKey: string;
  name?: string;
  color?: string;
  stackId?: string;
  radius?: number | [number, number, number, number];
}

interface TerminalBarChartProps {
  data: DataPoint[];
  bars: BarConfig[];
  xAxisKey: string;
  title?: string;
  subtitle?: string;
  height?: number;
  showGrid?: boolean;
  showZeroLine?: boolean;
  colorByValue?: boolean;
  layout?: 'vertical' | 'horizontal';
  yAxisFormatter?: (value: number) => string;
  xAxisFormatter?: (value: string) => string;
  tooltipFormatter?: (value: number, name: string) => string;
  animate?: boolean;
  className?: string;
  barGap?: number;
  barCategoryGap?: string | number;
}

/**
 * Premium terminal-style bar chart with gradients and rounded corners
 */
export function TerminalBarChart({
  data,
  bars,
  xAxisKey,
  title,
  subtitle,
  height = 300,
  showGrid = true,
  showZeroLine = false,
  colorByValue = false,
  layout = 'horizontal',
  yAxisFormatter = formatters.number,
  xAxisFormatter,
  tooltipFormatter,
  animate = true,
  className,
  barGap = 4,
  barCategoryGap = '20%',
}: TerminalBarChartProps) {
  // Generate gradient IDs for each bar
  const barGradients = useMemo(() => {
    return bars.map((bar, index) => {
      const color = bar.color || seriesColors[index % seriesColors.length];
      return {
        id: `bar-gradient-${index}`,
        color,
      };
    });
  }, [bars]);

  const isVertical = layout === 'vertical';

  return (
    <ChartContainer
      title={title}
      subtitle={subtitle}
      height={height}
      className={className}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout={layout}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          barGap={barGap}
          barCategoryGap={barCategoryGap}
        >
          {/* Gradient definitions */}
          <defs>
            {barGradients.map((grad) => (
              <linearGradient
                key={grad.id}
                id={grad.id}
                x1={isVertical ? '0' : '0'}
                y1={isVertical ? '0' : '0'}
                x2={isVertical ? '1' : '0'}
                y2={isVertical ? '0' : '1'}
              >
                <stop offset="0%" stopColor={grad.color} stopOpacity={0.9} />
                <stop offset="100%" stopColor={grad.color} stopOpacity={0.6} />
              </linearGradient>
            ))}
            {/* Profit/loss gradients for colorByValue */}
            <linearGradient id="bar-gradient-profit" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={chartColors.profit} stopOpacity={0.9} />
              <stop offset="100%" stopColor={chartColors.profitDark} stopOpacity={0.6} />
            </linearGradient>
            <linearGradient id="bar-gradient-loss" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={chartColors.loss} stopOpacity={0.9} />
              <stop offset="100%" stopColor={chartColors.lossDark} stopOpacity={0.6} />
            </linearGradient>
          </defs>

          {/* Grid */}
          {showGrid && (
            <CartesianGrid
              strokeDasharray="none"
              stroke={chartColors.grid}
              strokeOpacity={0.4}
              horizontal={!isVertical}
              vertical={isVertical}
            />
          )}

          {/* Axes */}
          {isVertical ? (
            <>
              <YAxis
                dataKey={xAxisKey}
                type="category"
                axisLine={{ stroke: chartColors.gridSubtle }}
                tickLine={false}
                tick={{
                  fill: chartColors.axisTick,
                  fontSize: chartDimensions.axisFontSize,
                  fontFamily: 'JetBrains Mono, monospace',
                }}
                width={80}
              />
              <XAxis
                type="number"
                axisLine={{ stroke: chartColors.gridSubtle }}
                tickLine={false}
                tick={{
                  fill: chartColors.axisTick,
                  fontSize: chartDimensions.axisFontSize,
                  fontFamily: 'JetBrains Mono, monospace',
                }}
                tickFormatter={yAxisFormatter}
              />
            </>
          ) : (
            <>
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
            </>
          )}

          {/* Zero reference line */}
          {showZeroLine && (
            <ReferenceLine
              y={isVertical ? undefined : 0}
              x={isVertical ? 0 : undefined}
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
                colorByValue={colorByValue}
              />
            }
            cursor={{
              fill: chartColors.elevatedSurface,
              fillOpacity: 0.5,
            }}
          />

          {/* Bars */}
          {bars.map((bar, barIndex) => {
            const defaultRadius: [number, number, number, number] = isVertical 
              ? [0, chartDimensions.barRadius, chartDimensions.barRadius, 0]
              : [chartDimensions.barRadius, chartDimensions.barRadius, 0, 0];

            return (
              <Bar
                key={bar.dataKey}
                dataKey={bar.dataKey}
                name={bar.name || bar.dataKey}
                fill={colorByValue ? undefined : `url(#${barGradients[barIndex].id})`}
                stackId={bar.stackId}
                radius={bar.radius ?? defaultRadius}
                isAnimationActive={animate}
                animationDuration={500}
                animationEasing="ease-out"
              >
                {colorByValue && data.map((entry, index) => {
                  const value = entry[bar.dataKey] as number;
                  const isProfit = value >= 0;
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={isProfit ? 'url(#bar-gradient-profit)' : 'url(#bar-gradient-loss)'}
                      style={{
                        filter: `drop-shadow(0 0 4px ${isProfit ? chartColors.profit : chartColors.loss})`,
                      }}
                    />
                  );
                })}
              </Bar>
            );
          })}
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

export default TerminalBarChart;
