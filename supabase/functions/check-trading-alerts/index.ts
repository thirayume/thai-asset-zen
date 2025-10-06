import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    console.log('Starting trading alerts check...');

    // Get current stock prices
    const { data: stocks, error: stocksError } = await supabase
      .from('thai_stocks')
      .select('symbol, current_price, name');

    if (stocksError) throw stocksError;

    const stockPrices = new Map(
      stocks?.map(s => [s.symbol, { price: s.current_price, name: s.name }]) || []
    );

    console.log(`Loaded ${stockPrices.size} stock prices`);

    // Get all active positions
    const { data: positions, error: positionsError } = await supabase
      .from('user_positions')
      .select('*')
      .eq('status', 'active');

    if (positionsError) throw positionsError;

    console.log(`Found ${positions?.length || 0} active positions`);

    const alerts = [];

    // Check positions for target/stop-loss triggers
    for (const position of positions || []) {
      const stockInfo = stockPrices.get(position.stock_symbol);
      if (!stockInfo) continue;

      const currentPrice = Number(stockInfo.price);
      const targetPrice = Number(position.target_price);
      const stopLoss = Number(position.stop_loss);

      // Check target price reached
      if (targetPrice && currentPrice >= targetPrice) {
        alerts.push({
          user_id: position.user_id,
          alert_type: 'target_reached',
          stock_symbol: position.stock_symbol,
          stock_name: position.stock_name,
          message: `🎯 ${position.stock_symbol} reached target price! Current: ฿${currentPrice.toFixed(2)}, Target: ฿${targetPrice.toFixed(2)}`,
          position_id: position.id,
          current_price: currentPrice,
          trigger_price: targetPrice,
        });
        console.log(`Target alert for ${position.stock_symbol}: ${currentPrice} >= ${targetPrice}`);
      }

      // Check stop loss triggered
      if (stopLoss && currentPrice <= stopLoss) {
        alerts.push({
          user_id: position.user_id,
          alert_type: 'stop_loss_triggered',
          stock_symbol: position.stock_symbol,
          stock_name: position.stock_name,
          message: `⚠️ ${position.stock_symbol} hit stop loss! Current: ฿${currentPrice.toFixed(2)}, Stop Loss: ฿${stopLoss.toFixed(2)}`,
          position_id: position.id,
          current_price: currentPrice,
          trigger_price: stopLoss,
        });
        console.log(`Stop loss alert for ${position.stock_symbol}: ${currentPrice} <= ${stopLoss}`);
      }
    }

    // Get watchlist items with target entry prices
    const { data: watchlist, error: watchlistError } = await supabase
      .from('user_watchlist')
      .select('*')
      .not('target_entry_price', 'is', null);

    if (watchlistError) throw watchlistError;

    console.log(`Found ${watchlist?.length || 0} watchlist items with target entry prices`);

    // Check watchlist for entry price alerts
    for (const item of watchlist || []) {
      const stockInfo = stockPrices.get(item.stock_symbol);
      if (!stockInfo) continue;

      const currentPrice = Number(stockInfo.price);
      const targetEntry = Number(item.target_entry_price);

      // Alert if price reached or went below target entry (good buying opportunity)
      if (currentPrice <= targetEntry) {
        alerts.push({
          user_id: item.user_id,
          alert_type: 'watchlist_entry',
          stock_symbol: item.stock_symbol,
          stock_name: item.stock_name,
          message: `🔔 ${item.stock_symbol} reached your target entry price! Current: ฿${currentPrice.toFixed(2)}, Target: ฿${targetEntry.toFixed(2)}`,
          watchlist_id: item.id,
          current_price: currentPrice,
          trigger_price: targetEntry,
        });
        console.log(`Watchlist alert for ${item.stock_symbol}: ${currentPrice} <= ${targetEntry}`);
      }
    }

    // Insert alerts (avoid duplicates by checking recent alerts)
    if (alerts.length > 0) {
      // Check for duplicate alerts in last 24 hours
      const { data: recentAlerts } = await supabase
        .from('trade_alerts')
        .select('user_id, stock_symbol, alert_type')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      const recentAlertKeys = new Set(
        recentAlerts?.map(a => `${a.user_id}-${a.stock_symbol}-${a.alert_type}`) || []
      );

      const newAlerts = alerts.filter(alert => 
        !recentAlertKeys.has(`${alert.user_id}-${alert.stock_symbol}-${alert.alert_type}`)
      );

      if (newAlerts.length > 0) {
        const { error: insertError } = await supabase
          .from('trade_alerts')
          .insert(newAlerts);

        if (insertError) {
          console.error('Error inserting alerts:', insertError);
        } else {
          console.log(`Inserted ${newAlerts.length} new alerts`);
        }
      } else {
        console.log('No new alerts to insert (all duplicates)');
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        alertsGenerated: alerts.length,
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
