-- Restrict investment suggestions access to protect proprietary trading strategies
-- Users can only see their own suggestions OR global suggestions (user_id IS NULL)
-- Admins can see all suggestions

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view all suggestions" ON public.investment_suggestions;

-- Create new policy: Users can view their own suggestions or global ones
CREATE POLICY "Users can view own or global suggestions"
ON public.investment_suggestions
FOR SELECT
TO authenticated
USING (
  -- Users can see global suggestions (no specific user assigned)
  user_id IS NULL
  OR 
  -- Users can see their own suggestions
  user_id = auth.uid()
  OR
  -- Admins can see all suggestions
  has_role(auth.uid(), 'admin'::app_role)
);

-- Keep the service role insert policy intact
-- (Service role can insert suggestions policy already exists)