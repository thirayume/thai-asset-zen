/**
 * MT5 Price Data Validation Utilities
 * Prevents injection of invalid or malicious price data
 */

export interface MT5PriceData {
  symbol: string;
  bid: number;
  ask: number;
  volume?: number;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

// Whitelist of supported symbols with their reasonable price ranges
const SYMBOL_RANGES: Record<string, { min: number; max: number; maxSpread: number }> = {
  'EURUSD': { min: 0.5, max: 2.0, maxSpread: 0.01 },     // 1% max spread
  'GBPUSD': { min: 0.5, max: 2.5, maxSpread: 0.01 },
  'USDJPY': { min: 50, max: 200, maxSpread: 0.01 },
  'XAUUSD': { min: 1000, max: 5000, maxSpread: 0.05 },   // Gold: 5% max spread
  'USDCHF': { min: 0.5, max: 2.0, maxSpread: 0.01 },
  'AUDUSD': { min: 0.3, max: 1.5, maxSpread: 0.01 },
  'USDCAD': { min: 0.5, max: 2.0, maxSpread: 0.01 },
  'NZDUSD': { min: 0.3, max: 1.5, maxSpread: 0.01 },
  'EURJPY': { min: 50, max: 250, maxSpread: 0.01 },
  'GBPJPY': { min: 50, max: 300, maxSpread: 0.01 },
};

/**
 * Validate MT5 price data
 */
export function validateMT5Price(data: any): ValidationResult {
  // Check required fields exist
  if (!data.symbol || data.bid === undefined || data.ask === undefined) {
    return { valid: false, error: 'Missing required fields: symbol, bid, ask' };
  }

  // Validate symbol is in whitelist
  const symbolConfig = SYMBOL_RANGES[data.symbol];
  if (!symbolConfig) {
    return { 
      valid: false, 
      error: `Invalid symbol. Supported: ${Object.keys(SYMBOL_RANGES).join(', ')}` 
    };
  }

  // Parse and validate prices are numbers
  const bid = parseFloat(data.bid);
  const ask = parseFloat(data.ask);

  if (isNaN(bid) || isNaN(ask)) {
    return { valid: false, error: 'Bid and ask must be valid numbers' };
  }

  // Validate prices are positive
  if (bid <= 0 || ask <= 0) {
    return { valid: false, error: 'Prices must be positive' };
  }

  // Validate spread (ask must be higher than bid)
  if (ask <= bid) {
    return { valid: false, error: 'Invalid spread: ask must be greater than bid' };
  }

  // Validate spread is reasonable
  const spread = (ask - bid) / bid;
  if (spread > symbolConfig.maxSpread) {
    return { 
      valid: false, 
      error: `Spread too large (${(spread * 100).toFixed(2)}% > ${symbolConfig.maxSpread * 100}%)` 
    };
  }

  // Validate price ranges (sanity check)
  if (bid < symbolConfig.min || bid > symbolConfig.max || 
      ask < symbolConfig.min || ask > symbolConfig.max) {
    return { 
      valid: false, 
      error: `Price out of range (expected ${symbolConfig.min}-${symbolConfig.max})` 
    };
  }

  // Validate volume if provided
  if (data.volume !== undefined) {
    const volume = parseInt(data.volume);
    if (isNaN(volume) || volume < 0 || volume > 10000000) {
      return { valid: false, error: 'Invalid volume (must be 0-10,000,000)' };
    }
  }

  return { valid: true };
}

/**
 * Sanitize price data for storage
 */
export function sanitizePriceData(data: any): MT5PriceData {
  return {
    symbol: String(data.symbol).toUpperCase().trim(),
    bid: parseFloat(data.bid),
    ask: parseFloat(data.ask),
    volume: data.volume ? parseInt(data.volume) : 0,
  };
}
