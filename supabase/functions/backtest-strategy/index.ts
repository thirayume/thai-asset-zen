import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BacktestParams {
  startDate: string;
  endDate: string;
  initialCapital: number;
  botConfig: {
    max_position_size: number;
    max_daily_trades: number;
    max_total_exposure: number;
    min_confidence_score: number;
    allowed_signal_types: string[];
    auto_stop_loss: boolean;
    auto_take_profit: boolean;
    trailing_stop_percent: number;
    daily_loss_limit: number;
  };
  symbols?: string[];
}

interface Position {
  symbol: string;
  name: string;
  shares: number;
  entry_price: number;
  entry_date: string;
  stop_loss: number | null;
  take_profit: number | null;
  closed: boolean;
  exit_price?: number;
  exit_date?: string;
  exit_reason?: string;
}

interface Trade {
  date: string;
  symbol: string;
  name: string;
  action: 'BUY' | 'SELL';
  shares: number;
  price: number;
  total_value: number;
  reason?: string;
  pnl?: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const params: BacktestParams = await req.json();
    console.log('Starting backtest:', params);

    // Fetch historical signals in date range
    const { data: signals, error: signalsError } = await supabase
      .from('trading_signals')
      .select('*')
      .gte('created_at', params.startDate)
      .lte('created_at', params.endDate)
      .gte('confidence_score', params.botConfig.min_confidence_score)
      .order('created_at', { ascending: true });

    if (signalsError) throw signalsError;

    console.log(`Found ${signals?.length || 0} signals in date range`);

    // Fetch historical price data
    const stockSymbols = params.symbols || [...new Set(signals?.map(s => s.stock_symbol) || [])];
    const { data: priceHistory, error: priceError } = await supabase
      .from('stock_price_history')
      .select('*')
      .in('stock_symbol', stockSymbols)
      .gte('recorded_at', params.startDate)
      .lte('recorded_at', params.endDate)
      .order('recorded_at', { ascending: true });

    if (priceError) throw priceError;

    console.log(`Loaded ${priceHistory?.length || 0} price records`);

    // Build price map: { symbol: { date: price } }
    const priceMap = new Map<string, Map<string, number>>();
    priceHistory?.forEach(record => {
      const date = new Date(record.recorded_at).toISOString().split('T')[0];
      if (!priceMap.has(record.stock_symbol)) {
        priceMap.set(record.stock_symbol, new Map());
      }
      priceMap.get(record.stock_symbol)!.set(date, Number(record.close_price));
    });

    // Run backtest simulation
    const result = await simulateTrading(
      signals || [],
      priceMap,
      params.botConfig,
      params.initialCapital,
      params.startDate,
      params.endDate
    );

    // Calculate benchmark (buy-and-hold SET index)
    const benchmarkReturn = await calculateBenchmark(supabase, params.startDate, params.endDate);

    return new Response(
      JSON.stringify({
        success: true,
        ...result,
        benchmark: benchmarkReturn,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in backtest-strategy:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function simulateTrading(
  signals: any[],
  priceMap: Map<string, Map<string, number>>,
  config: any,
  initialCapital: number,
  startDate: string,
  endDate: string
) {
  let cash = initialCapital;
  const positions: Position[] = [];
  const trades: Trade[] = [];
  const equityCurve: { date: string; value: number }[] = [];
  const dailyTrades = new Map<string, number>();

  // Group signals by date
  const signalsByDate = new Map<string, any[]>();
  signals.forEach(signal => {
    const date = new Date(signal.created_at).toISOString().split('T')[0];
    if (!signalsByDate.has(date)) {
      signalsByDate.set(date, []);
    }
    signalsByDate.get(date)!.push(signal);
  });

  // Simulate day by day
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const dateStr = date.toISOString().split('T')[0];
    
    // Check daily trade limit
    const todayTradeCount = dailyTrades.get(dateStr) || 0;
    
    // Process new signals
    const todaySignals = signalsByDate.get(dateStr) || [];
    for (const signal of todaySignals) {
      if (todayTradeCount >= config.max_daily_trades) break;
      if (!config.allowed_signal_types.includes(signal.signal_type)) continue;
      if (signal.signal_type !== 'BUY') continue;

      // Calculate position size
      const positionSize = Math.min(config.max_position_size, cash);
      if (positionSize < 1000) continue;

      const shares = Math.floor(positionSize / signal.current_price);
      if (shares === 0) continue;

      const totalCost = shares * signal.current_price;
      
      // Check total exposure
      const currentExposure = positions
        .filter(p => !p.closed)
        .reduce((sum, p) => sum + (p.shares * p.entry_price), 0);
      
      if (currentExposure + totalCost > config.max_total_exposure) continue;

      // Execute BUY
      cash -= totalCost;
      positions.push({
        symbol: signal.stock_symbol,
        name: signal.stock_name,
        shares,
        entry_price: signal.current_price,
        entry_date: dateStr,
        stop_loss: config.auto_stop_loss ? signal.stop_loss : null,
        take_profit: config.auto_take_profit ? signal.target_price : null,
        closed: false,
      });

      trades.push({
        date: dateStr,
        symbol: signal.stock_symbol,
        name: signal.stock_name,
        action: 'BUY',
        shares,
        price: signal.current_price,
        total_value: totalCost,
      });

      dailyTrades.set(dateStr, todayTradeCount + 1);
    }

    // Check existing positions for exit conditions
    for (const position of positions) {
      if (position.closed) continue;

      const currentPrice = priceMap.get(position.symbol)?.get(dateStr);
      if (!currentPrice) continue;

      let shouldExit = false;
      let exitReason = '';

      // Check stop loss
      if (position.stop_loss && currentPrice <= position.stop_loss) {
        shouldExit = true;
        exitReason = 'stop_loss';
      }

      // Check take profit
      if (!shouldExit && position.take_profit && currentPrice >= position.take_profit) {
        shouldExit = true;
        exitReason = 'take_profit';
      }

      if (shouldExit) {
        const exitValue = position.shares * currentPrice;
        const pnl = (currentPrice - position.entry_price) * position.shares;
        
        cash += exitValue;
        position.closed = true;
        position.exit_price = currentPrice;
        position.exit_date = dateStr;
        position.exit_reason = exitReason;

        trades.push({
          date: dateStr,
          symbol: position.symbol,
          name: position.name,
          action: 'SELL',
          shares: position.shares,
          price: currentPrice,
          total_value: exitValue,
          reason: exitReason,
          pnl,
        });
      }
    }

    // Calculate daily portfolio value
    const positionsValue = positions
      .filter(p => !p.closed)
      .reduce((sum, p) => {
        const price = priceMap.get(p.symbol)?.get(dateStr) || p.entry_price;
        return sum + (p.shares * price);
      }, 0);

    equityCurve.push({
      date: dateStr,
      value: cash + positionsValue,
    });
  }

  // Close remaining positions at end date
  for (const position of positions) {
    if (!position.closed) {
      const finalPrice = priceMap.get(position.symbol)?.get(endDate) || position.entry_price;
      const exitValue = position.shares * finalPrice;
      const pnl = (finalPrice - position.entry_price) * position.shares;
      
      cash += exitValue;
      position.closed = true;
      position.exit_price = finalPrice;
      position.exit_date = endDate;
      position.exit_reason = 'end_of_backtest';

      trades.push({
        date: endDate,
        symbol: position.symbol,
        name: position.name,
        action: 'SELL',
        shares: position.shares,
        price: finalPrice,
        total_value: exitValue,
        reason: 'end_of_backtest',
        pnl,
      });
    }
  }

  // Calculate metrics
  const finalValue = equityCurve[equityCurve.length - 1]?.value || initialCapital;
  const totalReturn = ((finalValue - initialCapital) / initialCapital) * 100;
  
  const completedTrades = trades.filter(t => t.action === 'SELL' && t.pnl !== undefined);
  const wins = completedTrades.filter(t => t.pnl! > 0);
  const losses = completedTrades.filter(t => t.pnl! <= 0);
  const winRate = completedTrades.length > 0 ? (wins.length / completedTrades.length) * 100 : 0;
  
  const totalProfit = wins.reduce((sum, t) => sum + t.pnl!, 0);
  const totalLoss = Math.abs(losses.reduce((sum, t) => sum + t.pnl!, 0));
  const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? 999 : 0;

  // Calculate max drawdown
  let maxDrawdown = 0;
  let peak = initialCapital;
  equityCurve.forEach(point => {
    if (point.value > peak) peak = point.value;
    const drawdown = ((peak - point.value) / peak) * 100;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  });

  // Calculate Sharpe ratio (simplified)
  const returns = equityCurve.map((point, i) => {
    if (i === 0) return 0;
    return ((point.value - equityCurve[i - 1].value) / equityCurve[i - 1].value) * 100;
  });
  const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const stdDev = Math.sqrt(
    returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
  );
  const sharpeRatio = stdDev > 0 ? avgReturn / stdDev : 0;

  const bestTrade = completedTrades.reduce((best, t) => 
    !best || (t.pnl! > best.pnl!) ? t : best
  , null as Trade | null);

  const worstTrade = completedTrades.reduce((worst, t) => 
    !worst || (t.pnl! < worst.pnl!) ? t : worst
  , null as Trade | null);

  return {
    initialCapital,
    finalValue,
    totalReturn: Number(totalReturn.toFixed(2)),
    totalTrades: trades.length,
    completedTrades: completedTrades.length,
    winRate: Number(winRate.toFixed(2)),
    wins: wins.length,
    losses: losses.length,
    profitFactor: Number(profitFactor.toFixed(2)),
    maxDrawdown: Number(maxDrawdown.toFixed(2)),
    sharpeRatio: Number(sharpeRatio.toFixed(2)),
    bestTrade: bestTrade ? {
      symbol: bestTrade.symbol,
      pnl: Number(bestTrade.pnl!.toFixed(2)),
      pnlPercent: Number(((bestTrade.pnl! / (bestTrade.shares * bestTrade.price - bestTrade.pnl!)) * 100).toFixed(2))
    } : null,
    worstTrade: worstTrade ? {
      symbol: worstTrade.symbol,
      pnl: Number(worstTrade.pnl!.toFixed(2)),
      pnlPercent: Number(((worstTrade.pnl! / (worstTrade.shares * worstTrade.price - worstTrade.pnl!)) * 100).toFixed(2))
    } : null,
    equityCurve,
    trades,
  };
}

async function calculateBenchmark(supabase: any, startDate: string, endDate: string) {
  // Use ADVANC as benchmark (large cap representative)
  const { data: benchmarkData } = await supabase
    .from('stock_price_history')
    .select('close_price, recorded_at')
    .eq('stock_symbol', 'ADVANC')
    .gte('recorded_at', startDate)
    .lte('recorded_at', endDate)
    .order('recorded_at', { ascending: true })
    .limit(2);

  if (!benchmarkData || benchmarkData.length < 2) {
    return { return: 0, label: 'No benchmark data' };
  }

  const startPrice = Number(benchmarkData[0].close_price);
  const endPrice = Number(benchmarkData[benchmarkData.length - 1].close_price);
  const benchmarkReturn = ((endPrice - startPrice) / startPrice) * 100;

  return {
    return: Number(benchmarkReturn.toFixed(2)),
    label: 'ADVANC Buy & Hold',
  };
}
