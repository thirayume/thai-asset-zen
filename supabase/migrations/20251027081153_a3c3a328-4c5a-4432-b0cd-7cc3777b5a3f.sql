-- Setup cron jobs for trading bot automation
-- Execute auto trades every 5 minutes during market hours (9 AM - 4 PM, Mon-Fri)
SELECT cron.schedule(
  'execute-auto-trades',
  '*/5 9-16 * * 1-5',
  $$
  SELECT
    net.http_post(
        url:='https://ohuzblalbmgykwaaecds.supabase.co/functions/v1/execute-auto-trades',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9odXpibGFsYm1neWt3YWFlY2RzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2NjMzNjMsImV4cCI6MjA3NTIzOTM2M30.D6kolU3r9WOTDEbjhaRniiWHKjZV5pV_nFx2MgQ0JWw"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);

-- Monitor positions every minute during market hours
SELECT cron.schedule(
  'monitor-positions',
  '* 9-16 * * 1-5',
  $$
  SELECT
    net.http_post(
        url:='https://ohuzblalbmgykwaaecds.supabase.co/functions/v1/monitor-positions',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9odXpibGFsYm1neWt3YWFlY2RzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2NjMzNjMsImV4cCI6MjA3NTIzOTM2M30.D6kolU3r9WOTDEbjhaRniiWHKjZV5pV_nFx2MgQ0JWw"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);