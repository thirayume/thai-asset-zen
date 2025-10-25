import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Bell, Plus, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PriceAlert {
  id: string;
  stock_symbol: string;
  stock_name: string;
  alert_type: string;
  condition_value: number;
  is_active: boolean;
  is_triggered: boolean;
  triggered_at: string | null;
  notes: string | null;
  created_at: string;
}

export const PriceAlerts = () => {
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newAlert, setNewAlert] = useState({
    stock_symbol: "",
    stock_name: "",
    alert_type: "above",
    condition_value: "",
    notes: "",
  });

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ["price-alerts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_price_alerts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as PriceAlert[];
    },
  });

  const createAlertMutation = useMutation({
    mutationFn: async (alert: typeof newAlert) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("custom_price_alerts").insert({
        user_id: user.id,
        stock_symbol: alert.stock_symbol.toUpperCase(),
        stock_name: alert.stock_name,
        alert_type: alert.alert_type,
        condition_value: parseFloat(alert.condition_value),
        notes: alert.notes || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["price-alerts"] });
      toast.success("Price alert created");
      setIsAddDialogOpen(false);
      setNewAlert({ stock_symbol: "", stock_name: "", alert_type: "above", condition_value: "", notes: "" });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteAlertMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("custom_price_alerts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["price-alerts"] });
      toast.success("Alert deleted");
    },
  });

  const toggleAlertMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("custom_price_alerts")
        .update({ is_active: !is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["price-alerts"] });
    },
  });

  const activeAlerts = alerts.filter((a) => a.is_active && !a.is_triggered);
  const triggeredAlerts = alerts.filter((a) => a.is_triggered);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Price Alerts
          </h2>
          <p className="text-muted-foreground">
            Get notified when stocks reach your target prices
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Alert
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Price Alert</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Stock Symbol</Label>
                <Input
                  placeholder="e.g., AAPL"
                  value={newAlert.stock_symbol}
                  onChange={(e) => setNewAlert({ ...newAlert, stock_symbol: e.target.value })}
                />
              </div>
              <div>
                <Label>Stock Name</Label>
                <Input
                  placeholder="e.g., Apple Inc."
                  value={newAlert.stock_name}
                  onChange={(e) => setNewAlert({ ...newAlert, stock_name: e.target.value })}
                />
              </div>
              <div>
                <Label>Alert Type</Label>
                <Select value={newAlert.alert_type} onValueChange={(v) => setNewAlert({ ...newAlert, alert_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="above">Price Above</SelectItem>
                    <SelectItem value="below">Price Below</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Target Price (฿)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newAlert.condition_value}
                  onChange={(e) => setNewAlert({ ...newAlert, condition_value: e.target.value })}
                />
              </div>
              <div>
                <Label>Notes (Optional)</Label>
                <Input
                  placeholder="Additional notes"
                  value={newAlert.notes}
                  onChange={(e) => setNewAlert({ ...newAlert, notes: e.target.value })}
                />
              </div>
              <Button onClick={() => createAlertMutation.mutate(newAlert)} className="w-full">
                Create Alert
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="text-lg font-semibold mb-4">Active Alerts ({activeAlerts.length})</h3>
          <div className="space-y-3">
            {activeAlerts.map((alert) => (
              <Card key={alert.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold">{alert.stock_symbol}</span>
                      <Badge variant="outline">{alert.stock_name}</Badge>
                      {alert.alert_type === "above" ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Alert when price goes {alert.alert_type} ฿{alert.condition_value.toLocaleString()}
                    </p>
                    {alert.notes && (
                      <p className="text-xs text-muted-foreground mt-1">{alert.notes}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleAlertMutation.mutate({ id: alert.id, is_active: alert.is_active })}
                    >
                      Pause
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteAlertMutation.mutate(alert.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
            {activeAlerts.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No active alerts</p>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Triggered Alerts ({triggeredAlerts.length})</h3>
          <div className="space-y-3">
            {triggeredAlerts.map((alert) => (
              <Card key={alert.id} className="p-4 border-primary">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold">{alert.stock_symbol}</span>
                      <Badge>{alert.stock_name}</Badge>
                      <Badge variant="destructive">Triggered</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Price went {alert.alert_type} ฿{alert.condition_value.toLocaleString()}
                    </p>
                    {alert.triggered_at && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Triggered: {new Date(alert.triggered_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteAlertMutation.mutate(alert.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
            {triggeredAlerts.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No triggered alerts</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
