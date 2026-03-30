import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TrendingUp, TrendingDown, Target, Clock, Zap, DollarSign, Percent, Calendar, Triangle, Gauge, Timer, Wind, BarChart3 } from 'lucide-react';

const Advisor = () => {
  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Options Trading Advisor
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            A beginner's guide to understanding call options, put options, and the Black-Scholes model
          </p>
        </div>

        {/* Call vs Put Options */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-2 border-param-stock/30 hover:border-param-stock/60 transition-all duration-300">
            <CardHeader className="bg-param-stock/10 rounded-t-lg">
              <CardTitle className="flex items-center gap-3 text-param-stock">
                <TrendingUp className="w-8 h-8" />
                Call Options
                <Badge variant="secondary" className="bg-param-stock/20 text-param-stock">BULLISH</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <p className="text-lg">
                A <strong>Call Option</strong> gives you the <span className="text-param-stock font-semibold">right to BUY</span> a stock at a specific price.
              </p>
              <div className="space-y-3">
                <div className="p-3 bg-param-stock/5 rounded-lg">
                  <h4 className="font-semibold text-param-stock mb-2">When to use:</h4>
                  <p>When you think the stock price will <strong>GO UP</strong></p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-2">Example:</h4>
                  <p>Stock is $100. You buy a call with $105 strike. If stock goes to $120, you can buy it for $105 and profit $15!</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-param-strike/30 hover:border-param-strike/60 transition-all duration-300">
            <CardHeader className="bg-param-strike/10 rounded-t-lg">
              <CardTitle className="flex items-center gap-3 text-param-strike">
                <TrendingDown className="w-8 h-8" />
                Put Options
                <Badge variant="secondary" className="bg-param-strike/20 text-param-strike">BEARISH</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <p className="text-lg">
                A <strong>Put Option</strong> gives you the <span className="text-param-strike font-semibold">right to SELL</span> a stock at a specific price.
              </p>
              <div className="space-y-3">
                <div className="p-3 bg-param-strike/5 rounded-lg">
                  <h4 className="font-semibold text-param-strike mb-2">When to use:</h4>
                  <p>When you think the stock price will <strong>GO DOWN</strong></p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-2">Example:</h4>
                  <p>Stock is $100. You buy a put with $95 strike. If stock drops to $80, you can sell it for $95 and profit $15!</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-8" />

        {/* Parameters Guide */}
        <div>
          <h2 className="text-3xl font-bold text-center mb-8 text-primary">
            Understanding the Parameters
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Stock Price */}
            <Card className="border-param-stock/30 hover:border-param-stock transition-all duration-300 hover:shadow-lg hover:shadow-param-stock/20">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-param-stock">
                  <DollarSign className="w-6 h-6" />
                  Stock Price (S)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">Current market price of the stock</p>
                <div className="p-3 bg-param-stock/5 rounded-lg">
                  <p className="font-semibold text-param-stock">Higher stock price = Higher call value</p>
                  <p className="text-sm">The stock is worth more, so the right to buy it becomes more valuable</p>
                </div>
              </CardContent>
            </Card>

            {/* Strike Price */}
            <Card className="border-param-strike/30 hover:border-param-strike transition-all duration-300 hover:shadow-lg hover:shadow-param-strike/20">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-param-strike">
                  <Target className="w-6 h-6" />
                  Strike Price (K)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">The price you can buy/sell at</p>
                <div className="p-3 bg-param-strike/5 rounded-lg">
                  <p className="font-semibold text-param-strike">Your "target" price</p>
                  <p className="text-sm">Like setting a price alert - this is where the option kicks in</p>
                </div>
              </CardContent>
            </Card>

            {/* Time to Expiration */}
            <Card className="border-param-time/30 hover:border-param-time transition-all duration-300 hover:shadow-lg hover:shadow-param-time/20">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-param-time">
                  <Clock className="w-6 h-6" />
                  Time (T)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">How long until the option expires</p>
                <div className="p-3 bg-param-time/5 rounded-lg">
                  <p className="font-semibold text-param-time">More time = More opportunity</p>
                  <p className="text-sm">Longer time gives the stock more chances to move in your favor</p>
                </div>
              </CardContent>
            </Card>

            {/* Volatility */}
            <Card className="border-param-volatility/30 hover:border-param-volatility transition-all duration-300 hover:shadow-lg hover:shadow-param-volatility/20">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-param-volatility">
                  <Zap className="w-6 h-6" />
                  Volatility (σ)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">How much the stock price jumps around</p>
                <div className="p-3 bg-param-volatility/5 rounded-lg">
                  <p className="font-semibold text-param-volatility">Wild stock = Valuable options</p>
                  <p className="text-sm">If a stock moves a lot, options become more valuable</p>
                </div>
              </CardContent>
            </Card>

            {/* Risk-Free Rate */}
            <Card className="border-param-rate/30 hover:border-param-rate transition-all duration-300 hover:shadow-lg hover:shadow-param-rate/20">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-param-rate">
                  <Percent className="w-6 h-6" />
                  Risk-Free Rate (r)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">Interest rate on "safe" investments</p>
                <div className="p-3 bg-param-rate/5 rounded-lg">
                  <p className="font-semibold text-param-rate">Higher rates favor calls</p>
                  <p className="text-sm">Like comparing to a savings account interest rate</p>
                </div>
              </CardContent>
            </Card>

            {/* Dividend Yield */}
            <Card className="border-param-dividend/30 hover:border-param-dividend transition-all duration-300 hover:shadow-lg hover:shadow-param-dividend/20">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-param-dividend">
                  <Calendar className="w-6 h-6" />
                  Dividend Yield (q)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">How much the company pays shareholders</p>
                <div className="p-3 bg-param-dividend/5 rounded-lg">
                  <p className="font-semibold text-param-dividend">Dividends reduce call value</p>
                  <p className="text-sm">Money paid out reduces the stock's option appeal</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Separator className="my-8" />

        {/* The Greeks */}
        <div>
          <h2 className="text-3xl font-bold text-center mb-8 text-primary">
            Understanding the Greeks
          </h2>
          <p className="text-lg text-muted-foreground text-center mb-8 max-w-4xl mx-auto">
            The "Greeks" are risk measures that show how sensitive an option's price is to different factors. They help you understand how your option's value will change.
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Delta */}
            <Card className="border-param-stock/30 hover:border-param-stock transition-all duration-300 hover:shadow-lg hover:shadow-param-stock/20">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-param-stock">
                  <Triangle className="w-6 h-6" />
                  Delta (Δ)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">How much the option price changes when stock moves $1</p>
                <div className="p-3 bg-param-stock/5 rounded-lg space-y-2">
                  <p className="font-semibold text-param-stock">Call Delta: 0 to 1.0</p>
                  <p className="font-semibold text-param-stock">Put Delta: -1.0 to 0</p>
                  <p className="text-sm">Delta of 0.5 means option price moves $0.50 for every $1 stock move</p>
                </div>
              </CardContent>
            </Card>

            {/* Gamma */}
            <Card className="border-param-strike/30 hover:border-param-strike transition-all duration-300 hover:shadow-lg hover:shadow-param-strike/20">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-param-strike">
                  <Gauge className="w-6 h-6" />
                  Gamma (Γ)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">How fast Delta changes as stock price moves</p>
                <div className="p-3 bg-param-strike/5 rounded-lg">
                  <p className="font-semibold text-param-strike">Higher Gamma = Delta changes quickly</p>
                  <p className="text-sm">Shows acceleration of option price movements</p>
                </div>
              </CardContent>
            </Card>

            {/* Theta */}
            <Card className="border-param-time/30 hover:border-param-time transition-all duration-300 hover:shadow-lg hover:shadow-param-time/20">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-param-time">
                  <Timer className="w-6 h-6" />
                  Theta (Θ)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">How much option loses value each day (time decay)</p>
                <div className="p-3 bg-param-time/5 rounded-lg">
                  <p className="font-semibold text-param-time">Always negative for buyers</p>
                  <p className="text-sm">Theta of -0.05 means option loses $5 per day (per 100 shares)</p>
                </div>
              </CardContent>
            </Card>

            {/* Vega */}
            <Card className="border-param-volatility/30 hover:border-param-volatility transition-all duration-300 hover:shadow-lg hover:shadow-param-volatility/20">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-param-volatility">
                  <Wind className="w-6 h-6" />
                  Vega (ν)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">How much option price changes when volatility changes by 1%</p>
                <div className="p-3 bg-param-volatility/5 rounded-lg">
                  <p className="font-semibold text-param-volatility">Higher volatility = Higher option prices</p>
                  <p className="text-sm">Vega of 0.10 means +$10 for each 1% volatility increase</p>
                </div>
              </CardContent>
            </Card>

            {/* Rho */}
            <Card className="border-param-rate/30 hover:border-param-rate transition-all duration-300 hover:shadow-lg hover:shadow-param-rate/20">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-param-rate">
                  <BarChart3 className="w-6 h-6" />
                  Rho (ρ)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">How much option price changes when interest rates change by 1%</p>
                <div className="p-3 bg-param-rate/5 rounded-lg">
                  <p className="font-semibold text-param-rate">Usually smallest impact</p>
                  <p className="text-sm">More important for long-term options</p>
                </div>
              </CardContent>
            </Card>

            {/* Greeks Summary */}
            <Card className="border-primary/30 hover:border-primary transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 lg:col-span-1 md:col-span-2 lg:col-start-2">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Target className="w-6 h-6" />
                  Greeks in Action
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">How Greeks work together to affect option prices</p>
                <div className="p-3 bg-primary/5 rounded-lg">
                  <p className="font-semibold text-primary">All Greeks interact with each other</p>
                  <p className="text-sm">Understanding them helps predict how your option's value will change in different market conditions</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Tips */}
        <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-2xl text-center text-primary">
              🎯 Quick Tips for Beginners
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-background/80 rounded-lg">
                <h4 className="font-semibold text-primary mb-2">Start Simple</h4>
                <p className="text-sm">Begin with basic calls and puts before exploring complex strategies</p>
              </div>
              <div className="p-4 bg-background/80 rounded-lg">
                <h4 className="font-semibold text-primary mb-2">Paper Trade First</h4>
                <p className="text-sm">Practice with virtual money before risking real capital</p>
              </div>
              <div className="p-4 bg-background/80 rounded-lg">
                <h4 className="font-semibold text-primary mb-2">Understand Greeks</h4>
                <p className="text-sm">Learn how Delta, Gamma, Theta affect your positions</p>
              </div>
              <div className="p-4 bg-background/80 rounded-lg">
                <h4 className="font-semibold text-primary mb-2">Time Decay</h4>
                <p className="text-sm">Options lose value as expiration approaches - plan accordingly</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Advisor;