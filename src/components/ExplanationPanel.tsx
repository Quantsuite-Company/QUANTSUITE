import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BlackScholesParams, BlackScholesResult, generateExplanation } from '@/lib/blackScholes';
import { BookOpen, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ExplanationPanelProps {
  params: BlackScholesParams;
  result: BlackScholesResult;
  isVisible: boolean;
  onToggle: () => void;
}

export const ExplanationPanel: React.FC<ExplanationPanelProps> = ({
  params,
  result,
  isVisible,
  onToggle,
}) => {
  const { toast } = useToast();
  const explanation = generateExplanation(params, result);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(explanation);
      toast({
        title: "Copied to clipboard",
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

  return (
    <Card className="terminal-panel">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold text-primary flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Plain English Explanation
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="text-xs"
            >
              <Copy className="w-3 h-3 mr-1" />
              Copy
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onToggle}
              className="text-xs"
            >
              {isVisible ? 'Hide' : 'Show'}
            </Button>
          </div>
        </div>
      </CardHeader>
      {isVisible && (
        <CardContent>
          <div className="prose prose-sm max-w-none text-foreground">
            <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans">
              {explanation}
            </pre>
          </div>
        </CardContent>
      )}
    </Card>
  );
};