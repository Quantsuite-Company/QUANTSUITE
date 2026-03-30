import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ApiHealthDashboard } from '@/components/ApiHealthDashboard';
import { EnhancedStockSelector } from '@/components/EnhancedStockSelector';
import { OptionsDataDisplay } from '@/components/OptionsDataDisplay';
import { BarChart3, TrendingUp, Target, Zap } from 'lucide-react';

const Dashboard = () => {
  const [selectedTicker, setSelectedTicker] = React.useState('AAPL');
  const [currentPrice, setCurrentPrice] = React.useState(0);

  const overviewCards = [
    { title: "Active Stocks", value: "2,847", change: "+12% from last month", icon: BarChart3 },
    { title: "Options Chains", value: "1,234", change: "Real-time option data", icon: Target },
    { title: "API Calls", value: "89,456", change: "+4.2% success rate", icon: Zap },
    { title: "Cached Data", value: "567 MB", change: "Efficient caching active", icon: TrendingUp },
  ];

  const quickActions = [
    { label: "Options Strategy Analyzer", icon: BarChart3 },
    { label: "Volatility Surface Viewer", icon: Target },
    { label: "Greeks Calculator", icon: TrendingUp },
    { label: "Risk Analytics", icon: Zap },
  ];

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Market Data Dashboard
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            Real-time market data, API monitoring, and options analytics
          </p>
        </motion.div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="stocks">Stocks</TabsTrigger>
            <TabsTrigger value="options">Options</TabsTrigger>
            <TabsTrigger value="api">API Status</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {overviewCards.map((card, index) => (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  transition={{ delay: 0.1 + index * 0.05, duration: 0.3 }}
                >
                  <Card className="bg-card/40 backdrop-blur-xl border-border/30 hover:border-border/60 transition-all">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-foreground">{card.title}</CardTitle>
                      <card.icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-foreground">{card.value}</div>
                      <p className="text-xs text-muted-foreground">
                        {card.change}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
              >
                <EnhancedStockSelector
                  ticker={selectedTicker}
                  onTickerChange={setSelectedTicker}
                  onPriceUpdate={setCurrentPrice}
                  showCompanyInfo={true}
                />
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.4 }}
              >
                <Card className="bg-card/40 backdrop-blur-xl border-border/30">
                  <CardHeader>
                    <CardTitle className="text-foreground">Quick Actions</CardTitle>
                    <CardDescription>
                      Common tasks and calculations
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {quickActions.map((action, index) => (
                      <motion.div
                        key={action.label}
                        whileHover={{ scale: 1.02, x: 4 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Button className="w-full justify-start" variant="outline">
                          <action.icon className="mr-2 h-4 w-4" />
                          {action.label}
                        </Button>
                      </motion.div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>

          <TabsContent value="stocks" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <EnhancedStockSelector
                ticker={selectedTicker}
                onTickerChange={setSelectedTicker}
                onPriceUpdate={setCurrentPrice}
                showCompanyInfo={true}
                showTechnicalData={true}
              />
            </motion.div>
          </TabsContent>

          <TabsContent value="options" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <OptionsDataDisplay 
                symbol={selectedTicker}
                currentPrice={currentPrice}
              />
            </motion.div>
          </TabsContent>

          <TabsContent value="api" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <ApiHealthDashboard />
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
