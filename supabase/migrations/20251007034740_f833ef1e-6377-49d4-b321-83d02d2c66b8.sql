-- Drop the restrictive SELECT policy that requires user_id match
DROP POLICY IF EXISTS "Users can view own suggestions" ON public.investment_suggestions;

-- Drop the INSERT policy that requires user_id
DROP POLICY IF EXISTS "Service role can insert suggestions" ON public.investment_suggestions;

-- Create new policy: Allow authenticated users to view all suggestions
CREATE POLICY "Authenticated users can view all suggestions" 
ON public.investment_suggestions
FOR SELECT
TO authenticated
USING (true);

-- Create new policy: Allow service role to insert suggestions (service role bypasses this anyway)
CREATE POLICY "Service role can insert suggestions" 
ON public.investment_suggestions
FOR INSERT
WITH CHECK (true);