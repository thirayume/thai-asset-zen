-- Phase 1: Lock down user_roles table to prevent privilege escalation
-- Drop existing permissive policies
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Create explicit restrictive policies
-- Policy 1: Users can only view their own role (read-only)
CREATE POLICY "Users can view own role (read-only)"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy 2: Only admins can insert new roles
CREATE POLICY "Only admins can assign roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Policy 3: Only admins can update roles
CREATE POLICY "Only admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Policy 4: Only admins can delete roles
CREATE POLICY "Only admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Phase 2: Restrict system_settings access to admins only
-- Drop the permissive authenticated user policy
DROP POLICY IF EXISTS "Authenticated users can read system settings" ON public.system_settings;

-- Create admin-only read policy
CREATE POLICY "Only admins can read system settings"
ON public.system_settings
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Phase 3: Add role change monitoring trigger
CREATE OR REPLACE FUNCTION public.log_role_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log role changes to audit_logs
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, changes)
    VALUES (
      auth.uid(),
      'ROLE_ASSIGNED',
      'user_roles',
      NEW.id,
      jsonb_build_object(
        'user_id', NEW.user_id,
        'role', NEW.role,
        'assigned_by', auth.uid()
      )
    );
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, changes)
    VALUES (
      auth.uid(),
      'ROLE_MODIFIED',
      'user_roles',
      NEW.id,
      jsonb_build_object(
        'user_id', NEW.user_id,
        'old_role', OLD.role,
        'new_role', NEW.role,
        'modified_by', auth.uid()
      )
    );
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, changes)
    VALUES (
      auth.uid(),
      'ROLE_REVOKED',
      'user_roles',
      OLD.id,
      jsonb_build_object(
        'user_id', OLD.user_id,
        'role', OLD.role,
        'revoked_by', auth.uid()
      )
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for role change monitoring
DROP TRIGGER IF EXISTS monitor_role_changes ON public.user_roles;
CREATE TRIGGER monitor_role_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_role_changes();