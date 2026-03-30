-- Drop the old unique constraint that doesn't include universe
ALTER TABLE alpha_signals 
DROP CONSTRAINT IF EXISTS alpha_signals_user_id_date_ticker_alpha_id_key;

-- Create new unique constraint including universe
ALTER TABLE alpha_signals 
ADD CONSTRAINT alpha_signals_user_id_date_ticker_alpha_id_universe_key 
UNIQUE (user_id, date, ticker, alpha_id, universe);