import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, User, Shield, RefreshCw } from "lucide-react";
import AISuggestions from "@/components/AISuggestions";
import LiveMarketFeed from "@/components/LiveMarketFeed";
import { MyPortfolio } from "@/components/MyPortfolio";
import { TradingAlerts } from "@/components/TradingAlerts";
import { Watchlist } from "@/components/Watchlist";
import TradingSignals from "@/components/TradingSignals";
import { useToast } from "@/hooks/use-toast";

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
      // Refresh stock prices
      const { error: pricesError } = await supabase.functions.invoke('update-stock-prices');
      if (pricesError) throw pricesError;

      // Refresh trading signals
      const { error: signalsError } = await supabase.functions.invoke('generate-trading-signals');
      if (signalsError) throw signalsError;

      // Check trading alerts
      const { error: alertsError } = await supabase.functions.invoke('check-trading-alerts');
      if (alertsError) throw alertsError;

      toast({
        title: "สำเร็จ / Success",
        description: "อัพเดทข้อมูลทั้งหมดเรียบร้อย / All data refreshed successfully",
      });

      // Reload the page to show updated data
      setTimeout(() => window.location.reload(), 1000);
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

        {/* AI Suggestions and Trading Signals */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <AISuggestions />
          <TradingSignals />
        </div>

        {/* Market Feed */}
        <div className="mb-6">
          <LiveMarketFeed />
        </div>

        {/* Trading Alerts */}
        <div className="mb-6">
          <TradingAlerts />
        </div>

        {/* Watchlist */}
        <div className="mb-6">
          <Watchlist />
        </div>

        {/* My Portfolio */}
        <div className="mb-6">
          <MyPortfolio />
        </div>
      </div>
    </div>
  );
};

export default Index;
