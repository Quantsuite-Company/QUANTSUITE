import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Zap, Target, Shield } from 'lucide-react';

interface PromptComposerProps {
  onGenerate: (prompt: string, config: StrategyConfig) => void;
  isLoading: boolean;
}

export interface StrategyConfig {
  universe: string;
  frequency: string;
  maxPositionSize: number;
  stopLoss: number;
  takeProfit: number;
}

export const PromptComposer = ({ onGenerate, isLoading }: PromptComposerProps) => {
  const [prompt, setPrompt] = useState('');
  const [config, setConfig] = useState<StrategyConfig>({
    universe: 'NIFTY 50',
    frequency: 'daily',
    maxPositionSize: 2,
    stopLoss: 8,
    takeProfit: 12,
  });

  const examplePrompts = [
    "Mean reversion on midcaps: buy RSI < 30, sell RSI > 70, 2% position size",
    "Momentum strategy: buy 20-day high breakout with volume confirmation",
    "Pairs trading HDFC Bank vs ICICI Bank, spread entry at 2 sigma",
    "Index arbitrage between Nifty futures and spot with transaction costs",
  ];

  const handleSubmit = () => {
    if (!prompt.trim()) return;
    onGenerate(prompt, config);
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-slate-700">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-br from-primary to-primary/60 rounded-lg">
          <Sparkles className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Strategy Prompt
          </h2>
          <p className="text-sm text-muted-foreground">
            Describe your trading strategy in plain English
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Main Prompt */}
        <div>
          <Label htmlFor="prompt" className="text-base font-medium mb-2 flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            Your Strategy Idea
          </Label>
          <Textarea
            id="prompt"
            placeholder="E.g., Long India midcaps, buy on RSI dip below 30, stop 8%, 2% portfolio max position, rebalance weekly..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[120px] bg-slate-950/50 border-slate-600 text-foreground"
            disabled={isLoading}
          />
        </div>

        {/* Instant Strategy Templates */}
        <div>
          <Label className="text-sm font-semibold mb-3 block">⚡ Instant Strategy Templates - Click to Load</Label>
          <div className="grid grid-cols-5 gap-2">
            {[
              { num: "1", title: "RSI Mean Reversion", prompt: "Long India midcaps when 14-day RSI < 30 and price below 50-day SMA, exit at 12% profit or 8% stop loss, max 2% position size, weekly rebalance" },
              { num: "2", title: "Momentum Breakout", prompt: "Buy stocks breaking 52-week high with volume 2x above average, hold for 20 days or until 15% gain or 10% loss, max 3% per position" },
              { num: "3", title: "Pairs Trading", prompt: "Trade RELIANCE vs ONGC pair, enter when spread > 2 std dev, exit at mean reversion, 5% stop on spread widening, equal dollar neutral" },
              { num: "4", title: "Dividend Capture", prompt: "Buy high-dividend NIFTY 50 stocks 5 days before ex-date, sell 2 days after, only if P/E < sector average, 4% max position" },
              { num: "5", title: "Trend Following", prompt: "Long when 50-day SMA crosses above 200-day SMA with increasing volume, trail stop at 2 ATR, pyramid up to 5% total exposure" },
            ].map((template) => (
              <button
                key={template.num}
                type="button"
                onClick={() => setPrompt(template.prompt)}
                className="group relative p-3 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 hover:from-primary/20 hover:to-accent/20 border border-primary/30 hover:border-primary/50 transition-all text-left overflow-hidden"
                disabled={isLoading}
              >
                <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-primary">{template.num}</span>
                </div>
                <div className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors mb-1">
                  {template.title}
                </div>
                <p className="text-[10px] text-muted-foreground line-clamp-2 group-hover:text-foreground/80 transition-colors">
                  {template.prompt}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Configuration */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-slate-700">
          <div>
            <Label htmlFor="universe" className="text-sm flex items-center gap-2">
              <Target className="h-3 w-3 text-primary" />
              Universe
            </Label>
            <Input
              id="universe"
              value={config.universe}
              onChange={(e) => setConfig({ ...config, universe: e.target.value })}
              className="bg-slate-950/50 border-slate-600"
              placeholder="NIFTY 50, Midcaps, etc."
              disabled={isLoading}
            />
          </div>
          
          <div>
            <Label htmlFor="frequency" className="text-sm">Frequency</Label>
            <Input
              id="frequency"
              value={config.frequency}
              onChange={(e) => setConfig({ ...config, frequency: e.target.value })}
              className="bg-slate-950/50 border-slate-600"
              placeholder="daily, weekly, etc."
              disabled={isLoading}
            />
          </div>
          
          <div>
            <Label htmlFor="maxPosition" className="text-sm flex items-center gap-2">
              <Shield className="h-3 w-3 text-warning" />
              Max Position (%)
            </Label>
            <Input
              id="maxPosition"
              type="number"
              value={config.maxPositionSize}
              onChange={(e) => setConfig({ ...config, maxPositionSize: Number(e.target.value) })}
              className="bg-slate-950/50 border-slate-600"
              min={0.1}
              max={100}
              step={0.1}
              disabled={isLoading}
            />
          </div>
          
          <div>
            <Label htmlFor="stopLoss" className="text-sm">Stop Loss (%)</Label>
            <Input
              id="stopLoss"
              type="number"
              value={config.stopLoss}
              onChange={(e) => setConfig({ ...config, stopLoss: Number(e.target.value) })}
              className="bg-slate-950/50 border-slate-600"
              min={0}
              max={100}
              step={0.1}
              disabled={isLoading}
            />
          </div>
          
          <div>
            <Label htmlFor="takeProfit" className="text-sm">Take Profit (%)</Label>
            <Input
              id="takeProfit"
              type="number"
              value={config.takeProfit}
              onChange={(e) => setConfig({ ...config, takeProfit: Number(e.target.value) })}
              className="bg-slate-950/50 border-slate-600"
              min={0}
              max={1000}
              step={0.1}
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleSubmit}
          disabled={!prompt.trim() || isLoading}
          className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground font-semibold text-base h-12"
        >
          {isLoading ? (
            <>
              <Sparkles className="h-5 w-5 mr-2 animate-spin" />
              Generating Strategy...
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5 mr-2" />
              Generate Strategy
            </>
          )}
        </Button>
      </div>
    </Card>
  );
};
