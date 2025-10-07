import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from "recharts";
import { getDateRange, formatTimePeriod, calculateSMA } from "@/lib/chartUtils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface GoldPriceChartProps {
  goldType: string;
  currentBuyPrice: number;
  currentSellPrice: number;
  priceChange?: number;
}

type TimePeriod = "1D" | "1W" | "1M" | "3M" | "1Y";

const GoldPriceChart = ({ 
  goldType, 
  currentBuyPrice, 
  currentSellPrice,
  priceChange = 0 
}: GoldPriceChartProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("1M");
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMA20, setShowMA20] = useState(true);

  useEffect(() => {
    const fetchHistoricalData = async () => {
      setLoading(true);
      
      const { startDate } = getDateRange(selectedPeriod);
      
      const { data, error } = await supabase
        .from("gold_price_history")
        .select("*")
        .eq("gold_type", goldType)
        .gte("recorded_at", startDate.toISOString())
        .order("recorded_at", { ascending: true });

      if (error) {
        console.error("Error fetching historical gold data:", error);
        setLoading(false);
        return;
      }

      if (data && data.length > 0) {
        // Group by timestamp and price type
        const groupedData: { [key: string]: any } = {};
        
        data.forEach((item) => {
          const dateKey = new Date(item.recorded_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: selectedPeriod === "1D" ? "2-digit" : undefined,
            minute: selectedPeriod === "1D" ? "2-digit" : undefined,
          });
          
          if (!groupedData[dateKey]) {
            groupedData[dateKey] = { date: dateKey };
          }
          
          if (item.price_type === 'buy') {
            groupedData[dateKey].buy = Number(item.price_per_baht);
          } else if (item.price_type === 'sell') {
            groupedData[dateKey].sell = Number(item.price_per_baht);
          }
        });

        const formattedData = Object.values(groupedData).map(item => ({
          ...item,
          close: item.buy || item.sell || 0, // For MA calculation
        }));

        // Calculate moving average for buy prices
        const ma20 = calculateSMA(formattedData, 20);

        const enrichedData = formattedData.map((item, index) => ({
          ...item,
          ma20: ma20[index],
        }));

        setChartData(enrichedData);
      } else {
        setChartData([]);
      }
      
      setLoading(false);
    };

    fetchHistoricalData();
  }, [goldType, selectedPeriod]);

  const periods: TimePeriod[] = ["1D", "1W", "1M", "3M", "1Y"];

  const goldTypeLabel = goldType === "96.5%" ? "Gold Ornament (96.5%)" : "Gold Bar (99.99%)";

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
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="text-2xl">{goldTypeLabel}</CardTitle>
            <div className="flex items-center gap-4 mt-2 flex-wrap">
              <div>
                <span className="text-sm text-muted-foreground">Buy: </span>
                <span className="text-2xl font-bold text-green-600">
                  ฿{currentBuyPrice.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Sell: </span>
                <span className="text-2xl font-bold text-red-600">
                  ฿{currentSellPrice.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                </span>
              </div>
              {priceChange !== 0 && (
                <span
                  className={`flex items-center gap-1 text-lg font-semibold ${
                    priceChange >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {priceChange >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                  {priceChange >= 0 ? "+" : ""}
                  {priceChange.toFixed(2)}%
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
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
            </div>

            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(var(--foreground))"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="hsl(var(--foreground))" 
                  domain={['auto', 'auto']}
                  tickFormatter={(value) => `฿${value.toLocaleString()}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => `฿${value.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="buy"
                  fill="rgba(34, 197, 94, 0.2)"
                  stroke="#22c55e"
                  strokeWidth={2}
                  name="Buy Price"
                />
                <Line
                  type="monotone"
                  dataKey="sell"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={false}
                  name="Sell Price"
                />
                {showMA20 && (
                  <Line
                    type="monotone"
                    dataKey="ma20"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={false}
                    name="MA20"
                    strokeDasharray="5 5"
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default GoldPriceChart;
