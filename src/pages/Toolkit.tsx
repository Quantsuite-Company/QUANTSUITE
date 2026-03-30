import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Code, Database, Cpu, Cloud, Shield, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Toolkit() {
  const navigate = useNavigate();

  const toolkitFeatures = [
    {
      icon: Code,
      title: "Advanced APIs",
      description: "RESTful APIs for all pricing models and calculations",
      features: ["Real-time Data", "WebSocket Support", "Rate Limiting", "Authentication"],
      badge: "Developer"
    },
    {
      icon: Database,
      title: "Market Data Integration",
      description: "Connect to major market data providers seamlessly",
      features: ["Bloomberg Terminal", "Reuters", "Yahoo Finance", "Alpha Vantage"],
      badge: "Data"
    },
    {
      icon: Cpu,
      title: "High-Performance Computing",
      description: "Optimized algorithms for lightning-fast calculations",
      features: ["GPU Acceleration", "Multi-threading", "Vectorized Operations", "Memory Optimization"],
      badge: "Performance"
    },
    {
      icon: Cloud,
      title: "Cloud Infrastructure",
      description: "Scalable cloud-based computation and storage",
      features: ["Auto Scaling", "Load Balancing", "Global CDN", "99.9% Uptime"],
      badge: "Cloud"
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-grade security for your trading data",
      features: ["End-to-End Encryption", "SOC 2 Compliance", "Multi-factor Auth", "Audit Logs"],
      badge: "Security"
    },
    {
      icon: Zap,
      title: "Real-time Analytics",
      description: "Live market analysis and risk monitoring",
      features: ["Live Greeks", "Risk Alerts", "P&L Tracking", "Portfolio Analytics"],
      badge: "Analytics"
    }
  ];

  const integrations = [
    { name: "Interactive Brokers", status: "Available" },
    { name: "TD Ameritrade", status: "Available" },
    { name: "E*TRADE", status: "Available" },
    { name: "Schwab", status: "Coming Soon" },
    { name: "Fidelity", status: "Coming Soon" },
    { name: "Robinhood", status: "Available" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D0D0F] via-[#1A1A1E] to-[#0D0D0F]">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center space-y-4">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-yellow-400 bg-clip-text text-transparent">
              Developer Toolkit
            </h1>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              Complete development ecosystem for building sophisticated trading applications.
            </p>
          </div>
        </div>
      </div>

      {/* Toolkit Features */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {toolkitFeatures.map((feature, index) => (
            <Card key={index} className="bg-black/40 backdrop-blur-md border-white/10 hover:border-cyan-400/30 transition-all duration-300 group">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-400/20 to-yellow-400/20">
                      <feature.icon className="w-6 h-6 text-cyan-400" />
                    </div>
                    <CardTitle className="text-white group-hover:text-cyan-400 transition-colors">
                      {feature.title}
                    </CardTitle>
                  </div>
                  <Badge variant="secondary" className="bg-cyan-400/10 text-cyan-400 border-cyan-400/20">
                    {feature.badge}
                  </Badge>
                </div>
                <CardDescription className="text-white/70">
                  {feature.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {feature.features.map((item, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      <span className="text-white/60 text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Integrations Section */}
      <div className="border-t border-white/10 bg-black/10">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center space-y-8">
            <h2 className="text-3xl font-bold text-white">
              Broker Integrations
            </h2>
            <p className="text-white/70 text-lg max-w-2xl mx-auto">
              Connect directly to your preferred broker for live trading and data feeds.
            </p>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {integrations.map((integration, index) => (
                <div key={index} className="bg-black/40 backdrop-blur-md border border-white/10 rounded-lg p-6 hover:border-cyan-400/30 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium">{integration.name}</span>
                    <Badge 
                      variant={integration.status === 'Available' ? 'default' : 'secondary'}
                      className={integration.status === 'Available' 
                        ? 'bg-green-400/10 text-green-400 border-green-400/20' 
                        : 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20'
                      }
                    >
                      {integration.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="border-t border-white/10 bg-black/20">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center space-y-6">
          <h2 className="text-3xl font-bold text-white">
            Start Building Today
          </h2>
          <p className="text-white/70 text-lg">
            Get access to our complete developer toolkit and start building your trading applications.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate('/app')}
              size="lg"
              className="bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-black font-semibold px-8 py-4 rounded-full"
            >
              Get Started
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-cyan-400/50 text-cyan-400 hover:bg-cyan-400/10 px-8 py-4 rounded-full backdrop-blur-sm"
            >
              View Documentation
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}