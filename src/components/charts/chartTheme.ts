/**
 * QuantSuite Terminal Chart Theme
 * Professional trading terminal visualization constants
 */

// Terminal color palette (HSL values for Recharts)
export const chartColors = {
  // Background layers
  terminalBase: 'hsl(220 26% 4%)',
  panelBg: 'hsl(220 20% 6%)',
  elevatedSurface: 'hsl(220 20% 8%)',
  
  // Grid & axis
  grid: 'hsl(220 20% 15%)',
  gridSubtle: 'hsl(220 20% 12%)',
  axisLabel: 'hsl(210 20% 65%)',
  axisTick: 'hsl(210 20% 55%)',
  
  // Trading colors
  profit: 'hsl(152 69% 45%)',
  profitLight: 'hsl(152 69% 55%)',
  profitDark: 'hsl(152 69% 35%)',
  loss: 'hsl(0 84% 60%)',
  lossLight: 'hsl(0 84% 70%)',
  lossDark: 'hsl(0 84% 50%)',
  
  // Accent colors
  cyan: 'hsl(198 93% 60%)',
  cyanLight: 'hsl(198 93% 70%)',
  cyanDark: 'hsl(198 93% 45%)',
  amber: 'hsl(45 93% 58%)',
  amberLight: 'hsl(45 93% 68%)',
  purple: 'hsl(262 83% 58%)',
  purpleLight: 'hsl(262 83% 68%)',
  
  // Neutral
  neutral: 'hsl(220 20% 60%)',
  neutralLight: 'hsl(220 20% 70%)',
  neutralDark: 'hsl(220 20% 40%)',
  
  // Text
  foreground: 'hsl(210 20% 95%)',
  muted: 'hsl(215 15% 65%)',
};

// Chart series color palette (for multi-line/multi-bar charts)
export const seriesColors = [
  chartColors.cyan,
  chartColors.profit,
  chartColors.amber,
  chartColors.purple,
  chartColors.loss,
  chartColors.neutralLight,
];

// Gradient definitions for SVG charts
export const gradients = {
  profit: {
    id: 'gradient-profit',
    stops: [
      { offset: '0%', color: chartColors.profit, opacity: 0.4 },
      { offset: '100%', color: chartColors.profitDark, opacity: 0.05 },
    ],
  },
  loss: {
    id: 'gradient-loss',
    stops: [
      { offset: '0%', color: chartColors.loss, opacity: 0.4 },
      { offset: '100%', color: chartColors.lossDark, opacity: 0.05 },
    ],
  },
  cyan: {
    id: 'gradient-cyan',
    stops: [
      { offset: '0%', color: chartColors.cyan, opacity: 0.4 },
      { offset: '100%', color: chartColors.cyanDark, opacity: 0.05 },
    ],
  },
  amber: {
    id: 'gradient-amber',
    stops: [
      { offset: '0%', color: chartColors.amber, opacity: 0.35 },
      { offset: '100%', color: chartColors.amber, opacity: 0.05 },
    ],
  },
  purple: {
    id: 'gradient-purple',
    stops: [
      { offset: '0%', color: chartColors.purple, opacity: 0.35 },
      { offset: '100%', color: chartColors.purple, opacity: 0.05 },
    ],
  },
  neutral: {
    id: 'gradient-neutral',
    stops: [
      { offset: '0%', color: chartColors.neutral, opacity: 0.3 },
      { offset: '100%', color: chartColors.neutralDark, opacity: 0.05 },
    ],
  },
};

// Pie/Donut chart segment colors with gradients
export const pieColors = [
  { fill: chartColors.cyan, stroke: chartColors.cyanLight },
  { fill: chartColors.profit, stroke: chartColors.profitLight },
  { fill: chartColors.amber, stroke: chartColors.amberLight },
  { fill: chartColors.purple, stroke: chartColors.purpleLight },
  { fill: chartColors.loss, stroke: chartColors.lossLight },
  { fill: chartColors.neutral, stroke: chartColors.neutralLight },
];

// Animation configurations
export const chartAnimations = {
  // Line drawing animation
  pathDraw: {
    duration: 800,
    easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
  },
  // Data point reveal
  pointReveal: {
    duration: 300,
    stagger: 30,
  },
  // Pie segment entry
  pieEntry: {
    duration: 600,
    stagger: 80,
    easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
  // Bar grow animation
  barGrow: {
    duration: 500,
    stagger: 50,
  },
  // Number morphing
  numberMorph: {
    duration: 400,
  },
};

// Chart dimension defaults
export const chartDimensions = {
  containerPadding: 24,
  axisFontSize: 11,
  labelFontSize: 12,
  tooltipPadding: { x: 16, y: 12 },
  lineStrokeWidth: 2.5,
  barRadius: 4,
  donutInnerRadius: '55%',
  donutOuterRadius: '85%',
};

// Glow/shadow effects
export const chartEffects = {
  lineGlow: (color: string) => `drop-shadow(0 0 8px ${color})`,
  segmentGlow: (color: string) => `drop-shadow(0 0 12px ${color})`,
  cardGlow: '0 0 30px hsl(198 93% 60% / 0.15)',
  profitGlow: '0 0 20px hsl(152 69% 45% / 0.3)',
  lossGlow: '0 0 20px hsl(0 84% 60% / 0.3)',
};

// Tooltip styling
export const tooltipStyles = {
  background: 'hsl(220 20% 8% / 0.95)',
  border: '1px solid hsl(198 93% 60% / 0.2)',
  borderRadius: '8px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px hsl(198 93% 60% / 0.1)',
  backdropFilter: 'blur(12px)',
};

// Format utilities
export const formatters = {
  percent: (value: number) => `${(value * 100).toFixed(2)}%`,
  percentSimple: (value: number) => `${value.toFixed(2)}%`,
  currency: (value: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value),
  currencyCompact: (value: number) => {
    if (Math.abs(value) >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (Math.abs(value) >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (Math.abs(value) >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
    return `$${value.toFixed(2)}`;
  },
  number: (value: number, decimals = 2) => value.toFixed(decimals),
  numberCompact: (value: number) => {
    if (Math.abs(value) >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
    if (Math.abs(value) >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
    if (Math.abs(value) >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
    return value.toFixed(2);
  },
};

// Get color based on value (profit/loss)
export const getValueColor = (value: number): string => {
  if (value > 0) return chartColors.profit;
  if (value < 0) return chartColors.loss;
  return chartColors.neutral;
};

// Get gradient ID based on value
export const getValueGradient = (value: number): string => {
  if (value > 0) return `url(#${gradients.profit.id})`;
  if (value < 0) return `url(#${gradients.loss.id})`;
  return `url(#${gradients.neutral.id})`;
};
