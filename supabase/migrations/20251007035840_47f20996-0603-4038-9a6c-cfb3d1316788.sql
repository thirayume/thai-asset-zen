-- Create gold_price_history table for historical tracking
CREATE TABLE IF NOT EXISTS public.gold_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gold_type TEXT NOT NULL,
  price_type TEXT NOT NULL,
  price_per_baht NUMERIC NOT NULL,
  price_per_gram NUMERIC NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gold_price_history ENABLE ROW LEVEL SECURITY;

-- Create policy for read access
CREATE POLICY "Anyone can read gold price history"
ON public.gold_price_history
FOR SELECT
USING (true);

-- Create policy for service role to insert
CREATE POLICY "Service role can insert gold price history"
ON public.gold_price_history
FOR INSERT
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_gold_price_history_recorded_at 
ON public.gold_price_history(recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_gold_price_history_gold_type 
ON public.gold_price_history(gold_type, price_type, recorded_at DESC);

-- Add realtime support
ALTER PUBLICATION supabase_realtime ADD TABLE public.gold_price_history;