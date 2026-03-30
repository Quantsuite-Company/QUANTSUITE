import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { StrategyTemplate } from '@/lib/optionsStrategies';
import { TrendingUp, TrendingDown, Activity, DollarSign, AlertTriangle } from 'lucide-react';

interface StrategyInfoDialogProps {
  strategy: StrategyTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const StrategyInfoDialog = ({ strategy, open, onOpenChange }: StrategyInfoDialogProps) => {
  if (!strategy) return null;

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-success';
      case 'medium': return 'text-warning';
      case 'high': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto backdrop-blur-sm">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="text-5xl animate-bounce">{strategy.icon}</div>
            <div>
              <DialogTitle className="text-2xl font-bold">{strategy.name}</DialogTitle>
              <Badge className={`mt-1 ${getRiskColor(strategy.riskLevel)}`}>
                {strategy.riskLevel.toUpperCase()} RISK
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* What is this? */}
          <div className="p-4 bg-primary/5 rounded-lg border-l-4 border-primary">
            <div className="flex items-center gap-2 mb-3">
              <div className="text-2xl">🤔</div>
              <h3 className="text-lg font-bold">What is this?</h3>
            </div>
            <p className="text-sm leading-relaxed">{strategy.description}</p>
            <p className="text-sm text-muted-foreground mt-2">{strategy.idealConditions}</p>
          </div>

          {/* When do I use this? */}
          <div className="p-4 bg-success/5 rounded-lg border-l-4 border-success">
            <div className="flex items-center gap-2 mb-3">
              <div className="text-2xl">🎯</div>
              <h3 className="text-lg font-bold">When do I use this?</h3>
            </div>
            <ul className="space-y-2">
              {strategy.useCases.map((useCase, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <span className="text-success mt-1">✓</span>
                  <span>{useCase}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Market Outlook */}
          <div className="p-4 bg-accent/5 rounded-lg border-l-4 border-accent">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-5 h-5" />
              <h3 className="text-lg font-bold">Best Market Conditions</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {strategy.outlook.map((outlook, idx) => (
                <Badge key={idx} variant="outline" className="capitalize">
                  {outlook === 'bullish' && <TrendingUp className="w-3 h-3 mr-1" />}
                  {outlook === 'bearish' && <TrendingDown className="w-3 h-3 mr-1" />}
                  {outlook}
                </Badge>
              ))}
            </div>
          </div>

          {/* Profit & Loss Profile */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-success/10 rounded-lg text-center">
              <DollarSign className="w-8 h-8 mx-auto mb-2 text-success" />
              <div className="text-xs text-muted-foreground mb-1">Max Profit</div>
              <div className="text-xl font-bold text-success capitalize">{strategy.maxProfitType}</div>
              {strategy.maxProfitType === 'unlimited' && (
                <div className="text-xs mt-1">🚀 Sky's the limit!</div>
              )}
            </div>
            <div className="p-4 bg-destructive/10 rounded-lg text-center">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-destructive" />
              <div className="text-xs text-muted-foreground mb-1">Max Loss</div>
              <div className="text-xl font-bold text-destructive capitalize">{strategy.maxLossType}</div>
              {strategy.maxLossType === 'unlimited' && (
                <div className="text-xs mt-1">⚠️ Can be big!</div>
              )}
            </div>
          </div>

          {/* Fun Analogy */}
          <div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20">
            <div className="flex items-center gap-2 mb-2">
              <div className="text-2xl">💡</div>
              <h3 className="text-lg font-bold">Think of it like this...</h3>
            </div>
            <p className="text-sm italic">
              {strategy.id === 'iron-condor' && "You're running a parking lot. You charge money for a spot. As long as no monster trucks show up, you keep the money!"}
              {strategy.id === 'long-straddle' && "You bought insurance on both your car and your neighbor's car. If EITHER crashes, you win!"}
              {strategy.id === 'bull-call-spread' && "Like betting your team will win by at least 2 goals. You get paid if they win, but profit is capped!"}
              {strategy.id === 'covered-call' && "You're renting out a parking spot you own. You get rent money. If someone wants to buy it, you sell at the agreed price!"}
              {strategy.id === 'long-call' && "Like buying a lottery ticket - small cost, but if you win, the sky's the limit!"}
              {strategy.id === 'long-put' && "Insurance for your stocks - if they crash, you're protected!"}
              {!['iron-condor', 'long-straddle', 'bull-call-spread', 'covered-call', 'long-call', 'long-put'].includes(strategy.id) && 
                "This strategy is like playing chess - timing and positioning are everything!"}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
