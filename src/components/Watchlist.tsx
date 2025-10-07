import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AddToWatchlistDialog } from "./AddToWatchlistDialog";
import { SkeletonCardList } from "@/components/ui/skeleton-card";

interface WatchlistItem {
  id: string;
  stock_symbol: string;
  stock_name: string;
  target_entry_price: number | null;
  notes: string | null;
  created_at: string;
}

interface StockPrice {
  symbol: string;
  current_price: number;
  change_percent: number;
}

export const Watchlist = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  // Fetch watchlist items
  const { data: watchlistItems, isLoading: watchlistLoading } = useQuery({
    queryKey: ["user-watchlist"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("user_watchlist")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as WatchlistItem[];
    },
  });

  // Fetch current stock prices
  const { data: stockPrices } = useQuery({
    queryKey: ["stock-prices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("thai_stocks")
        .select("symbol, current_price, change_percent");

      if (error) throw error;
      return data as StockPrice[];
    },
  });

  // Delete watchlist item with optimistic update
  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from("user_watchlist")
        .delete()
        .eq("id", itemId);

      if (error) throw error;
    },
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: ["user-watchlist"] });
      const previousData = queryClient.getQueryData(["user-watchlist"]);
      
      queryClient.setQueryData(["user-watchlist"], (old: WatchlistItem[] | undefined) =>
        old?.filter(item => item.id !== itemId) || []
      );
      
      return { previousData };
    },
    onError: (error: any, _itemId, context) => {
      queryClient.setQueryData(["user-watchlist"], context?.previousData);
      toast({
        title: "ข้อผิดพลาด / Error",
        description: error.message,
        variant: "destructive",
      });
    },
    onSuccess: () => {
      toast({
        title: "ลบออกจาก Watchlist แล้ว / Removed from Watchlist",
        description: "ลบหุ้นออกจาก Watchlist เรียบร้อยแล้ว / Stock removed successfully",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["user-watchlist"] });
    },
  });

  const getStockPrice = (symbol: string) => {
    return stockPrices?.find(s => s.symbol === symbol);
  };

  const calculateDistanceToTarget = (currentPrice: number, targetPrice: number | null) => {
    if (!targetPrice) return null;
    const diff = ((currentPrice - targetPrice) / targetPrice) * 100;
    return diff;
  };

  if (watchlistLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Watchlist / รายการติดตาม</CardTitle>
          <CardDescription>หุ้นที่คุณสนใจและกำลังติดตาม / Stocks you're tracking</CardDescription>
        </CardHeader>
        <CardContent>
          <SkeletonCardList count={3} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Watchlist / รายการติดตาม</CardTitle>
            <CardDescription>
              หุ้นที่คุณสนใจและกำลังติดตาม / Stocks you're tracking
            </CardDescription>
          </div>
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            เพิ่มหุ้น / Add Stock
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {!watchlistItems || watchlistItems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>ยังไม่มีหุ้นใน Watchlist / No stocks in your watchlist yet</p>
            <p className="text-sm mt-2">คลิก "เพิ่มหุ้น" เพื่อเริ่มติดตาม / Click "Add Stock" to start tracking</p>
          </div>
        ) : (
          <div className="space-y-4">
            {watchlistItems.map((item) => {
              const stockPrice = getStockPrice(item.stock_symbol);
              const distanceToTarget = item.target_entry_price && stockPrice
                ? calculateDistanceToTarget(stockPrice.current_price, item.target_entry_price)
                : null;

              return (
                <div
                  key={item.id}
                  className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{item.stock_symbol}</h3>
                        <span className="text-sm text-muted-foreground">{item.stock_name}</span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                        <div>
                          <p className="text-sm text-muted-foreground">ราคาปัจจุบัน / Current</p>
                          <div className="flex items-center gap-1">
                            <p className="font-semibold">
                              ฿{stockPrice?.current_price.toFixed(2) || "N/A"}
                            </p>
                            {stockPrice && (
                              <span className={`text-sm flex items-center ${
                                stockPrice.change_percent >= 0 ? "text-green-600" : "text-red-600"
                              }`}>
                                {stockPrice.change_percent >= 0 ? (
                                  <TrendingUp className="h-3 w-3 mr-1" />
                                ) : (
                                  <TrendingDown className="h-3 w-3 mr-1" />
                                )}
                                {stockPrice.change_percent.toFixed(2)}%
                              </span>
                            )}
                          </div>
                        </div>

                        <div>
                          <p className="text-sm text-muted-foreground">ราคาเป้าหมาย / Target</p>
                          <p className="font-semibold">
                            {item.target_entry_price ? `฿${item.target_entry_price.toFixed(2)}` : "ไม่ระบุ / Not set"}
                          </p>
                        </div>

                        {distanceToTarget !== null && (
                          <div>
                            <p className="text-sm text-muted-foreground">ระยะห่างจากเป้า / Distance</p>
                            <p className={`font-semibold ${
                              distanceToTarget <= 0 ? "text-green-600" : "text-orange-600"
                            }`}>
                              {distanceToTarget > 0 ? "+" : ""}{distanceToTarget.toFixed(2)}%
                            </p>
                          </div>
                        )}

                        {item.notes && (
                          <div className="md:col-span-2">
                            <p className="text-sm text-muted-foreground">โน้ต / Notes</p>
                            <p className="text-sm">{item.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteItemMutation.mutate(item.id)}
                      disabled={deleteItemMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <AddToWatchlistDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
    </Card>
  );
};
