import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface TradeExecution {
  id: string;
  stock_symbol: string;
  stock_name: string;
  action: 'BUY' | 'SELL';
  shares: number;
  price: number;
  total_value: number;
  status: string;
  executed_at: string;
  confidence_score: number;
}

interface PerformanceMetrics {
  totalPL: number;
  winRate: number;
  totalTrades: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
}

export const BotTradeHistory = () => {
  const [trades, setTrades] = useState<TradeExecution[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'buy' | 'sell'>('all');

  useEffect(() => {
    fetchTradeHistory();
  }, []);

  const fetchTradeHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('auto_trade_executions')
        .select('*')
        .eq('user_id', user.id)
        .order('executed_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      
      setTrades(data || []);
      calculateMetrics(data || []);
    } catch (error: any) {
      console.error('Error fetching trade history:', error);
      toast.error('Failed to load trade history');
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = (tradeData: TradeExecution[]) => {
    if (tradeData.length === 0) {
      setMetrics(null);
      return;
    }

    const wins = tradeData.filter(t => t.action === 'SELL' && t.total_value > 0);
    const losses = tradeData.filter(t => t.action === 'SELL' && t.total_value < 0);
    
    const totalPL = tradeData
      .filter(t => t.action === 'SELL')
      .reduce((sum, t) => sum + t.total_value, 0);
    
    const winRate = wins.length / (wins.length + losses.length) * 100 || 0;
    const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + t.total_value, 0) / wins.length : 0;
    const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s, t) => s + t.total_value, 0) / losses.length) : 0;
    const profitFactor = avgLoss > 0 ? avgWin / avgLoss : 0;

    setMetrics({
      totalPL,
      winRate,
      totalTrades: wins.length + losses.length,
      avgWin,
      avgLoss,
      profitFactor
    });
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Symbol', 'Action', 'Shares', 'Price', 'Total Value', 'Status', 'Confidence'];
    const rows = trades.map(t => [
      format(new Date(t.executed_at), 'yyyy-MM-dd HH:mm:ss'),
      t.stock_symbol,
      t.action,
      t.shares,
      t.price,
      t.total_value,
      t.status,
      t.confidence_score
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bot-trades-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    toast.success('Trade history exported');
  };

  const filteredTrades = trades.filter(t => 
    filter === 'all' ? true : t.action.toLowerCase() === filter
  );

  if (loading) {
    return <div className="p-8 text-center">Loading trade history...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Performance Metrics */}
      {metrics && (
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total P/L</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${metrics.totalPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ฿{metrics.totalPL.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Win Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.winRate.toFixed(1)}%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Trades</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalTrades}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Win</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">฿{metrics.avgWin.toFixed(0)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Loss</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">฿{metrics.avgLoss.toFixed(0)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Profit Factor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.profitFactor.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Trade History Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Trade History</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setFilter('all')}>All</Button>
              <Button variant="outline" size="sm" onClick={() => setFilter('buy')}>Buy</Button>
              <Button variant="outline" size="sm" onClick={() => setFilter('sell')}>Sell</Button>
              <Button variant="outline" size="sm" onClick={exportToCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead className="text-right">Shares</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Total Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Confidence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrades.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      No trades executed yet
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTrades.map((trade) => (
                    <TableRow key={trade.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(trade.executed_at), 'MMM dd, HH:mm')}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{trade.stock_symbol}</div>
                          <div className="text-xs text-muted-foreground">{trade.stock_name}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={trade.action === 'BUY' ? 'default' : 'secondary'}>
                          {trade.action === 'BUY' ? (
                            <TrendingUp className="h-3 w-3 mr-1" />
                          ) : (
                            <TrendingDown className="h-3 w-3 mr-1" />
                          )}
                          {trade.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{trade.shares.toLocaleString()}</TableCell>
                      <TableCell className="text-right">฿{trade.price.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-medium">
                        ฿{trade.total_value.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={trade.status === 'completed' ? 'default' : 'outline'}>
                          {trade.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{trade.confidence_score}%</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};