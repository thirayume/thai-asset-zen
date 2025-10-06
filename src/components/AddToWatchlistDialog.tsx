import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AddToWatchlistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddToWatchlistDialog = ({ open, onOpenChange }: AddToWatchlistDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedStock, setSelectedStock] = useState("");
  const [targetEntryPrice, setTargetEntryPrice] = useState("");
  const [notes, setNotes] = useState("");

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

  const addToWatchlistMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const stock = stocks?.find(s => s.symbol === selectedStock);
      if (!stock) throw new Error("Stock not found");

      const { error } = await supabase.from("user_watchlist").insert({
        user_id: user.id,
        stock_symbol: selectedStock,
        stock_name: stock.name,
        target_entry_price: targetEntryPrice ? parseFloat(targetEntryPrice) : null,
        notes: notes || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-watchlist"] });
      toast({
        title: "สำเร็จ / Success",
        description: "เพิ่มหุ้นใน Watchlist เรียบร้อย / Added to watchlist successfully",
      });
      onOpenChange(false);
      // Reset form
      setSelectedStock("");
      setTargetEntryPrice("");
      setNotes("");
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
    addToWatchlistMutation.mutate();
  };

  const selectedStockData = stocks?.find(s => s.symbol === selectedStock);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>เพิ่มใน Watchlist / Add to Watchlist</DialogTitle>
          <DialogDescription>
            ติดตามหุ้นที่คุณสนใจและตั้งราคาเป้าหมาย / Track stocks you're interested in and set target prices
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
            <Label htmlFor="target-entry-price">ราคาเป้าหมาย / Target Entry Price (THB) - Optional</Label>
            <Input
              id="target-entry-price"
              type="number"
              step="0.01"
              min="0.01"
              value={targetEntryPrice}
              onChange={(e) => setTargetEntryPrice(e.target.value)}
              placeholder={selectedStockData?.current_price.toString() || "0.00"}
            />
            {selectedStockData && (
              <p className="text-sm text-muted-foreground">
                ราคาตลาดปัจจุบัน / Current market price: ฿{selectedStockData.current_price.toFixed(2)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">โน้ต / Notes - Optional</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="เช่น รอราคาลงต่ำกว่า 50 บาท / e.g., Waiting for price below 50 THB"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              ยกเลิก / Cancel
            </Button>
            <Button type="submit" disabled={addToWatchlistMutation.isPending}>
              {addToWatchlistMutation.isPending ? "กำลังเพิ่ม... / Adding..." : "เพิ่ม / Add to Watchlist"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
