-- Create user contexts table for conversational memory
CREATE TABLE IF NOT EXISTS public.user_contexts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  preferences jsonb DEFAULT '{}'::jsonb,
  conversation_history jsonb DEFAULT '[]'::jsonb,
  last_analysis_data jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_contexts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_contexts
CREATE POLICY "Users can view their own context"
ON public.user_contexts
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own context"
ON public.user_contexts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own context"
ON public.user_contexts
FOR UPDATE
USING (auth.uid() = user_id);

-- Create conversation logs table (optional - for analytics)
CREATE TABLE IF NOT EXISTS public.conversation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  message_type text NOT NULL,
  content text NOT NULL,
  intent_detected text,
  emotion_detected text,
  actions_suggested text[],
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.conversation_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversation_logs
CREATE POLICY "Users can view their own logs"
ON public.conversation_logs
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own logs"
ON public.conversation_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_contexts_updated_at
BEFORE UPDATE ON public.user_contexts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();