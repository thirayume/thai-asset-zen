import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BotConfig {
  user_id: string;
  enabled: boolean;
  mode: 'paper' | 'live';
  max_position_size: number;
  max_daily_trades: number;
  max_total_exposure: number;
  min_confidence_score: number;
  allowed_signal_types: string[];
  auto_stop_loss: boolean;
  auto_take_profit: boolean;
  trailing_stop_percent: number;
  daily_loss_limit: number;
  max_portfolio_drawdown: number;
}

interface TradingSignal {
  id: string;
  stock_symbol: string;
  stock_name: string;
  signal_type: 'BUY' | 'SELL';
  confidence_score: number;
  current_price: number;
  target_price: number;
  stop_loss: number;
  reasoning: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting auto-trade execution...');

    // Fetch all enabled bot configs
    const { data: configs, error: configError } = await supabase
      .from('trading_bot_config')
      .select('*')
      .eq('enabled', true);

    if (configError) throw configError;

    console.log(`Found ${configs?.length || 0} enabled bots`);

    const results = [];
    for (const config of configs || []) {
      try {
        const tradeResult = await processUserTrades(supabase, config);
        results.push(tradeResult);
      } catch (error) {
        console.error(`Error processing trades for user ${config.user_id}:`, error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        results.push({ user_id: config.user_id, error: errorMessage });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: results.length,
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in execute-auto-trades:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function processUserTrades(supabase: any, config: BotConfig) {
  console.log(`Processing trades for user ${config.user_id}`);

  // Safety checks
  const canTrade = await checkSafetyLimits(supabase, config);
  if (!canTrade.allowed) {
    console.log(`Trading blocked for user ${config.user_id}: ${canTrade.reason}`);
    
    // Auto-disable bot
    await supabase
      .from('trading_bot_config')
      .update({ enabled: false })
      .eq('user_id', config.user_id);
    
    // Send alert to user
    await supabase.from('trade_alerts').insert({
      user_id: config.user_id,
      stock_symbol: 'SYSTEM',
      stock_name: 'System Alert',
      alert_type: 'bot_auto_paused',
      message: `🛑 Bot auto-paused: ${canTrade.reason}`,
      current_price: null,
      trigger_price: null
    });
    
    return { user_id: config.user_id, skipped: true, reason: canTrade.reason };
  }

  // Fetch high-confidence signals
  const { data: signals, error: signalsError } = await supabase
    .from('trading_signals')
    .select('*')
    .gte('confidence_score', config.min_confidence_score)
    .gt('expires_at', new Date().toISOString())
    .order('confidence_score', { ascending: false })
    .limit(5);

  if (signalsError) throw signalsError;

  console.log(`Found ${signals?.length || 0} qualifying signals`);

  const executedTrades = [];
  for (const signal of signals || []) {
    // Check if signal type is allowed
    if (!config.allowed_signal_types.includes(signal.signal_type)) {
      continue;
    }

    // Check if we've already traded this signal
    const { data: existingTrade } = await supabase
      .from('auto_trade_executions')
      .select('id')
      .eq('user_id', config.user_id)
      .eq('signal_id', signal.id)
      .maybeSingle();

    if (existingTrade) {
      console.log(`Already traded signal ${signal.id}, skipping`);
      continue;
    }

    // For BUY signals, check available capital
    if (signal.signal_type === 'BUY') {
      const { data: portfolio } = await supabase
        .from('user_portfolios')
        .select('total_cash')
        .eq('user_id', config.user_id)
        .maybeSingle();

      const availableCash = portfolio?.total_cash || 0;
      const positionSize = Math.min(config.max_position_size, availableCash);

      if (positionSize < 1000) {
        console.log(`Insufficient funds for user ${config.user_id}`);
        continue;
      }

      // Calculate shares based on position size
      const shares = Math.floor(positionSize / signal.current_price);
      if (shares === 0) continue;

      const totalValue = shares * signal.current_price;

      // Execute trade (paper or live)
      const tradeResult = await executeTrade(supabase, config, signal, shares, totalValue);
      executedTrades.push(tradeResult);

      // Only process max_daily_trades per run
      if (executedTrades.length >= config.max_daily_trades) {
        break;
      }
    }
  }

  return {
    user_id: config.user_id,
    trades_executed: executedTrades.length,
    trades: executedTrades
  };
}

async function checkSafetyLimits(supabase: any, config: BotConfig) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check daily trade count
  const { data: todayTrades, error: tradesError } = await supabase
    .from('auto_trade_executions')
    .select('id')
    .eq('user_id', config.user_id)
    .gte('created_at', today.toISOString());

  if (tradesError) throw tradesError;

  if (todayTrades && todayTrades.length >= config.max_daily_trades) {
    return { allowed: false, reason: 'Daily trade limit reached' };
  }

  // Check daily losses
  const { data: todayExecutions, error: executionsError } = await supabase
    .from('auto_trade_executions')
    .select('total_value, execution_price, shares, action')
    .eq('user_id', config.user_id)
    .eq('status', 'executed')
    .gte('created_at', today.toISOString());

  if (executionsError) throw executionsError;

  let dailyPnL = 0;
  if (todayExecutions) {
    for (const trade of todayExecutions) {
      const pnl = trade.action === 'BUY' 
        ? -(trade.total_value) 
        : (trade.execution_price * trade.shares) - trade.total_value;
      dailyPnL += pnl;
    }
  }

  if (dailyPnL < -Math.abs(config.daily_loss_limit)) {
    return { allowed: false, reason: 'Daily loss limit exceeded' };
  }

  // Check total exposure
  const { data: activePositions, error: positionsError } = await supabase
    .from('user_positions')
    .select('shares_owned, average_entry_price')
    .eq('user_id', config.user_id)
    .eq('status', 'active');

  if (positionsError) throw positionsError;

  let totalExposure = 0;
  if (activePositions) {
    for (const position of activePositions) {
      totalExposure += position.shares_owned * position.average_entry_price;
    }
  }

  if (totalExposure >= config.max_total_exposure) {
    return { allowed: false, reason: 'Maximum exposure limit reached' };
  }

  return { allowed: true };
}

async function executeTrade(
  supabase: any,
  config: BotConfig,
  signal: TradingSignal,
  shares: number,
  totalValue: number
) {
  console.log(`Executing ${config.mode} trade: ${signal.signal_type} ${shares} shares of ${signal.stock_symbol}`);

  const stopLoss = config.auto_stop_loss ? signal.stop_loss : null;
  const takeProfit = config.auto_take_profit ? signal.target_price : null;

  if (config.mode === 'paper') {
    // Paper trading: just record the trade
    const { data: execution, error: executionError } = await supabase
      .from('auto_trade_executions')
      .insert({
        user_id: config.user_id,
        signal_id: signal.id,
        stock_symbol: signal.stock_symbol,
        stock_name: signal.stock_name,
        action: signal.signal_type,
        shares: shares,
        price: signal.current_price,
        total_value: totalValue,
        status: 'executed',
        executed_at: new Date().toISOString(),
        execution_price: signal.current_price,
        stop_loss: stopLoss,
        take_profit: takeProfit,
        confidence_score: signal.confidence_score,
      })
      .select()
      .single();

    if (executionError) throw executionError;

    // Create user position
    const { error: positionError } = await supabase
      .from('user_positions')
      .insert({
        user_id: config.user_id,
        stock_symbol: signal.stock_symbol,
        stock_name: signal.stock_name,
        shares_owned: shares,
        average_entry_price: signal.current_price,
        purchase_date: new Date().toISOString(),
        target_price: takeProfit,
        stop_loss: stopLoss,
        status: 'active',
        notes: `Auto-trade from signal (${signal.confidence_score}% confidence)`,
      });

    if (positionError) throw positionError;

    // Create monitored position
    const { data: position } = await supabase
      .from('user_positions')
      .select('id')
      .eq('user_id', config.user_id)
      .eq('stock_symbol', signal.stock_symbol)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (position) {
      await supabase
        .from('monitored_positions')
        .insert({
          user_id: config.user_id,
          position_id: position.id,
          entry_price: signal.current_price,
          current_price: signal.current_price,
          stop_loss_price: stopLoss,
          take_profit_price: takeProfit,
          trailing_stop_enabled: config.trailing_stop_percent > 0,
          highest_price_seen: signal.current_price,
          active: true,
        });
    }

    console.log(`Paper trade executed successfully: ${execution.id}`);
    return { execution_id: execution.id, mode: 'paper', status: 'executed' };
  } else {
    // Live trading with broker API
    return await executeLiveTrade(supabase, config, signal, shares, totalValue, stopLoss, takeProfit);
  }
}

async function executeLiveTrade(
  supabase: any,
  config: BotConfig,
  signal: TradingSignal,
  shares: number,
  totalValue: number,
  stopLoss: number | null,
  takeProfit: number | null
) {
  console.log(`Executing LIVE trade: ${signal.signal_type} ${shares} shares of ${signal.stock_symbol}`);

  try {
    // Import broker API
    const { getBrokerAPI } = await import('../_shared/brokerAPI.ts');

    // Validate broker configuration
    const { data: brokerConfig } = await supabase
      .from('trading_bot_config')
      .select('broker_name, broker_api_key, broker_account_id')
      .eq('user_id', config.user_id)
      .single();

    if (!brokerConfig?.broker_name || !brokerConfig?.broker_api_key || !brokerConfig?.broker_account_id) {
      throw new Error('Broker credentials not configured. Please configure broker in Bot Settings.');
    }

    // Initialize broker API
    const brokerAPI = getBrokerAPI(
      brokerConfig.broker_name,
      brokerConfig.broker_api_key,
      brokerConfig.broker_account_id
    );

    // Authenticate with broker
    const authenticated = await brokerAPI.authenticate();
    if (!authenticated) {
      throw new Error('Broker authentication failed');
    }

    // Check account balance
    const { cash } = await brokerAPI.getAccountBalance();
    if (cash < totalValue) {
      throw new Error(`Insufficient funds: Need ฿${totalValue}, Available: ฿${cash}`);
    }

    // Place order with broker
    console.log(`Placing order with ${brokerConfig.broker_name}...`);
    const orderResult = await brokerAPI.placeOrder({
      symbol: signal.stock_symbol,
      side: signal.signal_type,
      quantity: shares,
      price: signal.current_price,
      orderType: 'LIMIT', // Use limit order for better control
      timeInForce: 'DAY',
    });

    console.log(`Order placed: ${orderResult.orderId}, Status: ${orderResult.status}`);

    // Record execution in database (pending)
    const { data: execution, error: executionError } = await supabase
      .from('auto_trade_executions')
      .insert({
        user_id: config.user_id,
        signal_id: signal.id,
        stock_symbol: signal.stock_symbol,
        stock_name: signal.stock_name,
        action: signal.signal_type,
        shares: shares,
        price: signal.current_price,
        total_value: totalValue,
        status: orderResult.status === 'filled' ? 'executed' : 'pending',
        executed_at: orderResult.status === 'filled' ? new Date().toISOString() : null,
        execution_price: orderResult.filledPrice || null,
        stop_loss: stopLoss,
        take_profit: takeProfit,
        confidence_score: signal.confidence_score,
        broker_order_id: orderResult.orderId,
      })
      .select()
      .single();

    if (executionError) throw executionError;

    // Poll for order confirmation (max 30 seconds)
    let attempts = 0;
    const maxAttempts = 6; // 6 attempts * 5 seconds = 30 seconds
    let finalStatus = orderResult.status;
    let filledPrice = orderResult.filledPrice;

    while (attempts < maxAttempts && finalStatus === 'pending') {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      
      const statusCheck = await brokerAPI.getOrderStatus(orderResult.orderId);
      finalStatus = statusCheck.status;
      filledPrice = statusCheck.filledPrice || filledPrice;
      
      console.log(`Order status check ${attempts + 1}/${maxAttempts}: ${finalStatus}`);
      
      if (finalStatus === 'filled') break;
      attempts++;
    }

    // Update execution record
    await supabase
      .from('auto_trade_executions')
      .update({
        status: finalStatus === 'filled' ? 'executed' : 'pending',
        executed_at: finalStatus === 'filled' ? new Date().toISOString() : null,
        execution_price: filledPrice,
        failure_reason: finalStatus === 'rejected' ? 'Order rejected by broker' : null,
      })
      .eq('id', execution.id);

    if (finalStatus === 'filled') {
      // Create user position
      const { error: positionError } = await supabase
        .from('user_positions')
        .insert({
          user_id: config.user_id,
          stock_symbol: signal.stock_symbol,
          stock_name: signal.stock_name,
          shares_owned: shares,
          average_entry_price: filledPrice || signal.current_price,
          purchase_date: new Date().toISOString(),
          target_price: takeProfit,
          stop_loss: stopLoss,
          status: 'active',
          notes: `Live trade from signal (${signal.confidence_score}% confidence, Order ID: ${orderResult.orderId})`,
        });

      if (positionError) throw positionError;

      // Create monitored position
      const { data: position } = await supabase
        .from('user_positions')
        .select('id')
        .eq('user_id', config.user_id)
        .eq('stock_symbol', signal.stock_symbol)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (position) {
        await supabase
          .from('monitored_positions')
          .insert({
            user_id: config.user_id,
            position_id: position.id,
            entry_price: filledPrice || signal.current_price,
            current_price: filledPrice || signal.current_price,
            stop_loss_price: stopLoss,
            take_profit_price: takeProfit,
            trailing_stop_enabled: config.trailing_stop_percent > 0,
            highest_price_seen: filledPrice || signal.current_price,
            active: true,
          });
      }

      // Send success alert
      await supabase.from('trade_alerts').insert({
        user_id: config.user_id,
        stock_symbol: signal.stock_symbol,
        stock_name: signal.stock_name,
        alert_type: 'trade_executed',
        message: `✅ Live trade executed: BUY ${shares} shares of ${signal.stock_symbol} @ ฿${filledPrice?.toFixed(2) || signal.current_price}`,
        current_price: filledPrice || signal.current_price,
        trigger_price: signal.current_price,
      });

      console.log(`✅ Live trade executed successfully: ${execution.id}`);
      return { execution_id: execution.id, mode: 'live', status: 'executed', order_id: orderResult.orderId };
    } else {
      // Order not filled in time
      console.log(`⚠️ Order ${orderResult.orderId} not filled within timeout. Status: ${finalStatus}`);
      
      // Send alert
      await supabase.from('trade_alerts').insert({
        user_id: config.user_id,
        stock_symbol: signal.stock_symbol,
        stock_name: signal.stock_name,
        alert_type: 'trade_pending',
        message: `⏳ Live trade pending: ${signal.signal_type} ${shares} shares of ${signal.stock_symbol}. Order ID: ${orderResult.orderId}`,
        current_price: signal.current_price,
        trigger_price: signal.current_price,
      });

      return { execution_id: execution.id, mode: 'live', status: finalStatus, order_id: orderResult.orderId };
    }
  } catch (error) {
    console.error('❌ Live trade execution failed:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Record failed execution
    await supabase
      .from('auto_trade_executions')
      .insert({
        user_id: config.user_id,
        signal_id: signal.id,
        stock_symbol: signal.stock_symbol,
        stock_name: signal.stock_name,
        action: signal.signal_type,
        shares: shares,
        price: signal.current_price,
        total_value: totalValue,
        status: 'failed',
        failure_reason: errorMessage,
        confidence_score: signal.confidence_score,
      });

    // Send alert
    await supabase.from('trade_alerts').insert({
      user_id: config.user_id,
      stock_symbol: signal.stock_symbol,
      stock_name: signal.stock_name,
      alert_type: 'trade_failed',
      message: `❌ Live trade failed: ${errorMessage}`,
      current_price: signal.current_price,
      trigger_price: signal.current_price,
    });

    return { error: errorMessage, mode: 'live', status: 'failed' };
  }
}
