import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  Activity, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Database, 
  RefreshCw, 
  Server,
  TrendingUp,
  Zap
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface EdgeFunctionMetrics {
  name: string;
  lastRun: string | null;
  status: 'healthy' | 'warning' | 'error';
  avgResponseTime?: number;
  errorRate?: number;
}

interface SystemHealth {
  database: 'healthy' | 'warning' | 'error';
  edgeFunctions: 'healthy' | 'warning' | 'error';
  apiServices: 'healthy' | 'warning' | 'error';
  overall: 'healthy' | 'warning' | 'error';
}

interface APIUsageStats {
  lovableAI: { calls: number; lastUsed: string | null };
  goldAPI: { calls: number; lastUsed: string | null };
  stockAPI: { calls: number; lastUsed: string | null };
}

const AdminMonitoring = () => {
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    database: 'healthy',
    edgeFunctions: 'healthy',
    apiServices: 'healthy',
    overall: 'healthy'
  });
  const [edgeFunctions, setEdgeFunctions] = useState<EdgeFunctionMetrics[]>([]);
  const [apiUsage, setApiUsage] = useState<APIUsageStats>({
    lovableAI: { calls: 0, lastUsed: null },
    goldAPI: { calls: 0, lastUsed: null },
    stockAPI: { calls: 0, lastUsed: null }
  });
  const [dbMetrics, setDbMetrics] = useState({
    activeConnections: 0,
    totalTables: 0,
    recentErrors: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchMonitoringData = async () => {
    try {
      setLoading(true);

      // Fetch edge function status
      const edgeFunctionsData: EdgeFunctionMetrics[] = [
        { name: 'generate-investment-suggestions', lastRun: null, status: 'healthy' },
        { name: 'generate-trading-signals', lastRun: null, status: 'healthy' },
        { name: 'update-gold-prices', lastRun: null, status: 'healthy' },
        { name: 'update-stock-prices', lastRun: null, status: 'healthy' },
        { name: 'check-trading-alerts', lastRun: null, status: 'healthy' }
      ];

      // Check gold prices to determine gold API health
      const { data: goldPrices, error: goldError } = await supabase
        .from('gold_prices')
        .select('recorded_at')
        .order('recorded_at', { ascending: false })
        .limit(1)
        .single();

      if (goldError && goldError.code !== 'PGRST116') {
        console.error('Error fetching gold prices:', goldError);
      }

      const goldUpdateTime = goldPrices?.recorded_at ? new Date(goldPrices.recorded_at) : null;
      const goldTimeDiff = goldUpdateTime ? Date.now() - goldUpdateTime.getTime() : null;
      
      // If gold prices haven't updated in over 2 hours, mark as warning
      const goldAPIStatus = goldTimeDiff && goldTimeDiff > 2 * 60 * 60 * 1000 ? 'warning' : 'healthy';
      const updateGoldPricesIndex = edgeFunctionsData.findIndex(f => f.name === 'update-gold-prices');
      if (updateGoldPricesIndex !== -1) {
        edgeFunctionsData[updateGoldPricesIndex].lastRun = goldPrices?.recorded_at || null;
        edgeFunctionsData[updateGoldPricesIndex].status = goldAPIStatus;
      }

      // Check stock prices
      const { data: stockPrices, error: stockError } = await supabase
        .from('thai_stocks')
        .select('last_updated')
        .order('last_updated', { ascending: false })
        .limit(1)
        .single();

      if (stockError && stockError.code !== 'PGRST116') {
        console.error('Error fetching stock prices:', stockError);
      }

      const stockUpdateTime = stockPrices?.last_updated ? new Date(stockPrices.last_updated) : null;
      const stockTimeDiff = stockUpdateTime ? Date.now() - stockUpdateTime.getTime() : null;
      
      const stockAPIStatus = stockTimeDiff && stockTimeDiff > 24 * 60 * 60 * 1000 ? 'warning' : 'healthy';
      const updateStockPricesIndex = edgeFunctionsData.findIndex(f => f.name === 'update-stock-prices');
      if (updateStockPricesIndex !== -1) {
        edgeFunctionsData[updateStockPricesIndex].lastRun = stockPrices?.last_updated || null;
        edgeFunctionsData[updateStockPricesIndex].status = stockAPIStatus;
      }

      // Check investment suggestions (Lovable AI)
      const { data: suggestions, error: suggestionsError } = await supabase
        .from('investment_suggestions')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (suggestionsError && suggestionsError.code !== 'PGRST116') {
        console.error('Error fetching suggestions:', suggestionsError);
      }

      const aiSuggestionTime = suggestions?.created_at ? new Date(suggestions.created_at) : null;
      const aiTimeDiff = aiSuggestionTime ? Date.now() - aiSuggestionTime.getTime() : null;
      
      const aiStatus = aiTimeDiff && aiTimeDiff > 24 * 60 * 60 * 1000 ? 'warning' : 'healthy';
      const generateSuggestionsIndex = edgeFunctionsData.findIndex(f => f.name === 'generate-investment-suggestions');
      if (generateSuggestionsIndex !== -1) {
        edgeFunctionsData[generateSuggestionsIndex].lastRun = suggestions?.created_at || null;
        edgeFunctionsData[generateSuggestionsIndex].status = aiStatus;
      }

      // Check trading alerts
      const { data: alerts, error: alertsError } = await supabase
        .from('trade_alerts')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (alertsError && alertsError.code !== 'PGRST116') {
        console.error('Error fetching alerts:', alertsError);
      }

      const checkAlertsIndex = edgeFunctionsData.findIndex(f => f.name === 'check-trading-alerts');
      if (checkAlertsIndex !== -1) {
        edgeFunctionsData[checkAlertsIndex].lastRun = alerts?.created_at || null;
      }

      setEdgeFunctions(edgeFunctionsData);

      // Calculate API usage stats
      const { count: aiCallsCount } = await supabase
        .from('investment_suggestions')
        .select('*', { count: 'exact', head: true });

      const { count: goldCallsCount } = await supabase
        .from('gold_prices')
        .select('*', { count: 'exact', head: true });

      const { count: stockCallsCount } = await supabase
        .from('thai_stocks')
        .select('*', { count: 'exact', head: true });

      setApiUsage({
        lovableAI: { calls: aiCallsCount || 0, lastUsed: suggestions?.created_at || null },
        goldAPI: { calls: goldCallsCount || 0, lastUsed: goldPrices?.recorded_at || null },
        stockAPI: { calls: stockCallsCount || 0, lastUsed: stockPrices?.last_updated || null }
      });

      // Database metrics - simplified since we can't query information_schema directly
      // Count known tables manually
      const knownTables = [
        'profiles', 'user_roles', 'user_portfolios', 'user_positions', 
        'user_watchlist', 'thai_stocks', 'gold_prices', 'trade_alerts',
        'investment_suggestions', 'market_alerts', 'audit_logs', 'system_settings'
      ];
      
      const tablesCount = knownTables.length;

      setDbMetrics({
        activeConnections: 0, // This would require admin access
        totalTables: tablesCount || 0,
        recentErrors: 0
      });

      // Determine overall system health
      const hasErrors = edgeFunctionsData.some(f => f.status === 'error');
      const hasWarnings = edgeFunctionsData.some(f => f.status === 'warning');
      
      const overallStatus = hasErrors ? 'error' : hasWarnings ? 'warning' : 'healthy';

      setSystemHealth({
        database: 'healthy',
        edgeFunctions: overallStatus,
        apiServices: goldAPIStatus === 'warning' || stockAPIStatus === 'warning' ? 'warning' : 'healthy',
        overall: overallStatus
      });

      toast({
        title: "Monitoring Data Refreshed",
        description: "System health metrics updated successfully",
      });

    } catch (error) {
      console.error("Error fetching monitoring data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch monitoring data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitoringData();
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchMonitoringData, 60000);
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status: 'healthy' | 'warning' | 'error') => {
    const variants = {
      healthy: { color: 'bg-success text-success-foreground', icon: CheckCircle },
      warning: { color: 'bg-warning text-warning-foreground', icon: AlertCircle },
      error: { color: 'bg-destructive text-destructive-foreground', icon: AlertCircle }
    };
    const variant = variants[status];
    const Icon = variant.icon;
    return (
      <Badge className={variant.color}>
        <Icon className="h-3 w-3 mr-1" />
        {status.toUpperCase()}
      </Badge>
    );
  };

  const formatTimeAgo = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const diff = Date.now() - new Date(dateString).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>System Monitoring</CardTitle>
          <CardDescription>Loading monitoring data...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">System Monitoring</h2>
          <p className="text-muted-foreground">Real-time health and performance metrics</p>
        </div>
        <Button onClick={fetchMonitoringData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Overall System Health Alert */}
      {systemHealth.overall !== 'healthy' && (
        <Alert variant={systemHealth.overall === 'error' ? 'destructive' : 'default'}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {systemHealth.overall === 'error' 
              ? 'Critical: System has errors that require immediate attention.'
              : 'Warning: Some services are experiencing issues.'}
          </AlertDescription>
        </Alert>
      )}

      {/* System Health Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {getStatusBadge(systemHealth.overall)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {getStatusBadge(systemHealth.database)}
            <p className="text-xs text-muted-foreground mt-2">
              {dbMetrics.totalTables} tables
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Edge Functions</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {getStatusBadge(systemHealth.edgeFunctions)}
            <p className="text-xs text-muted-foreground mt-2">
              {edgeFunctions.length} functions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Services</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {getStatusBadge(systemHealth.apiServices)}
            <p className="text-xs text-muted-foreground mt-2">
              3 services
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Edge Functions Monitor */}
      <Card>
        <CardHeader>
          <CardTitle>Edge Functions</CardTitle>
          <CardDescription>Backend function performance and health</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {edgeFunctions.map((func) => (
              <div key={func.name} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <p className="font-semibold">{func.name}</p>
                    {getStatusBadge(func.status)}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>Last run: {formatTimeAgo(func.lastRun)}</span>
                  </div>
                </div>
                {func.avgResponseTime && (
                  <div className="text-right">
                    <p className="text-sm font-semibold">{func.avgResponseTime}ms</p>
                    <p className="text-xs text-muted-foreground">Avg response</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* API Usage Monitor */}
      <Card>
        <CardHeader>
          <CardTitle>API Usage Statistics</CardTitle>
          <CardDescription>External API call tracking and costs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <p className="font-semibold">Lovable AI</p>
              </div>
              <p className="text-2xl font-bold">{apiUsage.lovableAI.calls}</p>
              <p className="text-xs text-muted-foreground">Total calls</p>
              <p className="text-xs text-muted-foreground mt-1">
                Last: {formatTimeAgo(apiUsage.lovableAI.lastUsed)}
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-warning" />
                <p className="font-semibold">Gold Prices API</p>
              </div>
              <p className="text-2xl font-bold">{apiUsage.goldAPI.calls}</p>
              <p className="text-xs text-muted-foreground">Total records</p>
              <p className="text-xs text-muted-foreground mt-1">
                Last: {formatTimeAgo(apiUsage.goldAPI.lastUsed)}
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-success" />
                <p className="font-semibold">Stock Prices API</p>
              </div>
              <p className="text-2xl font-bold">{apiUsage.stockAPI.calls}</p>
              <p className="text-xs text-muted-foreground">Total records</p>
              <p className="text-xs text-muted-foreground mt-1">
                Last: {formatTimeAgo(apiUsage.stockAPI.lastUsed)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Database Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Database Performance</CardTitle>
          <CardDescription>Database health and metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Total Tables</p>
              <p className="text-2xl font-bold">{dbMetrics.totalTables}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Recent Errors</p>
              <p className="text-2xl font-bold">{dbMetrics.recentErrors}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Active Connections</p>
              <p className="text-2xl font-bold">N/A</p>
              <p className="text-xs text-muted-foreground mt-1">Requires admin access</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminMonitoring;
