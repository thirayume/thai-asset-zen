import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";
import { useEffect } from "react";

const LiveMarketFeed = () => {
  const { data: stocks, refetch } = useQuery({
    queryKey: ['thai-stocks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('thai_stocks')
        .select('*')
        .order('change_percent', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });

  // Update prices on initial load
  useEffect(() => {
    const updatePrices = async () => {
      await supabase.functions.invoke('update-stock-prices');
      refetch();
    };
    updatePrices();
  }, [refetch]);

  return (
    <Card className="p-6 bg-card/50 backdrop-blur-xl border-border/50">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/10">
          <Activity className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Live Market Feed</h2>
          <p className="text-sm text-muted-foreground">Top Thai Stocks (SET & SET50)</p>
        </div>
        <div className="ml-auto">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-profit animate-pulse" />
            <span className="text-xs text-muted-foreground">Live</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {stocks?.map((stock) => (
          <div 
            key={stock.symbol}
            className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50 hover:border-primary/30 transition-all"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg">{stock.symbol}</span>
                {stock.change_percent >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-profit" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-loss" />
                )}
              </div>
              <p className="text-sm text-muted-foreground">{stock.name}</p>
            </div>
            
            <div className="text-right">
              <p className="text-lg font-bold">฿{stock.current_price}</p>
              <p className={`text-sm font-medium ${
                stock.change_percent >= 0 ? 'text-profit' : 'text-loss'
              }`}>
                {stock.change_percent >= 0 ? '+' : ''}{stock.change_percent}%
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default LiveMarketFeed;