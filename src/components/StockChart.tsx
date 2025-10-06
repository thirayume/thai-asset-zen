import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from "recharts";
import { calculateSMA, formatTimePeriod, getDateRange, formatVolume } from "@/lib/chartUtils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StockChartProps {
  symbol: string;
  stockName: string;
  currentPrice: number;
  changePercent: number;
}

type TimePeriod = "1D" | "1W" | "1M" | "3M" | "1Y";

const StockChart = ({ symbol, stockName, currentPrice, changePercent }: StockChartProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("1M");
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMA20, setShowMA20] = useState(true);
  const [showMA50, setShowMA50] = useState(true);

  useEffect(() => {
    const fetchHistoricalData = async () => {
      setLoading(true);
      
      const { startDate } = getDateRange(selectedPeriod);
      
      const { data, error } = await supabase
        .from("stock_price_history")
        .select("*")
        .eq("stock_symbol", symbol)
        .gte("recorded_at", startDate.toISOString())
        .order("recorded_at", { ascending: true });

      if (error) {
        console.error("Error fetching historical data:", error);
        setLoading(false);
        return;
      }

      if (data && data.length > 0) {
        const formattedData = data.map((item) => ({
          date: new Date(item.recorded_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: selectedPeriod === "1D" ? "2-digit" : undefined,
            minute: selectedPeriod === "1D" ? "2-digit" : undefined,
          }),
          open: Number(item.open_price || 0),
          high: Number(item.high_price || 0),
          low: Number(item.low_price || 0),
          close: Number(item.close_price || 0),
          volume: Number(item.volume || 0),
        }));

        // Calculate moving averages
        const ma20 = calculateSMA(formattedData, 20);
        const ma50 = calculateSMA(formattedData, 50);

        const enrichedData = formattedData.map((item, index) => ({
          ...item,
          ma20: ma20[index],
          ma50: ma50[index],
        }));

        setChartData(enrichedData);
      } else {
        setChartData([]);
      }
      
      setLoading(false);
    };

    fetchHistoricalData();
  }, [symbol, selectedPeriod]);

  const periods: TimePeriod[] = ["1D", "1W", "1M", "3M", "1Y"];

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl">
              {stockName} ({symbol})
            </CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-3xl font-bold">฿{currentPrice.toFixed(2)}</span>
              <span
                className={`flex items-center gap-1 text-lg font-semibold ${
                  changePercent >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {changePercent >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                {changePercent >= 0 ? "+" : ""}
                {changePercent.toFixed(2)}%
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            {periods.map((period) => (
              <Button
                key={period}
                variant={selectedPeriod === period ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedPeriod(period)}
              >
                {period}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-96 flex items-center justify-center text-muted-foreground">
            No historical data available for {formatTimePeriod(selectedPeriod)}
          </div>
        ) : (
          <>
            <div className="mb-4 flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showMA20}
                  onChange={(e) => setShowMA20(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">MA20</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showMA50}
                  onChange={(e) => setShowMA50(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">MA50</span>
              </label>
            </div>

            {/* Price Chart */}
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--foreground))" />
                <YAxis stroke="hsl(var(--foreground))" domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="close"
                  fill="hsl(var(--primary) / 0.2)"
                  stroke="hsl(var(--primary))"
                  name="Price"
                />
                {showMA20 && (
                  <Line
                    type="monotone"
                    dataKey="ma20"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={false}
                    name="MA20"
                  />
                )}
                {showMA50 && (
                  <Line
                    type="monotone"
                    dataKey="ma50"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={false}
                    name="MA50"
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>

            {/* Volume Chart */}
            <ResponsiveContainer width="100%" height={150} className="mt-8">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--foreground))" />
                <YAxis
                  stroke="hsl(var(--foreground))"
                  tickFormatter={(value) => formatVolume(value)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => formatVolume(value)}
                />
                <Bar dataKey="volume" fill="hsl(var(--primary) / 0.6)" name="Volume" />
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default StockChart;
