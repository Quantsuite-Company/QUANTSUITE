-- Create chart_drawings table for persisting user drawings
CREATE TABLE public.chart_drawings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  symbol text NOT NULL,
  drawing_type text NOT NULL,
  points jsonb NOT NULL,
  color text NOT NULL DEFAULT '#3b82f6',
  label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.chart_drawings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own drawings"
ON public.chart_drawings
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own drawings"
ON public.chart_drawings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own drawings"
ON public.chart_drawings
FOR DELETE
USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX idx_chart_drawings_user_symbol ON public.chart_drawings(user_id, symbol);