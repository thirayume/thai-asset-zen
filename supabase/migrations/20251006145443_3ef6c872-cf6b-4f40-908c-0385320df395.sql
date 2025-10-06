-- Assign admin role to super user
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'thirayu.m@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Create system_settings table for global configuration
CREATE TABLE IF NOT EXISTS public.system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value jsonb NOT NULL,
  description text,
  updated_at timestamp with time zone DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on system_settings
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage system settings
CREATE POLICY "Admins can manage system settings"
ON public.system_settings
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Anyone authenticated can read system settings
CREATE POLICY "Authenticated users can read system settings"
ON public.system_settings
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Create audit_logs table for tracking admin actions
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  action text NOT NULL,
  table_name text,
  record_id uuid,
  changes jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON public.audit_logs
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Service role can insert audit logs
CREATE POLICY "Service role can insert audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (true);

-- Insert default system settings
INSERT INTO public.system_settings (setting_key, setting_value, description)
VALUES 
  ('default_risk_tolerance', '"medium"', 'Default risk tolerance for new users'),
  ('max_position_size_percent', '20', 'Maximum position size as percentage of portfolio'),
  ('default_budget', '500', 'Default budget for new users (THB)'),
  ('alert_price_change_threshold', '5', 'Price change percentage to trigger alerts'),
  ('stock_refresh_interval', '15', 'Stock price refresh interval in minutes')
ON CONFLICT (setting_key) DO NOTHING;

-- Create trigger for updating updated_at on system_settings
CREATE TRIGGER update_system_settings_updated_at
BEFORE UPDATE ON public.system_settings
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();