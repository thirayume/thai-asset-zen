import { useState } from "react";
import PortfolioOverview from "@/components/PortfolioOverview";
import AssetAllocation from "@/components/AssetAllocation";
import IncomeStreams from "@/components/IncomeStreams";
import AssetCards from "@/components/AssetCards";
import { portfolioData } from "@/data/portfolioData";

const Index = () => {
  const [portfolio] = useState(portfolioData);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                Thai Portfolio Dashboard
              </h1>
              <p className="text-sm text-muted-foreground">Multi-Asset Passive Income Tracker</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Last Updated</p>
                <p className="text-sm font-mono">{new Date().toLocaleTimeString('th-TH')}</p>
              </div>
              <div className="h-2 w-2 rounded-full bg-profit animate-pulse" />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Portfolio Overview */}
        <PortfolioOverview portfolio={portfolio} />

        {/* Asset Allocation & Income */}
        <div className="grid lg:grid-cols-2 gap-6">
          <AssetAllocation assetAllocation={portfolio.assetAllocation} />
          <IncomeStreams assetAllocation={portfolio.assetAllocation} />
        </div>

        {/* Asset Cards */}
        <AssetCards assetAllocation={portfolio.assetAllocation} />
      </main>
    </div>
  );
};

export default Index;
