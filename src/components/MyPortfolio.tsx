import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AddPositionDialog } from "./AddPositionDialog";
import { formatCurrency } from "@/lib/utils";

interface Position {
  id: string;
  stock_symbol: string;
  stock_name: string;
  shares_owned: number;
  average_entry_price: number;
  purchase_date: string;
  target_price: number | null;
  stop_loss: number | null;
  notes: string | null;
}

interface StockPrice {
  symbol: string;
  current_price: number;
  change_percent: number;
}

export const MyPortfolio = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Fetch user positions
  const { data: positions, isLoading } = useQuery({
    queryKey: ["user-positions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_positions")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Position[];
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
      
      const pricesMap: Record<string, StockPrice> = {};
      data.forEach((stock) => {
        pricesMap[stock.symbol] = stock as StockPrice;
      });
      return pricesMap;
    },
  });

  // Delete position mutation
  const deleteMutation = useMutation({
    mutationFn: async (positionId: string) => {
      const { error } = await supabase
        .from("user_positions")
        .delete()
        .eq("id", positionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-positions"] });
      toast({
        title: "ลบสำเร็จ / Deleted",
        description: "ลบตำแหน่งการลงทุนเรียบร้อย / Position deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "ข้อผิดพลาด / Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const calculatePL = (position: Position, currentPrice: number) => {
    const totalCost = position.shares_owned * position.average_entry_price;
    const currentValue = position.shares_owned * currentPrice;
    const pl = currentValue - totalCost;
    const plPercent = (pl / totalCost) * 100;
    return { pl, plPercent, currentValue };
  };

  const totalStats = positions?.reduce(
    (acc, position) => {
      const stockPrice = stockPrices?.[position.stock_symbol];
      if (!stockPrice) return acc;

      const { pl, currentValue } = calculatePL(position, stockPrice.current_price);
      acc.totalInvested += position.shares_owned * position.average_entry_price;
      acc.currentValue += currentValue;
      acc.totalPL += pl;
      return acc;
    },
    { totalInvested: 0, currentValue: 0, totalPL: 0 }
  ) || { totalInvested: 0, currentValue: 0, totalPL: 0 };

  if (isLoading) {
    return <Card><CardContent className="p-6">กำลังโหลด... / Loading...</CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>พอร์ตของฉัน / My Portfolio</CardTitle>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div>
                <p className="text-sm text-muted-foreground">เงินลงทุนทั้งหมด / Total Invested</p>
                <p className="text-xl font-bold">{formatCurrency(totalStats.totalInvested)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">มูลค่าปัจจุบัน / Current Value</p>
                <p className="text-xl font-bold">{formatCurrency(totalStats.currentValue)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">กำไร/ขาดทุน / P/L</p>
                <p className={`text-xl font-bold ${totalStats.totalPL >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {formatCurrency(totalStats.totalPL)} ({((totalStats.totalPL / totalStats.totalInvested) * 100).toFixed(2)}%)
                </p>
              </div>
            </div>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            เพิ่มตำแหน่ง / Add Position
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!positions || positions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>ยังไม่มีตำแหน่งการลงทุน / No positions yet</p>
            <p className="text-sm mt-2">คลิก "เพิ่มตำแหน่ง" เพื่อเริ่มต้น / Click "Add Position" to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {positions.map((position) => {
              const stockPrice = stockPrices?.[position.stock_symbol];
              if (!stockPrice) return null;

              const { pl, plPercent, currentValue } = calculatePL(position, stockPrice.current_price);

              return (
                <div key={position.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg">{position.stock_symbol}</h3>
                        <span className="text-sm text-muted-foreground">{position.stock_name}</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                        <div>
                          <p className="text-xs text-muted-foreground">หุ้น / Shares</p>
                          <p className="font-semibold">{position.shares_owned.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">ราคาซื้อเฉลี่ย / Avg Entry</p>
                          <p className="font-semibold">{formatCurrency(position.average_entry_price)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">ราคาปัจจุบัน / Current</p>
                          <p className="font-semibold">{formatCurrency(stockPrice.current_price)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">มูลค่า / Value</p>
                          <p className="font-semibold">{formatCurrency(currentValue)}</p>
                        </div>
                      </div>
                      <div className="mt-2">
                        <p className="text-xs text-muted-foreground">กำไร/ขาดทุน / P/L</p>
                        <p className={`font-bold ${pl >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {formatCurrency(pl)} ({plPercent >= 0 ? "+" : ""}{plPercent.toFixed(2)}%)
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(position.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <AddPositionDialog 
        open={isAddDialogOpen} 
        onOpenChange={setIsAddDialogOpen}
      />
    </Card>
  );
};
