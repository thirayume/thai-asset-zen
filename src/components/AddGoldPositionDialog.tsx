import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AddGoldPositionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddGoldPositionDialog = ({ open, onOpenChange }: AddGoldPositionDialogProps) => {
  const [goldType, setGoldType] = useState<string>("96.5%");
  const [weightInBaht, setWeightInBaht] = useState<string>("");
  const [purchasePricePerBaht, setPurchasePricePerBaht] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: portfolio } = useQuery({
    queryKey: ['user-portfolio', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('user_portfolios')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const addPositionMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !portfolio?.id) {
        throw new Error('User not authenticated');
      }

      const weight = parseFloat(weightInBaht);
      const price = parseFloat(purchasePricePerBaht);

      if (isNaN(weight) || isNaN(price) || weight <= 0 || price <= 0) {
        throw new Error('Please enter valid weight and price');
      }

      const weightInGrams = weight * 15.244; // 1 baht = 15.244 grams
      const totalCost = weight * price;

      const { error } = await supabase
        .from('user_gold_positions')
        .insert({
          user_id: user.id,
          portfolio_id: portfolio.id,
          gold_type: goldType,
          weight_in_baht: weight,
          weight_in_grams: weightInGrams,
          purchase_price_per_baht: price,
          total_cost: totalCost,
          notes: notes || null,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gold-positions'] });
      toast.success('Gold position added successfully');
      onOpenChange(false);
      // Reset form
      setWeightInBaht("");
      setPurchasePricePerBaht("");
      setNotes("");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to add gold position');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addPositionMutation.mutate();
  };

  const weightInGrams = parseFloat(weightInBaht) * 15.244 || 0;
  const totalCost = parseFloat(weightInBaht) * parseFloat(purchasePricePerBaht) || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Gold Position</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="gold-type">Gold Type</Label>
            <Select value={goldType} onValueChange={setGoldType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="96.5%">Gold 96.5% (Ornament)</SelectItem>
                <SelectItem value="99.99%">Gold 99.99% (Bar)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="weight">Weight (baht)</Label>
            <Input
              id="weight"
              type="number"
              step="0.01"
              placeholder="e.g., 1.00"
              value={weightInBaht}
              onChange={(e) => setWeightInBaht(e.target.value)}
              required
            />
            {weightInBaht && (
              <p className="text-xs text-muted-foreground">
                = {weightInGrams.toFixed(3)} grams
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Purchase Price (฿ per baht)</Label>
            <Input
              id="price"
              type="number"
              step="1"
              placeholder="e.g., 38500"
              value={purchasePricePerBaht}
              onChange={(e) => setPurchasePricePerBaht(e.target.value)}
              required
            />
          </div>

          {weightInBaht && purchasePricePerBaht && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">Total Cost</div>
              <div className="text-2xl font-bold">
                {new Intl.NumberFormat('th-TH', {
                  style: 'currency',
                  currency: 'THB',
                  minimumFractionDigits: 0,
                }).format(totalCost)}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this purchase..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={addPositionMutation.isPending}
              className="flex-1"
            >
              {addPositionMutation.isPending ? 'Adding...' : 'Add Position'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};