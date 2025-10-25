import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, DollarSign, Target, PieChart as PieChartIcon } from "lucide-react";

interface Position {
  stock_symbol: string;
  stock_name: string;
  shares_owned: number;
  average_entry_price: number;
  sector?: string;
}

interface StockPrice {
  symbol: string;
  current_price: number;
}

export const PortfolioAnalytics = () => {
  const { data: positions = [] } = useQuery({
    queryKey: ["portfolio-positions"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("user_positions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active");

      if (error) throw error;
      return data as Position[];
    },
  });

  const { data: stockPrices = [] } = useQuery({
    queryKey: ["stock-prices-analytics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("thai_stocks")
        .select("symbol, current_price, sector");

      if (error) throw error;
      return data as (StockPrice & { sector?: string })[];
    },
  });

  // Calculate portfolio metrics
  const positionsWithPrices = positions.map((pos) => {
    const price = stockPrices.find((p) => p.symbol === pos.stock_symbol);
    const currentValue = (price?.current_price || 0) * pos.shares_owned;
    const costBasis = pos.average_entry_price * pos.shares_owned;
    const pl = currentValue - costBasis;
    const plPercent = (pl / costBasis) * 100;

    return {
      ...pos,
      currentPrice: price?.current_price || 0,
      currentValue,
      costBasis,
      pl,
      plPercent,
      sector: price?.sector || "Unknown",
    };
  });

  const totalValue = positionsWithPrices.reduce((sum, p) => sum + p.currentValue, 0);
  const totalCost = positionsWithPrices.reduce((sum, p) => sum + p.costBasis, 0);
  const totalPL = totalValue - totalCost;
  const totalPLPercent = totalCost > 0 ? (totalPL / totalCost) * 100 : 0;

  // Top performers
  const topPerformers = [...positionsWithPrices]
    .sort((a, b) => b.plPercent - a.plPercent)
    .slice(0, 5)
    .map((p) => ({
      name: p.stock_symbol,
      value: p.plPercent,
    }));

  // Sector allocation
  const sectorMap = new Map<string, number>();
  positionsWithPrices.forEach((p) => {
    const current = sectorMap.get(p.sector) || 0;
    sectorMap.set(p.sector, current + p.currentValue);
  });

  const sectorData = Array.from(sectorMap.entries()).map(([name, value]) => ({
    name,
    value,
    percentage: ((value / totalValue) * 100).toFixed(1),
  }));

  const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))", "hsl(var(--chart-1))", "hsl(var(--chart-2))"];

  // Position sizes
  const positionSizes = positionsWithPrices
    .map((p) => ({
      name: p.stock_symbol,
      value: p.currentValue,
      percentage: ((p.currentValue / totalValue) * 100).toFixed(1),
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <PieChartIcon className="h-6 w-6" />
          Portfolio Analytics
        </h2>
        <p className="text-muted-foreground">
          Comprehensive analysis of your portfolio performance
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Total Value</span>
          </div>
          <p className="text-2xl font-bold">฿{totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Total Cost</span>
          </div>
          <p className="text-2xl font-bold">฿{totalCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Total P/L</span>
          </div>
          <p className={`text-2xl font-bold ${totalPL >= 0 ? "text-green-500" : "text-red-500"}`}>
            ฿{totalPL.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Return %</span>
          </div>
          <p className={`text-2xl font-bold ${totalPLPercent >= 0 ? "text-green-500" : "text-red-500"}`}>
            {totalPLPercent >= 0 ? "+" : ""}{totalPLPercent.toFixed(2)}%
          </p>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Top Performers</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topPerformers}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Sector Allocation</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={sectorData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name} (${entry.percentage}%)`}
                outerRadius={80}
                fill="hsl(var(--primary))"
                dataKey="value"
              >
                {sectorData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6 md:col-span-2">
          <h3 className="text-lg font-semibold mb-4">Position Sizes</h3>
          <div className="space-y-3">
            {positionSizes.map((pos, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="font-medium">{pos.name}</span>
                <div className="flex items-center gap-4">
                  <div className="w-32 bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${pos.percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-16 text-right">
                    {pos.percentage}%
                  </span>
                  <span className="text-sm font-medium w-24 text-right">
                    ฿{pos.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
