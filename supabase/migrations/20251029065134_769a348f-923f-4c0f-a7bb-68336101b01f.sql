-- Create broker_credentials table to store user-specific API credentials
CREATE TABLE IF NOT EXISTS public.broker_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  account_no TEXT NOT NULL,
  app_code TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.broker_credentials ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own credentials
CREATE POLICY "Users can view own credentials"
  ON public.broker_credentials
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own credentials
CREATE POLICY "Users can insert own credentials"
  ON public.broker_credentials
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own credentials
CREATE POLICY "Users can update own credentials"
  ON public.broker_credentials
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Add index for performance
CREATE INDEX idx_broker_credentials_user_id ON public.broker_credentials(user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_broker_credentials_updated_at
  BEFORE UPDATE ON public.broker_credentials
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();