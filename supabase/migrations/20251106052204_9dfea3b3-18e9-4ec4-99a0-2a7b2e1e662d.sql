-- Alpha Signals Schema

-- Store calculated alpha signals for each stock
CREATE TABLE alpha_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  ticker text NOT NULL,
  alpha_id text NOT NULL, -- 'momentum21', 'meanReversion', etc.
  raw_value numeric,
  zscore numeric,
  percentile_rank numeric, -- 0-100
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date, ticker, alpha_id)
);

CREATE INDEX idx_signals_user_date ON alpha_signals(user_id, date);
CREATE INDEX idx_signals_ticker ON alpha_signals(ticker, date);
CREATE INDEX idx_signals_alpha ON alpha_signals(alpha_id, date);

-- Store alpha performance metrics (IC, IC Sharpe, etc.)
CREATE TABLE alpha_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  alpha_id text NOT NULL,
  ic numeric,              -- Information Coefficient
  ic_sharpe numeric,       -- IC / std(IC)
  half_life_days numeric,  -- Signal decay rate
  is_healthy boolean,      -- IC > threshold & IC Sharpe > 1
  lookback_days int DEFAULT 21,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date, alpha_id, lookback_days)
);

CREATE INDEX idx_metrics_user_date ON alpha_metrics(user_id, date);
CREATE INDEX idx_metrics_alpha ON alpha_metrics(alpha_id);

-- Store walk-forward backtest results
CREATE TABLE walk_forward_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  config jsonb NOT NULL,   -- WalkForwardConfig object
  windows jsonb NOT NULL,  -- WalkForwardWindow[] array
  out_of_sample_metrics jsonb,
  cumulative_returns numeric,
  sharpe_ratio numeric,
  max_drawdown numeric,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_wf_user ON walk_forward_results(user_id, created_at);

-- Store portfolio snapshots
CREATE TABLE portfolio_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  weights jsonb NOT NULL,        -- {ticker: weight}
  alpha_weights jsonb NOT NULL,  -- {alpha_id: weight}
  metrics jsonb,                 -- {return, volatility, sharpe, etc.}
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

CREATE INDEX idx_portfolio_user_date ON portfolio_snapshots(user_id, date);

-- Enable RLS on all tables
ALTER TABLE alpha_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE alpha_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE walk_forward_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users access own alpha signals" 
  ON alpha_signals 
  FOR ALL 
  USING (auth.uid() = user_id);

CREATE POLICY "Users access own metrics" 
  ON alpha_metrics 
  FOR ALL 
  USING (auth.uid() = user_id);

CREATE POLICY "Users access own backtests" 
  ON walk_forward_results 
  FOR ALL 
  USING (auth.uid() = user_id);

CREATE POLICY "Users access own portfolios" 
  ON portfolio_snapshots 
  FOR ALL 
  USING (auth.uid() = user_id);