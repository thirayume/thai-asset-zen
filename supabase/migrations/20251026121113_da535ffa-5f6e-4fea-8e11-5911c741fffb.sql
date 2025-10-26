-- Create enum types
CREATE TYPE trading_mode AS ENUM ('paper', 'live');
CREATE TYPE trade_action AS ENUM ('BUY', 'SELL');
CREATE TYPE execution_status AS ENUM ('pending', 'executed', 'failed', 'cancelled');

-- Create trading bot configuration table
CREATE TABLE public.trading_bot_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  enabled boolean DEFAULT false,
  mode trading_mode DEFAULT 'paper',
  
  -- Risk Management
  max_position_size numeric DEFAULT 10000,
  max_daily_trades integer DEFAULT 3,
  max_total_exposure numeric DEFAULT 50000,
  min_confidence_score numeric DEFAULT 75 CHECK (min_confidence_score >= 0 AND min_confidence_score <= 100),
  
  -- Trading Rules
  allowed_signal_types text[] DEFAULT ARRAY['BUY'],
  auto_stop_loss boolean DEFAULT true,
  auto_take_profit boolean DEFAULT true,
  trailing_stop_percent numeric DEFAULT 5 CHECK (trailing_stop_percent >= 0 AND trailing_stop_percent <= 100),
  
  -- Safety Limits
  daily_loss_limit numeric DEFAULT 5000,
  max_portfolio_drawdown numeric DEFAULT 20 CHECK (max_portfolio_drawdown >= 0 AND max_portfolio_drawdown <= 100),
  
  -- Broker Integration
  broker_name text,
  broker_api_key text,
  broker_account_id text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create auto trade executions table
CREATE TABLE public.auto_trade_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  signal_id uuid REFERENCES public.trading_signals(id),
  
  -- Trade Details
  stock_symbol text NOT NULL,
  stock_name text NOT NULL,
  action trade_action NOT NULL,
  shares integer NOT NULL CHECK (shares > 0),
  price numeric NOT NULL CHECK (price > 0),
  total_value numeric NOT NULL CHECK (total_value > 0),
  
  -- Execution
  status execution_status DEFAULT 'pending',
  broker_order_id text,
  executed_at timestamptz,
  execution_price numeric,
  
  -- Risk Parameters
  stop_loss numeric,
  take_profit numeric,
  confidence_score numeric,
  
  -- Failure Tracking
  failure_reason text,
  retry_count integer DEFAULT 0,
  
  created_at timestamptz DEFAULT now()
);

-- Create monitored positions table
CREATE TABLE public.monitored_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  position_id uuid REFERENCES public.user_positions(id) ON DELETE CASCADE,
  
  -- Monitoring Settings
  entry_price numeric NOT NULL CHECK (entry_price > 0),
  current_price numeric CHECK (current_price > 0),
  stop_loss_price numeric CHECK (stop_loss_price > 0),
  take_profit_price numeric CHECK (take_profit_price > 0),
  trailing_stop_enabled boolean DEFAULT false,
  highest_price_seen numeric,
  
  -- Status
  active boolean DEFAULT true,
  exit_reason text,
  exited_at timestamptz,
  
  last_checked_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trading_bot_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_trade_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitored_positions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for trading_bot_config
CREATE POLICY "Users can view own bot config"
  ON public.trading_bot_config
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bot config"
  ON public.trading_bot_config
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bot config"
  ON public.trading_bot_config
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bot config"
  ON public.trading_bot_config
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for auto_trade_executions
CREATE POLICY "Users can view own trade executions"
  ON public.auto_trade_executions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert trade executions"
  ON public.auto_trade_executions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update trade executions"
  ON public.auto_trade_executions
  FOR UPDATE
  USING (true);

-- RLS Policies for monitored_positions
CREATE POLICY "Users can view own monitored positions"
  ON public.monitored_positions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage monitored positions"
  ON public.monitored_positions
  FOR ALL
  USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_trading_bot_config_updated_at
  BEFORE UPDATE ON public.trading_bot_config
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for performance
CREATE INDEX idx_trading_bot_config_user_id ON public.trading_bot_config(user_id);
CREATE INDEX idx_auto_trade_executions_user_id ON public.auto_trade_executions(user_id);
CREATE INDEX idx_auto_trade_executions_status ON public.auto_trade_executions(status);
CREATE INDEX idx_auto_trade_executions_created_at ON public.auto_trade_executions(created_at DESC);
CREATE INDEX idx_monitored_positions_user_id ON public.monitored_positions(user_id);
CREATE INDEX idx_monitored_positions_active ON public.monitored_positions(active) WHERE active = true;