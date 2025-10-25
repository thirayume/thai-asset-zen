import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export const Leaderboard = () => {
  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      // Get all users' portfolio performance
      const { data: allPositions } = await supabase
        .from("user_positions")
        .select("user_id, stock_symbol, shares_owned, average_entry_price")
        .eq("status", "active");

      const { data: stockPrices } = await supabase
        .from("thai_stocks")
        .select("symbol, current_price");

      const pricesMap = Object.fromEntries(
        (stockPrices || []).map(s => [s.symbol, s.current_price])
      );

      // Calculate performance per user
      const userPerformance = new Map<string, { pl: number; plPercent: number; totalInvested: number }>();

      (allPositions || []).forEach(pos => {
        const price = pricesMap[pos.stock_symbol];
        if (!price) return;

        const invested = pos.shares_owned * pos.average_entry_price;
        const currentValue = pos.shares_owned * price;
        const pl = currentValue - invested;

        const existing = userPerformance.get(pos.user_id) || { pl: 0, plPercent: 0, totalInvested: 0 };
        existing.totalInvested += invested;
        existing.pl += pl;
        userPerformance.set(pos.user_id, existing);
      });

      // Calculate percentages and sort
      const leaders = Array.from(userPerformance.entries())
        .map(([userId, stats]) => ({
          userId,
          pl: stats.pl,
          plPercent: (stats.pl / stats.totalInvested) * 100,
          totalInvested: stats.totalInvested,
        }))
        .sort((a, b) => b.plPercent - a.plPercent)
        .slice(0, 10);

      return leaders;
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-gold" />
          Top Performers
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground text-center py-4">Loading leaderboard...</p>
        ) : !leaderboard || leaderboard.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No data yet</p>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((user, index) => (
              <div
                key={user.userId}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex-shrink-0 w-8 text-center">
                  {index === 0 && <Trophy className="h-6 w-6 text-yellow-500 mx-auto" />}
                  {index === 1 && <Trophy className="h-6 w-6 text-gray-400 mx-auto" />}
                  {index === 2 && <Trophy className="h-6 w-6 text-amber-700 mx-auto" />}
                  {index > 2 && <span className="text-sm font-bold text-muted-foreground">#{index + 1}</span>}
                </div>
                
                <div className="flex-1">
                  <p className="text-sm font-medium">Investor {user.userId.slice(0, 8)}...</p>
                  <p className="text-xs text-muted-foreground">
                    Portfolio: {formatCurrency(user.totalInvested)}
                  </p>
                </div>

                <div className="text-right">
                  <Badge variant={user.plPercent >= 0 ? "default" : "destructive"}>
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {user.plPercent >= 0 ? '+' : ''}{user.plPercent.toFixed(2)}%
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatCurrency(user.pl)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
