-- Phase 2: Add OHLC columns to thai_stocks table

-- Add OHLC (Open, High, Low, Close) columns to thai_stocks table
ALTER TABLE public.thai_stocks 
  ADD COLUMN IF NOT EXISTS open_price numeric,
  ADD COLUMN IF NOT EXISTS high_price numeric,
  ADD COLUMN IF NOT EXISTS low_price numeric,
  ADD COLUMN IF NOT EXISTS close_price numeric;

-- Backfill OHLC prices with current_price for existing records
UPDATE public.thai_stocks 
SET close_price = current_price,
    open_price = current_price,
    high_price = current_price,
    low_price = current_price
WHERE close_price IS NULL;