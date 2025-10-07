import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, Coins } from "lucide-react";
import GoldPriceChart from "./GoldPriceChart";

interface GoldPrice {
  id: string;
  price_type: string;
  gold_type: string;
  price_per_baht: number;
  price_per_gram: number;
  recorded_at: string;
}

export const GoldPrices = () => {
  const { data: goldPrices, isLoading, error, refetch } = useQuery({
    queryKey: ['gold-prices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gold_prices')
        .select('*')
        .order('recorded_at', { ascending: false })
        .limit(4);

      if (error) throw error;
      
      const latestPrices = data?.reduce((acc: GoldPrice[], price) => {
        const key = `${price.gold_type}-${price.price_type}`;
        if (!acc.find(p => `${p.gold_type}-${p.price_type}` === key)) {
          acc.push(price);
        }
        return acc;
      }, []);
      
      return latestPrices || [];
    },
    refetchInterval: 60000,
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getPriceTypeColor = (priceType: string) => {
    return priceType === 'buy' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20';
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-yellow-500" />
            <CardTitle>Gold Prices (Thailand)</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full border-destructive">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-yellow-500" />
            <CardTitle>Gold Prices (Thailand)</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-destructive">Failed to load gold prices. Please try again.</p>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!goldPrices || goldPrices.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-yellow-500" />
            <CardTitle>Gold Prices (Thailand)</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No gold price data available. Click "Refresh All" to update.</p>
        </CardContent>
      </Card>
    );
  }

  const ornamentBuy = goldPrices.find(p => p.gold_type === '96.5%' && p.price_type === 'buy');
  const ornamentSell = goldPrices.find(p => p.gold_type === '96.5%' && p.price_type === 'sell');
  const barBuy = goldPrices.find(p => p.gold_type === '99.99%' && p.price_type === 'buy');
  const barSell = goldPrices.find(p => p.gold_type === '99.99%' && p.price_type === 'sell');

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-yellow-500" />
            <CardTitle>Gold Prices (Thailand)</CardTitle>
          </div>
          <Badge variant="outline" className="text-xs">
            🔴 Live • Updated: {new Date(goldPrices[0]?.recorded_at).toLocaleTimeString('th-TH')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="ornament">96.5% Chart</TabsTrigger>
            <TabsTrigger value="bar">99.99% Chart</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            {/* Ornament Gold 96.5% */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <span className="text-yellow-600">●</span>
                Gold 96.5% (Ornament / ทองรูปพรรณ)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ornamentBuy && (
                  <div className="border-2 rounded-xl p-4 hover:shadow-lg transition-shadow bg-gradient-to-br from-green-50/50 to-transparent dark:from-green-950/20">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={getPriceTypeColor('buy')}>
                        <TrendingUp className="w-3 h-3 mr-1" />
                        BUY PRICE
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="text-3xl font-bold text-green-600">
                        {formatCurrency(ornamentBuy.price_per_baht)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        per baht (15.244g)
                      </div>
                      <div className="text-sm font-medium text-muted-foreground">
                        {formatCurrency(ornamentBuy.price_per_gram)} / gram
                      </div>
                    </div>
                  </div>
                )}
                {ornamentSell && (
                  <div className="border-2 rounded-xl p-4 hover:shadow-lg transition-shadow bg-gradient-to-br from-red-50/50 to-transparent dark:from-red-950/20">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={getPriceTypeColor('sell')}>
                        <TrendingDown className="w-3 h-3 mr-1" />
                        SELL PRICE
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="text-3xl font-bold text-red-600">
                        {formatCurrency(ornamentSell.price_per_baht)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        per baht (15.244g)
                      </div>
                      <div className="text-sm font-medium text-muted-foreground">
                        {formatCurrency(ornamentSell.price_per_gram)} / gram
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bar Gold 99.99% */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <span className="text-yellow-500">●</span>
                Gold 99.99% (Bar / ทองคำแท่ง)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {barBuy && (
                  <div className="border-2 rounded-xl p-4 hover:shadow-lg transition-shadow bg-gradient-to-br from-green-50/50 to-transparent dark:from-green-950/20">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={getPriceTypeColor('buy')}>
                        <TrendingUp className="w-3 h-3 mr-1" />
                        BUY PRICE
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="text-3xl font-bold text-green-600">
                        {formatCurrency(barBuy.price_per_baht)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        per baht (15.244g)
                      </div>
                      <div className="text-sm font-medium text-muted-foreground">
                        {formatCurrency(barBuy.price_per_gram)} / gram
                      </div>
                    </div>
                  </div>
                )}
                {barSell && (
                  <div className="border-2 rounded-xl p-4 hover:shadow-lg transition-shadow bg-gradient-to-br from-red-50/50 to-transparent dark:from-red-950/20">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={getPriceTypeColor('sell')}>
                        <TrendingDown className="w-3 h-3 mr-1" />
                        SELL PRICE
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="text-3xl font-bold text-red-600">
                        {formatCurrency(barSell.price_per_baht)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        per baht (15.244g)
                      </div>
                      <div className="text-sm font-medium text-muted-foreground">
                        {formatCurrency(barSell.price_per_gram)} / gram
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 p-4 bg-muted/50 rounded-lg text-xs text-muted-foreground">
              <p>💡 <strong>Tip:</strong> Prices are updated every minute. Buy price = what you pay to buy gold. Sell price = what you receive when selling gold.</p>
            </div>
          </TabsContent>
          
          <TabsContent value="ornament">
            {ornamentBuy && ornamentSell && (
              <GoldPriceChart
                goldType="96.5%"
                currentBuyPrice={ornamentBuy.price_per_baht}
                currentSellPrice={ornamentSell.price_per_baht}
              />
            )}
          </TabsContent>
          
          <TabsContent value="bar">
            {barBuy && barSell && (
              <GoldPriceChart
                goldType="99.99%"
                currentBuyPrice={barBuy.price_per_baht}
                currentSellPrice={barSell.price_per_baht}
              />
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
