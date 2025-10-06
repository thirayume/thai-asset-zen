// Trading signal calculation utilities

export interface TechnicalIndicators {
  rsi?: number;
  macd?: { value: number; signal: number; histogram: number };
  ma20?: number;
  ma50?: number;
  volumeChange?: number;
  priceChange?: number;
}

export interface StockAnalysis {
  symbol: string;
  currentPrice: number;
  historicalData: Array<{
    close: number;
    volume: number;
    date: string;
  }>;
}

// Calculate RSI (Relative Strength Index)
export const calculateRSI = (prices: number[], period: number = 14): number => {
  if (prices.length < period + 1) return 50;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const change = prices[i] - prices[i - 1];
    if (change >= 0) {
      gains += change;
    } else {
      losses -= change;
    }
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;

  if (avgLoss === 0) return 100;

  const rs = avgGain / avgLoss;
  const rsi = 100 - 100 / (1 + rs);

  return rsi;
};

// Calculate Simple Moving Average
export const calculateSMA = (prices: number[], period: number): number => {
  if (prices.length < period) return prices[prices.length - 1];
  
  const slice = prices.slice(-period);
  const sum = slice.reduce((acc, price) => acc + price, 0);
  return sum / period;
};

// Calculate volume change percentage
export const calculateVolumeChange = (volumes: number[]): number => {
  if (volumes.length < 2) return 0;
  
  const currentVolume = volumes[volumes.length - 1];
  const avgVolume = volumes.slice(0, -1).reduce((a, b) => a + b, 0) / (volumes.length - 1);
  
  return ((currentVolume - avgVolume) / avgVolume) * 100;
};

// Determine signal based on technical indicators
export const determineSignal = (indicators: TechnicalIndicators): {
  signal: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  reasons: string[];
} => {
  const reasons: string[] = [];
  let bullishPoints = 0;
  let bearishPoints = 0;

  // RSI Analysis
  if (indicators.rsi !== undefined) {
    if (indicators.rsi < 30) {
      bullishPoints += 2;
      reasons.push(`RSI oversold (${indicators.rsi.toFixed(1)})`);
    } else if (indicators.rsi > 70) {
      bearishPoints += 2;
      reasons.push(`RSI overbought (${indicators.rsi.toFixed(1)})`);
    }
  }

  // Moving Average Crossover
  if (indicators.ma20 !== undefined && indicators.ma50 !== undefined) {
    if (indicators.ma20 > indicators.ma50) {
      bullishPoints += 1.5;
      reasons.push('MA20 above MA50 (bullish trend)');
    } else if (indicators.ma20 < indicators.ma50) {
      bearishPoints += 1.5;
      reasons.push('MA20 below MA50 (bearish trend)');
    }
  }

  // Volume Analysis
  if (indicators.volumeChange !== undefined) {
    if (indicators.volumeChange > 50) {
      bullishPoints += 1;
      reasons.push(`High volume spike (+${indicators.volumeChange.toFixed(0)}%)`);
    }
  }

  // Price Change
  if (indicators.priceChange !== undefined) {
    if (indicators.priceChange > 5) {
      bearishPoints += 0.5;
      reasons.push('Potentially overextended');
    } else if (indicators.priceChange < -5) {
      bullishPoints += 0.5;
      reasons.push('Potential reversal opportunity');
    }
  }

  const totalPoints = bullishPoints + bearishPoints;
  let signal: 'BUY' | 'SELL' | 'HOLD';
  let confidence: number;

  if (bullishPoints > bearishPoints && bullishPoints >= 2) {
    signal = 'BUY';
    confidence = Math.min((bullishPoints / (totalPoints || 1)) * 100, 95);
  } else if (bearishPoints > bullishPoints && bearishPoints >= 2) {
    signal = 'SELL';
    confidence = Math.min((bearishPoints / (totalPoints || 1)) * 100, 95);
  } else {
    signal = 'HOLD';
    confidence = 50;
    reasons.push('Mixed signals - wait for clearer trend');
  }

  return { signal, confidence, reasons };
};
