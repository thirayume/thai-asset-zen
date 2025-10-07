import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { positionSchema } from "@/lib/validationSchemas";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AddPositionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddPositionDialog = ({ open, onOpenChange }: AddPositionDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedStock, setSelectedStock] = useState("");
  const [shares, setShares] = useState("");
  const [entryPrice, setEntryPrice] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);

  // Fetch available stocks
  const { data: stocks } = useQuery({
    queryKey: ["thai-stocks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("thai_stocks")
        .select("symbol, name, current_price")
        .order("symbol");

      if (error) throw error;
      return data;
    },
  });

  // Get portfolio ID
  const { data: portfolio } = useQuery({
    queryKey: ["user-portfolio"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("user_portfolios")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const addPositionMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Validate inputs
      const validationResult = positionSchema.safeParse({
        stockSymbol: selectedStock,
        shares,
        entryPrice,
        purchaseDate,
      });

      if (!validationResult.success) {
        const errors = validationResult.error.errors.map(err => err.message).join(", ");
        throw new Error(errors);
      }

      const stock = stocks?.find(s => s.symbol === validationResult.data.stockSymbol);
      if (!stock) throw new Error("Stock not found");

      const { error } = await supabase.from("user_positions").insert({
        user_id: user.id,
        portfolio_id: portfolio?.id,
        stock_symbol: validationResult.data.stockSymbol,
        stock_name: stock.name,
        shares_owned: parseFloat(validationResult.data.shares),
        average_entry_price: parseFloat(validationResult.data.entryPrice),
        purchase_date: validationResult.data.purchaseDate,
        status: "active",
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-positions"] });
      toast({
        title: "สำเร็จ / Success",
        description: "เพิ่มตำแหน่งการลงทุนเรียบร้อย / Position added successfully",
      });
      onOpenChange(false);
      // Reset form
      setSelectedStock("");
      setShares("");
      setEntryPrice("");
      setPurchaseDate(new Date().toISOString().split('T')[0]);
    },
    onError: (error: any) => {
      toast({
        title: "ข้อผิดพลาด / Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addPositionMutation.mutate();
  };

  const selectedStockData = stocks?.find(s => s.symbol === selectedStock);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>เพิ่มตำแหน่งการลงทุน / Add Position</DialogTitle>
          <DialogDescription>
            เพิ่มหุ้นที่คุณถืออยู่ในพอร์ตของคุณ / Add stocks you own to your portfolio
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="stock">หุ้น / Stock</Label>
            <Select value={selectedStock} onValueChange={setSelectedStock} required>
              <SelectTrigger>
                <SelectValue placeholder="เลือกหุ้น / Select stock" />
              </SelectTrigger>
              <SelectContent>
                {stocks?.map((stock) => (
                  <SelectItem key={stock.symbol} value={stock.symbol}>
                    {stock.symbol} - {stock.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shares">จำนวนหุ้น / Shares</Label>
            <Input
              id="shares"
              type="number"
              step="1"
              min="1"
              value={shares}
              onChange={(e) => setShares(e.target.value)}
              placeholder="100"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="entry-price">ราคาซื้อเฉลี่ย / Average Entry Price (THB)</Label>
            <Input
              id="entry-price"
              type="number"
              step="0.01"
              min="0.01"
              value={entryPrice}
              onChange={(e) => setEntryPrice(e.target.value)}
              placeholder={selectedStockData?.current_price.toString() || "0.00"}
              required
            />
            {selectedStockData && (
              <p className="text-sm text-muted-foreground">
                ราคาตลาดปัจจุบัน / Current market price: ฿{selectedStockData.current_price.toFixed(2)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="purchase-date">วันที่ซื้อ / Purchase Date</Label>
            <Input
              id="purchase-date"
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              ยกเลิก / Cancel
            </Button>
            <Button type="submit" disabled={addPositionMutation.isPending}>
              {addPositionMutation.isPending ? "กำลังเพิ่ม... / Adding..." : "เพิ่มตำแหน่ง / Add Position"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
