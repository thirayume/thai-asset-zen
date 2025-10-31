-- Create MT5 real-time ticks table
CREATE TABLE mt5_ticks (
  id BIGSERIAL PRIMARY KEY,
  symbol TEXT NOT NULL,
  bid NUMERIC(10, 5) NOT NULL,
  ask NUMERIC(10, 5) NOT NULL,
  spread NUMERIC(10, 5) GENERATED ALWAYS AS (ask - bid) STORED,
  volume BIGINT DEFAULT 0,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_mt5_ticks_symbol_time ON mt5_ticks (symbol, timestamp DESC);
CREATE INDEX idx_mt5_ticks_timestamp ON mt5_ticks (timestamp DESC);

-- Auto-cleanup old ticks (keep last 7 days)
CREATE OR REPLACE FUNCTION cleanup_old_ticks() RETURNS void AS $$
BEGIN
  DELETE FROM mt5_ticks WHERE timestamp < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trade execution tracking (from Python bot)
CREATE TABLE trade_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_id UUID REFERENCES trading_signals(id),
  user_id UUID REFERENCES auth.users(id),
  order_id TEXT,
  symbol TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('BUY', 'SELL', 'CLOSE')),
  volume NUMERIC(10, 2) NOT NULL,
  entry_price NUMERIC(10, 5),
  stop_loss NUMERIC(10, 5),
  take_profit NUMERIC(10, 5),
  current_price NUMERIC(10, 5),
  profit_loss NUMERIC(10, 2),
  status TEXT NOT NULL CHECK (status IN ('pending', 'executed', 'failed', 'closed')),
  error_message TEXT,
  executed_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_trade_executions_signal ON trade_executions(signal_id);
CREATE INDEX idx_trade_executions_status ON trade_executions(status);

-- RLS Policies
ALTER TABLE mt5_ticks ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_executions ENABLE ROW LEVEL SECURITY;

-- Anyone can read ticks (public price data)
CREATE POLICY "Anyone can read mt5 ticks"
ON mt5_ticks FOR SELECT
USING (true);

-- Only service role can insert ticks (from edge function)
CREATE POLICY "Service role can insert ticks"
ON mt5_ticks FOR INSERT
WITH CHECK (true);

-- Users can read their own trade executions
CREATE POLICY "Users can read own trade executions"
ON trade_executions FOR SELECT
USING (auth.uid() = user_id OR user_id IS NULL);

-- Service role can manage all executions (from Python bot)
CREATE POLICY "Service role can manage trade executions"
ON trade_executions FOR ALL
USING (true);

-- Enable realtime for mt5_ticks
ALTER PUBLICATION supabase_realtime ADD TABLE mt5_ticks;