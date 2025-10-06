import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import StockChart from "./StockChart";
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Percent } from "lucide-react";

interface StockDetailsProps {
  stock: {
    symbol: string;
    name: string;
    current_price: number;
    change_percent: number;
    volume: number;
    market_cap: number;
    pe_ratio: number;
    dividend_yield: number;
  };
  open: boolean;
  onClose: () => void;
}

const StockDetails = ({ stock, open, onClose }: StockDetailsProps) => {
  const isPositive = stock.change_percent >= 0;

  const formatCurrency = (value: number) => {
    if (value >= 1e9) {
      return `฿${(value / 1e9).toFixed(2)}B`;
    } else if (value >= 1e6) {
      return `฿${(value / 1e6).toFixed(2)}M`;
    }
    return `฿${value.toLocaleString()}`;
  };

  const formatVolume = (value: number) => {
    if (value >= 1e6) {
      return `${(value / 1e6).toFixed(2)}M`;
    } else if (value >= 1e3) {
      return `${(value / 1e3).toFixed(2)}K`;
    }
    return value.toLocaleString();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{stock.name}</h2>
              <p className="text-sm text-muted-foreground">{stock.symbol}</p>
            </div>
            <Badge variant={isPositive ? "default" : "destructive"} className="text-lg px-4 py-2">
              {isPositive ? "+": ""}
              {stock.change_percent.toFixed(2)}%
            </Badge>
          </DialogTitle>
          <DialogDescription>
            View detailed stock information, historical price charts, and key metrics
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card border rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <DollarSign size={16} />
                <span className="text-sm">Market Cap</span>
              </div>
              <p className="text-xl font-bold">{formatCurrency(stock.market_cap)}</p>
            </div>

            <div className="bg-card border rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <BarChart3 size={16} />
                <span className="text-sm">Volume</span>
              </div>
              <p className="text-xl font-bold">{formatVolume(stock.volume)}</p>
            </div>

            <div className="bg-card border rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <TrendingUp size={16} />
                <span className="text-sm">P/E Ratio</span>
              </div>
              <p className="text-xl font-bold">{stock.pe_ratio.toFixed(2)}</p>
            </div>

            <div className="bg-card border rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Percent size={16} />
                <span className="text-sm">Dividend Yield</span>
              </div>
              <p className="text-xl font-bold">{(stock.dividend_yield * 100).toFixed(2)}%</p>
            </div>
          </div>

          {/* Chart */}
          <StockChart
            symbol={stock.symbol}
            stockName={stock.name}
            currentPrice={stock.current_price}
            changePercent={stock.change_percent}
          />

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StockDetails;
