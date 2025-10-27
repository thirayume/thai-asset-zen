import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle2, Info, TrendingDown, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface BotAlert {
  id: string;
  alert_type: string;
  message: string;
  stock_symbol: string;
  stock_name: string;
  current_price: number | null;
  trigger_price: number | null;
  is_read: boolean;
  created_at: string;
}

export const BotAlerts = () => {
  const [alerts, setAlerts] = useState<BotAlert[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('unread');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
    subscribeToAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('trade_alerts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setAlerts(data || []);
    } catch (error: any) {
      console.error('Error fetching alerts:', error);
      toast.error('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  const subscribeToAlerts = () => {
    const channel = supabase
      .channel('trade_alerts_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'trade_alerts'
        },
        (payload) => {
          const newAlert = payload.new as BotAlert;
          setAlerts(prev => [newAlert, ...prev]);
          
          // Show toast notification
          toast(newAlert.message, {
            icon: getAlertIcon(newAlert.alert_type),
            duration: 5000,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const markAsRead = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('trade_alerts')
        .update({ is_read: true })
        .eq('id', alertId);

      if (error) throw error;

      setAlerts(prev => 
        prev.map(alert => 
          alert.id === alertId ? { ...alert, is_read: true } : alert
        )
      );
    } catch (error: any) {
      console.error('Error marking alert as read:', error);
      toast.error('Failed to update alert');
    }
  };

  const markAllAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('trade_alerts')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      setAlerts(prev => prev.map(alert => ({ ...alert, is_read: true })));
      toast.success('All alerts marked as read');
    } catch (error: any) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to update alerts');
    }
  };

  const getAlertIcon = (type: string) => {
    if (type.includes('stop_loss') || type.includes('loss')) {
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
    if (type.includes('take_profit') || type.includes('profit')) {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    }
    if (type.includes('paused') || type.includes('limit')) {
      return <Info className="h-4 w-4 text-yellow-500" />;
    }
    return <CheckCircle2 className="h-4 w-4 text-blue-500" />;
  };

  const getAlertBadge = (type: string) => {
    if (type.includes('stop_loss') || type.includes('loss')) {
      return <Badge variant="destructive">Critical</Badge>;
    }
    if (type.includes('take_profit') || type.includes('profit')) {
      return <Badge className="bg-green-500">Success</Badge>;
    }
    if (type.includes('paused')) {
      return <Badge variant="secondary">Warning</Badge>;
    }
    return <Badge variant="outline">Info</Badge>;
  };

  const filteredAlerts = filter === 'unread' 
    ? alerts.filter(a => !a.is_read) 
    : alerts;

  const unreadCount = alerts.filter(a => !a.is_read).length;

  if (loading) {
    return <div className="p-8 text-center">Loading alerts...</div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle>Bot Alerts</CardTitle>
              {unreadCount > 0 && (
                <Badge variant="destructive">{unreadCount} new</Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setFilter('all')}
                className={filter === 'all' ? 'bg-primary text-primary-foreground' : ''}
              >
                All
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setFilter('unread')}
                className={filter === 'unread' ? 'bg-primary text-primary-foreground' : ''}
              >
                Unread
              </Button>
              {unreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={markAllAsRead}>
                  Mark All Read
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredAlerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {filter === 'unread' ? 'No unread alerts' : 'No alerts yet'}
              </div>
            ) : (
              filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 border rounded-lg ${
                    !alert.is_read ? 'bg-accent border-primary' : 'bg-background'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      {getAlertIcon(alert.alert_type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{alert.stock_symbol}</span>
                          {getAlertBadge(alert.alert_type)}
                          {!alert.is_read && (
                            <Badge variant="outline" className="text-xs">New</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {alert.message}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{format(new Date(alert.created_at), 'MMM dd, yyyy HH:mm')}</span>
                          {alert.current_price && (
                            <span>Current: ฿{alert.current_price.toFixed(2)}</span>
                          )}
                          {alert.trigger_price && (
                            <span>Trigger: ฿{alert.trigger_price.toFixed(2)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {!alert.is_read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead(alert.id)}
                      >
                        Mark Read
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};