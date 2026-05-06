import { useEffect, useRef, useCallback } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickSeries, LineSeries, UTCTimestamp } from 'lightweight-charts';
import { CandleData } from '@/stores/useTradeStore';

interface Props {
  candles: CandleData[];
  entryPrice?: number;
  targetPrice?: number;
  stopLoss?: number;
  currentPrice?: number;
  isProfitable?: boolean;
  direction?: 'LONG' | 'SHORT';
  isLive?: boolean;
  height?: number;
  entryTime?: number;
  exitTime?: number;
  exitPrice?: number;
}

const FONT = '"Times New Roman", Times, serif';

export default function LiveTradingChart({
  candles, entryPrice, targetPrice, stopLoss, currentPrice,
  isProfitable, direction, isLive, height = 480, entryTime, exitTime, exitPrice
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const entryLineRef = useRef<any>(null);
  const targetLineRef = useRef<any>(null);
  const stopLineRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const tint = isProfitable ? 'rgba(16,185,129,0.03)' : 'rgba(239,68,68,0.03)';
    const chart = createChart(containerRef.current, {
      layout: { background: { color: isLive ? tint : '#050505' }, textColor: '#a3a3a3', fontFamily: FONT },
      grid: { vertLines: { color: 'rgba(255,255,255,0.04)' }, horzLines: { color: 'rgba(255,255,255,0.04)' } },
      width: containerRef.current.clientWidth,
      height,
      crosshair: { mode: 1, vertLine: { color: 'rgba(255,255,255,0.15)', width: 1, style: 2 }, horzLine: { color: 'rgba(255,255,255,0.15)', width: 1, style: 2 } },
      timeScale: { borderColor: '#1a1a1a', timeVisible: true, rightOffset: 5 },
      rightPriceScale: { borderColor: '#1a1a1a' },
    });
    chartRef.current = chart;

    const series = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981', downColor: '#ef4444',
      borderUpColor: '#10b981', borderDownColor: '#ef4444',
      wickUpColor: '#10b981', wickDownColor: '#ef4444',
    });
    candleSeriesRef.current = series;

    const handleResize = () => {
      if (containerRef.current) chart.applyOptions({ width: containerRef.current.clientWidth });
    };
    window.addEventListener('resize', handleResize);
    return () => { window.removeEventListener('resize', handleResize); chart.remove(); };
  }, [height]);

  // Update background tint when profitability changes
  useEffect(() => {
    if (!chartRef.current || !isLive) return;
    const tint = isProfitable ? 'rgba(16,185,129,0.03)' : 'rgba(239,68,68,0.03)';
    chartRef.current.applyOptions({ layout: { background: { color: tint } } });
  }, [isProfitable, isLive]);

  // Update candle data
  useEffect(() => {
    if (!candleSeriesRef.current || candles.length === 0) return;
    const sorted = [...candles].sort((a, b) => a.time - b.time);
    const formatted = sorted.map(c => ({
      time: c.time as UTCTimestamp, open: c.open, high: c.high, low: c.low, close: c.close,
    }));
    candleSeriesRef.current.setData(formatted);
    chartRef.current?.timeScale().fitContent();
  }, [candles]);

  // Update last candle in real-time
  useEffect(() => {
    if (!candleSeriesRef.current || !currentPrice || candles.length === 0) return;
    const last = candles[candles.length - 1];
    candleSeriesRef.current.update({
      time: last.time as UTCTimestamp,
      open: last.open,
      high: Math.max(last.high, currentPrice),
      low: Math.min(last.low, currentPrice),
      close: currentPrice,
    });
  }, [currentPrice]);

  // Price lines: entry, target, stop
  useEffect(() => {
    if (!candleSeriesRef.current) return;
    // Remove old lines
    try {
      if (entryLineRef.current) candleSeriesRef.current.removePriceLine(entryLineRef.current);
      if (targetLineRef.current) candleSeriesRef.current.removePriceLine(targetLineRef.current);
      if (stopLineRef.current) candleSeriesRef.current.removePriceLine(stopLineRef.current);
    } catch {}

    if (entryPrice) {
      entryLineRef.current = candleSeriesRef.current.createPriceLine({
        price: entryPrice, color: '#3b82f6', lineWidth: 2, lineStyle: 2,
        axisLabelVisible: true, title: `ENTRY $${entryPrice.toFixed(2)}`,
      });
    }
    if (targetPrice) {
      targetLineRef.current = candleSeriesRef.current.createPriceLine({
        price: targetPrice, color: '#10b981', lineWidth: 2, lineStyle: 2,
        axisLabelVisible: true, title: `TARGET $${targetPrice.toFixed(2)}`,
      });
    }
    if (stopLoss) {
      stopLineRef.current = candleSeriesRef.current.createPriceLine({
        price: stopLoss, color: '#ef4444', lineWidth: 2, lineStyle: 2,
        axisLabelVisible: true, title: `STOP $${stopLoss.toFixed(2)}`,
      });
    }
  }, [entryPrice, targetPrice, stopLoss]);

  // Markers for entry/exit in post-trade view
  useEffect(() => {
    if (!candleSeriesRef.current || !exitTime || !exitPrice) return;
    const markers: any[] = [];
    if (entryTime && entryPrice) {
      markers.push({
        time: Math.floor(entryTime / 1000) as UTCTimestamp,
        position: direction === 'LONG' ? 'belowBar' : 'aboveBar',
        color: '#3b82f6', shape: direction === 'LONG' ? 'arrowUp' : 'arrowDown',
        text: `ENTRY $${entryPrice.toFixed(2)}`,
      });
    }
    if (exitTime && exitPrice) {
      const isWin = direction === 'LONG' ? exitPrice > (entryPrice || 0) : exitPrice < (entryPrice || 0);
      markers.push({
        time: Math.floor(exitTime / 1000) as UTCTimestamp,
        position: direction === 'LONG' ? 'aboveBar' : 'belowBar',
        color: isWin ? '#10b981' : '#ef4444', shape: isWin ? 'arrowUp' : 'arrowDown',
        text: `EXIT $${exitPrice.toFixed(2)}`,
      });
    }
    if (markers.length > 0) {
      markers.sort((a, b) => (a.time as number) - (b.time as number));
      candleSeriesRef.current.setMarkers(markers);
    }
  }, [exitTime, exitPrice, entryTime, entryPrice, direction]);

  return <div ref={containerRef} style={{ width: '100%', borderRadius: 4 }} />;
}
