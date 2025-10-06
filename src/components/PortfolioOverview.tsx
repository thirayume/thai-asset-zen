import { TrendingUp, TrendingDown } from "lucide-react";
import { Card } from "@/components/ui/card";

interface PortfolioOverviewProps {
  portfolio: {
    totalValue: number;
    currency: string;
    monthlyIncome: number;
    annualYield: number;
  };
}

const PortfolioOverview = ({ portfolio }: PortfolioOverviewProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('th-TH', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return (value * 100).toFixed(2);
  };

  return (
    <div className="grid md:grid-cols-4 gap-4">
      <Card className="p-6 card-glow bg-gradient-to-br from-card to-card-glow border-border/50 animate-float">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Total Portfolio Value</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              ฿{formatCurrency(portfolio.totalValue)}
            </span>
          </div>
          <div className="flex items-center gap-1 text-profit text-sm">
            <TrendingUp className="h-4 w-4" />
            <span className="font-mono">+8.5%</span>
            <span className="text-muted-foreground">this month</span>
          </div>
        </div>
      </Card>

      <Card className="p-6 card-glow bg-gradient-to-br from-card to-card-glow border-border/50 animate-float" style={{ animationDelay: '0.1s' }}>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Monthly Income</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-profit">
              ฿{formatCurrency(portfolio.monthlyIncome)}
            </span>
          </div>
          <div className="flex items-center gap-1 text-profit text-sm">
            <TrendingUp className="h-4 w-4" />
            <span className="font-mono">+12.3%</span>
            <span className="text-muted-foreground">vs last month</span>
          </div>
        </div>
      </Card>

      <Card className="p-6 card-glow bg-gradient-to-br from-card to-card-glow border-border/50 animate-float" style={{ animationDelay: '0.2s' }}>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Annual Yield</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-gold">
              {formatPercent(portfolio.annualYield)}%
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            ฿{formatCurrency(portfolio.totalValue * portfolio.annualYield)}/year
          </p>
        </div>
      </Card>

      <Card className="p-6 card-glow bg-gradient-to-br from-card to-card-glow border-border/50 animate-float" style={{ animationDelay: '0.3s' }}>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Portfolio Risk</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-primary">
              Medium
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
              <div className="h-full w-[55%] bg-gradient-to-r from-profit via-gold to-loss rounded-full" />
            </div>
            <span className="text-xs text-muted-foreground font-mono">5.5/10</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PortfolioOverview;
