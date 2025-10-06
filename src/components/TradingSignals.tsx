import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, TrendingDown, Minus, RefreshCw, Lightbulb } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface TradingSignal {
  id: string;
  stock_symbol: string;
  stock_name: string;
  signal_type: 'BUY' | 'SELL' | 'HOLD';
  confidence_score: number;
  reasoning: string;
  current_price: number;
  target_price: number;
  stop_loss: number;
  indicators: any;
  created_at: string;
}

const TradingSignals = () => {
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  const fetchSignals = async () => {
    try {
      const { data, error } = await supabase
        .from('trading_signals')
        .select('*')
        .order('confidence_score', { ascending: false })
        .limit(10);

      if (error) throw error;
      setSignals((data as TradingSignal[]) || []);
    } catch (error) {
      console.error('Error fetching signals:', error);
      toast({
        title: "Error",
        description: "Failed to fetch trading signals",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateSignals = async () => {
    setGenerating(true);
    try {
      const { error } = await supabase.functions.invoke('generate-trading-signals');

      if (error) throw error;

      toast({
        title: "Success",
        description: "Trading signals generated successfully",
      });

      await fetchSignals();
    } catch (error) {
      console.error('Error generating signals:', error);
      toast({
        title: "Error",
        description: "Failed to generate trading signals",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    fetchSignals();
  }, []);

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'BUY': return 'text-green-600 dark:text-green-400';
      case 'SELL': return 'text-red-600 dark:text-red-400';
      default: return 'text-yellow-600 dark:text-yellow-400';
    }
  };

  const getSignalIcon = (signal: string) => {
    switch (signal) {
      case 'BUY': return <TrendingUp className="w-5 h-5" />;
      case 'SELL': return <TrendingDown className="w-5 h-5" />;
      default: return <Minus className="w-5 h-5" />;
    }
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 75) return 'default';
    if (confidence >= 50) return 'secondary';
    return 'outline';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-6 h-6" />
            AI Trading Signals
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-6 h-6" />
            AI Trading Signals
          </CardTitle>
          <Button
            onClick={generateSignals}
            disabled={generating}
            size="sm"
            variant="outline"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
            {generating ? 'Generating...' : 'Refresh'}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          AI-powered buy/sell recommendations based on technical analysis
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {signals.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Lightbulb className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No trading signals available</p>
            <Button onClick={generateSignals} className="mt-4" disabled={generating}>
              Generate Signals
            </Button>
          </div>
        ) : (
          signals.map((signal) => (
            <div
              key={signal.id}
              className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg">{signal.stock_symbol}</h3>
                    <Badge
                      variant={getConfidenceBadge(signal.confidence_score)}
                      className="text-xs"
                    >
                      {signal.confidence_score.toFixed(0)}% confident
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{signal.stock_name}</p>
                </div>
                <div className={`flex items-center gap-2 font-bold text-lg ${getSignalColor(signal.signal_type)}`}>
                  {getSignalIcon(signal.signal_type)}
                  {signal.signal_type}
                </div>
              </div>

              <p className="text-sm mb-3">{signal.reasoning}</p>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Current</span>
                  <p className="font-semibold">฿{signal.current_price?.toFixed(2)}</p>
                </div>
                {signal.target_price && (
                  <div>
                    <span className="text-muted-foreground">Target</span>
                    <p className="font-semibold text-green-600">฿{signal.target_price.toFixed(2)}</p>
                  </div>
                )}
                {signal.stop_loss && (
                  <div>
                    <span className="text-muted-foreground">Stop Loss</span>
                    <p className="font-semibold text-red-600">฿{signal.stop_loss.toFixed(2)}</p>
                  </div>
                )}
              </div>

              {signal.indicators && (
                <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                  <div className="flex gap-4">
                    {signal.indicators.rsi && (
                      <span>RSI: {signal.indicators.rsi.toFixed(1)}</span>
                    )}
                    {signal.indicators.ma20 && signal.indicators.ma50 && (
                      <span>
                        MA20/50: ฿{signal.indicators.ma20.toFixed(2)} / ฿{signal.indicators.ma50.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default TradingSignals;
