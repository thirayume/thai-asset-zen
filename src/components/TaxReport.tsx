import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useState } from "react";

interface Position {
  id: string;
  stock_symbol: string;
  stock_name: string;
  shares_owned: number;
  average_entry_price: number;
  sold_price: number | null;
  sold_at: string | null;
  purchase_date: string;
  status: string;
}

export const TaxReport = () => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());

  const { data: positions = [] } = useQuery({
    queryKey: ["tax-positions", selectedYear],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const yearStart = `${selectedYear}-01-01`;
      const yearEnd = `${selectedYear}-12-31`;

      const { data, error } = await supabase
        .from("user_positions")
        .select("*")
        .eq("user_id", user.id)
        .gte("purchase_date", yearStart)
        .lte("purchase_date", yearEnd);

      if (error) throw error;
      return data as Position[];
    },
  });

  const soldPositions = positions.filter((p) => p.status === "sold" && p.sold_price);

  const taxSummary = soldPositions.reduce(
    (acc, pos) => {
      const costBasis = pos.shares_owned * pos.average_entry_price;
      const proceeds = pos.shares_owned * (pos.sold_price || 0);
      const gain = proceeds - costBasis;

      return {
        totalProceeds: acc.totalProceeds + proceeds,
        totalCostBasis: acc.totalCostBasis + costBasis,
        totalGains: acc.totalGains + (gain > 0 ? gain : 0),
        totalLosses: acc.totalLosses + (gain < 0 ? Math.abs(gain) : 0),
        netGainLoss: acc.netGainLoss + gain,
      };
    },
    {
      totalProceeds: 0,
      totalCostBasis: 0,
      totalGains: 0,
      totalLosses: 0,
      netGainLoss: 0,
    }
  );

  const exportTaxReport = () => {
    const csvContent = [
      ["Tax Year:", selectedYear],
      [],
      ["Summary"],
      ["Total Proceeds", taxSummary.totalProceeds.toFixed(2)],
      ["Total Cost Basis", taxSummary.totalCostBasis.toFixed(2)],
      ["Total Gains", taxSummary.totalGains.toFixed(2)],
      ["Total Losses", taxSummary.totalLosses.toFixed(2)],
      ["Net Gain/Loss", taxSummary.netGainLoss.toFixed(2)],
      [],
      ["Detailed Transactions"],
      ["Stock", "Shares", "Purchase Date", "Sale Date", "Cost Basis", "Proceeds", "Gain/Loss"],
      ...soldPositions.map((pos) => {
        const costBasis = pos.shares_owned * pos.average_entry_price;
        const proceeds = pos.shares_owned * (pos.sold_price || 0);
        const gainLoss = proceeds - costBasis;

        return [
          pos.stock_symbol,
          pos.shares_owned,
          new Date(pos.purchase_date).toLocaleDateString(),
          pos.sold_at ? new Date(pos.sold_at).toLocaleDateString() : "",
          costBasis.toFixed(2),
          proceeds.toFixed(2),
          gainLoss.toFixed(2),
        ];
      }),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tax-report-${selectedYear}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Tax Report
          </h2>
          <p className="text-muted-foreground">
            Capital gains and losses summary for tax filing
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 5 }, (_, i) => currentYear - i).map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={exportTaxReport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Proceeds</h3>
          <p className="text-2xl font-bold">{formatCurrency(taxSummary.totalProceeds)}</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Cost Basis</h3>
          <p className="text-2xl font-bold">{formatCurrency(taxSummary.totalCostBasis)}</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Net Gain/Loss</h3>
          <p className={`text-2xl font-bold ${taxSummary.netGainLoss >= 0 ? "text-green-500" : "text-red-500"}`}>
            {taxSummary.netGainLoss >= 0 ? "+" : ""}
            {formatCurrency(taxSummary.netGainLoss)}
          </p>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Gains & Losses Breakdown</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Total Capital Gains</p>
            <p className="text-xl font-bold text-green-500">
              +{formatCurrency(taxSummary.totalGains)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-2">Total Capital Losses</p>
            <p className="text-xl font-bold text-red-500">
              -{formatCurrency(taxSummary.totalLosses)}
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Transactions ({soldPositions.length})</h3>
        <div className="space-y-3">
          {soldPositions.map((pos) => {
            const costBasis = pos.shares_owned * pos.average_entry_price;
            const proceeds = pos.shares_owned * (pos.sold_price || 0);
            const gainLoss = proceeds - costBasis;

            return (
              <div key={pos.id} className="flex items-center justify-between border-b pb-3">
                <div>
                  <p className="font-medium">{pos.stock_symbol}</p>
                  <p className="text-sm text-muted-foreground">
                    {pos.shares_owned} shares • Purchased {new Date(pos.purchase_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-medium ${gainLoss >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {gainLoss >= 0 ? "+" : ""}
                    {formatCurrency(gainLoss)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(proceeds)} proceeds
                  </p>
                </div>
              </div>
            );
          })}
          {soldPositions.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No completed transactions for {selectedYear}
            </p>
          )}
        </div>
      </Card>

      <Card className="p-6 border-amber-500/50 bg-amber-500/5">
        <h3 className="text-lg font-semibold mb-2">Important Tax Information</h3>
        <ul className="text-sm text-muted-foreground space-y-2">
          <li>• This report is for informational purposes only</li>
          <li>• Consult with a qualified tax professional for tax filing</li>
          <li>• Tax rates and regulations vary by jurisdiction</li>
          <li>• Keep detailed records of all transactions</li>
          <li>• Report includes only sold positions with realized gains/losses</li>
        </ul>
      </Card>
    </div>
  );
};
