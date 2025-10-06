import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, TrendingDown, Coins } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface GoldPrice {
  id: string;
  price_type: string;
  gold_type: string;
  price_per_baht: number;
  price_per_gram: number;
  recorded_at: string;
}

export const GoldPrices = () => {
  const { data: goldPrices, isLoading } = useQuery({
    queryKey: ['gold-prices'],
    queryFn: async () => {
      // Get latest prices for each gold type and price type
      const { data, error } = await supabase
        .from('gold_prices')
        .select('*')
        .order('recorded_at', { ascending: false })
        .limit(4);

      if (error) throw error;
      
      // Group by gold_type and price_type to get latest of each
      const latestPrices = data?.reduce((acc: GoldPrice[], price) => {
        const key = `${price.gold_type}-${price.price_type}`;
        if (!acc.find(p => `${p.gold_type}-${p.price_type}` === key)) {
          acc.push(price);
        }
        return acc;
      }, []);
      
      return latestPrices || [];
    },
    refetchInterval: 60000, // Refetch every minute
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getGoldTypeLabel = (goldType: string) => {
    return goldType === '96.5%' ? 'Gold 96.5% (Ornament)' : 'Gold 99.99% (Bar)';
  };

  const getPriceTypeColor = (priceType: string) => {
    return priceType === 'buy' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500';
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Coins className="w-5 h-5 text-yellow-500" />
          <h2 className="text-xl font-semibold">Gold Prices</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </Card>
    );
  }

  if (!goldPrices || goldPrices.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Coins className="w-5 h-5 text-yellow-500" />
          <h2 className="text-xl font-semibold">Gold Prices</h2>
        </div>
        <p className="text-muted-foreground">No gold price data available</p>
      </Card>
    );
  }

  // Group by gold type
  const ornamentPrices = goldPrices.filter(p => p.gold_type === '96.5%');
  const barPrices = goldPrices.filter(p => p.gold_type === '99.99%');

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Coins className="w-5 h-5 text-yellow-500" />
        <h2 className="text-xl font-semibold">Gold Prices (Thailand)</h2>
        <Badge variant="outline" className="ml-auto text-xs">
          Updated: {new Date(goldPrices[0]?.recorded_at).toLocaleTimeString('th-TH')}
        </Badge>
      </div>
      
      <div className="space-y-6">
        {/* Ornament Gold 96.5% */}
        <div>
          <h3 className="font-medium mb-3 text-sm text-muted-foreground">Gold 96.5% (Ornament)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {ornamentPrices.map((price) => (
              <div
                key={price.id}
                className="border rounded-lg p-4 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge className={getPriceTypeColor(price.price_type)}>
                    {price.price_type === 'buy' ? 'Buy' : 'Sell'}
                  </Badge>
                  {price.price_type === 'buy' ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold">
                    {formatCurrency(price.price_per_baht)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    per baht (15.244g)
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatCurrency(price.price_per_gram)} / gram
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bar Gold 99.99% */}
        <div>
          <h3 className="font-medium mb-3 text-sm text-muted-foreground">Gold 99.99% (Bar)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {barPrices.map((price) => (
              <div
                key={price.id}
                className="border rounded-lg p-4 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge className={getPriceTypeColor(price.price_type)}>
                    {price.price_type === 'buy' ? 'Buy' : 'Sell'}
                  </Badge>
                  {price.price_type === 'buy' ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold">
                    {formatCurrency(price.price_per_baht)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    per baht (15.244g)
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatCurrency(price.price_per_gram)} / gram
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};