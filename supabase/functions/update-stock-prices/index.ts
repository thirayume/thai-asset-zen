import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mock data generator for Thai stocks (until real SET API is connected)
const generateMockStockData = () => {
  const setStocks = [
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

  return setStocks.map(stock => {
    const changePercent = (Math.random() - 0.5) * 2 * stock.volatility * 100;
    const currentPrice = stock.basePrice * (1 + changePercent / 100);
    
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

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase credentials');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Generate mock stock data
    const stockData = generateMockStockData();
    console.log('Generated stock data for', stockData.length, 'symbols');

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

    // Create alert for significant changes
    const significantChanges = stockData.filter(s => Math.abs(s.change_percent) > 2);
    if (significantChanges.length > 0) {
      await supabase
        .from('market_alerts')
        .insert({
          alert_type: 'price_movement',
          message: `${significantChanges.length} stocks with significant price changes (>2%)`,
          severity: 'warning'
        });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        updated: updatedStocks?.length || 0,
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