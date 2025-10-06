-- Create table for Thai stocks data
CREATE TABLE public.thai_stocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  current_price DECIMAL(10, 2),
  change_percent DECIMAL(5, 2),
  volume BIGINT,
  market_cap BIGINT,
  pe_ratio DECIMAL(10, 2),
  dividend_yield DECIMAL(5, 4),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create table for AI-generated investment suggestions
CREATE TABLE public.investment_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_symbol TEXT NOT NULL,
  stock_name TEXT NOT NULL,
  suggestion_type TEXT NOT NULL CHECK (suggestion_type IN ('buy', 'hold', 'sell')),
  profit_potential DECIMAL(5, 2),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
  recommended_entry DECIMAL(10, 2),
  recommended_exit DECIMAL(10, 2),
  stop_loss DECIMAL(10, 2),
  holding_period TEXT,
  reasoning TEXT,
  confidence_score DECIMAL(3, 2),
  target_audience TEXT DEFAULT 'newbie',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '24 hours')
);

-- Create table for market alerts
CREATE TABLE public.market_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL,
  stock_symbol TEXT,
  message TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('info', 'warning', 'critical')),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.thai_stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_alerts ENABLE ROW LEVEL SECURITY;

-- Public read access policies (no auth required for viewing market data)
CREATE POLICY "Anyone can read stock data"
ON public.thai_stocks
FOR SELECT
USING (true);

CREATE POLICY "Anyone can read suggestions"
ON public.investment_suggestions
FOR SELECT
USING (true);

CREATE POLICY "Anyone can read alerts"
ON public.market_alerts
FOR SELECT
USING (true);

-- Create indexes for performance
CREATE INDEX idx_stocks_symbol ON public.thai_stocks(symbol);
CREATE INDEX idx_stocks_updated ON public.thai_stocks(last_updated DESC);
CREATE INDEX idx_suggestions_created ON public.investment_suggestions(created_at DESC);
CREATE INDEX idx_suggestions_expires ON public.investment_suggestions(expires_at);
CREATE INDEX idx_alerts_created ON public.market_alerts(created_at DESC);

-- Function to clean up expired suggestions
CREATE OR REPLACE FUNCTION public.cleanup_expired_suggestions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.investment_suggestions
  WHERE expires_at < now();
END;
$$;