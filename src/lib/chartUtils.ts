// Utility functions for stock chart calculations

export interface StockDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Calculate Simple Moving Average
export const calculateSMA = (data: StockDataPoint[], period: number): number[] => {
  const sma: number[] = [];
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      sma.push(NaN);
      continue;
    }
    
    const sum = data.slice(i - period + 1, i + 1).reduce((acc, item) => acc + item.close, 0);
    sma.push(sum / period);
  }
  
  return sma;
};

// Format time period for display
export const formatTimePeriod = (period: string): string => {
  const periodMap: Record<string, string> = {
    '1D': 'Today',
    '1W': 'This Week',
    '1M': 'This Month',
    '3M': 'Last 3 Months',
    '1Y': 'This Year',
  };
  
  return periodMap[period] || period;
};

// Get date range for time period
export const getDateRange = (period: string): { startDate: Date; endDate: Date } => {
  const endDate = new Date();
  const startDate = new Date();
  
  switch (period) {
    case '1D':
      startDate.setDate(startDate.getDate() - 1);
      break;
    case '1W':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case '1M':
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case '3M':
      startDate.setMonth(startDate.getMonth() - 3);
      break;
    case '1Y':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    default:
      startDate.setMonth(startDate.getMonth() - 1);
  }
  
  return { startDate, endDate };
};

// Format large numbers for display
export const formatVolume = (volume: number): string => {
  if (volume >= 1000000) {
    return `${(volume / 1000000).toFixed(2)}M`;
  } else if (volume >= 1000) {
    return `${(volume / 1000).toFixed(2)}K`;
  }
  return volume.toString();
};
