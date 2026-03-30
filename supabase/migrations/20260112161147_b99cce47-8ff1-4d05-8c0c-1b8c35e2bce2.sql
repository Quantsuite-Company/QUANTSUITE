-- Fix market_data_cache - drop the INSERT policy that allows anyone
DROP POLICY IF EXISTS "System can write market data cache" ON public.market_data_cache;

-- Fix shared_reports - drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can view shared reports with valid token" ON public.shared_reports;

-- Add profiles INSERT policy
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Add user_contexts DELETE policy  
DROP POLICY IF EXISTS "Users can delete their own context" ON public.user_contexts;
CREATE POLICY "Users can delete their own context" 
ON public.user_contexts 
FOR DELETE 
USING (auth.uid() = user_id);