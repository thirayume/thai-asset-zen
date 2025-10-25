import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Share2, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils";

export const SharePortfolio = () => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const { data: portfolioStats } = useQuery({
    queryKey: ["portfolio-stats"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: positions } = await supabase
        .from("user_positions")
        .select("*")
        .eq("status", "active");

      const { data: stockPrices } = await supabase
        .from("thai_stocks")
        .select("symbol, current_price");

      const pricesMap = Object.fromEntries(
        (stockPrices || []).map(s => [s.symbol, s.current_price])
      );

      let totalInvested = 0;
      let currentValue = 0;

      (positions || []).forEach(pos => {
        const price = pricesMap[pos.stock_symbol];
        if (price) {
          totalInvested += pos.shares_owned * pos.average_entry_price;
          currentValue += pos.shares_owned * price;
        }
      });

      const pl = currentValue - totalInvested;
      const plPercent = totalInvested > 0 ? (pl / totalInvested) * 100 : 0;

      return {
        totalInvested,
        currentValue,
        pl,
        plPercent,
        positions: positions?.length || 0,
      };
    },
  });

  const handleShare = async () => {
    const shareText = `📊 My Thai Portfolio Stats\n\n` +
      `💰 Total Invested: ${formatCurrency(portfolioStats?.totalInvested || 0)}\n` +
      `📈 Current Value: ${formatCurrency(portfolioStats?.currentValue || 0)}\n` +
      `${(portfolioStats?.pl || 0) >= 0 ? '✅' : '❌'} P/L: ${formatCurrency(portfolioStats?.pl || 0)} (${(portfolioStats?.plPercent || 0).toFixed(2)}%)\n` +
      `📁 Positions: ${portfolioStats?.positions || 0}\n\n` +
      `Track your Thai investments at Thai Portfolio Tracker`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Portfolio Stats',
          text: shareText,
        });
        toast({
          title: "Shared Successfully",
          description: "Portfolio stats shared!",
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied to Clipboard",
        description: "Share your portfolio stats!",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          Share Portfolio
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Invested</p>
              <p className="text-lg font-bold">{formatCurrency(portfolioStats?.totalInvested || 0)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Current Value</p>
              <p className="text-lg font-bold">{formatCurrency(portfolioStats?.currentValue || 0)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">P/L</p>
              <p className={`text-lg font-bold ${(portfolioStats?.pl || 0) >= 0 ? 'text-profit' : 'text-loss'}`}>
                {formatCurrency(portfolioStats?.pl || 0)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">P/L %</p>
              <p className={`text-lg font-bold ${(portfolioStats?.plPercent || 0) >= 0 ? 'text-profit' : 'text-loss'}`}>
                {(portfolioStats?.plPercent || 0).toFixed(2)}%
              </p>
            </div>
          </div>

          <Button onClick={handleShare} className="w-full">
            {copied ? <Check className="h-4 w-4 mr-2" /> : <Share2 className="h-4 w-4 mr-2" />}
            {copied ? "Copied!" : "Share Portfolio"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
