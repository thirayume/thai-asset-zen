import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, Check, Trash2, TrendingUp, TrendingDown, Target, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

interface Alert {
  id: string;
  alert_type: 'target_reached' | 'stop_loss_triggered' | 'watchlist_entry';
  stock_symbol: string;
  stock_name: string;
  message: string;
  current_price: number;
  trigger_price: number;
  is_read: boolean;
  created_at: string;
}

export const TradingAlerts = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check for alerts on mount and periodically
  useEffect(() => {
    const checkAlerts = async () => {
      try {
        await supabase.functions.invoke('check-trading-alerts');
        queryClient.invalidateQueries({ queryKey: ['trading-alerts'] });
      } catch (error) {
        console.error('Error checking alerts:', error);
      }
    };

    // Check on mount
    checkAlerts();

    // Check every 2 minutes
    const interval = setInterval(checkAlerts, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [queryClient]);

  const { data: alerts, isLoading } = useQuery({
    queryKey: ['trading-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trade_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as Alert[];
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from('trade_alerts')
        .update({ is_read: true })
        .eq('id', alertId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trading-alerts'] });
    },
  });

  const deleteAlertMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from('trade_alerts')
        .delete()
        .eq('id', alertId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trading-alerts'] });
      toast({
        title: "Alert deleted",
        description: "The alert has been removed.",
      });
    },
  });

  const checkAlertsMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.functions.invoke('check-trading-alerts');
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trading-alerts'] });
      toast({
        title: "Alerts checked",
        description: "Your positions have been checked for alerts.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error checking alerts",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    },
  });

  const getAlertIcon = (type: Alert['alert_type']) => {
    switch (type) {
      case 'target_reached':
        return <Target className="h-5 w-5 text-green-500" />;
      case 'stop_loss_triggered':
        return <TrendingDown className="h-5 w-5 text-red-500" />;
      case 'watchlist_entry':
        return <TrendingUp className="h-5 w-5 text-blue-500" />;
    }
  };

  const getAlertBadge = (type: Alert['alert_type']) => {
    const variants: Record<Alert['alert_type'], { text: string; className: string }> = {
      target_reached: { text: 'Target Reached', className: 'bg-green-100 text-green-800' },
      stop_loss_triggered: { text: 'Stop Loss', className: 'bg-red-100 text-red-800' },
      watchlist_entry: { text: 'Entry Price', className: 'bg-blue-100 text-blue-800' },
    };
    
    return <Badge className={variants[type].className}>{variants[type].text}</Badge>;
  };

  const unreadCount = alerts?.filter(a => !a.is_read).length || 0;

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Trading Alerts</h2>
        </div>
        <p className="text-muted-foreground">Loading alerts...</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Trading Alerts</h2>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {unreadCount} new
            </Badge>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => checkAlertsMutation.mutate()}
          disabled={checkAlertsMutation.isPending}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${checkAlertsMutation.isPending ? 'animate-spin' : ''}`} />
          Check Now
        </Button>
      </div>

      {!alerts || alerts.length === 0 ? (
        <p className="text-muted-foreground">No alerts yet. Alerts will appear when your positions reach target/stop-loss prices or watchlist items hit entry prices.</p>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-lg border ${
                alert.is_read ? 'bg-background' : 'bg-accent/50 border-accent'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  {getAlertIcon(alert.alert_type)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{alert.stock_symbol}</span>
                      {getAlertBadge(alert.alert_type)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{alert.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(alert.created_at).toLocaleString('th-TH')}
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-1">
                  {!alert.is_read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAsReadMutation.mutate(alert.id)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteAlertMutation.mutate(alert.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
