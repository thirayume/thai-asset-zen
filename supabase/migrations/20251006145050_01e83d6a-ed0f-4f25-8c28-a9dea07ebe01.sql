-- Schedule: Update stock prices every 15 minutes
SELECT cron.schedule(
  'update-stock-prices-every-15min',
  '*/15 * * * *',
  $$
  SELECT
    net.http_post(
        url:='https://ohuzblalbmgykwaaecds.supabase.co/functions/v1/update-stock-prices',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9odXpibGFsYm1neWt3YWFlY2RzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2NjMzNjMsImV4cCI6MjA3NTIzOTM2M30.D6kolU3r9WOTDEbjhaRniiWHKjZV5pV_nFx2MgQ0JWw"}'::jsonb
    ) as request_id;
  $$
);

-- Schedule: Check trading alerts every 5 minutes  
SELECT cron.schedule(
  'check-trading-alerts-every-5min',
  '*/5 * * * *',
  $$
  SELECT
    net.http_post(
        url:='https://ohuzblalbmgykwaaecds.supabase.co/functions/v1/check-trading-alerts',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9odXpibGFsYm1neWt3YWFlY2RzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2NjMzNjMsImV4cCI6MjA3NTIzOTM2M30.D6kolU3r9WOTDEbjhaRniiWHKjZV5pV_nFx2MgQ0JWw"}'::jsonb
    ) as request_id;
  $$
);

-- Schedule: Generate AI investment suggestions daily at 9 AM Bangkok time (2 AM UTC)
SELECT cron.schedule(
  'generate-investment-suggestions-daily',
  '0 2 * * *',
  $$
  SELECT
    net.http_post(
        url:='https://ohuzblalbmgykwaaecds.supabase.co/functions/v1/generate-investment-suggestions',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9odXpibGFsYm1neWt3YWFlY2RzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2NjMzNjMsImV4cCI6MjA3NTIzOTM2M30.D6kolU3r9WOTDEbjhaRniiWHKjZV5pV_nFx2MgQ0JWw"}'::jsonb,
        body:='{"targetAudience": "newbie"}'::jsonb
    ) as request_id;
  $$
);