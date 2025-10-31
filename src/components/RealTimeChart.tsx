import { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, UTCTimestamp } from 'lightweight-charts';
import { supabase } from '@/integrations/supabase/client';
import { Card } from './ui/card';

interface RealTimeChartProps {
  symbol: string;
  height?: number;
}

export function RealTimeChart({ symbol, height = 600 }: RealTimeChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const lineSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [lastPrice, setLastPrice] = useState<number | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Initialize chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: 'hsl(var(--background))' },
        textColor: 'hsl(var(--foreground))',
      },
      grid: {
        vertLines: { color: 'hsl(var(--border))' },
        horzLines: { color: 'hsl(var(--border))' },
      },
      width: chartContainerRef.current.clientWidth,
      height: height,
      timeScale: {
        timeVisible: true,
        secondsVisible: true,
      },
    });

    const lineSeries = chart.addLineSeries({
      color: 'hsl(var(--primary))',
      lineWidth: 2,
    });

    chartRef.current = chart;
    lineSeriesRef.current = lineSeries;

    // Load recent historical data
    loadRecentData(symbol, lineSeries);

    // Subscribe to real-time updates
    const channel = supabase
      .channel('mt5_prices')
      .on('broadcast', { event: 'price_update' }, (payload) => {
        if (payload.payload.symbol === symbol) {
          const { bid, time } = payload.payload;
          const timestamp = Math.floor(new Date(time).getTime() / 1000) as UTCTimestamp;
          
          lineSeries.update({
            time: timestamp,
            value: parseFloat(bid),
          });
          
          setLastPrice(parseFloat(bid));
          setIsLive(true);
        }
      })
      .subscribe();

    // Handle window resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      channel.unsubscribe();
      chart.remove();
    };
  }, [symbol, height]);

  return (
    <Card className="relative p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{symbol}</h3>
        <div className="flex items-center gap-4">
          {lastPrice && (
            <span className="text-2xl font-bold text-primary">
              {lastPrice.toFixed(5)}
            </span>
          )}
          {isLive && (
            <div className="flex items-center gap-2 bg-green-500/20 px-3 py-1.5 rounded-full backdrop-blur-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs font-medium text-green-400">LIVE</span>
            </div>
          )}
        </div>
      </div>
      <div ref={chartContainerRef} className="w-full rounded-lg" />
    </Card>
  );
}

async function loadRecentData(symbol: string, lineSeries: ISeriesApi<'Line'>) {
  try {
    const { data, error } = await supabase
      .from('mt5_ticks')
      .select('bid, timestamp')
      .eq('symbol', symbol)
      .order('timestamp', { ascending: true })
      .limit(500);

    if (error) {
      console.error('Failed to load historical data:', error);
      return;
    }

    if (data && data.length > 0) {
      const chartData = data.map(tick => ({
        time: Math.floor(new Date(tick.timestamp).getTime() / 1000) as UTCTimestamp,
        value: parseFloat(String(tick.bid)),
      }));
      
      lineSeries.setData(chartData);
    }
  } catch (error) {
    console.error('Failed to load historical data:', error);
  }
}
