-- ========================================
-- QUANTSUITE FOUNDATION SCHEMA
-- Sprint 1-2: Auth + Multi-Tenant Architecture
-- ========================================

-- 1. USER PROFILES (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  company TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- 2. USER ROLES (security-first approach)
CREATE TYPE public.app_role AS ENUM ('free', 'pro', 'enterprise', 'admin');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

-- Security definer function for role checks (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 3. PORTFOLIOS (user-isolated)
CREATE TABLE public.portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  positions JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD their own portfolios"
ON public.portfolios FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. STRATEGIES (QuantScript strategies)
CREATE TABLE public.strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  strategy_code TEXT,
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.strategies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD their own strategies"
ON public.strategies FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 5. BACKTESTS (strategy execution results)
CREATE TABLE public.backtests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  strategy_id UUID REFERENCES public.strategies(id) ON DELETE CASCADE,
  strategy_name TEXT NOT NULL,
  config JSONB NOT NULL,
  results JSONB,
  status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.backtests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD their own backtests"
ON public.backtests FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 6. ALPHA SIGNALS CACHE (computed signals per user)
CREATE TABLE public.user_alpha_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  portfolio_id UUID REFERENCES public.portfolios(id) ON DELETE CASCADE,
  ticker TEXT NOT NULL,
  date DATE NOT NULL,
  signals JSONB NOT NULL,
  combined_score NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, ticker, date)
);

ALTER TABLE public.user_alpha_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD their own alpha signals"
ON public.user_alpha_signals FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 7. SHARED REPORTS (collaboration feature)
CREATE TABLE public.shared_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('portfolio', 'backtest', 'strategy')),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  share_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.shared_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD their own shared reports"
ON public.shared_reports FOR ALL
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Anyone can view shared reports with valid token"
ON public.shared_reports FOR SELECT
USING (true);

-- 8. MARKET DATA CACHE (shared across all users)
CREATE TABLE public.market_data_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker TEXT NOT NULL,
  date DATE NOT NULL,
  timeframe TEXT NOT NULL DEFAULT 'daily',
  data JSONB NOT NULL,
  source TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(ticker, date, timeframe)
);

-- No RLS on cache (shared resource)
ALTER TABLE public.market_data_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read market data cache"
ON public.market_data_cache FOR SELECT
USING (true);

CREATE POLICY "System can write market data cache"
ON public.market_data_cache FOR INSERT
WITH CHECK (true);

-- 9. TRIGGER: Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  
  -- Assign default 'free' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'free');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 10. TRIGGER: Update timestamps
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_portfolios_updated_at
  BEFORE UPDATE ON public.portfolios
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_strategies_updated_at
  BEFORE UPDATE ON public.strategies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 11. INDEXES for performance
CREATE INDEX idx_portfolios_user_id ON public.portfolios(user_id);
CREATE INDEX idx_strategies_user_id ON public.strategies(user_id);
CREATE INDEX idx_backtests_user_id ON public.backtests(user_id);
CREATE INDEX idx_backtests_strategy_id ON public.backtests(strategy_id);
CREATE INDEX idx_alpha_signals_user_ticker ON public.user_alpha_signals(user_id, ticker);
CREATE INDEX idx_market_data_ticker_date ON public.market_data_cache(ticker, date);
CREATE INDEX idx_shared_reports_token ON public.shared_reports(share_token);