import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, User, Shield, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MyPortfolio } from "@/components/MyPortfolio";
import { MyGoldPositions } from "@/components/MyGoldPositions";
import { Watchlist } from "@/components/Watchlist";
import { GoldPrices } from "@/components/GoldPrices";
import AISuggestions from "@/components/AISuggestions";
import TradingSignals from "@/components/TradingSignals";
import { TradingAlerts } from "@/components/TradingAlerts";
import LiveMarketFeed from "@/components/LiveMarketFeed";
import { PriceAlerts } from "@/components/PriceAlerts";
import { PortfolioAnalytics } from "@/components/PortfolioAnalytics";
import { TransactionHistory } from "@/components/TransactionHistory";
import { TaxReport } from "@/components/TaxReport";
import { PullToRefresh } from "@/components/PullToRefresh";
import { SharePortfolio } from "@/components/SharePortfolio";
import { Leaderboard } from "@/components/Leaderboard";
import TradingBotSettings from "@/components/TradingBotSettings";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userEmail, setUserEmail] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || "");
        
        // Check if user is admin
        const { data: hasAdminRole } = await supabase.rpc('has_role', {
          _user_id: user.id,
          _role: 'admin'
        });
        setIsAdmin(hasAdminRole || false);
      }
    };
    checkUser();
  }, []);

  const handleRefreshAll = async () => {
    setRefreshing(true);
    try {
      const [stocksResponse, goldResponse, signalsResponse, alertsResponse] = await Promise.all([
        supabase.functions.invoke('update-stock-prices'),
        supabase.functions.invoke('update-gold-prices'),
        supabase.functions.invoke('generate-trading-signals'),
        supabase.functions.invoke('check-trading-alerts')
      ]);

      const errors = [];
      if (stocksResponse.error) errors.push('Stock prices update failed');
      if (goldResponse.error) errors.push('Gold prices update failed');
      if (signalsResponse.error) errors.push('Trading signals update failed');
      if (alertsResponse.error) errors.push('Trading alerts check failed');

      if (errors.length > 0) {
        toast({
          title: "ข้อผิดพลาดบางส่วน / Partial Error",
          description: errors.join(', '),
          variant: "destructive",
        });
      } else {
        toast({
          title: "สำเร็จ / Success",
          description: "อัพเดทข้อมูลทั้งหมดเรียบร้อย / All data refreshed successfully",
        });
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch (error) {
      console.error('Refresh error:', error);
      toast({
        title: "ข้อผิดพลาด / Error",
        description: "ไม่สามารถอัพเดทข้อมูลได้ / Failed to refresh data",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handlePullToRefresh = async () => {
    await handleRefreshAll();
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "ข้อผิดพลาด / Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "ออกจากระบบ / Logged out",
        description: "ออกจากระบบสำเร็จ / Successfully logged out",
      });
      navigate("/auth");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <PullToRefresh onRefresh={handlePullToRefresh} />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-2">
              Thai Portfolio Tracker
            </h1>
            <p className="text-muted-foreground">
              Last updated: {new Date().toLocaleString('th-TH')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{userEmail}</span>
            </div>
            <Button 
              variant="secondary" 
              onClick={handleRefreshAll}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh All
            </Button>
            {isAdmin && (
              <Button variant="default" onClick={() => navigate("/admin")}>
                <Shield className="h-4 w-4 mr-2" />
                Admin Panel
              </Button>
            )}
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              ออกจากระบบ / Logout
            </Button>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="portfolio" className="w-full">
          <TabsList className="grid w-full grid-cols-5 lg:grid-cols-11">
            <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
            <TabsTrigger value="gold">Gold</TabsTrigger>
            <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
            <TabsTrigger value="ai">AI Insights</TabsTrigger>
            <TabsTrigger value="market">Market</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="tax">Tax Report</TabsTrigger>
            <TabsTrigger value="social">Social</TabsTrigger>
            <TabsTrigger value="bot">Bot</TabsTrigger>
          </TabsList>

          <TabsContent value="portfolio" className="space-y-6">
            <MyPortfolio />
          </TabsContent>

          <TabsContent value="gold" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <GoldPrices />
              <MyGoldPositions />
            </div>
          </TabsContent>

          <TabsContent value="watchlist" className="space-y-6">
            <Watchlist />
          </TabsContent>

          <TabsContent value="ai" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AISuggestions />
              <TradingSignals />
            </div>
            <TradingAlerts />
          </TabsContent>

          <TabsContent value="market" className="space-y-6">
            <LiveMarketFeed />
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6">
            <PriceAlerts />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <PortfolioAnalytics />
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <TransactionHistory />
          </TabsContent>

          <TabsContent value="tax" className="space-y-6">
            <TaxReport />
          </TabsContent>

          <TabsContent value="social" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SharePortfolio />
              <Leaderboard />
            </div>
          </TabsContent>

          <TabsContent value="bot" className="space-y-6">
            <TradingBotSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
