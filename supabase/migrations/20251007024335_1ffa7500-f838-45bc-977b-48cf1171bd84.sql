-- Phase 1 Security Fixes

-- 1. Delete duplicate cron job
SELECT cron.unschedule('update-stock-prices-every-15min');

-- 2. Update RLS policies to prevent NULL user_id for investment_suggestions
DROP POLICY IF EXISTS "Users can view own suggestions" ON public.investment_suggestions;
DROP POLICY IF EXISTS "Service role can insert suggestions" ON public.investment_suggestions;

CREATE POLICY "Users can view own suggestions"
ON public.investment_suggestions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert suggestions"
ON public.investment_suggestions
FOR INSERT
WITH CHECK (user_id IS NOT NULL);

-- 3. Update RLS policies to prevent NULL user_id for market_alerts
DROP POLICY IF EXISTS "Users can view own alerts" ON public.market_alerts;
DROP POLICY IF EXISTS "Service role can insert alerts" ON public.market_alerts;

CREATE POLICY "Users can view own alerts"
ON public.market_alerts
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert alerts"
ON public.market_alerts
FOR INSERT
WITH CHECK (user_id IS NOT NULL);

-- 4. Delete existing public data (NULL user_id)
DELETE FROM public.investment_suggestions WHERE user_id IS NULL;
DELETE FROM public.market_alerts WHERE user_id IS NULL;