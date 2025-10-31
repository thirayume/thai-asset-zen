-- Phase 1: Create MT5 Authentication Tokens Table
CREATE TABLE public.mt5_auth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  token TEXT UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_mt5_auth_tokens_user ON mt5_auth_tokens(user_id);
CREATE INDEX idx_mt5_auth_tokens_token ON mt5_auth_tokens(token) WHERE is_active = true;

-- RLS for mt5_auth_tokens
ALTER TABLE public.mt5_auth_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tokens"
ON mt5_auth_tokens FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tokens"
ON mt5_auth_tokens FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tokens"
ON mt5_auth_tokens FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tokens"
ON mt5_auth_tokens FOR DELETE
USING (auth.uid() = user_id);

-- Phase 2: Fix trade_executions to require user_id
-- First, set a default for any existing NULL values (use first admin user or create system user)
DO $$
DECLARE
  system_user_id UUID;
BEGIN
  -- Try to get first user, if no users exist, skip update
  SELECT id INTO system_user_id FROM auth.users LIMIT 1;
  
  IF system_user_id IS NOT NULL THEN
    UPDATE public.trade_executions
    SET user_id = system_user_id
    WHERE user_id IS NULL;
  END IF;
END $$;

-- Now make it NOT NULL
ALTER TABLE public.trade_executions
ALTER COLUMN user_id SET NOT NULL;

-- Update RLS policy to remove NULL check
DROP POLICY IF EXISTS "Users can read own trade executions" ON trade_executions;

CREATE POLICY "Users can read own trade executions"
ON trade_executions FOR SELECT
USING (auth.uid() = user_id);

-- Phase 3: Create audit log table
CREATE TABLE public.security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  event_type TEXT NOT NULL,
  event_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_log_user ON security_audit_log(user_id);
CREATE INDEX idx_audit_log_type ON security_audit_log(event_type);
CREATE INDEX idx_audit_log_created ON security_audit_log(created_at DESC);

ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only service role can write to audit log
CREATE POLICY "Service role can insert audit logs"
ON security_audit_log FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- Users can read their own audit logs
CREATE POLICY "Users can read own audit logs"
ON security_audit_log FOR SELECT
USING (auth.uid() = user_id);

-- Phase 4: Add function to generate secure tokens
CREATE OR REPLACE FUNCTION public.generate_mt5_token()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  token TEXT;
BEGIN
  -- Generate a secure random token (32 bytes = 64 hex characters)
  token := encode(gen_random_bytes(32), 'hex');
  RETURN 'mt5_' || token;
END;
$$;

-- Phase 5: Add function to validate MT5 token
CREATE OR REPLACE FUNCTION public.validate_mt5_token(token_value TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  token_user_id UUID;
BEGIN
  -- Find active token and return user_id
  SELECT user_id INTO token_user_id
  FROM mt5_auth_tokens
  WHERE token = token_value
    AND is_active = true;
  
  -- Update last_used_at
  IF token_user_id IS NOT NULL THEN
    UPDATE mt5_auth_tokens
    SET last_used_at = NOW()
    WHERE token = token_value;
  END IF;
  
  RETURN token_user_id;
END;
$$;