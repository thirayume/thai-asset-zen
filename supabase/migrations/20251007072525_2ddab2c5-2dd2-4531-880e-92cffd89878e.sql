-- Add sector and industry columns to thai_stocks
ALTER TABLE thai_stocks 
ADD COLUMN IF NOT EXISTS sector text,
ADD COLUMN IF NOT EXISTS industry text;

-- Update some sample data for sectors (you can update more later)
UPDATE thai_stocks SET sector = 'Energy', industry = 'Oil & Gas' WHERE symbol IN ('PTT', 'PTTEP', 'TOP', 'GULF');
UPDATE thai_stocks SET sector = 'Financials', industry = 'Banking' WHERE symbol IN ('KBANK', 'SCB', 'BBL');
UPDATE thai_stocks SET sector = 'Telecommunications', industry = 'Wireless' WHERE symbol IN ('ADVANC', 'TRUE', 'INTUCH');
UPDATE thai_stocks SET sector = 'Consumer', industry = 'Retail' WHERE symbol = 'CPALL';
UPDATE thai_stocks SET sector = 'Real Estate', industry = 'REITs' WHERE symbol IN ('CPNREIT', 'WHAREM');
UPDATE thai_stocks SET sector = 'Industrials', industry = 'Transportation' WHERE symbol IN ('AOT', 'BEM');

-- Create custom_price_alerts table for advanced alerting
CREATE TABLE IF NOT EXISTS public.custom_price_alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  stock_symbol text NOT NULL,
  stock_name text NOT NULL,
  alert_type text NOT NULL, -- 'price_above', 'price_below', 'percent_change', 'volume_spike'
  condition_value numeric NOT NULL, -- the threshold value
  is_active boolean DEFAULT true,
  is_triggered boolean DEFAULT false,
  triggered_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  notes text,
  notification_sent boolean DEFAULT false
);

-- Enable RLS
ALTER TABLE public.custom_price_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for custom_price_alerts
CREATE POLICY "Users can view own custom alerts"
  ON public.custom_price_alerts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own custom alerts"
  ON public.custom_price_alerts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own custom alerts"
  ON public.custom_price_alerts
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own custom alerts"
  ON public.custom_price_alerts
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can update custom alerts"
  ON public.custom_price_alerts
  FOR UPDATE
  USING (true);

-- Create index for faster queries
CREATE INDEX idx_custom_alerts_user ON custom_price_alerts(user_id);
CREATE INDEX idx_custom_alerts_stock ON custom_price_alerts(stock_symbol);
CREATE INDEX idx_custom_alerts_active ON custom_price_alerts(is_active, is_triggered);