-- ============================================================
-- Security Fix: Add Explicit RLS Policies for Trading Signals
-- ============================================================

-- Add explicit UPDATE policy for trading_signals
CREATE POLICY "Only admins can update trading signals" 
ON public.trading_signals
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Add explicit DELETE policy for trading_signals
CREATE POLICY "Only admins can delete trading signals" 
ON public.trading_signals  
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));