-- Fix overly permissive RLS policy on shared_reports table
-- The current policy allows anyone to see all share tokens, creating a security risk

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can view shared reports with valid token" ON public.shared_reports;

-- Create a policy that only allows owners to see their own shared reports
-- Token-based access should be handled through a secure edge function, not direct RLS
CREATE POLICY "Users can view their own shared reports"
ON public.shared_reports
FOR SELECT
USING (auth.uid() = owner_id);