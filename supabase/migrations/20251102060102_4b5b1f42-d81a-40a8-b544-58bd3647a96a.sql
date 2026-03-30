-- Fix search_path for cleanup function
CREATE OR REPLACE FUNCTION public.cleanup_expired_screener_results()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  DELETE FROM public.screener_results
  WHERE expires_at < now();
END;
$$;