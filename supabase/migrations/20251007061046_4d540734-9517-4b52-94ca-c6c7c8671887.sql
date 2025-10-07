-- Make user_id nullable in investment_suggestions table
ALTER TABLE public.investment_suggestions 
ALTER COLUMN user_id DROP NOT NULL;