-- Create trade_alerts table
CREATE TABLE IF NOT EXISTS public.trade_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('target_reached', 'stop_loss_triggered', 'watchlist_entry')),
  stock_symbol TEXT NOT NULL,
  stock_name TEXT NOT NULL,
  message TEXT NOT NULL,
  position_id UUID,
  watchlist_id UUID,
  current_price NUMERIC,
  trigger_price NUMERIC,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trade_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own alerts"
  ON public.trade_alerts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own alerts"
  ON public.trade_alerts
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert alerts"
  ON public.trade_alerts
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can delete own alerts"
  ON public.trade_alerts
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_trade_alerts_user_id ON public.trade_alerts(user_id);
CREATE INDEX idx_trade_alerts_created_at ON public.trade_alerts(created_at DESC);