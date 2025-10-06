-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'member');

-- Create profiles table (auto-populated on user signup)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text UNIQUE,
  preferred_language text DEFAULT 'th',
  default_budget numeric DEFAULT 500,
  max_position_size_percent numeric DEFAULT 20,
  allow_high_risk boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'member',
  UNIQUE(user_id, role)
);

-- Create user portfolios table
CREATE TABLE public.user_portfolios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text DEFAULT 'Main Portfolio',
  total_cash numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- Create user positions table (actual stock holdings)
CREATE TABLE public.user_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id uuid REFERENCES user_portfolios(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stock_symbol text NOT NULL,
  stock_name text NOT NULL,
  shares_owned numeric NOT NULL,
  average_entry_price numeric NOT NULL,
  purchase_date timestamp with time zone NOT NULL,
  notes text,
  target_price numeric,
  stop_loss numeric,
  status text DEFAULT 'active',
  sold_at timestamp with time zone,
  sold_price numeric,
  created_at timestamp with time zone DEFAULT now()
);

-- Create user watchlist table (stocks to track)
CREATE TABLE public.user_watchlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stock_symbol text NOT NULL,
  stock_name text NOT NULL,
  target_entry_price numeric,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, stock_symbol)
);

-- Add user_id to investment_suggestions for personalization
ALTER TABLE public.investment_suggestions 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to market_alerts for personalization
ALTER TABLE public.market_alerts 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Enable RLS on all user tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_watchlist ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_portfolios
CREATE POLICY "Users can view own portfolios"
  ON public.user_portfolios FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own portfolios"
  ON public.user_portfolios FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own portfolios"
  ON public.user_portfolios FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own portfolios"
  ON public.user_portfolios FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for user_positions
CREATE POLICY "Users can view own positions"
  ON public.user_positions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own positions"
  ON public.user_positions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own positions"
  ON public.user_positions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own positions"
  ON public.user_positions FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for user_watchlist
CREATE POLICY "Users can view own watchlist"
  ON public.user_watchlist FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own watchlist"
  ON public.user_watchlist FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own watchlist"
  ON public.user_watchlist FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own watchlist"
  ON public.user_watchlist FOR DELETE
  USING (auth.uid() = user_id);

-- Update RLS policies for investment_suggestions (personalized)
DROP POLICY IF EXISTS "Anyone can read suggestions" ON public.investment_suggestions;

CREATE POLICY "Users can view own suggestions"
  ON public.investment_suggestions FOR SELECT
  USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Service role can insert suggestions"
  ON public.investment_suggestions FOR INSERT
  WITH CHECK (true);

-- Update RLS policies for market_alerts (personalized)
DROP POLICY IF EXISTS "Anyone can read alerts" ON public.market_alerts;

CREATE POLICY "Users can view own alerts"
  ON public.market_alerts FOR SELECT
  USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Service role can insert alerts"
  ON public.market_alerts FOR INSERT
  WITH CHECK (true);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert into profiles
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email)
  );
  
  -- Assign default role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'member');
  
  -- Create default portfolio
  INSERT INTO public.user_portfolios (user_id, name, total_cash)
  VALUES (new.id, 'Main Portfolio', 0);
  
  RETURN new;
END;
$$;

-- Trigger to auto-create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger for profiles updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();