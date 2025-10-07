-- Schedule update-stock-prices to run every 15 minutes during market hours (9 AM - 5 PM Bangkok time, weekdays)
SELECT cron.schedule(
  'update-stock-prices-market-hours',
  '*/15 9-17 * * 1-5',
  $$
  SELECT net.http_post(
    url := 'https://ohuzblalbmgykwaaecds.supabase.co/functions/v1/update-stock-prices',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9odXpibGFsYm1neWt3YWFlY2RzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2NjMzNjMsImV4cCI6MjA3NTIzOTM2M30.D6kolU3r9WOTDEbjhaRniiWHKjZV5pV_nFx2MgQ0JWw"}'::jsonb
  ) AS request_id;
  $$
);

-- Schedule update-gold-prices to run every hour
SELECT cron.schedule(
  'update-gold-prices-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://ohuzblalbmgykwaaecds.supabase.co/functions/v1/update-gold-prices',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9odXpibGFsYm1neWt3YWFlY2RzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2NjMzNjMsImV4cCI6MjA3NTIzOTM2M30.D6kolU3r9WOTDEbjhaRniiWHKjZV5pV_nFx2MgQ0JWw"}'::jsonb
  ) AS request_id;
  $$
);