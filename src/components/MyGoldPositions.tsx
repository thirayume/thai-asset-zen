import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Coins, Plus, TrendingUp, TrendingDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { AddGoldPositionDialog } from "./AddGoldPositionDialog";

interface GoldPosition {
  id: string;
  gold_type: string;
  weight_in_baht: number;
  weight_in_grams: number;
  purchase_price_per_baht: number;
  total_cost: number;
  purchase_date: string;
  notes: string | null;
  status: string;
}

interface GoldPrice {
  gold_type: string;
  price_type: string;
  price_per_baht: number;
}

export const MyGoldPositions = () => {
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const { data: positions, isLoading } = useQuery({
    queryKey: ['gold-positions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_gold_positions')
        .select('*')
        .eq('status', 'active')
        .order('purchase_date', { ascending: false });

      if (error) throw error;
      return data as GoldPosition[];
    },
  });

  const { data: currentPrices } = useQuery({
    queryKey: ['current-gold-prices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gold_prices')
        .select('*')
        .eq('price_type', 'sell')
        .order('recorded_at', { ascending: false })
        .limit(2);

      if (error) throw error;
      return data as GoldPrice[];
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

  const getCurrentPrice = (goldType: string) => {
    if (!currentPrices || currentPrices.length === 0) return null;
    return currentPrices.find(p => p.gold_type === goldType)?.price_per_baht || null;
  };

  const calculateProfit = (position: GoldPosition) => {
    const currentPrice = getCurrentPrice(position.gold_type);
    if (currentPrice === null) return null;
    const currentValue = currentPrice * position.weight_in_baht;
    return currentValue - position.total_cost;
  };

  const calculateProfitPercent = (position: GoldPosition) => {
    const profit = calculateProfit(position);
    if (profit === null) return null;
    return (profit / position.total_cost) * 100;
  };

  const totalInvestment = positions?.reduce((sum, pos) => sum + pos.total_cost, 0) || 0;
  const totalCurrentValue = positions?.reduce((sum, pos) => {
    const currentPrice = getCurrentPrice(pos.gold_type);
    if (currentPrice === null) return sum;
    return sum + (currentPrice * pos.weight_in_baht);
  }, 0) || 0;
  const totalProfit = totalCurrentValue - totalInvestment;
  const totalProfitPercent = totalInvestment > 0 ? (totalProfit / totalInvestment) * 100 : 0;

  if (isLoading) {
    return (
      <Card className="p-6">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-32" />
      </Card>
    );
  }

  return (
    <>
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-yellow-500" />
            <h2 className="text-xl font-semibold">My Gold Positions</h2>
          </div>
          <Button onClick={() => setAddDialogOpen(true)} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Gold
          </Button>
        </div>

        {/* Summary */}
        {positions && positions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Total Investment</div>
              <div className="text-2xl font-bold">{formatCurrency(totalInvestment)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Current Value</div>
              <div className="text-2xl font-bold">{formatCurrency(totalCurrentValue)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Total P/L</div>
              <div className={`text-2xl font-bold flex items-center gap-2 ${totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {totalProfit >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                {formatCurrency(Math.abs(totalProfit))}
                <span className="text-sm">({totalProfitPercent.toFixed(2)}%)</span>
              </div>
            </div>
          </div>
        )}

        {!positions || positions.length === 0 ? (
          <div className="text-center py-8">
            <Coins className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">No gold positions yet</p>
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Gold Position
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {positions.map((position) => {
              const profit = calculateProfit(position);
              const profitPercent = calculateProfitPercent(position);
              const currentPrice = getCurrentPrice(position.gold_type);

              return (
                <div
                  key={position.id}
                  className="border rounded-lg p-4 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">
                          {position.gold_type === '96.5%' ? 'Ornament Gold 96.5%' : 'Bar Gold 99.99%'}
                        </h3>
                        <Badge variant="outline">
                          {position.weight_in_baht} baht
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {position.weight_in_grams.toFixed(3)} grams
                      </div>
                    </div>
                     <Badge className={profit !== null && profit >= 0 ? 'bg-green-500/10 text-green-500' : profit !== null ? 'bg-red-500/10 text-red-500' : 'bg-muted'}>
                       {profitPercent !== null ? `${profit! >= 0 ? '+' : ''}${profitPercent.toFixed(2)}%` : 'N/A'}
                     </Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <div className="text-muted-foreground mb-1">Purchase Price</div>
                      <div className="font-medium">{formatCurrency(position.purchase_price_per_baht)}/baht</div>
                    </div>
                     <div>
                       <div className="text-muted-foreground mb-1">Current Price</div>
                       <div className="font-medium">
                         {currentPrice !== null ? `${formatCurrency(currentPrice)}/baht` : 'Price unavailable'}
                       </div>
                     </div>
                    <div>
                      <div className="text-muted-foreground mb-1">Total Cost</div>
                      <div className="font-medium">{formatCurrency(position.total_cost)}</div>
                    </div>
                     <div>
                       <div className="text-muted-foreground mb-1">P/L</div>
                       <div className={`font-medium ${profit !== null && profit >= 0 ? 'text-green-500' : profit !== null ? 'text-red-500' : ''}`}>
                         {profit !== null ? `${profit >= 0 ? '+' : ''}${formatCurrency(profit)}` : 'N/A'}
                       </div>
                     </div>
                  </div>

                  {position.notes && (
                    <div className="mt-3 pt-3 border-t text-sm text-muted-foreground">
                      {position.notes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <AddGoldPositionDialog 
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
      />
    </>
  );
};