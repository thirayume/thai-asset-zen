-- Clean up duplicate records in gold_prices (keep only latest for each combination)
DELETE FROM gold_prices a USING (
  SELECT gold_type, price_type, MAX(recorded_at) as max_date
  FROM gold_prices
  GROUP BY gold_type, price_type
) b
WHERE a.gold_type = b.gold_type 
  AND a.price_type = b.price_type 
  AND a.recorded_at < b.max_date;

-- Add unique constraint for upsert logic
ALTER TABLE gold_prices 
ADD CONSTRAINT gold_prices_type_unique 
UNIQUE (gold_type, price_type);