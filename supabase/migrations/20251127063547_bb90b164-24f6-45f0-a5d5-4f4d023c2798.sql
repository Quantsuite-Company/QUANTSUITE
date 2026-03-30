-- Add universe column to alpha_signals table
ALTER TABLE alpha_signals ADD COLUMN universe TEXT NOT NULL DEFAULT 'S&P 500';

-- Create index for faster filtering
CREATE INDEX idx_alpha_signals_universe ON alpha_signals(user_id, universe, date);

-- Clean up duplicate signals (keep only most recent per user/date/ticker/alpha_id)
DELETE FROM alpha_signals a
USING alpha_signals b
WHERE a.id < b.id
  AND a.user_id = b.user_id
  AND a.date = b.date
  AND a.ticker = b.ticker
  AND a.alpha_id = b.alpha_id;