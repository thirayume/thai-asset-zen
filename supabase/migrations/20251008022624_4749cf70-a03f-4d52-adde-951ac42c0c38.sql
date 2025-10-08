
-- Drop the combined policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Create separate explicit policies for better security clarity
-- Policy 1: Users can view their own profile only
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Policy 2: Admins can view all profiles (separate policy for admin access)
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));
