/**
 * AI Response Parser
 * 
 * Extracts structured visualization data from AI responses
 * Supports: pie charts, bar charts, line charts, area charts, ticker tables, comparisons
 */

export interface ChartConfig {
  type: 'pie' | 'bar' | 'line' | 'area';
  data: { name: string; value: number }[];
  title?: string;
  insertAfterParagraph?: number;
}

export interface TickerData {
  symbol: string;
  name?: string;
  price?: number;
  change?: number;
  weight?: number;
  action?: 'buy' | 'sell' | 'hold';
}

export interface ComparisonData {
  before: { label: string; value: string | number }[];
  after: { label: string; value: string | number }[];
  insertAfterParagraph?: number;
}

export interface MetricData {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
}

export interface ParsedAIResponse {
  prose: string;
  charts: ChartConfig[];
  tickers: TickerData[];
  comparisons: ComparisonData[];
  metrics: MetricData[];
}

/**
 * Parse AI response and extract visualization data
 */
export function parseAIResponse(rawResponse: string): ParsedAIResponse {
  let prose = rawResponse;
  const charts: ChartConfig[] = [];
  const tickers: TickerData[] = [];
  const comparisons: ComparisonData[] = [];
  const metrics: MetricData[] = [];

  // Extract chart blocks: ```chart:pie {...} ```
  const chartRegex = /```chart:(pie|bar|line|area)\s*\n([\s\S]*?)\n```/g;
  let chartMatch;
  while ((chartMatch = chartRegex.exec(rawResponse)) !== null) {
    try {
      const chartType = chartMatch[1] as 'pie' | 'bar' | 'line' | 'area';
      const chartJson = JSON.parse(chartMatch[2]);
      charts.push({
        type: chartType,
        data: chartJson.data || [],
        title: chartJson.title,
      });
      prose = prose.replace(chartMatch[0], '');
    } catch (e) {
      console.warn('Failed to parse chart data:', e);
    }
  }

  // Extract ticker tables: ```tickers [...] ```
  const tickerRegex = /```tickers\s*\n([\s\S]*?)\n```/g;
  let tickerMatch;
  while ((tickerMatch = tickerRegex.exec(rawResponse)) !== null) {
    try {
      const tickerData = JSON.parse(tickerMatch[1]);
      if (Array.isArray(tickerData)) {
        tickers.push(...tickerData.map((t: any) => ({
          symbol: t.symbol || '',
          name: t.name,
          price: typeof t.price === 'number' ? t.price : undefined,
          change: typeof t.change === 'number' ? t.change : undefined,
          weight: typeof t.weight === 'number' ? t.weight : undefined,
          action: t.action as 'buy' | 'sell' | 'hold' | undefined,
        })));
      }
      prose = prose.replace(tickerMatch[0], '');
    } catch (e) {
      console.warn('Failed to parse ticker data:', e);
    }
  }

  // Extract comparisons: ```comparison {...} ```
  const comparisonRegex = /```comparison\s*\n([\s\S]*?)\n```/g;
  let compMatch;
  while ((compMatch = comparisonRegex.exec(rawResponse)) !== null) {
    try {
      const compData = JSON.parse(compMatch[1]);
      comparisons.push({
        before: compData.before || [],
        after: compData.after || [],
      });
      prose = prose.replace(compMatch[0], '');
    } catch (e) {
      console.warn('Failed to parse comparison data:', e);
    }
  }

  // Extract metrics: ```metrics [...] ```
  const metricsRegex = /```metrics\s*\n([\s\S]*?)\n```/g;
  let metricsMatch;
  while ((metricsMatch = metricsRegex.exec(rawResponse)) !== null) {
    try {
      const metricsData = JSON.parse(metricsMatch[1]);
      if (Array.isArray(metricsData)) {
        metrics.push(...metricsData);
      }
      prose = prose.replace(metricsMatch[0], '');
    } catch (e) {
      console.warn('Failed to parse metrics data:', e);
    }
  }

  // Also extract regular JSON blocks that contain visualization data
  const jsonRegex = /```json\s*\n([\s\S]*?)\n```/g;
  let jsonMatch;
  while ((jsonMatch = jsonRegex.exec(rawResponse)) !== null) {
    try {
      const data = JSON.parse(jsonMatch[1]);
      
      // Check for specific visualization keys
      if (data.topMovers && Array.isArray(data.topMovers)) {
        tickers.push(...data.topMovers.map((m: any) => ({
          symbol: m.symbol || '',
          name: m.name,
          price: typeof m.price === 'number' ? m.price : undefined,
          change: typeof m.change === 'number' ? m.change : undefined,
        })));
      }
      
      if (data.sectorPerformance && Array.isArray(data.sectorPerformance)) {
        charts.push({
          type: 'pie',
          data: data.sectorPerformance.map((s: any) => ({
            name: s.sector || s.name,
            value: Math.abs(s.change || s.value || 0),
          })),
          title: 'Sector Performance',
        });
      }

      if (data.allocation && Array.isArray(data.allocation)) {
        charts.push({
          type: 'pie',
          data: data.allocation.map((a: any) => ({
            name: a.name || a.sector,
            value: a.value || a.weight || 0,
          })),
          title: 'Allocation',
        });
      }

      if (data.priceData && Array.isArray(data.priceData)) {
        charts.push({
          type: 'area',
          data: data.priceData.map((p: any) => ({
            name: p.time || p.date,
            value: p.price || p.value,
          })),
          title: 'Price Movement',
        });
      }

      prose = prose.replace(jsonMatch[0], '');
    } catch (e) {
      // Not all JSON blocks are visualization data, that's okay
    }
  }

  // If no explicit visualization data, try to extract implicit visualizations
  if (charts.length === 0 && tickers.length === 0) {
    const implicitData = extractImplicitVisualizations(prose);
    charts.push(...implicitData.charts);
    tickers.push(...implicitData.tickers);
  }

  // Clean up the prose
  prose = prose
    .replace(/```[\s\S]*?```/g, '') // Remove any remaining code blocks
    .trim();

  return { prose, charts, tickers, comparisons, metrics };
}

/**
 * Extract visualizations from prose content when AI doesn't provide explicit data
 */
function extractImplicitVisualizations(prose: string): { charts: ChartConfig[]; tickers: TickerData[] } {
  const charts: ChartConfig[] = [];
  const tickers: TickerData[] = [];

  // Pattern: "X% in Tech, Y% in Finance" - extract allocation data
  const allocationPattern = /(\d+(?:\.\d+)?)\s*%\s*(?:in|to|for)\s+([A-Za-z\s]+?)(?:,|\.|\s+and\s+)/gi;
  const allocations: { name: string; value: number }[] = [];
  let allocMatch;
  while ((allocMatch = allocationPattern.exec(prose)) !== null) {
    const value = parseFloat(allocMatch[1]);
    const name = allocMatch[2].trim();
    if (value > 0 && value <= 100 && name.length < 30) {
      allocations.push({ name, value });
    }
  }
  if (allocations.length >= 2) {
    charts.push({
      type: 'pie',
      data: allocations,
      title: 'Allocation Breakdown',
    });
  }

  // Pattern: "AAPL +2.5%, NVDA -1.2%" - extract ticker movements
  const tickerPattern = /\b([A-Z]{2,5})\s+([+-]?\d+(?:\.\d+)?%)/g;
  const excludeWords = new Set(['THE', 'AND', 'FOR', 'NOT', 'BUT', 'ARE', 'YOU', 'CAN', 'HAS', 'RSI', 'SMA', 'EMA', 'VIX', 'ETF', 'CEO', 'CFO', 'IPO', 'ROI', 'ROE', 'API']);
  let tickerMoveMatch;
  const seenTickers = new Set<string>();
  while ((tickerMoveMatch = tickerPattern.exec(prose)) !== null) {
    const symbol = tickerMoveMatch[1];
    const changeStr = tickerMoveMatch[2].replace('%', '');
    const change = parseFloat(changeStr);
    
    if (!excludeWords.has(symbol) && !seenTickers.has(symbol) && !isNaN(change)) {
      seenTickers.add(symbol);
      tickers.push({
        symbol,
        change,
        action: change > 0 ? 'buy' : change < 0 ? 'sell' : 'hold',
      });
    }
  }

  // Pattern: Just ticker symbols in uppercase - extract as potential tickers
  if (tickers.length === 0) {
    const symbolPattern = /\b([A-Z]{2,5})\b(?!\w)/g;
    let symbolMatch;
    const symbolCounts: { [key: string]: number } = {};
    while ((symbolMatch = symbolPattern.exec(prose)) !== null) {
      const symbol = symbolMatch[1];
      if (!excludeWords.has(symbol)) {
        symbolCounts[symbol] = (symbolCounts[symbol] || 0) + 1;
      }
    }
    
    // Get tickers mentioned multiple times (more likely to be actual stock symbols)
    const frequentSymbols = Object.entries(symbolCounts)
      .filter(([_, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([symbol]) => ({ symbol }));
    
    tickers.push(...frequentSymbols);
  }

  return { charts, tickers };
}

/**
 * Safe number formatting with type checking
 */
export function safeToFixed(value: unknown, decimals: number = 2): string {
  if (typeof value !== 'number' || isNaN(value)) {
    return '—';
  }
  return value.toFixed(decimals);
}

/**
 * Safe percentage formatting
 */
export function safePercent(value: unknown, decimals: number = 2): string {
  if (typeof value !== 'number' || isNaN(value)) {
    return '—';
  }
  const formatted = value.toFixed(decimals);
  return value >= 0 ? `+${formatted}%` : `${formatted}%`;
}
