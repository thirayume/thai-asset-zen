import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MonitoredPosition {
  id: string;
  user_id: string;
  position_id: string;
  entry_price: number;
  current_price: number;
  stop_loss_price: number;
  take_profit_price: number;
  trailing_stop_enabled: boolean;
  highest_price_seen: number;
  active: boolean;
}

interface StockPrice {
  symbol: string;
  current_price: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting position monitoring...');

    // Fetch all active monitored positions
    const { data: positions, error: positionsError } = await supabase
      .from('monitored_positions')
      .select(`
        *,
        user_positions!inner (
          stock_symbol,
          stock_name,
          shares_owned
        )
      `)
      .eq('active', true);

    if (positionsError) throw positionsError;

    console.log(`Found ${positions?.length || 0} active monitored positions`);

    if (!positions || positions.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No positions to monitor' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get current prices for all stocks
    const stockSymbols = [...new Set(positions.map(p => p.user_positions.stock_symbol))];
    const { data: stocks, error: stocksError } = await supabase
      .from('thai_stocks')
      .select('symbol, current_price')
      .in('symbol', stockSymbols);

    if (stocksError) throw stocksError;

    const priceMap = new Map<string, number>();
    stocks?.forEach(stock => {
      if (stock.current_price) {
        priceMap.set(stock.symbol, Number(stock.current_price));
      }
    });

    console.log(`Loaded ${priceMap.size} stock prices`);

    const results = [];
    for (const position of positions) {
      try {
        const currentPrice = priceMap.get(position.user_positions.stock_symbol);
        if (!currentPrice) {
          console.log(`No price found for ${position.user_positions.stock_symbol}, skipping`);
          continue;
        }

        const result = await checkPosition(supabase, position, currentPrice);
        results.push(result);
      } catch (error) {
        console.error(`Error checking position ${position.id}:`, error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        results.push({ position_id: position.id, error: errorMessage });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        checked: results.length,
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in monitor-positions:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function checkPosition(supabase: any, position: any, currentPrice: number) {
  console.log(`Checking position ${position.id}: ${position.user_positions.stock_symbol} @ ${currentPrice}`);

  let shouldExit = false;
  let exitReason = '';
  let updatedStopLoss = position.stop_loss_price;
  let updatedHighest = position.highest_price_seen;

  // Check stop loss
  if (position.stop_loss_price && currentPrice <= position.stop_loss_price) {
    shouldExit = true;
    exitReason = 'stop_loss';
    console.log(`Stop loss triggered for ${position.user_positions.stock_symbol}: ${currentPrice} <= ${position.stop_loss_price}`);
  }

  // Check take profit
  if (!shouldExit && position.take_profit_price && currentPrice >= position.take_profit_price) {
    shouldExit = true;
    exitReason = 'take_profit';
    console.log(`Take profit triggered for ${position.user_positions.stock_symbol}: ${currentPrice} >= ${position.take_profit_price}`);
  }

  // Check trailing stop
  if (!shouldExit && position.trailing_stop_enabled) {
    if (currentPrice > position.highest_price_seen) {
      updatedHighest = currentPrice;
      
      // Get trailing stop percentage from bot config
      const { data: config } = await supabase
        .from('trading_bot_config')
        .select('trailing_stop_percent')
        .eq('user_id', position.user_id)
        .single();

      const trailingPercent = config?.trailing_stop_percent || 5;
      const newStopLoss = currentPrice * (1 - trailingPercent / 100);
      updatedStopLoss = Math.max(position.stop_loss_price, newStopLoss);

      console.log(`Trailing stop updated for ${position.user_positions.stock_symbol}: ${updatedStopLoss}`);
    }

    if (currentPrice <= updatedStopLoss) {
      shouldExit = true;
      exitReason = 'trailing_stop';
      console.log(`Trailing stop triggered for ${position.user_positions.stock_symbol}: ${currentPrice} <= ${updatedStopLoss}`);
    }
  }

  if (shouldExit) {
    // Exit position
    await executeExit(supabase, position, currentPrice, exitReason);
    return {
      position_id: position.id,
      action: 'exited',
      reason: exitReason,
      exit_price: currentPrice
    };
  } else {
    // Update position tracking
    const { error: updateError } = await supabase
      .from('monitored_positions')
      .update({
        current_price: currentPrice,
        highest_price_seen: updatedHighest,
        stop_loss_price: updatedStopLoss,
        last_checked_at: new Date().toISOString(),
      })
      .eq('id', position.id);

    if (updateError) throw updateError;

    return {
      position_id: position.id,
      action: 'monitored',
      current_price: currentPrice,
      highest_seen: updatedHighest
    };
  }
}

async function executeExit(supabase: any, position: any, exitPrice: number, exitReason: string) {
  console.log(`Executing exit for position ${position.id}: ${exitReason} @ ${exitPrice}`);

  const shares = position.user_positions.shares_owned;
  const totalValue = shares * exitPrice;
  const pnl = (exitPrice - position.entry_price) * shares;

  // Get bot config to check mode
  const { data: config } = await supabase
    .from('trading_bot_config')
    .select('mode')
    .eq('user_id', position.user_id)
    .single();

  const mode = config?.mode || 'paper';

  // Record the exit trade
  const { error: executionError } = await supabase
    .from('auto_trade_executions')
    .insert({
      user_id: position.user_id,
      stock_symbol: position.user_positions.stock_symbol,
      stock_name: position.user_positions.stock_name,
      action: 'SELL',
      shares: shares,
      price: exitPrice,
      total_value: totalValue,
      status: 'executed',
      executed_at: new Date().toISOString(),
      execution_price: exitPrice,
      confidence_score: null,
    });

  if (executionError) throw executionError;

  // Update user position
  const { error: positionError } = await supabase
    .from('user_positions')
    .update({
      status: 'sold',
      sold_at: new Date().toISOString(),
      sold_price: exitPrice,
      notes: `Auto-exit: ${exitReason} (P/L: ฿${pnl.toFixed(2)})`,
    })
    .eq('id', position.position_id);

  if (positionError) throw positionError;

  // Deactivate monitored position
  const { error: monitorError } = await supabase
    .from('monitored_positions')
    .update({
      active: false,
      exit_reason: exitReason,
      exited_at: new Date().toISOString(),
      current_price: exitPrice,
    })
    .eq('id', position.id);

  if (monitorError) throw monitorError;

  // Create alert for user
  const alertMessage = pnl >= 0
    ? `🎉 Auto-exit: Sold ${shares} shares of ${position.user_positions.stock_symbol} @ ฿${exitPrice} (Profit: ฿${pnl.toFixed(2)})`
    : `⚠️ Auto-exit: Sold ${shares} shares of ${position.user_positions.stock_symbol} @ ฿${exitPrice} (Loss: ฿${Math.abs(pnl).toFixed(2)})`;

  await supabase
    .from('trade_alerts')
    .insert({
      user_id: position.user_id,
      alert_type: exitReason === 'take_profit' ? 'target_reached' : 'stop_loss',
      stock_symbol: position.user_positions.stock_symbol,
      stock_name: position.user_positions.stock_name,
      message: alertMessage,
      current_price: exitPrice,
      trigger_price: exitReason === 'take_profit' ? position.take_profit_price : position.stop_loss_price,
      position_id: position.position_id,
    });

  console.log(`✅ Successfully exited position ${position.id}`);
}
