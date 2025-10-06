-- Create table for trading signals
CREATE TABLE IF NOT EXISTS public.trading_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_symbol TEXT NOT NULL,
  stock_name TEXT NOT NULL,
  signal_type TEXT NOT NULL CHECK (signal_type IN ('BUY', 'SELL', 'HOLD')),
  confidence_score NUMERIC NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
  reasoning TEXT NOT NULL,
  indicators JSONB,
  current_price NUMERIC,
  target_price NUMERIC,
  stop_loss NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '24 hours')
);

-- Create index for faster queries
CREATE INDEX idx_signals_symbol_date ON public.trading_signals(stock_symbol, created_at DESC);
CREATE INDEX idx_signals_expires ON public.trading_signals(expires_at);

-- Enable RLS
ALTER TABLE public.trading_signals ENABLE ROW LEVEL SECURITY;

-- Anyone can read trading signals
CREATE POLICY "Anyone can read trading signals"
  ON public.trading_signals
  FOR SELECT
  USING (expires_at > now());

-- Only service role can insert signals
CREATE POLICY "Service role can insert trading signals"
  ON public.trading_signals
  FOR INSERT
  WITH CHECK (true);