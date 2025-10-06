-- Fix search_path for handle_updated_at function by dropping trigger first
DROP TRIGGER IF EXISTS set_updated_at ON public.profiles;
DROP FUNCTION IF EXISTS public.handle_updated_at();

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate trigger for profiles updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();