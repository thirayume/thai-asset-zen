import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, TrendingUp, TrendingDown, Target, AlertTriangle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts";

interface BacktestResult {
  initialCapital: number;
  finalValue: number;
  totalReturn: number;
  totalTrades: number;
  completedTrades: number;
  winRate: number;
  wins: number;
  losses: number;
  profitFactor: number;
  maxDrawdown: number;
  sharpeRatio: number;
  bestTrade: { symbol: string; pnl: number; pnlPercent: number } | null;
  worstTrade: { symbol: string; pnl: number; pnlPercent: number } | null;
  equityCurve: { date: string; value: number }[];
  trades: any[];
  benchmark: { return: number; label: string };
}

export default function BotBacktest() {
  const { toast } = useToast();
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<BacktestResult | null>(null);
  
  // Form state
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 3); // Default: 3 months ago
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [initialCapital, setInitialCapital] = useState(100000);

  const runBacktest = async () => {
    setRunning(true);
    setResult(null);

    try {
      // Get user's bot config
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: config } = await supabase
        .from('trading_bot_config')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!config) {
        toast({
          title: "Configuration Required",
          description: "Please configure your bot settings first",
          variant: "destructive",
        });
        setRunning(false);
        return;
      }

      // Call backtest edge function
      const { data, error } = await supabase.functions.invoke('backtest-strategy', {
        body: {
          startDate,
          endDate,
          initialCapital,
          botConfig: {
            max_position_size: config.max_position_size,
            max_daily_trades: config.max_daily_trades,
            max_total_exposure: config.max_total_exposure,
            min_confidence_score: config.min_confidence_score,
            allowed_signal_types: config.allowed_signal_types,
            auto_stop_loss: config.auto_stop_loss,
            auto_take_profit: config.auto_take_profit,
            trailing_stop_percent: config.trailing_stop_percent,
            daily_loss_limit: config.daily_loss_limit,
          },
        },
      });

      if (error) throw error;

      setResult(data);
      toast({
        title: "Backtest Complete",
        description: `Simulated ${data.totalTrades} trades over ${Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))} days`,
      });
    } catch (error) {
      console.error('Backtest error:', error);
      toast({
        title: "Backtest Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setRunning(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Configuration Card */}
      <Card>
        <CardHeader>
          <CardTitle>🔬 Backtest Your Strategy</CardTitle>
          <CardDescription>
            Test your bot configuration on historical data to see how it would have performed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> Past performance does not guarantee future results. 
              Backtesting uses historical data and does not account for slippage, fees, or market impact.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                max={endDate}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="capital">Initial Capital (฿)</Label>
              <Input
                id="capital"
                type="number"
                value={initialCapital}
                onChange={(e) => setInitialCapital(Number(e.target.value))}
                min={10000}
                step={10000}
              />
            </div>
          </div>

          <Button onClick={runBacktest} disabled={running} className="w-full">
            {running ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Backtest...
              </>
            ) : (
              'Run Backtest'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <>
          {/* Performance Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Return</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${result.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {result.totalReturn >= 0 ? <TrendingUp className="inline h-5 w-5 mr-1" /> : <TrendingDown className="inline h-5 w-5 mr-1" />}
                  {result.totalReturn.toFixed(2)}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatCurrency(result.initialCapital)} → {formatCurrency(result.finalValue)}
                </p>
                <p className="text-xs text-muted-foreground">
                  vs Benchmark: {result.benchmark.return.toFixed(2)}%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Win Rate</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <Target className="inline h-5 w-5 mr-1 text-primary" />
                  {result.winRate.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {result.wins} wins, {result.losses} losses
                </p>
                <p className="text-xs text-muted-foreground">
                  {result.completedTrades} completed trades
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Profit Factor</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {result.profitFactor.toFixed(2)}x
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Avg profit / Avg loss ratio
                </p>
                <p className="text-xs text-muted-foreground">
                  Sharpe: {result.sharpeRatio.toFixed(2)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Max Drawdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  -{result.maxDrawdown.toFixed(2)}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Largest peak-to-trough decline
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Best/Worst Trades */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.bestTrade && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-green-600">🏆 Best Trade</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{result.bestTrade.symbol}</p>
                  <p className="text-green-600 text-xl">
                    +{formatCurrency(result.bestTrade.pnl)} ({result.bestTrade.pnlPercent.toFixed(2)}%)
                  </p>
                </CardContent>
              </Card>
            )}

            {result.worstTrade && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-red-600">💀 Worst Trade</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{result.worstTrade.symbol}</p>
                  <p className="text-red-600 text-xl">
                    {formatCurrency(result.worstTrade.pnl)} ({result.worstTrade.pnlPercent.toFixed(2)}%)
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Equity Curve */}
          <Card>
            <CardHeader>
              <CardTitle>📈 Equity Curve</CardTitle>
              <CardDescription>Portfolio value over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={result.equityCurve}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(date) => new Date(date).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `฿${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(date) => new Date(date).toLocaleDateString('th-TH')}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    name="Portfolio Value"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Trade Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>📊 Trade Distribution</CardTitle>
              <CardDescription>Wins vs Losses</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={[
                  { name: 'Wins', count: result.wins, fill: 'hsl(142, 76%, 36%)' },
                  { name: 'Losses', count: result.losses, fill: 'hsl(0, 84%, 60%)' }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="fill" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Trade Log */}
          <Card>
            <CardHeader>
              <CardTitle>📋 Trade Log</CardTitle>
              <CardDescription>All {result.trades.length} trades executed during backtest</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-background border-b">
                    <tr className="text-left">
                      <th className="p-2">Date</th>
                      <th className="p-2">Symbol</th>
                      <th className="p-2">Action</th>
                      <th className="p-2">Shares</th>
                      <th className="p-2">Price</th>
                      <th className="p-2">Total</th>
                      <th className="p-2">P/L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.trades.map((trade, idx) => (
                      <tr key={idx} className="border-b hover:bg-muted/50">
                        <td className="p-2">{new Date(trade.date).toLocaleDateString('th-TH')}</td>
                        <td className="p-2 font-mono">{trade.symbol}</td>
                        <td className="p-2">
                          <span className={trade.action === 'BUY' ? 'text-green-600' : 'text-red-600'}>
                            {trade.action}
                          </span>
                        </td>
                        <td className="p-2">{trade.shares}</td>
                        <td className="p-2">฿{trade.price.toFixed(2)}</td>
                        <td className="p-2">{formatCurrency(trade.total_value)}</td>
                        <td className={`p-2 ${trade.pnl ? (trade.pnl >= 0 ? 'text-green-600' : 'text-red-600') : ''}`}>
                          {trade.pnl ? formatCurrency(trade.pnl) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
