import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Calculator, TrendingUp, BarChart, Zap, Shield, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Products() {
  const navigate = useNavigate();

  const products = [
    {
      icon: Calculator,
      title: "Black-Scholes Calculator",
      description: "Professional option pricing with real-time Greeks calculation and risk analysis.",
      features: ["Real-time Greeks", "IV Calculations", "Risk Metrics", "Multiple Expiries"],
      route: "/app"
    },
    {
      icon: TrendingUp,
      title: "SVI Volatility Modeling",
      description: "Advanced volatility surface modeling with automated parameter calibration.",
      features: ["Auto Parameter Fitting", "Market Data Integration", "Volatility Surface", "Arbitrage Detection"],
      route: "/svi"
    },
    {
      icon: BarChart,
      title: "Monte Carlo Simulation",
      description: "Risk assessment through advanced Monte Carlo path simulation.",
      features: ["Path Generation", "Risk Analysis", "Portfolio Simulation", "Stress Testing"],
      route: "/monte-carlo"
    },
    {
      icon: Target,
      title: "Binomial Tree Pricing",
      description: "American and European option pricing using binomial tree models.",
      features: ["Multi-Period Pricing", "Early Exercise", "Dividend Handling", "Greeks Calculation"],
      route: "/binomial-tree"
    },
    {
      icon: Zap,
      title: "Volatility Solver",
      description: "Advanced implied volatility solving with multiple market models.",
      features: ["IV Surface", "Model Calibration", "Real-time Updates", "Historical Analysis"],
      route: "/volatility-solver"
    },
    {
      icon: Shield,
      title: "AI Trading Advisor",
      description: "Intelligent trading recommendations powered by machine learning.",
      features: ["ML Predictions", "Risk Assessment", "Market Analysis", "Trade Signals"],
      route: "/advisor"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D0D0F] via-[#1A1A1E] to-[#0D0D0F]">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center space-y-4">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-yellow-400 bg-clip-text text-transparent">
              Professional Trading Products
            </h1>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              Comprehensive suite of quantitative trading tools built for professionals, quants, and serious traders.
            </p>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product, index) => (
            <Card key={index} className="bg-black/40 backdrop-blur-md border-white/10 hover:border-cyan-400/30 transition-all duration-300 group">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-400/20 to-yellow-400/20">
                    <product.icon className="w-6 h-6 text-cyan-400" />
                  </div>
                  <CardTitle className="text-white group-hover:text-cyan-400 transition-colors">
                    {product.title}
                  </CardTitle>
                </div>
                <CardDescription className="text-white/70">
                  {product.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {product.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      <span className="text-white/60 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
                <Button
                  onClick={() => navigate(product.route)}
                  className="w-full bg-gradient-to-r from-cyan-400/20 to-yellow-400/20 hover:from-cyan-400/30 hover:to-yellow-400/30 text-white border border-cyan-400/30 hover:border-cyan-400/50"
                >
                  Launch Tool
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="border-t border-white/10 bg-black/20">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center space-y-6">
          <h2 className="text-3xl font-bold text-white">
            Ready to Start Trading Smarter?
          </h2>
          <p className="text-white/70 text-lg">
            Get access to all professional trading tools and start making data-driven decisions.
          </p>
          <Button
            onClick={() => navigate('/app')}
            size="lg"
            className="bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-black font-semibold px-8 py-4 rounded-full"
          >
            Start Free Trial
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}