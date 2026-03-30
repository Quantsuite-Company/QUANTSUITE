-- Add policies to deny anonymous/unauthenticated access to all user data tables

-- 1. profiles table
CREATE POLICY "Deny anonymous access to profiles"
ON public.profiles
FOR ALL
USING (auth.uid() IS NOT NULL);

-- 2. user_roles table
CREATE POLICY "Deny anonymous access to user_roles"
ON public.user_roles
FOR ALL
USING (auth.uid() IS NOT NULL);

-- 3. conversation_logs table
CREATE POLICY "Deny anonymous access to conversation_logs"
ON public.conversation_logs
FOR ALL
USING (auth.uid() IS NOT NULL);

-- 4. strategies table
CREATE POLICY "Deny anonymous access to strategies"
ON public.strategies
FOR ALL
USING (auth.uid() IS NOT NULL);

-- 5. portfolios table
CREATE POLICY "Deny anonymous access to portfolios"
ON public.portfolios
FOR ALL
USING (auth.uid() IS NOT NULL);

-- 6. backtests table
CREATE POLICY "Deny anonymous access to backtests"
ON public.backtests
FOR ALL
USING (auth.uid() IS NOT NULL);

-- 7. user_contexts table
CREATE POLICY "Deny anonymous access to user_contexts"
ON public.user_contexts
FOR ALL
USING (auth.uid() IS NOT NULL);

-- 8. chart_drawings table
CREATE POLICY "Deny anonymous access to chart_drawings"
ON public.chart_drawings
FOR ALL
USING (auth.uid() IS NOT NULL);

-- 9. screener_results table
CREATE POLICY "Deny anonymous access to screener_results"
ON public.screener_results
FOR ALL
USING (auth.uid() IS NOT NULL);

-- 10. alpha_signals table
CREATE POLICY "Deny anonymous access to alpha_signals"
ON public.alpha_signals
FOR ALL
USING (auth.uid() IS NOT NULL);

-- 11. user_alpha_signals table
CREATE POLICY "Deny anonymous access to user_alpha_signals"
ON public.user_alpha_signals
FOR ALL
USING (auth.uid() IS NOT NULL);

-- 12. alpha_metrics table
CREATE POLICY "Deny anonymous access to alpha_metrics"
ON public.alpha_metrics
FOR ALL
USING (auth.uid() IS NOT NULL);

-- 13. portfolio_snapshots table
CREATE POLICY "Deny anonymous access to portfolio_snapshots"
ON public.portfolio_snapshots
FOR ALL
USING (auth.uid() IS NOT NULL);

-- 14. walk_forward_results table
CREATE POLICY "Deny anonymous access to walk_forward_results"
ON public.walk_forward_results
FOR ALL
USING (auth.uid() IS NOT NULL);

-- 15. shared_reports table
CREATE POLICY "Deny anonymous access to shared_reports"
ON public.shared_reports
FOR ALL
USING (auth.uid() IS NOT NULL);

-- 16. market_data_cache table (public data, but good to restrict write access)
CREATE POLICY "Deny anonymous access to market_data_cache"
ON public.market_data_cache
FOR ALL
USING (auth.uid() IS NOT NULL);