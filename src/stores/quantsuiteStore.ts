import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'dark' | 'light' | 'system';
export type MarketStatus = 'open' | 'closed' | 'pre-market' | 'post-market';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

interface ChartPreferences {
  defaultTimeframe: string;
  indicators: string[];
  chartType: 'candlestick' | 'line' | 'area';
}

interface Portfolio {
  id: string;
  name: string;
  positions: any[];
}

interface LiveQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  timestamp: number;
}

interface QuantSuiteState {
  // User Preferences
  theme: Theme;
  sidebarCollapsed: boolean;
  sidebarSections: Record<string, boolean>;
  chartPreferences: ChartPreferences;
  
  // Onboarding
  hasCompletedOnboarding: boolean;
  experienceLevel: ExperienceLevel;
  userGoals: string[];
  
  // Portfolio State
  activePortfolio: Portfolio | null;
  watchlist: string[];
  
  // Market State
  marketStatus: MarketStatus;
  liveQuotes: Record<string, LiveQuote>;
  
  // Geo/Localization
  region: 'US' | 'EU' | 'IN' | 'APAC';
  currency: string;
  locale: string;
  
  // Unified Alert Bus
  sharedAlerts: Array<{ id: string; message: string; timestamp: number; source: string; level: 'info' | 'warning' | 'critical' }>;
  
  // Actions
  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
  setSidebarSections: (sections: Record<string, boolean>) => void;
  setChartPreferences: (prefs: Partial<ChartPreferences>) => void;
  setActivePortfolio: (portfolio: Portfolio | null) => void;
  addToWatchlist: (symbol: string) => void;
  removeFromWatchlist: (symbol: string) => void;
  updateLiveQuote: (symbol: string, quote: LiveQuote) => void;
  setMarketStatus: (status: MarketStatus) => void;
  setGeoConfig: (config: { region: string; currency: string; locale: string }) => void;
  
  // Alert Bus Actions
  addSharedAlert: (alert: Omit<QuantSuiteState['sharedAlerts'][0], 'id' | 'timestamp'>) => void;
  clearSharedAlerts: () => void;
  
  // Onboarding Actions
  setExperienceLevel: (level: ExperienceLevel) => void;
  completeOnboarding: () => void;
  setUserGoals: (goals: string[]) => void;
}

export const useQuantSuiteStore = create<QuantSuiteState>()(
  persist(
    (set) => ({
      // Initial State
      theme: 'dark',
      sidebarCollapsed: false,
      sidebarSections: {},
      hasCompletedOnboarding: false,
      experienceLevel: 'beginner' as ExperienceLevel,
      userGoals: [] as string[],
      chartPreferences: {
        defaultTimeframe: '1D',
        indicators: ['SMA', 'RSI'],
        chartType: 'candlestick',
      },
      activePortfolio: null,
      watchlist: ['AAPL', 'MSFT', 'GOOGL', 'TSLA'],
      marketStatus: 'closed',
      liveQuotes: {},
      region: 'US',
      currency: 'USD',
      locale: 'en-US',
      sharedAlerts: [],
      
      // Actions
      setTheme: (theme) => set({ theme }),
      
      toggleSidebar: () => set((state) => ({ 
        sidebarCollapsed: !state.sidebarCollapsed 
      })),

      setSidebarSections: (sections) => set({ sidebarSections: sections }),
      
      setChartPreferences: (prefs) => set((state) => ({
        chartPreferences: { ...state.chartPreferences, ...prefs }
      })),
      
      setActivePortfolio: (portfolio) => set({ activePortfolio: portfolio }),
      
      addToWatchlist: (symbol) => set((state) => ({
        watchlist: [...state.watchlist, symbol.toUpperCase()]
      })),
      
      removeFromWatchlist: (symbol) => set((state) => ({
        watchlist: state.watchlist.filter(s => s !== symbol.toUpperCase())
      })),
      
      updateLiveQuote: (symbol, quote) => set((state) => ({
        liveQuotes: { ...state.liveQuotes, [symbol]: quote }
      })),
      
      setMarketStatus: (status) => set({ marketStatus: status }),
      
      setGeoConfig: (config) => set({
        region: config.region as any,
        currency: config.currency,
        locale: config.locale,
      }),
      
      // Alert Bus Actions
      addSharedAlert: (alert) => set((state) => ({
        sharedAlerts: [
          { ...alert, id: Math.random().toString(36).substring(7), timestamp: Date.now() },
          ...state.sharedAlerts
        ].slice(0, 10) // Keep last 10
      })),
      
      clearSharedAlerts: () => set({ sharedAlerts: [] }),
      
      // Onboarding Actions
      setExperienceLevel: (level) => set({ experienceLevel: level }),
      completeOnboarding: () => set({ hasCompletedOnboarding: true }),
      setUserGoals: (goals) => set({ userGoals: goals }),
    }),
    {
      name: 'quantsuite-storage',
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
        sidebarSections: state.sidebarSections,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        experienceLevel: state.experienceLevel,
        userGoals: state.userGoals,
        chartPreferences: state.chartPreferences,
        watchlist: state.watchlist,
        region: state.region,
        currency: state.currency,
        locale: state.locale,
      }),
    }
  )
);
