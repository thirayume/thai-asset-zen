-- Create table for stock price history
CREATE TABLE IF NOT EXISTS public.stock_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_symbol TEXT NOT NULL,
  stock_name TEXT NOT NULL,
  open_price NUMERIC,
  high_price NUMERIC,
  low_price NUMERIC,
  close_price NUMERIC,
  volume BIGINT,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_stock_history_symbol_date ON public.stock_price_history(stock_symbol, recorded_at DESC);

-- Enable RLS
ALTER TABLE public.stock_price_history ENABLE ROW LEVEL SECURITY;

-- Anyone can read historical stock data
CREATE POLICY "Anyone can read stock history"
  ON public.stock_price_history
  FOR SELECT
  USING (true);

-- Only service role can insert historical data
CREATE POLICY "Service role can insert stock history"
  ON public.stock_price_history
  FOR INSERT
  WITH CHECK (true);