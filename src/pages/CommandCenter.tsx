import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Zap, BarChart3, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { PremiumHeader } from '@/components/command-center/PremiumHeader';
import { MarketPulseSection } from '@/components/command-center/MarketPulseSection';
import { QuickActionCard } from '@/components/command-center/QuickActionCard';
import { PortfolioSection } from '@/components/command-center/PortfolioSection';
import { BacktestSection } from '@/components/command-center/BacktestSection';
import { OnboardingWizard } from '@/components/OnboardingWizard';
import { useQuantSuiteStore } from '@/stores/quantsuiteStore';

export default function CommandCenter() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { hasCompletedOnboarding } = useQuantSuiteStore();
  const [showOnboarding, setShowOnboarding] = useState(!hasCompletedOnboarding);

  // Fetch user's portfolios
  const { data: portfolios = [], isLoading: portfoliosLoading } = useQuery({
    queryKey: ['portfolios', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('portfolios')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch user's recent backtests
  const { data: backtests = [], isLoading: backtestsLoading } = useQuery({
    queryKey: ['backtests', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('backtests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch real-time market data - single call returning all indices
  const { data: marketData, isLoading: marketLoading } = useQuery({
    queryKey: ['market-pulse'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('fetch-market-data');
      
      if (error) {
        console.error('Failed to fetch market data:', error);
        return null;
      }
      
      // Map the structured response to display format
      if (data?.indices && Array.isArray(data.indices)) {
        return data.indices.map((index: { name: string; price: number; changePercent: number }) => ({
          name: index.name,
          value: index.price,
          change: index.changePercent,
          positive: index.name === 'VIX' 
            ? index.changePercent < 0 // VIX: negative is good
            : index.changePercent > 0, // Others: positive is good
        }));
      }
      
      return null;
    },
    refetchInterval: 30000,
  });

  // Use real data or show unavailable state
  const marketPulse = marketData || [
    { name: 'S&P 500', value: 0, change: 0, positive: true, unavailable: true },
    { name: 'NASDAQ', value: 0, change: 0, positive: true, unavailable: true },
    { name: 'DOW', value: 0, change: 0, positive: true, unavailable: true },
    { name: 'VIX', value: 0, change: 0, positive: true, unavailable: true },
  ];

  const quickActions = [
    {
      icon: Plus,
      label: 'New Portfolio',
      description: 'Create a new portfolio',
      action: () => navigate('/portfolios'),
      color: 'cyan',
    },
    {
      icon: Zap,
      label: 'Run Backtest',
      description: 'Test your strategies',
      action: () => navigate('/quant-engine'),
      color: 'amber',
    },
    {
      icon: BarChart3,
      label: 'Alpha Signals',
      description: 'View market opportunities',
      action: () => navigate('/alpha-signals'),
      color: 'violet',
    },
    {
      icon: Target,
      label: 'Risk Analysis',
      description: 'Analyze portfolio risk',
      action: () => navigate('/risk-analysis'),
      color: 'emerald',
    },
  ];

  const userName = user?.email?.split('@')[0] || 'Trader';

  return (
    <>
      {showOnboarding && (
        <OnboardingWizard onComplete={() => setShowOnboarding(false)} />
      )}
      <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-background p-4 md:p-6 space-y-6"
    >
      {/* Premium Header */}
      <PremiumHeader userName={userName} />

      {/* Market Pulse */}
      <MarketPulseSection marketData={marketPulse} isLoading={marketLoading} />

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action, index) => (
          <QuickActionCard
            key={action.label}
            icon={action.icon}
            label={action.label}
            description={action.description}
            color={action.color}
            onClick={action.action}
            index={index}
          />
        ))}
      </div>

      {/* Portfolios & Backtests Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PortfolioSection
          portfolios={portfolios}
          isLoading={portfoliosLoading}
          onNavigate={navigate}
        />
        <BacktestSection
          backtests={backtests}
          isLoading={backtestsLoading}
          onNavigate={navigate}
        />
      </div>
    </motion.div>
    </>
  );
}
