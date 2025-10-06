import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Stock {
  id: string;
  symbol: string;
  name: string;
  current_price: number | null;
  change_percent: number | null;
  last_updated: string | null;
}

const AdminStockManager = () => {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();

  const fetchStocks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('thai_stocks')
        .select('id, symbol, name, current_price, change_percent, last_updated')
        .order('symbol');

      if (error) throw error;
      setStocks(data || []);
    } catch (error) {
      console.error("Error fetching stocks:", error);
      toast({
        title: "Error",
        description: "Failed to fetch stock data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStocks();
  }, []);

  const triggerStockUpdate = async () => {
    try {
      setUpdating(true);
      
      const { error } = await supabase.functions.invoke('update-stock-prices');

      if (error) throw error;

      toast({
        title: "Success",
        description: "Stock price update triggered successfully",
      });

      // Refresh stock data after a short delay
      setTimeout(() => {
        fetchStocks();
      }, 2000);
    } catch (error) {
      console.error("Error triggering stock update:", error);
      toast({
        title: "Error",
        description: "Failed to trigger stock price update",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Stock Management</CardTitle>
          <CardDescription>Loading stock data...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Stock Database Management</CardTitle>
            <CardDescription>
              View and manage Thai stock data
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchStocks} variant="outline" size="sm" disabled={updating}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={triggerStockUpdate} size="sm" disabled={updating}>
              <TrendingUp className="h-4 w-4 mr-2" />
              {updating ? 'Updating...' : 'Update Prices'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Symbol</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Change %</TableHead>
              <TableHead>Last Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stocks.map((stock) => (
              <TableRow key={stock.id}>
                <TableCell className="font-bold">{stock.symbol}</TableCell>
                <TableCell>{stock.name}</TableCell>
                <TableCell className="text-right">
                  {stock.current_price ? formatCurrency(stock.current_price) : 'N/A'}
                </TableCell>
                <TableCell className="text-right">
                  {stock.change_percent !== null ? (
                    <span
                      className={
                        stock.change_percent >= 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }
                    >
                      {stock.change_percent >= 0 ? '+' : ''}
                      {stock.change_percent.toFixed(2)}%
                    </span>
                  ) : (
                    'N/A'
                  )}
                </TableCell>
                <TableCell>
                  {stock.last_updated
                    ? new Date(stock.last_updated).toLocaleString()
                    : 'Never'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default AdminStockManager;
