-- Create table for gold prices
CREATE TABLE IF NOT EXISTS public.gold_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  price_type TEXT NOT NULL, -- 'buy' or 'sell'
  gold_type TEXT NOT NULL, -- '96.5%' or '99.99%' (bar gold)
  price_per_baht NUMERIC NOT NULL,
  price_per_gram NUMERIC NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_gold_prices_recorded_at ON public.gold_prices(recorded_at DESC);

-- Enable RLS
ALTER TABLE public.gold_prices ENABLE ROW LEVEL SECURITY;

-- Public read access for gold prices
CREATE POLICY "Anyone can read gold prices"
  ON public.gold_prices
  FOR SELECT
  USING (true);

-- Service role can insert gold prices
CREATE POLICY "Service role can insert gold prices"
  ON public.gold_prices
  FOR INSERT
  WITH CHECK (true);

-- Create table for user gold positions
CREATE TABLE IF NOT EXISTS public.user_gold_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  portfolio_id UUID REFERENCES public.user_portfolios(id) ON DELETE CASCADE,
  gold_type TEXT NOT NULL, -- '96.5%' or '99.99%'
  weight_in_baht NUMERIC NOT NULL, -- Thai gold unit (1 baht = 15.244 grams)
  weight_in_grams NUMERIC NOT NULL,
  purchase_price_per_baht NUMERIC NOT NULL,
  total_cost NUMERIC NOT NULL,
  purchase_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  status TEXT DEFAULT 'active', -- 'active' or 'sold'
  sold_at TIMESTAMP WITH TIME ZONE,
  sold_price_per_baht NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_user_gold_positions_user_id ON public.user_gold_positions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_gold_positions_status ON public.user_gold_positions(status);

-- Enable RLS
ALTER TABLE public.user_gold_positions ENABLE ROW LEVEL SECURITY;

-- Users can view own gold positions
CREATE POLICY "Users can view own gold positions"
  ON public.user_gold_positions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert own gold positions
CREATE POLICY "Users can insert own gold positions"
  ON public.user_gold_positions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update own gold positions
CREATE POLICY "Users can update own gold positions"
  ON public.user_gold_positions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete own gold positions
CREATE POLICY "Users can delete own gold positions"
  ON public.user_gold_positions
  FOR DELETE
  USING (auth.uid() = user_id);