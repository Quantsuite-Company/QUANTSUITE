-- Create screener_results table for caching stock screening results
CREATE TABLE IF NOT EXISTS public.screener_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  filters jsonb NOT NULL,
  results jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '5 minutes')
);

-- Enable RLS
ALTER TABLE public.screener_results ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own screener results
CREATE POLICY "Users can view their own screener results"
ON public.screener_results
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can create their own screener results
CREATE POLICY "Users can insert their own screener results"
ON public.screener_results
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own screener results
CREATE POLICY "Users can delete their own screener results"
ON public.screener_results
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_screener_results_user_id ON public.screener_results(user_id);
CREATE INDEX idx_screener_results_expires_at ON public.screener_results(expires_at);

-- Function to clean up expired results
CREATE OR REPLACE FUNCTION public.cleanup_expired_screener_results()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.screener_results
  WHERE expires_at < now();
END;
$$;