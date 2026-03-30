import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { HelmetProvider } from 'react-helmet-async';
import ErrorBoundary from "./components/ErrorBoundary";

// Direct imports for instant navigation (no lazy loading)
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Products from "./pages/Products";
import Toolkit from "./pages/Toolkit";
import Pricing from "./pages/Pricing";
import Insights from "./pages/Insights";
import Advisor from "./pages/Advisor";
import WildVolatilitySolver from "./pages/WildVolatilitySolver";
import TechnicalIndicators from "./pages/TechnicalIndicators";
import SVI from "./pages/SVI";
import BinomialTree from "./pages/BinomialTree";
import MonteCarloSimulation from "./pages/MonteCarloSimulation";
import HestonModel from "./pages/HestonModel";
import JumpDiffusion from "./pages/JumpDiffusion";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import FAQ from "./pages/FAQ";
import About from "./pages/About";
import ArbitrageDetector from "./pages/ArbitrageDetector";
import EducationalInsight from "./pages/EducationalInsight";
import AdvancedGreeks from "./pages/AdvancedGreeks";
import AdvancedScenarioAnalysis from "./pages/AdvancedScenarioAnalysis";
import Athena from "./pages/Athena";
import MarketMaw from "./pages/MarketMaw";
import Tutorial from "./pages/Tutorial";
import CSVVisualizer from "./pages/CSVVisualizer";
import StrategyBuilder from "./pages/StrategyBuilder";
import QuantEngine from "./pages/QuantEngine";
import CommandCenter from "./pages/CommandCenter";
import MarketTerminal from "./pages/MarketTerminal";
import Portfolios from "./pages/Portfolios";
import AlphaSignals from "./pages/AlphaSignals";
import WalkForwardBacktest from "./pages/WalkForwardBacktest";
import BacktestHistory from "./pages/BacktestHistory";
import PortfolioBuilder from "./pages/PortfolioBuilder";
import PortfolioOptimizer from "./pages/PortfolioOptimizer";
import RiskAnalysis from "./pages/RiskAnalysis";
import Screener from "./pages/Screener";
import NotFound from "./pages/NotFound";
import InsiderStreet from "./pages/InsiderStreet";
import AIStrategyAdvisor from "./pages/AIStrategyAdvisor";
import CreditRiskModels from "./pages/CreditRiskModels";
import StockReport from "./pages/StockReport";
import EarningsCalendar from "./pages/EarningsCalendar";
import Pulse from "./pages/Pulse";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <HelmetProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
              <AuthProvider>
                <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/products" element={<Products />} />
                <Route path="/toolkit" element={<Toolkit />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/insights" element={<Insights />} />
                <Route path="/login" element={<Login />} />
                <Route path="/privacy-policy" element={<Layout><PrivacyPolicy /></Layout>} />
                <Route path="/faq" element={<Layout><FAQ /></Layout>} />
                <Route path="/about" element={<Layout><About /></Layout>} />
                
                {/* Protected Routes - Dashboard */}
                <Route path="/command-center" element={
                  <ProtectedRoute>
                    <Layout><CommandCenter /></Layout>
                  </ProtectedRoute>
                } />
                <Route path="/pulse" element={
                  <ProtectedRoute>
                    <Layout><Pulse /></Layout>
                  </ProtectedRoute>
                } />
                <Route path="/market-terminal" element={
                  <ProtectedRoute>
                    <Layout><MarketTerminal /></Layout>
                  </ProtectedRoute>
                } />
                
                {/* Protected Routes - AI Tools */}
                <Route path="/athena" element={
                  <ProtectedRoute>
                    <Layout><Athena /></Layout>
                  </ProtectedRoute>
                } />
                <Route path="/market-maw" element={
                  <ProtectedRoute>
                    <Layout><MarketMaw /></Layout>
                  </ProtectedRoute>
                } />
                <Route path="/advisor" element={
                  <ProtectedRoute>
                    <Layout><Advisor /></Layout>
                  </ProtectedRoute>
                } />
                <Route path="/ai-strategy-advisor" element={
                  <ProtectedRoute>
                    <Layout><AIStrategyAdvisor /></Layout>
                  </ProtectedRoute>
                } />
                
                {/* Protected Routes - Portfolio Management */}
                <Route path="/portfolios" element={
                  <ProtectedRoute>
                    <Layout><Portfolios /></Layout>
                  </ProtectedRoute>
                } />
                <Route path="/alpha-signals" element={
                  <ProtectedRoute>
                    <Layout><AlphaSignals /></Layout>
                  </ProtectedRoute>
                } />
                <Route path="/walk-forward" element={
                  <ProtectedRoute>
                    <Layout><WalkForwardBacktest /></Layout>
                  </ProtectedRoute>
                } />
                <Route path="/backtest-history" element={
                  <ProtectedRoute>
                    <Layout><BacktestHistory /></Layout>
                  </ProtectedRoute>
                } />
                <Route path="/portfolio-builder" element={
                  <ProtectedRoute>
                    <Layout><PortfolioBuilder /></Layout>
                  </ProtectedRoute>
                } />
                <Route path="/risk-analysis" element={
                  <ProtectedRoute>
                    <Layout><RiskAnalysis /></Layout>
                  </ProtectedRoute>
                } />
                <Route path="/portfolio-optimizer" element={
                  <ProtectedRoute>
                    <Layout><PortfolioOptimizer /></Layout>
                  </ProtectedRoute>
                } />
                
                {/* Protected Routes - Trading & Markets */}
                <Route path="/insider-street" element={
                  <ProtectedRoute>
                    <Layout><InsiderStreet /></Layout>
                  </ProtectedRoute>
                } />
                <Route path="/screener" element={
                  <ProtectedRoute>
                    <Layout><Screener /></Layout>
                  </ProtectedRoute>
                } />
                <Route path="/stock-report" element={
                  <ProtectedRoute>
                    <Layout><StockReport /></Layout>
                  </ProtectedRoute>
                } />
                
                {/* Protected Routes - Analysis Tools */}
                <Route path="/app" element={
                  <ProtectedRoute>
                    <Layout><Index /></Layout>
                  </ProtectedRoute>
                } />
                <Route path="/volatility-solver" element={
                  <ProtectedRoute>
                    <Layout><WildVolatilitySolver /></Layout>
                  </ProtectedRoute>
                } />
                <Route path="/technical-indicators" element={
                  <ProtectedRoute>
                    <Layout><TechnicalIndicators /></Layout>
                  </ProtectedRoute>
                } />
                <Route path="/svi" element={
                  <ProtectedRoute>
                    <Layout><SVI /></Layout>
                  </ProtectedRoute>
                } />
                <Route path="/binomial-tree" element={
                  <ProtectedRoute>
                    <Layout><BinomialTree /></Layout>
                  </ProtectedRoute>
                } />
                <Route path="/monte-carlo" element={
                  <ProtectedRoute>
                    <Layout><MonteCarloSimulation /></Layout>
                  </ProtectedRoute>
                } />
                <Route path="/heston-model" element={
                  <ProtectedRoute>
                    <Layout><HestonModel /></Layout>
                  </ProtectedRoute>
                } />
                <Route path="/jump-diffusion" element={
                  <ProtectedRoute>
                    <Layout><JumpDiffusion /></Layout>
                  </ProtectedRoute>
                } />
                <Route path="/advanced-greeks" element={
                  <ProtectedRoute>
                    <Layout><AdvancedGreeks /></Layout>
                  </ProtectedRoute>
                } />
                <Route path="/scenario-analysis" element={
                  <ProtectedRoute>
                    <Layout><AdvancedScenarioAnalysis /></Layout>
                  </ProtectedRoute>
                } />
                
                <Route path="/earnings-calendar" element={
                  <ProtectedRoute>
                    <Layout><EarningsCalendar /></Layout>
                  </ProtectedRoute>
                } />
                
                {/* Protected Routes - Strategy & Tools */}
                <Route path="/arbitrage-detector" element={
                  <ProtectedRoute>
                    <Layout><ArbitrageDetector /></Layout>
                  </ProtectedRoute>
                } />
                <Route path="/credit-risk" element={
                  <ProtectedRoute>
                    <Layout><CreditRiskModels /></Layout>
                  </ProtectedRoute>
                } />
                <Route path="/strategy-builder" element={
                  <ProtectedRoute>
                    <Layout><StrategyBuilder /></Layout>
                  </ProtectedRoute>
                } />
                <Route path="/quant-engine" element={
                  <ProtectedRoute>
                    <Layout><QuantEngine /></Layout>
                  </ProtectedRoute>
                } />
                
                {/* Protected Routes - Learning */}
                <Route path="/educational-insight" element={
                  <ProtectedRoute>
                    <Layout><EducationalInsight /></Layout>
                  </ProtectedRoute>
                } />
                <Route path="/tutorial" element={
                  <ProtectedRoute>
                    <Layout><Tutorial /></Layout>
                  </ProtectedRoute>
                } />
                
                {/* Other Routes */}
                <Route path="/csv-visualizer" element={<CSVVisualizer />} />
                
                {/* Legacy Redirects */}
                <Route path="/dashboard" element={<Navigate to="/command-center" replace />} />
                
                {/* 404 Not Found - must be last */}
                <Route path="*" element={<NotFound />} />
                </Routes>
              </AuthProvider>
            </BrowserRouter>
        </HelmetProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
