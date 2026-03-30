-- AI Feedback table for reinforcement learning loop
-- Captures user thumbs up/down on AI responses to improve prompt selection over time.

CREATE TABLE IF NOT EXISTS ai_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  agent TEXT NOT NULL CHECK (agent IN ('athena', 'market_maw', 'strategy_advisor')),
  query TEXT NOT NULL,
  response_snippet TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating IN (-1, 1)), -- -1 = thumbs down, 1 = thumbs up
  query_category TEXT, -- 'risk', 'strategy', 'market', 'portfolio', etc.
  regime_context TEXT, -- regime at time of response (BULL/BEAR/SIDEWAYS/HIGH_VOL)
  ml_context_used BOOLEAN DEFAULT false, -- whether ML pipeline data was injected
  correction_note TEXT, -- optional user note on what was wrong
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookups by agent + quality
CREATE INDEX idx_ai_feedback_agent_rating ON ai_feedback(agent, rating);
CREATE INDEX idx_ai_feedback_user ON ai_feedback(user_id, created_at DESC);
CREATE INDEX idx_ai_feedback_category ON ai_feedback(agent, query_category, rating);

-- RLS: Users can only see/create their own feedback
ALTER TABLE ai_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own feedback"
  ON ai_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own feedback"
  ON ai_feedback FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own feedback"
  ON ai_feedback FOR UPDATE
  USING (auth.uid() = user_id);
