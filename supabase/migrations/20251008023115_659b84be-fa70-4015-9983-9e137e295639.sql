-- Secure thai_stocks table from data manipulation
-- Only service role (automated systems/edge functions) can modify stock data

-- Policy 1: Only service role can insert stock data
CREATE POLICY "Only service role can insert stock data"
ON public.thai_stocks
FOR INSERT
TO service_role
WITH CHECK (true);

-- Policy 2: Only service role can update stock data
CREATE POLICY "Only service role can update stock data"
ON public.thai_stocks
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- Policy 3: Only service role can delete stock data (for cleanup/maintenance)
CREATE POLICY "Only service role can delete stock data"
ON public.thai_stocks
FOR DELETE
TO service_role
USING (true);

-- Apply same security to stock_price_history table
CREATE POLICY "Only service role can insert stock history"
ON public.stock_price_history
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Only service role can update stock history"
ON public.stock_price_history
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Only service role can delete stock history"
ON public.stock_price_history
FOR DELETE
TO service_role
USING (true);

-- Secure gold price tables as well
CREATE POLICY "Only service role can insert gold prices"
ON public.gold_prices
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Only service role can update gold prices"
ON public.gold_prices
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Only service role can delete gold prices"
ON public.gold_prices
FOR DELETE
TO service_role
USING (true);

CREATE POLICY "Only service role can insert gold history"
ON public.gold_price_history
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Only service role can update gold history"
ON public.gold_price_history
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Only service role can delete gold history"
ON public.gold_price_history
FOR DELETE
TO service_role
USING (true);