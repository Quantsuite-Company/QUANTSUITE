import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Check, Star, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Pricing() {
  const navigate = useNavigate();

  const plans = [
    {
      name: "Starter",
      price: "Free",
      description: "Perfect for learning and basic calculations",
      features: [
        "Black-Scholes Calculator",
        "Basic Greeks Calculation",
        "5 calculations per day",
        "Community Support",
        "Educational Resources"
      ],
      limitations: [
        "Limited API calls",
        "No real-time data",
        "Basic charting"
      ],
      cta: "Start Free",
      popular: false,
      color: "cyan"
    },
    {
      name: "Professional",
      price: "$49",
      period: "/month",
      description: "For serious traders and small firms",
      features: [
        "All Starter features",
        "Real-time market data",
        "Advanced Greeks & IV",
        "Monte Carlo simulations",
        "SVI volatility modeling",
        "Unlimited calculations",
        "Priority support",
        "API access",
        "Custom indicators"
      ],
      limitations: [],
      cta: "Get Professional",
      popular: true,
      color: "yellow"
    },
    {
      name: "Enterprise",
      price: "$199",
      period: "/month",
      description: "For trading firms and institutions",
      features: [
        "All Professional features",
        "Multi-user accounts",
        "Advanced analytics",
        "Custom integrations",
        "Dedicated support",
        "On-premise deployment",
        "Custom models",
        "Compliance tools",
        "White-label options",
        "SLA guarantee"
      ],
      limitations: [],
      cta: "Contact Sales",
      popular: false,
      color: "cyan"
    }
  ];

  const faqs = [
    {
      question: "Can I upgrade or downgrade my plan anytime?",
      answer: "Yes, you can change your plan at any time. Changes take effect immediately, and we'll prorate any billing changes."
    },
    {
      question: "Do you offer annual discounts?",
      answer: "Yes! Save 20% when you choose annual billing on Professional and Enterprise plans."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards, PayPal, and wire transfers for Enterprise customers."
    },
    {
      question: "Is there a free trial for paid plans?",
      answer: "Yes, all paid plans come with a 14-day free trial. No credit card required to start."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D0D0F] via-[#1A1A1E] to-[#0D0D0F]">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center space-y-4">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-yellow-400 bg-clip-text text-transparent">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              Choose the perfect plan for your trading needs. Start free and upgrade as you grow.
            </p>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`relative bg-black/40 backdrop-blur-md border-white/10 hover:border-${plan.color}-400/30 transition-all duration-300 ${
                plan.popular ? 'scale-105 border-yellow-400/50' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black">
                    <Star className="w-3 h-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center">
                <CardTitle className="text-white text-2xl">{plan.name}</CardTitle>
                <div className="space-y-2">
                  <div className="flex items-baseline justify-center space-x-1">
                    <span className={`text-4xl font-bold bg-gradient-to-r from-${plan.color}-400 to-${plan.color}-600 bg-clip-text text-transparent`}>
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span className="text-white/60">{plan.period}</span>
                    )}
                  </div>
                  <CardDescription className="text-white/70">
                    {plan.description}
                  </CardDescription>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center space-x-3">
                      <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                      <span className="text-white/80 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
                
                <Button
                  onClick={() => navigate('/app')}
                  className={`w-full ${
                    plan.popular 
                      ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-black' 
                      : 'bg-gradient-to-r from-cyan-400/20 to-yellow-400/20 hover:from-cyan-400/30 hover:to-yellow-400/30 text-white border border-cyan-400/30 hover:border-cyan-400/50'
                  }`}
                >
                  {plan.cta}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Features Comparison */}
      <div className="border-t border-white/10 bg-black/10">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center space-y-8">
            <h2 className="text-3xl font-bold text-white">
              All Plans Include
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                "99.9% Uptime SLA",
                "Bank-grade Security",
                "Regular Updates",
                "Mobile Responsive",
                "Data Export",
                "Custom Alerts",
                "Historical Data",
                "Performance Analytics"
              ].map((feature, index) => (
                <div key={index} className="flex items-center space-x-3 text-white/80">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="border-t border-white/10">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-black/40 backdrop-blur-md border border-white/10 rounded-lg p-6">
                <h3 className="text-white font-semibold text-lg mb-3">
                  {faq.question}
                </h3>
                <p className="text-white/70">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="border-t border-white/10 bg-black/20">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center space-y-6">
          <h2 className="text-3xl font-bold text-white">
            Ready to Get Started?
          </h2>
          <p className="text-white/70 text-lg">
            Join thousands of traders who trust QuantSuite for their daily trading decisions.
          </p>
          <Button
            onClick={() => navigate('/app')}
            size="lg"
            className="bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-black font-semibold px-8 py-4 rounded-full"
          >
            Start Your Free Trial
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}