-- Phase 1: Fix RLS Policy and Assign Admin Role

-- Drop the broken policy (missing WITH CHECK clause)
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Create correct policy with both USING and WITH CHECK
CREATE POLICY "Admins can manage all roles"
  ON public.user_roles
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Assign admin role to super user
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'thirayu.m@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;