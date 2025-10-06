import { Card } from "@/components/ui/card";
import { TrendingUp, Building2, Coins, FileText, DollarSign, Bitcoin } from "lucide-react";

interface AssetCardsProps {
  assetAllocation: Record<string, {
    name: string;
    value: number;
    percentage: number;
    monthlyIncome: number;
    yield: number;
    color: string;
    icon: string;
  }>;
}

const AssetCards = ({ assetAllocation }: AssetCardsProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('th-TH', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return (value * 100).toFixed(2);
  };

  const getIcon = (iconName: string) => {
    const icons: Record<string, any> = {
      TrendingUp,
      Building2,
      Coins,
      FileText,
      DollarSign,
      Bitcoin
    };
    return icons[iconName] || TrendingUp;
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Asset Classes</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(assetAllocation).map(([key, asset], idx) => {
          const Icon = getIcon(asset.icon);
          return (
            <Card
              key={key}
              className="p-6 card-glow bg-gradient-to-br from-card to-card-glow border-border/50 hover:border-primary/50 transition-all duration-300 cursor-pointer group"
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-lg" style={{ backgroundColor: `${asset.color}20` }}>
                  <Icon className="h-6 w-6" style={{ color: asset.color }} />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold font-mono">{asset.percentage}%</p>
                  <p className="text-xs text-muted-foreground">of portfolio</p>
                </div>
              </div>

              <h3 className="text-lg font-semibold mb-2">{asset.name}</h3>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Value</span>
                  <span className="font-mono font-semibold">
                    ฿{formatCurrency(asset.value)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Monthly Income</span>
                  <span className="font-mono text-profit">
                    {asset.monthlyIncome > 0 ? `฿${formatCurrency(asset.monthlyIncome)}` : '-'}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Yield</span>
                  <span className="font-mono text-gold">
                    {formatPercent(asset.yield)}%
                  </span>
                </div>

                <div className="pt-3 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Performance</span>
                    <div className="flex items-center gap-1 text-profit text-sm">
                      <TrendingUp className="h-3 w-3" />
                      <span className="font-mono">+{(Math.random() * 10 + 2).toFixed(2)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default AssetCards;
