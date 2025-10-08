
-- Add admin policy to allow admins to view all profiles for user management
-- This fixes the security issue by maintaining user privacy while enabling admin functions
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR auth.uid() = id
);

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
