import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Download, Trash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AddPositionDialog } from "./AddPositionDialog";
import { formatCurrency } from "@/lib/utils";
import { SkeletonCardList } from "@/components/ui/skeleton-card";
import { SkeletonStats } from "@/components/ui/skeleton-stats";
import { SearchFilter } from "@/components/ui/search-filter";
import { SortDropdown, SortOption } from "@/components/ui/sort-dropdown";
import { exportPortfolioToCSV, ExportablePosition } from "@/lib/csvExport";
import { Checkbox } from "@/components/ui/checkbox";

interface Position {
  id: string;
  stock_symbol: string;
  stock_name: string;
  shares_owned: number;
  average_entry_price: number;
  purchase_date: string;
  target_price: number | null;
  stop_loss: number | null;
  notes: string | null;
}

interface StockPrice {
  symbol: string;
  current_price: number;
  change_percent: number;
}

export const MyPortfolio = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSector, setSelectedSector] = useState("all");
  const [sortBy, setSortBy] = useState<string>("symbol");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [selectedPositions, setSelectedPositions] = useState<Set<string>>(new Set());

  // Fetch user positions
  const { data: positions, isLoading } = useQuery({
    queryKey: ["user-positions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_positions")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Position[];
    },
  });

  // Fetch current stock prices
  const { data: stockPrices } = useQuery({
    queryKey: ["stock-prices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("thai_stocks")
        .select("symbol, current_price, change_percent");

      if (error) throw error;
      
      const pricesMap: Record<string, StockPrice> = {};
      data.forEach((stock) => {
        pricesMap[stock.symbol] = stock as StockPrice;
      });
      return pricesMap;
    },
  });

  // Delete position mutation with optimistic update
  const deleteMutation = useMutation({
    mutationFn: async (positionId: string) => {
      const { error } = await supabase
        .from("user_positions")
        .delete()
        .eq("id", positionId);

      if (error) throw error;
    },
    onMutate: async (positionId) => {
      await queryClient.cancelQueries({ queryKey: ["user-positions"] });
      const previousData = queryClient.getQueryData(["user-positions"]);
      
      queryClient.setQueryData(["user-positions"], (old: Position[] | undefined) =>
        old?.filter(pos => pos.id !== positionId) || []
      );
      
      return { previousData };
    },
    onError: (error: any, _positionId, context) => {
      queryClient.setQueryData(["user-positions"], context?.previousData);
      toast({
        title: "ข้อผิดพลาด / Error",
        description: error.message,
        variant: "destructive",
      });
    },
    onSuccess: () => {
      toast({
        title: "ลบสำเร็จ / Deleted",
        description: "ลบตำแหน่งการลงทุนเรียบร้อย / Position deleted successfully",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["user-positions"] });
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (positionIds: string[]) => {
      const { error } = await supabase
        .from("user_positions")
        .delete()
        .in("id", positionIds);

      if (error) throw error;
    },
    onSuccess: (_, positionIds) => {
      toast({
        title: "ลบสำเร็จ / Deleted",
        description: `ลบตำแหน่งการลงทุน ${positionIds.length} รายการเรียบร้อย / ${positionIds.length} positions deleted successfully`,
      });
      setSelectedPositions(new Set());
    },
    onError: (error: any) => {
      toast({
        title: "ข้อผิดพลาด / Error",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["user-positions"] });
    },
  });

  const calculatePL = (position: Position, currentPrice: number) => {
    const totalCost = position.shares_owned * position.average_entry_price;
    const currentValue = position.shares_owned * currentPrice;
    const pl = currentValue - totalCost;
    const plPercent = (pl / totalCost) * 100;
    return { pl, plPercent, currentValue };
  };

  // Sort options
  const sortOptions: SortOption[] = [
    { value: "symbol", label: "Symbol" },
    { value: "pl", label: "Profit/Loss" },
    { value: "value", label: "Value" },
    { value: "plPercent", label: "P/L %" },
  ];

  // Filtered and sorted positions
  const filteredAndSortedPositions = useMemo(() => {
    if (!positions || !stockPrices) return [];

    let filtered = positions.filter((pos) => {
      const matchesSearch =
        pos.stock_symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pos.stock_name.toLowerCase().includes(searchQuery.toLowerCase());
      
      const stockPrice = stockPrices[pos.stock_symbol];
      const stockData = Object.values(stockPrices).find(s => s.symbol === pos.stock_symbol);
      const matchesSector = selectedSector === "all" || !stockData || (stockData as any).sector === selectedSector;

      return matchesSearch && matchesSector;
    });

    // Sort
    filtered.sort((a, b) => {
      const priceA = stockPrices[a.stock_symbol];
      const priceB = stockPrices[b.stock_symbol];

      if (!priceA || !priceB) return 0;

      const plA = calculatePL(a, priceA.current_price);
      const plB = calculatePL(b, priceB.current_price);

      let comparison = 0;
      switch (sortBy) {
        case "symbol":
          comparison = a.stock_symbol.localeCompare(b.stock_symbol);
          break;
        case "pl":
          comparison = plA.pl - plB.pl;
          break;
        case "value":
          comparison = plA.currentValue - plB.currentValue;
          break;
        case "plPercent":
          comparison = plA.plPercent - plB.plPercent;
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [positions, stockPrices, searchQuery, selectedSector, sortBy, sortOrder]);

  // Available sectors
  const availableSectors = useMemo(() => {
    if (!stockPrices) return [];
    const sectors = new Set<string>();
    Object.values(stockPrices).forEach((stock: any) => {
      if (stock.sector) sectors.add(stock.sector);
    });
    return Array.from(sectors).sort();
  }, [stockPrices]);

  const totalStats = filteredAndSortedPositions?.reduce(
    (acc, position) => {
      const stockPrice = stockPrices?.[position.stock_symbol];
      if (!stockPrice) return acc;

      const { pl, currentValue } = calculatePL(position, stockPrice.current_price);
      acc.totalInvested += position.shares_owned * position.average_entry_price;
      acc.currentValue += currentValue;
      acc.totalPL += pl;
      return acc;
    },
    { totalInvested: 0, currentValue: 0, totalPL: 0 }
  ) || { totalInvested: 0, currentValue: 0, totalPL: 0 };

  const handleExport = () => {
    if (!filteredAndSortedPositions || !stockPrices) return;

    const exportData: ExportablePosition[] = filteredAndSortedPositions.map((pos) => {
      const stockPrice = stockPrices[pos.stock_symbol];
      const { pl, plPercent, currentValue } = stockPrice 
        ? calculatePL(pos, stockPrice.current_price)
        : { pl: 0, plPercent: 0, currentValue: 0 };

      return {
        stock_symbol: pos.stock_symbol,
        stock_name: pos.stock_name,
        shares_owned: pos.shares_owned,
        average_entry_price: pos.average_entry_price,
        current_price: stockPrice?.current_price,
        current_value: currentValue,
        profit_loss: pl,
        profit_loss_percent: plPercent,
        purchase_date: pos.purchase_date,
        target_price: pos.target_price,
        stop_loss: pos.stop_loss,
        notes: pos.notes,
      };
    });

    exportPortfolioToCSV(exportData);
    toast({
      title: "Exported Successfully",
      description: "Portfolio data has been exported to CSV",
    });
  };

  const handleBulkDelete = () => {
    if (selectedPositions.size === 0) return;
    
    if (confirm(`Are you sure you want to delete ${selectedPositions.size} positions?`)) {
      bulkDeleteMutation.mutate(Array.from(selectedPositions));
    }
  };

  const toggleSelectAll = () => {
    if (selectedPositions.size === filteredAndSortedPositions.length) {
      setSelectedPositions(new Set());
    } else {
      setSelectedPositions(new Set(filteredAndSortedPositions.map(p => p.id)));
    }
  };

  const toggleSelectPosition = (id: string) => {
    const newSelection = new Set(selectedPositions);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedPositions(newSelection);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>พอร์ตของฉัน / My Portfolio</CardTitle>
          <div className="mt-4">
            <SkeletonStats count={3} />
          </div>
        </CardHeader>
        <CardContent>
          <SkeletonCardList count={3} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>พอร์ตของฉัน / My Portfolio</CardTitle>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div>
                <p className="text-sm text-muted-foreground">เงินลงทุนทั้งหมด / Total Invested</p>
                <p className="text-xl font-bold">{formatCurrency(totalStats.totalInvested)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">มูลค่าปัจจุบัน / Current Value</p>
                <p className="text-xl font-bold">{formatCurrency(totalStats.currentValue)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">กำไร/ขาดทุน / P/L</p>
                <p className={`text-xl font-bold ${totalStats.totalPL >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {formatCurrency(totalStats.totalPL)} ({((totalStats.totalPL / totalStats.totalInvested) * 100).toFixed(2)}%)
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleExport} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              เพิ่มตำแหน่ง / Add Position
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <SearchFilter
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedSector={selectedSector}
          onSectorChange={setSelectedSector}
          sectors={availableSectors}
          showSectorFilter={true}
          placeholder="Search by symbol or name..."
        />

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <SortDropdown
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortChange={(newSortBy, newSortOrder) => {
                setSortBy(newSortBy);
                setSortOrder(newSortOrder);
              }}
              options={sortOptions}
            />
            {selectedPositions.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                disabled={bulkDeleteMutation.isPending}
              >
                <Trash className="h-4 w-4 mr-2" />
                Delete ({selectedPositions.size})
              </Button>
            )}
          </div>
          {filteredAndSortedPositions.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSelectAll}
            >
              {selectedPositions.size === filteredAndSortedPositions.length
                ? "Deselect All"
                : "Select All"}
            </Button>
          )}
        </div>

        {!filteredAndSortedPositions || filteredAndSortedPositions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>ยังไม่มีตำแหน่งการลงทุน / No positions yet</p>
            <p className="text-sm mt-2">คลิก "เพิ่มตำแหน่ง" เพื่อเริ่มต้น / Click "Add Position" to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAndSortedPositions.map((position) => {
              const stockPrice = stockPrices?.[position.stock_symbol];
              if (!stockPrice) return null;

              const { pl, plPercent, currentValue } = calculatePL(position, stockPrice.current_price);

              return (
                <div key={position.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedPositions.has(position.id)}
                      onCheckedChange={() => toggleSelectPosition(position.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg">{position.stock_symbol}</h3>
                        <span className="text-sm text-muted-foreground">{position.stock_name}</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                        <div>
                          <p className="text-xs text-muted-foreground">หุ้น / Shares</p>
                          <p className="font-semibold">{position.shares_owned.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">ราคาซื้อเฉลี่ย / Avg Entry</p>
                          <p className="font-semibold">{formatCurrency(position.average_entry_price)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">ราคาปัจจุบัน / Current</p>
                          <p className="font-semibold">{formatCurrency(stockPrice.current_price)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">มูลค่า / Value</p>
                          <p className="font-semibold">{formatCurrency(currentValue)}</p>
                        </div>
                      </div>
                      <div className="mt-2">
                        <p className="text-xs text-muted-foreground">กำไร/ขาดทุน / P/L</p>
                        <p className={`font-bold ${pl >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {formatCurrency(pl)} ({plPercent >= 0 ? "+" : ""}{plPercent.toFixed(2)}%)
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(position.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <AddPositionDialog 
        open={isAddDialogOpen} 
        onOpenChange={setIsAddDialogOpen}
      />
    </Card>
  );
};
