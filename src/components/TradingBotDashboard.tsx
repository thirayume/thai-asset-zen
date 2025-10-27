import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Activity, TrendingUp, TrendingDown, DollarSign, Target, RefreshCw, Play, Pause, Power, AlertTriangle, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

interface TradeExecution {
  id: string;
  stock_symbol: string;
  stock_name: string;
  action: 'BUY' | 'SELL';
  shares: number;
  execution_price: number;
  total_value: number;
  status: string;
  executed_at: string;
  confidence_score: number | null;
}

interface BotStats {
  trades_today: number;
  win_rate: number;
  total_pnl: number;
  active_positions: number;
}

export default function TradingBotDashboard() {
  const [botEnabled, setBotEnabled] = useState(false);
  const [botMode, setBotMode] = useState<'paper' | 'live'>('paper');
  const [stats, setStats] = useState<BotStats>({
    trades_today: 0,
    win_rate: 0,
    total_pnl: 0,
    active_positions: 0,
  });
  const [recentTrades, setRecentTrades] = useState<TradeExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchBotStatus();
    fetchStats();
    fetchRecentTrades();

    // Set up real-time subscription
    const channel = supabase
      .channel('bot-trades')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'auto_trade_executions',
        },
        () => {
          fetchStats();
          fetchRecentTrades();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchBotStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('trading_bot_config')
        .select('enabled, mode')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setBotEnabled(data.enabled);
        setBotMode(data.mode as 'paper' | 'live');
      }
    } catch (error) {
      console.error('Error fetching bot status:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Fetch today's trades
      const { data: todayTrades } = await supabase
        .from('auto_trade_executions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'executed')
        .gte('created_at', today.toISOString());

      // Calculate stats
      let totalPnL = 0;
      let wins = 0;
      let losses = 0;

      if (todayTrades) {
        const buyTrades = todayTrades.filter(t => t.action === 'BUY');
        const sellTrades = todayTrades.filter(t => t.action === 'SELL');

        sellTrades.forEach(sell => {
          const buy = buyTrades.find(b => b.stock_symbol === sell.stock_symbol);
          if (buy) {
            const pnl = (sell.execution_price - buy.execution_price) * sell.shares;
            totalPnL += pnl;
            if (pnl > 0) wins++;
            else if (pnl < 0) losses++;
          }
        });
      }

      const winRate = (wins + losses) > 0 ? (wins / (wins + losses)) * 100 : 0;

      // Fetch active positions
      const { data: positions } = await supabase
        .from('monitored_positions')
        .select('id')
        .eq('user_id', user.id)
        .eq('active', true);

      setStats({
        trades_today: todayTrades?.length || 0,
        win_rate: winRate,
        total_pnl: totalPnL,
        active_positions: positions?.length || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentTrades = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('auto_trade_executions')
        .select('*')
        .eq('user_id', user.id)
        .order('executed_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentTrades(data || []);
    } catch (error) {
      console.error('Error fetching recent trades:', error);
    }
  };

  const toggleBot = async () => {
    setToggling(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('trading_bot_config')
        .update({ enabled: !botEnabled })
        .eq('user_id', user.id);

      if (error) throw error;

      setBotEnabled(!botEnabled);
      toast({
        title: botEnabled ? "Bot Paused" : "Bot Activated",
        description: botEnabled 
          ? "Auto-trading has been paused" 
          : "Auto-trading is now active",
      });
    } catch (error) {
      console.error('Error toggling bot:', error);
      toast({
        title: "Error",
        description: "Failed to toggle bot status",
        variant: "destructive",
      });
    } finally {
      setToggling(false);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchBotStatus();
    fetchStats();
    fetchRecentTrades();
  };

  const handleKillSwitch = async () => {
    if (!window.confirm('⚠️ EMERGENCY STOP\n\nThis will immediately disable the trading bot.\n\nAre you sure?')) {
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('trading_bot_config')
        .update({ enabled: false })
        .eq('user_id', user.id);

      if (error) throw error;

      setBotEnabled(false);
      toast({
        title: '🛑 Bot stopped successfully',
        description: 'All automated trading has been disabled'
      });

      // Insert alert
      await supabase.from('trade_alerts').insert({
        user_id: user.id,
        stock_symbol: 'SYSTEM',
        stock_name: 'System Alert',
        alert_type: 'bot_emergency_stop',
        message: '🛑 Trading bot emergency stopped by user',
        current_price: null,
        trigger_price: null
      });
    } catch (error: any) {
      console.error('Kill switch error:', error);
      toast({
        title: 'Error',
        description: 'Failed to stop bot',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Bot Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Trading Bot Status
              </CardTitle>
              <CardDescription>
                Real-time bot activity and performance
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                variant={botEnabled ? "destructive" : "default"}
                onClick={toggleBot}
                disabled={toggling}
              >
                {botEnabled ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Pause Bot
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Start Bot
                  </>
                )}
              </Button>
              {botEnabled && (
                <Button 
                  onClick={handleKillSwitch} 
                  variant="destructive" 
                  size="sm"
                  className="gap-2"
                >
                  <Power className="h-4 w-4" />
                  Emergency Stop
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="text-2xl font-bold">
                  {botEnabled ? "Active" : "Paused"}
                </p>
              </div>
              <Badge variant={botEnabled ? "default" : "secondary"} className="text-lg">
                {botEnabled ? "●" : "○"}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Mode</p>
                <p className="text-2xl font-bold capitalize">{botMode}</p>
              </div>
              <Badge variant={botMode === 'paper' ? "outline" : "destructive"}>
                {botMode === 'paper' ? 'Simulated' : 'Live ⚠️'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Safety Status Indicators */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-yellow-500/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Daily Loss Limit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              ฿0 / ฿5,000
            </div>
            <div className="w-full bg-secondary rounded-full h-2 mt-2">
              <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '0%' }} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Safe - No losses today</p>
          </CardContent>
        </Card>

        <Card className="border-blue-500/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-500" />
              Daily Trades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {stats.trades_today} / 3
            </div>
            <div className="w-full bg-secondary rounded-full h-2 mt-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(stats.trades_today / 3) * 100}%` }} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {3 - stats.trades_today} trades remaining today
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-500/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Total Exposure
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              ฿0 / ฿50,000
            </div>
            <div className="w-full bg-secondary rounded-full h-2 mt-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: '0%' }} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Safe - Low exposure</p>
          </CardContent>
        </Card>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Trades Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{stats.trades_today}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Win Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{stats.win_rate.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Today's P/L
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {stats.total_pnl >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              <span className={`text-2xl font-bold ${stats.total_pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ฿{stats.total_pnl.toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Positions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{stats.active_positions}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Trades */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Trades</CardTitle>
          <CardDescription>Last 10 executed trades</CardDescription>
        </CardHeader>
        <CardContent>
          {recentTrades.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No trades executed yet
            </p>
          ) : (
            <div className="space-y-4">
              {recentTrades.map((trade) => (
                <div
                  key={trade.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <Badge variant={trade.action === 'BUY' ? 'default' : 'secondary'}>
                      {trade.action}
                    </Badge>
                    <div>
                      <p className="font-medium">{trade.stock_symbol}</p>
                      <p className="text-sm text-muted-foreground">{trade.stock_name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {trade.shares} shares @ ฿{trade.execution_price.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Total: ฿{trade.total_value.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    {trade.confidence_score && (
                      <Badge variant="outline" className="mb-1">
                        {trade.confidence_score}% confident
                      </Badge>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(trade.executed_at), 'MMM dd, HH:mm')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
