-- Phase 1: Critical Security Fixes - Data Exposure Cleanup

-- 1. Delete investment suggestions with NULL user_id (public data exposure)
DELETE FROM public.investment_suggestions WHERE user_id IS NULL;

-- 2. Make user_id NOT NULL to prevent future exposure
ALTER TABLE public.investment_suggestions 
ALTER COLUMN user_id SET NOT NULL;

-- 3. Add comment for documentation
COMMENT ON COLUMN public.investment_suggestions.user_id IS 'Required: User who should see this suggestion. Cannot be NULL for security.';