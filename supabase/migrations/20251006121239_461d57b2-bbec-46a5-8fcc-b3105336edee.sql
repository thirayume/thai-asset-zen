-- Fix search_path for cleanup function
DROP FUNCTION IF EXISTS public.cleanup_expired_suggestions();

CREATE OR REPLACE FUNCTION public.cleanup_expired_suggestions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.investment_suggestions
  WHERE expires_at < now();
END;
$$;