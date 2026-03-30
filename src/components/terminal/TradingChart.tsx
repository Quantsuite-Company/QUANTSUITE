import { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, HistogramData, UTCTimestamp, CandlestickSeries, HistogramSeries } from 'lightweight-charts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, TrendingUp, Minus, Square, Type, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

type DrawingTool = 'trendline' | 'horizontal' | 'rectangle' | 'text' | null;

interface Point {
  time: number;
  price: number;
}

interface Drawing {
  id: string;
  type: DrawingTool;
  points: Point[];
  color: string;
  label?: string;
}

interface TradingChartProps {
  symbol: string;
  interval?: '1m' | '5m' | '1h' | '1d' | '1w';
  height?: number;
}

export const TradingChart = ({ symbol, interval = '1d', height = 500 }: TradingChartProps) => {
  const { user } = useAuth();
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  
  const [currentInterval, setCurrentInterval] = useState(interval);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drawingMode, setDrawingMode] = useState<DrawingTool>(null);
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [currentDrawing, setCurrentDrawing] = useState<Partial<Drawing> | null>(null);

  // Load saved drawings from database
  useEffect(() => {
    const loadDrawings = async () => {
      if (!user?.id) return;
      
      const { data, error } = await supabase
        .from("chart_drawings")
        .select("*")
        .eq("user_id", user.id)
        .eq("symbol", symbol);
      
      if (error) {
        console.error("Failed to load drawings:", error);
        return;
      }
      
      if (data) {
        setDrawings(data.map(d => ({
          id: d.id,
          type: d.drawing_type as DrawingTool,
          points: (d.points as unknown as Point[]),
          color: d.color,
          label: d.label || undefined
        })));
      }
    };
    
    loadDrawings();
  }, [user?.id, symbol]);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: 'transparent' },
        textColor: '#9CA3AF',
      },
      grid: {
        vertLines: { color: 'rgba(156, 163, 175, 0.1)' },
        horzLines: { color: 'rgba(156, 163, 175, 0.1)' },
      },
      width: chartContainerRef.current.clientWidth,
      height: height,
      crosshair: {
        mode: 1,
        vertLine: {
          width: 1,
          color: 'rgba(156, 163, 175, 0.5)',
          style: 1,
        },
        horzLine: {
          width: 1,
          color: 'rgba(156, 163, 175, 0.5)',
          style: 1,
        },
      },
      timeScale: {
        borderColor: 'rgba(156, 163, 175, 0.2)',
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: 'rgba(156, 163, 175, 0.2)',
      },
    });

    chartRef.current = chart;

    // Add candlestick series
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#22C55E',
      downColor: '#EF4444',
      borderUpColor: '#22C55E',
      borderDownColor: '#EF4444',
      wickUpColor: '#22C55E',
      wickDownColor: '#EF4444',
    });
    candlestickSeriesRef.current = candlestickSeries;

    // Add volume series
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#9CA3AF',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
    });
    volumeSeriesRef.current = volumeSeries;

    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ 
          width: chartContainerRef.current.clientWidth 
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [height]);

  useEffect(() => {
    const fetchChartData = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase.functions.invoke('fetch-stock-data', {
          body: { symbol, interval: currentInterval }
        });

        if (fetchError) throw fetchError;

        if (data?.chartData && candlestickSeriesRef.current && volumeSeriesRef.current) {
          const candleData: CandlestickData[] = data.chartData.map((item: any) => ({
            time: (new Date(item.date).getTime() / 1000) as UTCTimestamp,
            open: item.open,
            high: item.high,
            low: item.low,
            close: item.close,
          }));

          const volumeData: HistogramData[] = data.chartData.map((item: any) => ({
            time: (new Date(item.date).getTime() / 1000) as UTCTimestamp,
            value: item.volume,
            color: item.close >= item.open ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)',
          }));

          candlestickSeriesRef.current.setData(candleData);
          volumeSeriesRef.current.setData(volumeData);

          if (chartRef.current) {
            chartRef.current.timeScale().fitContent();
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch chart data');
        console.error('Chart data error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (symbol) {
      fetchChartData();
    }
  }, [symbol, currentInterval]);

  // Drawing click handlers
  useEffect(() => {
    if (!chartRef.current || !drawingMode) return;

    const handleClick = (param: any) => {
      if (!param.point || !candlestickSeriesRef.current) return;

      const price = candlestickSeriesRef.current.coordinateToPrice(param.point.y);
      const time = param.time;

      if (!price || !time) return;

      const point: Point = { time: time as number, price };

      if (!currentDrawing) {
        // Start new drawing
        setCurrentDrawing({
          id: Math.random().toString(36).substr(2, 9),
          type: drawingMode,
          points: [point],
          color: '#3B82F6',
        });
      } else {
        // Add point to current drawing
        const updatedPoints = [...(currentDrawing.points || []), point];

        // Complete drawing based on type
        if (drawingMode === 'horizontal') {
          // Horizontal line completes on first click
          completeDrawing({ ...currentDrawing, points: updatedPoints } as Drawing);
        } else if (drawingMode === 'trendline' && updatedPoints.length === 2) {
          // Trendline completes on second click
          completeDrawing({ ...currentDrawing, points: updatedPoints } as Drawing);
        } else if (drawingMode === 'rectangle' && updatedPoints.length === 2) {
          // Rectangle completes on second click
          completeDrawing({ ...currentDrawing, points: updatedPoints } as Drawing);
        } else if (drawingMode === 'text') {
          // Text completes on first click
          const label = prompt('Enter text:');
          if (label) {
            completeDrawing({ ...currentDrawing, points: updatedPoints, label } as Drawing);
          } else {
            setCurrentDrawing(null);
          }
        } else {
          setCurrentDrawing({ ...currentDrawing, points: updatedPoints });
        }
      }
    };

    chartRef.current.subscribeClick(handleClick);

    return () => {
      chartRef.current?.unsubscribeClick(handleClick);
    };
  }, [drawingMode, currentDrawing]);

  const completeDrawing = async (drawing: Drawing) => {
    if (!user?.id) {
      toast.error("Please log in to save drawings");
      setCurrentDrawing(null);
      setDrawingMode(null);
      return;
    }

    // Save to database
    const { data, error } = await supabase
      .from("chart_drawings")
      .insert([{
        user_id: user.id,
        symbol: symbol,
        drawing_type: drawing.type!,
        points: drawing.points as any,
        color: drawing.color,
        label: drawing.label
      }])
      .select()
      .single();
    
    if (error) {
      toast.error("Failed to save drawing");
      console.error(error);
      setCurrentDrawing(null);
      setDrawingMode(null);
      return;
    }
    
    // Update local state with DB id
    setDrawings(prev => [...prev, { ...drawing, id: data.id }]);
    setCurrentDrawing(null);
    setDrawingMode(null);
    toast.success("Drawing saved");
  };

  // Delete drawing
  const deleteDrawing = async (drawingId: string) => {
    if (!user?.id) return;
    
    const { error } = await supabase
      .from("chart_drawings")
      .delete()
      .eq("id", drawingId)
      .eq("user_id", user.id);
    
    if (error) {
      toast.error("Failed to delete drawing");
      console.error(error);
      return;
    }
    
    setDrawings(prev => prev.filter(d => d.id !== drawingId));
    toast.success("Drawing deleted");
  };

  // Render drawings on chart
  useEffect(() => {
    if (!chartRef.current || !candlestickSeriesRef.current) return;

    // Store references to clean up later
    const priceLines: any[] = [];

    // Render completed drawings
    drawings.forEach(drawing => {
      if (drawing.type === 'horizontal' && drawing.points.length >= 1) {
        const priceLine = candlestickSeriesRef.current!.createPriceLine({
          price: drawing.points[0].price,
          color: drawing.color,
          lineWidth: 2,
          lineStyle: 2, // Dashed
          axisLabelVisible: true,
          title: drawing.label || '',
        });
        priceLines.push(priceLine);
      }
      // Note: Trendlines and rectangles require more complex rendering
      // that lightweight-charts doesn't support natively
      // Would need custom canvas drawing or different library
    });

    // Cleanup function
    return () => {
      priceLines.forEach(line => {
        try {
          candlestickSeriesRef.current?.removePriceLine(line);
        } catch (e) {
          console.error('Error removing price line:', e);
        }
      });
    };
  }, [drawings]);


  const intervals = [
    { label: '1m', value: '1m' as const },
    { label: '5m', value: '5m' as const },
    { label: '1h', value: '1h' as const },
    { label: '1D', value: '1d' as const },
    { label: '1W', value: '1w' as const },
  ];

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">{symbol}</h3>
          {loading && <p className="text-sm text-muted-foreground">Loading chart data...</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <div className="flex gap-1">
          {intervals.map((int) => (
            <Button
              key={int.value}
              variant={currentInterval === int.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentInterval(int.value)}
              disabled={loading}
            >
              {int.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Drawing Toolbar */}
      <div className="flex gap-1 mb-3 flex-wrap">
        <Button
          size="sm"
          variant={drawingMode === 'horizontal' ? 'default' : 'outline'}
          onClick={() => setDrawingMode(drawingMode === 'horizontal' ? null : 'horizontal')}
          className="gap-1"
        >
          <Minus className="h-3 w-3" />
          H-Line
        </Button>
        {drawings.length > 0 && (
          <Button
            size="sm"
            variant="destructive"
            onClick={() => {
              drawings.forEach(d => deleteDrawing(d.id));
            }}
            className="gap-1"
          >
            <Trash2 className="h-3 w-3" />
            Clear All ({drawings.length})
          </Button>
        )}
        {drawingMode && (
          <span className="text-xs text-muted-foreground self-center ml-2">
            Click on chart to place line
          </span>
        )}
        {drawings.length > 0 && (
          <div className="flex flex-wrap gap-1 ml-2">
            {drawings.map(drawing => (
              <Button
                key={drawing.id}
                size="sm"
                variant="outline"
                onClick={() => deleteDrawing(drawing.id)}
                className="text-xs h-7"
              >
                @ {drawing.points[0]?.price?.toFixed(2)}
                <Trash2 className="w-3 h-3 ml-1" />
              </Button>
            ))}
          </div>
        )}
      </div>
      
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        )}
        <div ref={chartContainerRef} />
      </div>
    </Card>
  );
};
