import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TrendingUp, TrendingDown, AlertCircle, Sparkles, RefreshCw, LogIn, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";

const AISuggestions = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [authSession, setAuthSession] = useState<Session | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Monitor auth state changes
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setAuthSession(session);
      setIsCheckingAuth(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthSession(session);
      setIsCheckingAuth(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const { data: suggestions, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['investment-suggestions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('investment_suggestions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });

  const handleGenerateSuggestions = async () => {
    try {
      // Check if user is authenticated
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        toast({
          title: "Session Error",
          description: "Unable to verify authentication. Please try logging in again.",
          variant: "destructive",
        });
        return;
      }

      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please log in to generate AI suggestions.",
          variant: "destructive",
        });
        return;
      }

      // Check if session has valid access token
      if (!session.access_token) {
        toast({
          title: "Invalid Session",
          description: "Your session is invalid. Please log in again.",
          variant: "destructive",
        });
        navigate('/auth');
        return;
      }

      // Check if session is expired
      const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
      if (expiresAt && expiresAt < Date.now()) {
        toast({
          title: "Session Expired",
          description: "Your session has expired. Refreshing...",
        });
        
        // Attempt to refresh session
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError || !refreshData.session) {
          toast({
            title: "Session Refresh Failed",
            description: "Please log in again.",
            variant: "destructive",
          });
          navigate('/auth');
          return;
        }
      }

      // Force refresh session to ensure we have the latest valid token
      const { data: refreshedSession, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.error('Session refresh error:', refreshError);
        toast({
          title: "Authentication Error",
          description: "Failed to refresh session. Please log in again.",
          variant: "destructive",
        });
        navigate('/auth');
        return;
      }

      if (!refreshedSession.session) {
        toast({
          title: "Authentication Required",
          description: "Please log in to continue.",
          variant: "destructive",
        });
        navigate('/auth');
        return;
      }

      toast({
        title: "Generating AI Suggestions",
        description: "Please wait while AI analyzes the market...",
      });

      // Call edge function with refreshed session
      const { data, error } = await supabase.functions.invoke('generate-investment-suggestions');
      
      console.log('Full response:', { data, error });
      
      if (error) {
        console.error('Error object:', JSON.stringify(error, null, 2));
        
        // Provide specific error messages based on error type
        if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
          toast({
            title: "Authentication Failed",
            description: "Your session is no longer valid. Please log in again.",
            variant: "destructive",
          });
          navigate('/auth');
          return;
        }
        
        toast({
          title: "Function Error",
          description: error.message || JSON.stringify(error),
          variant: "destructive",
        });
        throw error;
      }

      await refetch();
      
      toast({
        title: "Suggestions Updated!",
        description: "AI has generated new investment recommendations.",
      });
    } catch (error) {
      console.error('Error generating suggestions:', error);
      
      // Differentiate error types
      let errorMessage = "Failed to generate suggestions. Please try again.";
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          errorMessage = "Network connection error. Please check your internet connection.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-profit/20 text-profit border-profit/30';
      case 'medium': return 'bg-warning/20 text-warning border-warning/30';
      case 'high': return 'bg-loss/20 text-loss border-loss/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'buy': return <TrendingUp className="w-5 h-5 text-profit" />;
      case 'sell': return <TrendingDown className="w-5 h-5 text-loss" />;
      default: return <AlertCircle className="w-5 h-5 text-warning" />;
    }
  };

  return (
    <Card className="p-6 bg-card/50 backdrop-blur-xl border-border/50">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              AI Investment Suggestions
            </h2>
            <p className="text-sm text-muted-foreground">Powered by Gemini AI - For Newbie Investors</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!isCheckingAuth && (
            <Badge 
              variant="outline" 
              className={authSession ? "border-profit/50 text-profit" : "border-warning/50 text-warning"}
            >
              {authSession ? (
                <>
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Logged In
                </>
              ) : (
                <>
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Not Logged In
                </>
              )}
            </Badge>
          )}
          <Button 
            onClick={handleGenerateSuggestions} 
            disabled={isRefetching || !authSession}
            size="sm"
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {!authSession && !isCheckingAuth && (
        <Alert className="mb-6 border-warning/50 bg-warning/10">
          <LogIn className="h-4 w-4 text-warning" />
          <AlertDescription className="text-sm">
            <strong>Login Required:</strong> You need to be logged in to generate AI investment suggestions.
            <Button 
              onClick={() => navigate('/auth')} 
              variant="link" 
              className="ml-2 p-0 h-auto text-warning hover:text-warning/80"
            >
              Go to Login →
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-40 bg-muted/20 animate-pulse rounded-lg" />
          ))}
        </div>
      ) : suggestions && suggestions.length > 0 ? (
        <div className="space-y-4">
          {suggestions.map((suggestion) => (
            <div 
              key={suggestion.id}
              className="p-4 rounded-lg bg-background/50 border border-border/50 hover:border-primary/30 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {getSuggestionIcon(suggestion.suggestion_type)}
                  <div>
                    <h3 className="font-bold text-lg">{suggestion.stock_symbol}</h3>
                    <p className="text-sm text-muted-foreground">{suggestion.stock_name}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge className={getRiskColor(suggestion.risk_level)}>
                    {suggestion.risk_level.toUpperCase()} RISK
                  </Badge>
                  <Badge variant="outline" className="border-primary/30">
                    {suggestion.suggestion_type.toUpperCase()}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                <div className="p-2 rounded bg-profit/10 border border-profit/20">
                  <p className="text-xs text-muted-foreground">Profit Potential</p>
                  <p className="text-lg font-bold text-profit">+{suggestion.profit_potential}%</p>
                </div>
                <div className="p-2 rounded bg-primary/10 border border-primary/20">
                  <p className="text-xs text-muted-foreground">Entry Price</p>
                  <p className="text-lg font-bold">฿{suggestion.recommended_entry}</p>
                </div>
                <div className="p-2 rounded bg-profit/10 border border-profit/20">
                  <p className="text-xs text-muted-foreground">Target Price</p>
                  <p className="text-lg font-bold">฿{suggestion.recommended_exit}</p>
                </div>
                <div className="p-2 rounded bg-loss/10 border border-loss/20">
                  <p className="text-xs text-muted-foreground">Stop Loss</p>
                  <p className="text-lg font-bold">฿{suggestion.stop_loss}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Holding Period:</span>
                  <span className="font-medium">{suggestion.holding_period}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Confidence:</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary to-primary-glow transition-all"
                        style={{ width: `${(suggestion.confidence_score * 100)}%` }}
                      />
                    </div>
                    <span className="font-medium">{(suggestion.confidence_score * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-border/50">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Why this stock? </span>
                  {suggestion.reasoning}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground mb-4">No AI suggestions available yet</p>
          <Button onClick={handleGenerateSuggestions} disabled={isRefetching}>
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Suggestions
          </Button>
        </div>
      )}
    </Card>
  );
};

export default AISuggestions;