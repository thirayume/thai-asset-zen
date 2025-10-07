-- Check and create pg_net extension if needed
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;

-- Update stock prices every 15 minutes during market hours (9 AM - 4 PM, Mon-Fri)
SELECT cron.schedule(
  'update-stock-prices',
  '*/15 9-16 * * 1-5',
  $$
  SELECT net.http_post(
    url:='https://ohuzblalbmgykwaaecds.supabase.co/functions/v1/update-stock-prices',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9odXpibGFsYm1neWt3YWFlY2RzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2NjMzNjMsImV4cCI6MjA3NTIzOTM2M30.D6kolU3r9WOTDEbjhaRniiWHKjZV5pV_nFx2MgQ0JWw"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);

-- Update gold prices every 15 minutes (24/7)
SELECT cron.schedule(
  'update-gold-prices',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url:='https://ohuzblalbmgykwaaecds.supabase.co/functions/v1/update-gold-prices',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9odXpibGFsYm1neWt3YWFlY2RzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2NjMzNjMsImV4cCI6MjA3NTIzOTM2M30.D6kolU3r9WOTDEbjhaRniiWHKjZV5pV_nFx2MgQ0JWw"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);

-- Generate trading signals every 30 minutes
SELECT cron.schedule(
  'generate-trading-signals',
  '*/30 * * * *',
  $$
  SELECT net.http_post(
    url:='https://ohuzblalbmgykwaaecds.supabase.co/functions/v1/generate-trading-signals',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9odXpibGFsYm1neWt3YWFlY2RzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2NjMzNjMsImV4cCI6MjA3NTIzOTM2M30.D6kolU3r9WOTDEbjhaRniiWHKjZV5pV_nFx2MgQ0JWw"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);

-- Check trading alerts every 10 minutes
SELECT cron.schedule(
  'check-trading-alerts',
  '*/10 * * * *',
  $$
  SELECT net.http_post(
    url:='https://ohuzblalbmgykwaaecds.supabase.co/functions/v1/check-trading-alerts',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9odXpibGFsYm1neWt3YWFlY2RzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2NjMzNjMsImV4cCI6MjA3NTIzOTM2M30.D6kolU3r9WOTDEbjhaRniiWHKjZV5pV_nFx2MgQ0JWw"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);

-- Generate AI investment suggestions daily at 6 PM
SELECT cron.schedule(
  'generate-investment-suggestions',
  '0 18 * * *',
  $$
  SELECT net.http_post(
    url:='https://ohuzblalbmgykwaaecds.supabase.co/functions/v1/generate-investment-suggestions',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9odXpibGFsYm1neWt3YWFlY2RzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2NjMzNjMsImV4cCI6MjA3NTIzOTM2M30.D6kolU3r9WOTDEbjhaRniiWHKjZV5pV_nFx2MgQ0JWw"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);

-- Clean up expired suggestions daily at midnight
SELECT cron.schedule(
  'cleanup-expired-suggestions',
  '0 0 * * *',
  $$
  SELECT cleanup_expired_suggestions();
  $$
);