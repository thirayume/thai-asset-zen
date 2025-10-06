import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Users, TrendingUp, Activity, Database } from "lucide-react";

interface AnalyticsData {
  totalUsers: number;
  totalPositions: number;
  totalWatchlistItems: number;
  totalStocks: number;
  mostPopularStocks: { symbol: string; count: number }[];
}

const AdminAnalytics = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);

        // Fetch total users
        const { count: userCount, error: userError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        if (userError) throw userError;

        // Fetch total positions
        const { count: positionCount, error: positionError } = await supabase
          .from('user_positions')
          .select('*', { count: 'exact', head: true });

        if (positionError) throw positionError;

        // Fetch total watchlist items
        const { count: watchlistCount, error: watchlistError } = await supabase
          .from('user_watchlist')
          .select('*', { count: 'exact', head: true });

        if (watchlistError) throw watchlistError;

        // Fetch total stocks
        const { count: stockCount, error: stockError } = await supabase
          .from('thai_stocks')
          .select('*', { count: 'exact', head: true });

        if (stockError) throw stockError;

        // Fetch most popular stocks
        const { data: positions, error: popStocksError } = await supabase
          .from('user_positions')
          .select('stock_symbol');

        if (popStocksError) throw popStocksError;

        const stockCounts: Record<string, number> = {};
        positions?.forEach(pos => {
          stockCounts[pos.stock_symbol] = (stockCounts[pos.stock_symbol] || 0) + 1;
        });

        const mostPopularStocks = Object.entries(stockCounts)
          .map(([symbol, count]) => ({ symbol, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        setAnalytics({
          totalUsers: userCount || 0,
          totalPositions: positionCount || 0,
          totalWatchlistItems: watchlistCount || 0,
          totalStocks: stockCount || 0,
          mostPopularStocks,
        });
      } catch (error) {
        console.error("Error fetching analytics:", error);
        toast({
          title: "Error",
          description: "Failed to fetch analytics data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [toast]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Platform Analytics</CardTitle>
          <CardDescription>Loading analytics...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics?.totalUsers || 0}</div>
          <p className="text-xs text-muted-foreground">
            Registered platform users
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Positions</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics?.totalPositions || 0}</div>
          <p className="text-xs text-muted-foreground">
            Active stock positions
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Watchlist Items</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics?.totalWatchlistItems || 0}</div>
          <p className="text-xs text-muted-foreground">
            Stocks being watched
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Available Stocks</CardTitle>
          <Database className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics?.totalStocks || 0}</div>
          <p className="text-xs text-muted-foreground">
            Thai stocks in database
          </p>
        </CardContent>
      </Card>

      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Most Popular Stocks</CardTitle>
          <CardDescription>Top 5 stocks by position count</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {analytics?.mostPopularStocks.map((stock, index) => (
              <div key={stock.symbol} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-muted-foreground">#{index + 1}</span>
                  <span className="font-semibold">{stock.symbol}</span>
                </div>
                <span className="text-muted-foreground">{stock.count} positions</span>
              </div>
            ))}
            {(!analytics?.mostPopularStocks || analytics.mostPopularStocks.length === 0) && (
              <p className="text-sm text-muted-foreground">No position data available</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAnalytics;
