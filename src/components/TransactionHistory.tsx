import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { History, Download } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Transaction {
  id: string;
  stock_symbol: string;
  stock_name: string;
  shares_owned: number;
  average_entry_price: number;
  purchase_date: string;
  sold_price: number | null;
  sold_at: string | null;
  status: string;
}

export const TransactionHistory = () => {
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["transaction-history"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("user_positions")
        .select("*")
        .eq("user_id", user.id)
        .order("purchase_date", { ascending: false });

      if (error) throw error;
      return data as Transaction[];
    },
  });

  const exportTransactions = () => {
    const csvContent = [
      ["Date", "Type", "Symbol", "Name", "Shares", "Price", "Total", "Status"].join(","),
      ...transactions.map((t) => {
        const isPurchase = true;
        const date = t.purchase_date;
        const price = t.average_entry_price;
        const total = t.shares_owned * price;
        
        return [
          new Date(date).toLocaleDateString(),
          "BUY",
          t.stock_symbol,
          `"${t.stock_name}"`,
          t.shares_owned,
          price.toFixed(2),
          total.toFixed(2),
          t.status
        ].join(",");
      }),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const calculatePL = (transaction: Transaction) => {
    if (transaction.status === "sold" && transaction.sold_price) {
      const buyValue = transaction.shares_owned * transaction.average_entry_price;
      const sellValue = transaction.shares_owned * transaction.sold_price;
      return sellValue - buyValue;
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <History className="h-6 w-6" />
            Transaction History
          </h2>
          <p className="text-muted-foreground">
            Complete record of all your trades
          </p>
        </div>
        <Button onClick={exportTransactions} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Shares</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Total Value</TableHead>
              <TableHead className="text-right">P/L</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => {
              const pl = calculatePL(transaction);
              return (
                <TableRow key={transaction.id}>
                  <TableCell>
                    {new Date(transaction.purchase_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{transaction.stock_symbol}</div>
                      <div className="text-sm text-muted-foreground">{transaction.stock_name}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">BUY</Badge>
                  </TableCell>
                  <TableCell className="text-right">{transaction.shares_owned}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(transaction.average_entry_price)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(transaction.shares_owned * transaction.average_entry_price)}
                  </TableCell>
                  <TableCell className="text-right">
                    {pl !== null ? (
                      <span className={pl >= 0 ? "text-green-500" : "text-red-500"}>
                        {pl >= 0 ? "+" : ""}{formatCurrency(pl)}
                      </span>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={transaction.status === "active" ? "default" : "secondary"}>
                      {transaction.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {transactions.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No transactions yet
          </div>
        )}
      </Card>
    </div>
  );
};
