-- Restrict trading signals access to admins only
-- This protects premium trading intelligence from being freely accessible

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Anyone can read trading signals" ON public.trading_signals;

-- Create new policy: Only admins can view trading signals
CREATE POLICY "Only admins can view trading signals"
ON public.trading_signals
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  AND expires_at > now()
);

-- Keep the service role insert policy intact
-- (Service role can insert trading signals policy already exists)