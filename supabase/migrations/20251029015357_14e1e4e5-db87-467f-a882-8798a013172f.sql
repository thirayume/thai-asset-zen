-- Remove broker credentials from trading_bot_config table
-- These will be moved to secure server-side secrets management

ALTER TABLE public.trading_bot_config DROP COLUMN IF EXISTS broker_api_key;
ALTER TABLE public.trading_bot_config DROP COLUMN IF EXISTS broker_account_id;