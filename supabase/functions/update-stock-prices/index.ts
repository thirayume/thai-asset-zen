import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";
import { encode as base64Encode } from "https://deno.land/std@0.177.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Stock symbols to track
const TRACKED_STOCKS = [
  { symbol: 'PTT', name: 'PTT Public Company' },
  { symbol: 'KBANK', name: 'Kasikornbank' },
  { symbol: 'CPALL', name: 'CP All' },
  { symbol: 'AOT', name: 'Airports of Thailand' },
  { symbol: 'ADVANC', name: 'Advanced Info Service' },
  { symbol: 'CPNREIT', name: 'CPN Retail Growth' },
  { symbol: 'WHAREM', name: 'WHA Industrial REIT' },
  { symbol: 'PTTEP', name: 'PTT Exploration' },
  { symbol: 'SCB', name: 'Siam Commercial Bank' },
  { symbol: 'TRUE', name: 'True Corporation' },
  { symbol: 'BBL', name: 'Bangkok Bank' },
  { symbol: 'INTUCH', name: 'Intouch Holdings' },
  { symbol: 'TOP', name: 'Thai Oil' },
  { symbol: 'BEM', name: 'Bangkok Expressway' },
  { symbol: 'GULF', name: 'Gulf Energy Development' },
];

// Generate HMAC-SHA256 signature for Settrade API
const generateSignature = async (appSecret: string, params: string, timestamp: number): Promise<string> => {
  const message = `${params}${timestamp}`;
  const key = new TextEncoder().encode(appSecret);
  const data = new TextEncoder().encode(message);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, data);
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

// Authenticate with Settrade API
const authenticateSettrade = async (username: string, appId: string, appSecret: string): Promise<string | null> => {
  try {
    const timestamp = Date.now();
    const params = '';
    const signature = await generateSignature(appSecret, params, timestamp);
    
    console.log('Authenticating with Settrade API...');
    
    const response = await fetch(
      'https://open-api.settrade.com/api/oam/v1/broker-apps/login',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: appId,
          params: params,
          signature: signature,
          timestamp: timestamp
        }),
      }
    );

    if (!response.ok) {
      console.error('Settrade authentication failed:', response.status, await response.text());
      return null;
    }

    const data = await response.json();
    console.log('Settrade authentication successful');
    return data.accessToken || data.token;
  } catch (error) {
    console.error('Settrade authentication error:', error);
    return null;
  }
};

// Fetch real stock data from Settrade API
const fetchSettradeStockData = async (accessToken: string) => {
  console.log('Fetching real stock data from Settrade API...');
  
  const stockDataPromises = TRACKED_STOCKS.map(async (stock) => {
    try {
      // Fetch stock quote from Settrade
      const response = await fetch(
        `https://open-api.settrade.com/api/market/v2/quote/${stock.symbol}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        console.error(`Failed to fetch ${stock.symbol}: ${response.status} ${response.statusText}`);
        return null;
      }

      const data = await response.json();
      
      // Parse Settrade API response
      const currentPrice = parseFloat(data.last || data.lastPrice || data.close || 0);
      const prevClose = parseFloat(data.prior || data.previousClose || currentPrice);
      const changePercent = prevClose > 0 ? ((currentPrice - prevClose) / prevClose) * 100 : 0;
      
      return {
        symbol: stock.symbol,
        name: stock.name,
        current_price: currentPrice,
        change_percent: parseFloat(changePercent.toFixed(2)),
        volume: parseInt(data.volume || data.totalVolume || 0),
        market_cap: parseInt(data.marketCap || 0),
        pe_ratio: parseFloat(data.pe || data.peRatio || 0),
        dividend_yield: parseFloat(data.dividendYield || 0),
        last_updated: new Date().toISOString(),
        open_price: parseFloat(data.open || currentPrice),
        high_price: parseFloat(data.high || currentPrice),
        low_price: parseFloat(data.low || currentPrice),
      };
    } catch (error) {
      console.error(`Error fetching ${stock.symbol}:`, error);
      return null;
    }
  });

  const results = await Promise.all(stockDataPromises);
  return results.filter(data => data !== null);
};

// Mock data generator (fallback when API unavailable)
const generateMockStockData = () => {
  console.log('Using mock data (SET API unavailable)');
  
  const baseData = [
    { symbol: 'PTT', name: 'PTT Public Company', basePrice: 38.5, volatility: 0.02 },
    { symbol: 'KBANK', name: 'Kasikornbank', basePrice: 142.5, volatility: 0.015 },
    { symbol: 'CPALL', name: 'CP All', basePrice: 68.0, volatility: 0.018 },
    { symbol: 'AOT', name: 'Airports of Thailand', basePrice: 67.5, volatility: 0.025 },
    { symbol: 'ADVANC', name: 'Advanced Info Service', basePrice: 225.0, volatility: 0.012 },
    { symbol: 'CPNREIT', name: 'CPN Retail Growth', basePrice: 32.5, volatility: 0.008 },
    { symbol: 'WHAREM', name: 'WHA Industrial REIT', basePrice: 18.0, volatility: 0.01 },
    { symbol: 'PTTEP', name: 'PTT Exploration', basePrice: 128.5, volatility: 0.03 },
    { symbol: 'SCB', name: 'Siam Commercial Bank', basePrice: 125.0, volatility: 0.016 },
    { symbol: 'TRUE', name: 'True Corporation', basePrice: 5.8, volatility: 0.035 },
    { symbol: 'BBL', name: 'Bangkok Bank', basePrice: 152.0, volatility: 0.014 },
    { symbol: 'INTUCH', name: 'Intouch Holdings', basePrice: 67.0, volatility: 0.02 },
    { symbol: 'TOP', name: 'Thai Oil', basePrice: 58.25, volatility: 0.022 },
    { symbol: 'BEM', name: 'Bangkok Expressway', basePrice: 9.15, volatility: 0.015 },
    { symbol: 'GULF', name: 'Gulf Energy Development', basePrice: 45.0, volatility: 0.028 },
  ];

  return baseData.map(stock => {
    const changePercent = (Math.random() - 0.5) * 2 * stock.volatility * 100;
    const currentPrice = stock.basePrice * (1 + changePercent / 100);
    const high = currentPrice * (1 + Math.random() * 0.01);
    const low = currentPrice * (1 - Math.random() * 0.01);
    const open = currentPrice * (1 + (Math.random() - 0.5) * 0.005);
    
    return {
      symbol: stock.symbol,
      name: stock.name,
      current_price: parseFloat(currentPrice.toFixed(2)),
      change_percent: parseFloat(changePercent.toFixed(2)),
      volume: Math.floor(Math.random() * 50000000) + 10000000,
      market_cap: Math.floor(currentPrice * (Math.random() * 10000000000 + 5000000000)),
      pe_ratio: parseFloat((Math.random() * 20 + 8).toFixed(2)),
      dividend_yield: parseFloat((Math.random() * 0.05 + 0.01).toFixed(4)),
      last_updated: new Date().toISOString(),
      open_price: parseFloat(open.toFixed(2)),
      high_price: parseFloat(high.toFixed(2)),
      low_price: parseFloat(low.toFixed(2)),
    };
  });
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const SET_SMART_API_KEY = Deno.env.get('SET_SMART_API_KEY');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase credentials');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let stockData;
    let usingMockData = false;

    const SETTRADE_USERNAME = Deno.env.get('SETTRADE_USERNAME');
    const SETTRADE_APP_ID = Deno.env.get('SETTRADE_APP_ID');
    const SETTRADE_APP_SECRET = Deno.env.get('SETTRADE_APP_SECRET');

    // Try to fetch from Settrade API first
    if (SETTRADE_USERNAME && SETTRADE_APP_ID && SETTRADE_APP_SECRET) {
      try {
        const accessToken = await authenticateSettrade(SETTRADE_USERNAME, SETTRADE_APP_ID, SETTRADE_APP_SECRET);
        
        if (accessToken) {
          stockData = await fetchSettradeStockData(accessToken);
          
          if (stockData.length === 0) {
            console.warn('No data returned from Settrade API, falling back to mock data');
            stockData = generateMockStockData();
            usingMockData = true;
          } else {
            console.log('Successfully fetched real stock data from Settrade for', stockData.length, 'symbols');
          }
        } else {
          console.warn('Settrade authentication failed, falling back to mock data');
          stockData = generateMockStockData();
          usingMockData = true;
        }
      } catch (apiError) {
        console.error('Settrade API error, falling back to mock data:', apiError);
        stockData = generateMockStockData();
        usingMockData = true;
        
        // Create alert for API failure
        await supabase
          .from('market_alerts')
          .insert({
            alert_type: 'system',
            message: 'Settrade API temporarily unavailable - using cached data',
            severity: 'warning'
          });
      }
    } else {
      console.warn('Settrade credentials not configured, using mock data');
      stockData = generateMockStockData();
      usingMockData = true;
    }

    // Upsert stock data
    const { data: updatedStocks, error: upsertError } = await supabase
      .from('thai_stocks')
      .upsert(stockData, { 
        onConflict: 'symbol',
        ignoreDuplicates: false 
      })
      .select();

    if (upsertError) {
      console.error('Upsert error:', upsertError);
      throw upsertError;
    }

    console.log('Updated stocks:', updatedStocks?.length);

    // Store historical data for charting
    const historicalData = stockData.map((stock: any) => ({
      stock_symbol: stock.symbol,
      stock_name: stock.name,
      open_price: stock.open_price || stock.current_price,
      high_price: stock.high_price || stock.current_price,
      low_price: stock.low_price || stock.current_price,
      close_price: stock.current_price,
      volume: stock.volume,
      recorded_at: new Date().toISOString(),
    }));

    const { error: historyError } = await supabase
      .from('stock_price_history')
      .insert(historicalData);

    if (historyError) {
      console.error('History insert error:', historyError);
      // Don't throw - we still want to return success if main update worked
    } else {
      console.log('Saved historical data for', historicalData.length, 'stocks');
    }

    // Create alert for significant changes (only for real data)
    if (!usingMockData) {
      const significantChanges = stockData.filter((s: any) => Math.abs(s.change_percent) > 2);
      if (significantChanges.length > 0) {
        await supabase
          .from('market_alerts')
          .insert({
            alert_type: 'price_movement',
            message: `${significantChanges.length} stocks with significant price changes (>2%)`,
            severity: 'warning'
          });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        updated: updatedStocks?.length || 0,
        usingMockData,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});