import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, TrendingUp, BarChart, PieChart, Activity, Clock, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Insights() {
  const navigate = useNavigate();

  const insights = [
    {
      category: "Market Analysis",
      title: "Options Volume Surge in Tech Stocks",
      excerpt: "Call options volume increased 340% in major tech stocks this week, indicating bullish sentiment ahead of earnings season.",
      author: "Dr. Sarah Chen",
      readTime: "5 min read",
      publishDate: "2 days ago",
      tags: ["Options", "Tech", "Volume Analysis"]
    },
    {
      category: "Trading Strategy",
      title: "The Greeks in Volatile Markets: A Deep Dive",
      excerpt: "Understanding how Delta, Gamma, and Vega behave during high volatility periods can significantly improve your trading edge.",
      author: "Michael Rodriguez",
      readTime: "8 min read",
      publishDate: "4 days ago",
      tags: ["Greeks", "Volatility", "Strategy"]
    },
    {
      category: "Risk Management",
      title: "Monte Carlo Methods for Portfolio Risk Assessment",
      excerpt: "Learn how Monte Carlo simulations can help you understand potential portfolio outcomes and optimize your risk exposure.",
      author: "Prof. James Kim",
      readTime: "12 min read",
      publishDate: "1 week ago",
      tags: ["Risk", "Monte Carlo", "Portfolio"]
    },
    {
      category: "Market Trends",
      title: "Implied Volatility Patterns in Post-Earnings Moves",
      excerpt: "Analysis of IV crush patterns across different sectors and how to position for post-earnings volatility changes.",
      author: "Lisa Thompson",
      readTime: "6 min read",
      publishDate: "1 week ago",
      tags: ["IV", "Earnings", "Patterns"]
    },
    {
      category: "Technical Analysis",
      title: "SVI Model Applications in Real Trading",
      excerpt: "Practical implementation of the Stochastic Volatility Inspired model for better volatility surface fitting.",
      author: "Dr. Robert Park",
      readTime: "10 min read",
      publishDate: "2 weeks ago",
      tags: ["SVI", "Volatility", "Modeling"]
    },
    {
      category: "Algorithm Trading",
      title: "Machine Learning in Options Pricing",
      excerpt: "How neural networks are revolutionizing options pricing accuracy and creating new trading opportunities.",
      author: "Alex Morgan",
      readTime: "7 min read",
      publishDate: "2 weeks ago",
      tags: ["ML", "Pricing", "AI"]
    }
  ];

  const stats = [
    { icon: TrendingUp, label: "Articles Published", value: "2,400+" },
    { icon: BarChart, label: "Market Reports", value: "150+" },
    { icon: PieChart, label: "Research Papers", value: "85+" },
    { icon: Activity, label: "Daily Readers", value: "45K+" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D0D0F] via-[#1A1A1E] to-[#0D0D0F]">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center space-y-4">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-yellow-400 bg-clip-text text-transparent">
              Market Insights & Research
            </h1>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              Deep market analysis, trading strategies, and research from leading quantitative analysts and traders.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center space-y-3">
                <div className="mx-auto w-12 h-12 bg-gradient-to-r from-cyan-400/20 to-yellow-400/20 rounded-lg flex items-center justify-center">
                  <stat.icon className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-white/60 text-sm">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Featured Articles */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Latest Insights</h2>
            <p className="text-white/70">Stay ahead with expert analysis and cutting-edge research</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {insights.map((insight, index) => (
              <Card key={index} className="bg-black/40 backdrop-blur-md border-white/10 hover:border-cyan-400/30 transition-all duration-300 group cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary" className="bg-cyan-400/10 text-cyan-400 border-cyan-400/20">
                      {insight.category}
                    </Badge>
                    <span className="text-white/40 text-xs">{insight.publishDate}</span>
                  </div>
                  <CardTitle className="text-white group-hover:text-cyan-400 transition-colors line-clamp-2">
                    {insight.title}
                  </CardTitle>
                  <CardDescription className="text-white/70 line-clamp-3">
                    {insight.excerpt}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {insight.tags.map((tag, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs border-white/20 text-white/60">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-white/40" />
                        <span className="text-white/60 text-sm">{insight.author}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-white/40" />
                        <span className="text-white/60 text-sm">{insight.readTime}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Newsletter Signup */}
      <div className="border-t border-white/10 bg-black/10">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center space-y-6">
          <h2 className="text-3xl font-bold text-white">
            Stay Informed
          </h2>
          <p className="text-white/70 text-lg">
            Get weekly market insights, trading strategies, and research updates delivered to your inbox.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 bg-black/40 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-cyan-400/50"
            />
            <Button className="bg-gradient-to-r from-cyan-400 to-yellow-400 hover:from-cyan-500 hover:to-yellow-500 text-black font-semibold px-6 py-3 rounded-lg">
              Subscribe
            </Button>
          </div>
          
          <p className="text-white/40 text-sm">
            No spam. Unsubscribe anytime. Join 25,000+ traders.
          </p>
        </div>
      </div>

      {/* CTA Section */}
      <div className="border-t border-white/10 bg-black/20">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center space-y-6">
          <h2 className="text-3xl font-bold text-white">
            Ready to Apply These Insights?
          </h2>
          <p className="text-white/70 text-lg">
            Put market research into action with our professional trading tools.
          </p>
          <Button
            onClick={() => navigate('/app')}
            size="lg"
            className="bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-black font-semibold px-8 py-4 rounded-full"
          >
            Start Trading
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}