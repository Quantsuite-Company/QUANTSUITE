import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { StrategyTemplate } from '@/lib/optionsStrategies';
import { StrategyMetrics } from '@/lib/payoffCalculator';
import { ExplanationEngine } from '@/lib/explanationEngine';
import { ChevronDown, ChevronUp, DollarSign, TrendingUp, Clock, Zap } from 'lucide-react';
import { useState } from 'react';

interface StrategyExplanationPanelProps {
  strategy: StrategyTemplate;
  metrics: StrategyMetrics;
}

export const StrategyExplanationPanel = ({ strategy, metrics }: StrategyExplanationPanelProps) => {
  const [isOpen, setIsOpen] = useState(true);
  
  // Generate explanation using the engine
  const engine = new ExplanationEngine('strategy', {}, {});
  const explanation = engine.explainStrategy(strategy, metrics);

  const profitRatio = metrics.maxProfit / (metrics.maxProfit + Math.abs(metrics.maxLoss));
  const lossRatio = Math.abs(metrics.maxLoss) / (metrics.maxProfit + Math.abs(metrics.maxLoss));

  const getRiskEmoji = (level: string) => {
    switch (level) {
      case 'low': return '🟢';
      case 'medium': return '🟡';
      case 'high': return '🔴';
      default: return '⚪';
    }
  };

  const formatCurrency = (value: number) => {
    return `₹${Math.abs(value).toFixed(0)}`;
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="p-6 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              {strategy.icon} {explanation.headline}
            </h2>
            {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="space-y-6 mt-4">
            {/* Main Insight */}
            <div className="p-4 bg-card rounded-lg border border-border">
              <p className="text-base leading-relaxed">{explanation.simpleInsight}</p>
            </div>

            {/* Money Story */}
            <div className="p-5 bg-gradient-to-br from-green-500/10 to-blue-500/10 rounded-lg border border-green-500/20">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-6 h-6 text-green-600" />
                <h3 className="text-xl font-bold">💰 YOUR MONEY STORY</h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">You're putting in:</span>
                  <span className="text-xl font-bold text-orange-600">{formatCurrency(metrics.capitalRequired)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Best case (you make):</span>
                  <span className="text-xl font-bold text-green-600">
                    {formatCurrency(metrics.maxProfit)} 🎉
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Worst case (you lose):</span>
                  <span className="text-xl font-bold text-red-600">
                    {formatCurrency(metrics.maxLoss)} 😬
                  </span>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Profit Zone</span>
                    <span>Loss Zone</span>
                  </div>
                  <div className="flex gap-1 h-6 rounded overflow-hidden">
                    <div 
                      className="bg-green-500 flex items-center justify-center text-white text-xs font-bold"
                      style={{ width: `${profitRatio * 100}%` }}
                    >
                      {(profitRatio * 100).toFixed(0)}%
                    </div>
                    <div 
                      className="bg-red-500 flex items-center justify-center text-white text-xs font-bold"
                      style={{ width: `${lossRatio * 100}%` }}
                    >
                      {(lossRatio * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Reading Your Graph */}
            <div className="p-5 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-6 h-6 text-blue-600" />
                <h3 className="text-xl font-bold">📈 READING YOUR GRAPH</h3>
              </div>
              
              <div className="space-y-2 text-sm">
                <p className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">●</span>
                  <span><strong>Green line:</strong> Your profit/loss on the last day (expiration)</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-yellow-500 font-bold">●</span>
                  <span><strong>Yellow line:</strong> If you close in 30 days (time decay starting)</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-purple-500 font-bold">●</span>
                  <span><strong>Purple line:</strong> If you close in 60 days (less time decay)</span>
                </p>
                {metrics.breakevens.length > 0 && (
                  <p className="flex items-start gap-2 mt-3 p-2 bg-yellow-500/10 rounded">
                    <span className="text-yellow-600 font-bold">⚠️</span>
                    <span>
                      <strong>Danger zones:</strong> If stock goes beyond{' '}
                      {metrics.breakevens.map((b, i) => (
                        <span key={i}>
                          {i > 0 && ' or '}
                          <strong className="text-yellow-600">₹{b.toFixed(2)}</strong>
                        </span>
                      ))}
                      , you start losing money!
                    </span>
                  </p>
                )}
              </div>
            </div>

            {/* Time & Chaos Meter */}
            <div className="p-5 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-6 h-6 text-purple-600" />
                <h3 className="text-xl font-bold">⏰ TIME & CHAOS METER</h3>
              </div>
              
              <div className="space-y-4">
                {/* Time Decay */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">
                      {metrics.netTheta > 0 ? "Time is your friend! 🕐" : "Time is eating your profits! ⏰"}
                    </span>
                    <Badge variant={metrics.netTheta > 0 ? "default" : "destructive"}>
                      {metrics.netTheta > 0 ? '+' : ''}{formatCurrency(metrics.netTheta)}/day
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {metrics.netTheta > 0 
                      ? "Every day that passes, you earn money (like ice cream gaining flavor!)"
                      : "Every day that passes costs you money (like ice cream melting!)"}
                  </p>
                </div>

                {/* Volatility */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">
                      {Math.abs(metrics.netVega) > 20 ? "Market chaos: Big deal! 🌪️" : "Market chaos: Meh 😌"}
                    </span>
                    <Badge variant="outline">
                      Vega: {metrics.netVega.toFixed(1)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {metrics.netVega > 20 
                      ? "If market goes crazy, you profit!"
                      : metrics.netVega < -20
                      ? "If market goes crazy, you lose money!"
                      : "Market craziness doesn't affect you much"}
                  </p>
                </div>

                {/* Direction */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">
                      {Math.abs(metrics.netDelta) < 0.1 ? "Stock direction: Don't care! 🤷" : "Stock direction: Matters! 🎯"}
                    </span>
                    <Badge variant="outline">
                      Delta: {metrics.netDelta.toFixed(2)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {Math.abs(metrics.netDelta) < 0.1
                      ? "Stock up or down doesn't matter much (neutral strategy)"
                      : metrics.netDelta > 0
                      ? "You want stock to go UP!"
                      : "You want stock to go DOWN!"}
                  </p>
                </div>
              </div>
            </div>

            {/* Game Plan */}
            <div className="p-5 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-lg border border-orange-500/20">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-6 h-6 text-orange-600" />
                <h3 className="text-xl font-bold">🎮 YOUR GAME PLAN</h3>
              </div>
              
              <div className="space-y-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-green-600 font-bold">✅</span>
                    <span className="text-sm font-medium">Buy when:</span>
                  </div>
                  <p className="text-sm text-muted-foreground ml-6">{strategy.idealConditions}</p>
                </div>
                
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-red-600 font-bold">❌</span>
                    <span className="text-sm font-medium">Watch out for:</span>
                  </div>
                  <p className="text-sm text-muted-foreground ml-6">
                    {metrics.netTheta < 0 && "Time decay eating your profits • "}
                    {metrics.breakevens.length > 0 && `Stock moving beyond ₹${metrics.breakevens[0]?.toFixed(0)} or ₹${metrics.breakevens[metrics.breakevens.length - 1]?.toFixed(0)} • `}
                    {explanation.riskLevel === 'high' && "High risk - don't bet the farm!"}
                    {explanation.riskLevel === 'medium' && "Moderate risk - size your position wisely"}
                    {explanation.riskLevel === 'low' && "Low risk - good for beginners"}
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-blue-600 font-bold">🎯</span>
                    <span className="text-sm font-medium">Close position when:</span>
                  </div>
                  <p className="text-sm text-muted-foreground ml-6">
                    {metrics.maxProfit > 0 && `You've captured ${((metrics.maxProfit * 0.5) / metrics.capitalRequired * 100).toFixed(0)}%+ of max profit • `}
                    {metrics.netTheta < 0 && "Time decay is killing you • "}
                    Stock approaching danger zones
                  </p>
                </div>

                <div className="mt-4 p-3 bg-primary/10 rounded border border-primary/20">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-lg">💡</span>
                    <strong>Pro tip:</strong>
                    <span className="text-muted-foreground">{explanation.analogy}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Risk Badge */}
            <div className="flex items-center justify-center gap-2 text-sm">
              <span className="text-2xl">{getRiskEmoji(explanation.riskLevel)}</span>
              <span className="font-medium">
                This is a <strong className={
                  explanation.riskLevel === 'low' ? 'text-success' :
                  explanation.riskLevel === 'medium' ? 'text-warning' : 'text-destructive'
                }>{explanation.riskLevel.toUpperCase()} RISK</strong> strategy
              </span>
            </div>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
