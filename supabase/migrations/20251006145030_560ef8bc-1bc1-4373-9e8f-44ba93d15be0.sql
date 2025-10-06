-- Fix security warning: Add search_path to list_cron_jobs function
DROP FUNCTION IF EXISTS public.list_cron_jobs();

CREATE OR REPLACE FUNCTION public.list_cron_jobs()
RETURNS TABLE (
  jobid bigint,
  schedule text,
  command text,
  nodename text,
  nodeport integer,
  database text,
  username text,
  active boolean,
  jobname text
) 
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM cron.job ORDER BY jobid;
$$;