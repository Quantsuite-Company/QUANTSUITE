import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExplanationEngine, ModelInputs, ModelOutputs, ExplanationResult } from '@/lib/explanationEngine';
import { Brain, ChevronDown, ChevronUp, Copy, Lightbulb } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

interface UniversalExplanationPanelProps {
  modelName: string;
  inputs: ModelInputs;
  outputs: ModelOutputs;
  className?: string;
}

export const UniversalExplanationPanel: React.FC<UniversalExplanationPanelProps> = ({
  modelName,
  inputs,
  outputs,
  className = ""
}) => {
  const [showDeepDive, setShowDeepDive] = useState(false);
  const { toast } = useToast();

  const engine = new ExplanationEngine(modelName, inputs, outputs);
  const explanation: ExplanationResult = engine.explain();

  const handleCopy = async () => {
    const fullText = `${explanation.headline}\n\n${explanation.simpleInsight}\n\n${explanation.analogy}\n\n--- Technical Details ---\n${explanation.deeperDive}`;
    
    try {
      await navigator.clipboard.writeText(fullText);
      toast({
        title: "Copied to clipboard! 📋",
        description: "The explanation has been copied to your clipboard.",
      });
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-500/20 text-green-700 border-green-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30';
      case 'high': return 'bg-red-500/20 text-red-700 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-700 border-gray-500/30';
    }
  };

  const getRiskEmoji = (risk: string) => {
    switch (risk) {
      case 'low': return '🛡️';
      case 'medium': return '⚖️';
      case 'high': return '🚨';
      default: return '❓';
    }
  };

  return (
    <Card className={`border-2 border-primary/20 bg-gradient-to-br from-background to-muted/30 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-lg font-bold text-primary flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            QuantSuite Explains
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={getRiskColor(explanation.riskLevel)}>
              {getRiskEmoji(explanation.riskLevel)} {explanation.riskLevel.toUpperCase()} RISK
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="text-xs"
            >
              <Copy className="w-3 h-3 mr-1" />
              Copy
            </Button>
          </div>
        </div>
        
        {/* Confidence meter */}
        <div className="mt-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>AI Confidence</span>
            <span>{Math.round(explanation.confidence * 100)}%</span>
          </div>
          <Progress value={explanation.confidence * 100} className="h-1" />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Main Headline */}
        <div className="text-center p-4 bg-primary/5 rounded-lg border border-primary/10">
          <h3 className="text-xl font-bold text-primary mb-2">
            {explanation.headline}
          </h3>
        </div>

        {/* Simple Insight */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-yellow-500" />
            <span className="font-semibold text-foreground">What This Means:</span>
          </div>
          <p className="text-foreground leading-relaxed pl-6">
            {explanation.simpleInsight}
          </p>
        </div>

        {/* Analogy */}
        <div className="bg-muted/50 p-3 rounded-lg border border-muted">
          <p className="text-sm text-muted-foreground italic">
            💡 <strong>Think of it like this:</strong> {explanation.analogy}
          </p>
        </div>

        {/* Deeper Dive Toggle */}
        <Button
          variant="outline"
          onClick={() => setShowDeepDive(!showDeepDive)}
          className="w-full flex items-center justify-center gap-2"
        >
          {showDeepDive ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {showDeepDive ? 'Hide' : 'Show'} Technical Details
        </Button>

        {/* Deeper Dive Content */}
        {showDeepDive && (
          <div className="space-y-3 p-4 bg-muted/30 rounded-lg border border-muted">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span className="font-semibold text-sm text-foreground">Technical Analysis</span>
            </div>
            <pre className="whitespace-pre-wrap text-xs leading-relaxed font-mono text-muted-foreground bg-background/50 p-3 rounded border overflow-x-auto">
              {explanation.deeperDive}
            </pre>
          </div>
        )}

        {/* Model Attribution */}
        <div className="text-center pt-2 border-t border-muted">
          <p className="text-xs text-muted-foreground">
            🤖 Powered by <strong>{modelName}</strong> analysis engine
          </p>
        </div>
      </CardContent>
    </Card>
  );
};