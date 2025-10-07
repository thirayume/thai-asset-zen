export interface ExportablePosition {
  stock_symbol: string;
  stock_name: string;
  shares_owned: number;
  average_entry_price: number;
  current_price?: number;
  current_value?: number;
  profit_loss?: number;
  profit_loss_percent?: number;
  purchase_date: string;
  target_price?: number | null;
  stop_loss?: number | null;
  notes?: string | null;
}

export interface ExportableGoldPosition {
  gold_type: string;
  weight_in_baht: number;
  weight_in_grams: number;
  purchase_price_per_baht: number;
  current_price_per_baht?: number;
  total_cost: number;
  current_value?: number;
  profit_loss?: number;
  profit_loss_percent?: number;
  purchase_date: string;
  notes?: string | null;
}

export const exportToCSV = (data: any[], filename: string) => {
  if (!data || data.length === 0) {
    return;
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);
  
  // Create CSV content
  const csvContent = [
    headers.join(","), // Header row
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Handle values that might contain commas
        if (typeof value === "string" && value.includes(",")) {
          return `"${value}"`;
        }
        return value ?? "";
      }).join(",")
    )
  ].join("\n");

  // Create blob and download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportPortfolioToCSV = (positions: ExportablePosition[]) => {
  const csvData = positions.map(pos => ({
    Symbol: pos.stock_symbol,
    Name: pos.stock_name,
    Shares: pos.shares_owned,
    "Avg Entry Price": pos.average_entry_price.toFixed(2),
    "Current Price": pos.current_price?.toFixed(2) || "N/A",
    "Current Value": pos.current_value?.toFixed(2) || "N/A",
    "P/L": pos.profit_loss?.toFixed(2) || "N/A",
    "P/L %": pos.profit_loss_percent?.toFixed(2) || "N/A",
    "Purchase Date": pos.purchase_date,
    "Target Price": pos.target_price?.toFixed(2) || "N/A",
    "Stop Loss": pos.stop_loss?.toFixed(2) || "N/A",
    Notes: pos.notes || "",
  }));

  exportToCSV(csvData, "portfolio");
};

export const exportGoldPositionsToCSV = (positions: ExportableGoldPosition[]) => {
  const csvData = positions.map(pos => ({
    "Gold Type": pos.gold_type,
    "Weight (Baht)": pos.weight_in_baht,
    "Weight (Grams)": pos.weight_in_grams.toFixed(3),
    "Purchase Price/Baht": pos.purchase_price_per_baht.toFixed(2),
    "Current Price/Baht": pos.current_price_per_baht?.toFixed(2) || "N/A",
    "Total Cost": pos.total_cost.toFixed(2),
    "Current Value": pos.current_value?.toFixed(2) || "N/A",
    "P/L": pos.profit_loss?.toFixed(2) || "N/A",
    "P/L %": pos.profit_loss_percent?.toFixed(2) || "N/A",
    "Purchase Date": pos.purchase_date,
    Notes: pos.notes || "",
  }));

  exportToCSV(csvData, "gold_positions");
};

export const exportWatchlistToCSV = (watchlist: any[]) => {
  const csvData = watchlist.map(item => ({
    Symbol: item.stock_symbol,
    Name: item.stock_name,
    "Current Price": item.current_price?.toFixed(2) || "N/A",
    "Target Entry Price": item.target_entry_price?.toFixed(2) || "N/A",
    "Distance to Target": item.distance_to_target?.toFixed(2) || "N/A",
    Notes: item.notes || "",
    "Added Date": item.created_at,
  }));

  exportToCSV(csvData, "watchlist");
};
