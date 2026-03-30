import { useState } from 'react';
import DOMPurify from 'dompurify';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Code, FileText, Shield, TrendingUp, AlertTriangle, Download, RefreshCw } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

interface StrategyDisplayProps {
  strategy: {
    strategy: {
      name: string;
      universe: string;
      frequency: string;
      entry_logic: string;
      exit_logic: string;
      risk_limits: string[];
    };
    code: string;
    explanation: string;
    parameters: Record<string, any>;
    risk_analysis: {
      max_position_exposure: string;
      max_drawdown_target: string;
      leverage: string;
      concentration_limit: string;
    };
    validation?: {
      safe: boolean;
      violations?: string[];
      message: string;
    };
  };
  onParametersChange?: (params: Record<string, any>) => void;
}

export const StrategyDisplay = ({ strategy, onParametersChange }: StrategyDisplayProps) => {
  const [parameters, setParameters] = useState(strategy.parameters);
  const { toast } = useToast();
  
  const handleParameterChange = (key: string, value: number) => {
    const newParams = { ...parameters, [key]: value };
    setParameters(newParams);
    onParametersChange?.(newParams);
  };
  
  const exportToPython = () => {
    const blob = new Blob([strategy.code], { type: 'text/x-python' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${strategy.strategy.name.replace(/\s+/g, '_').toLowerCase()}.py`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Strategy Exported",
      description: "Python file downloaded successfully",
    });
  };
  
  const formatExplanation = (text: string) => {
    // Remove all ** markdown
    let cleaned = text.replace(/\*\*/g, '');
    
    // Split into main sections
    const assumptionsIndex = cleaned.indexOf('Assumptions:');
    const risksIndex = cleaned.indexOf('Key Risks:');
    
    const mainStrategy = assumptionsIndex > 0 ? cleaned.substring(0, assumptionsIndex).trim() : cleaned;
    const assumptionsText = assumptionsIndex > 0 && risksIndex > 0 
      ? cleaned.substring(assumptionsIndex, risksIndex).trim() 
      : '';
    const risksText = risksIndex > 0 ? cleaned.substring(risksIndex).trim() : '';
    
    // Parse assumptions into individual items
    const parseSection = (text: string, startMarker: string) => {
      const items: string[] = [];
      const content = text.replace(startMarker, '').trim();
      const matches = content.match(/\d+\.\s+[^:]+:\s+[^]+?(?=\d+\.|$)/g);
      
      if (matches) {
        return matches.map(item => item.trim());
      }
      return [content];
    };
    
    const assumptions = assumptionsText ? parseSection(assumptionsText, 'Assumptions:') : [];
    const risks = risksText ? parseSection(risksText, 'Key Risks:') : [];
    
    // Build HTML structure
    let html = `<div class="space-y-6">`;
    
    // Main strategy description
    if (mainStrategy) {
      html += `
        <div class="text-base leading-7 text-foreground">
          ${mainStrategy}
        </div>
      `;
    }
    
    // Assumptions section
    if (assumptions.length > 0) {
      html += `
        <div class="space-y-3">
          <h4 class="flex items-center gap-2 text-sm font-semibold text-primary">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            Underlying Assumptions
          </h4>
          <div class="space-y-3">
            ${assumptions.map(item => `
              <p class="text-sm leading-7 text-muted-foreground pl-4 border-l-2 border-primary/30 hover:border-primary/50 transition-colors">
                ${item}
              </p>
            `).join('')}
          </div>
        </div>
      `;
    }
    
    // Key risks section
    if (risks.length > 0) {
      html += `
        <div class="space-y-3">
          <h4 class="flex items-center gap-2 text-sm font-semibold text-amber-500">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
            Key Risk Factors
          </h4>
          <div class="space-y-3">
            ${risks.map(item => `
              <p class="text-sm leading-7 text-muted-foreground pl-4 border-l-2 border-amber-500/30 hover:border-amber-500/50 transition-colors">
                ${item}
              </p>
            `).join('')}
          </div>
        </div>
      `;
    }
    
    html += `</div>`;
    return html;
  };
  
  return (
    <Card className="p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-slate-700">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              {strategy.strategy.name}
            </h2>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline" className="border-primary/50 text-primary">
                {strategy.strategy.universe}
              </Badge>
              <Badge variant="outline" className="border-accent/50 text-accent">
                {strategy.strategy.frequency}
              </Badge>
            </div>
          </div>
          <div className="flex gap-2 flex-col items-end">
            <div className="flex gap-2">
              {strategy.validation?.safe ? (
                <Badge className="bg-success/20 text-success border-success/50">
                  ✓ Safe
                </Badge>
              ) : (
                <Badge className="bg-destructive/20 text-destructive border-destructive/50">
                  ⚠ Unsafe
                </Badge>
              )}
              <Badge className="bg-warning/20 text-warning border-warning/50">
                <Shield className="h-3 w-3 mr-1" />
                Risk Checked
              </Badge>
            </div>
            <Button 
              size="sm" 
              onClick={exportToPython}
              className="bg-primary/20 hover:bg-primary/30 text-primary"
            >
              <Download className="h-4 w-4 mr-2" />
              Export .py
            </Button>
          </div>
        </div>
        
        {strategy.validation && !strategy.validation.safe && (
          <Alert className="bg-destructive/10 border-destructive/50 mt-3">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-sm">
              <p className="font-semibold text-destructive mb-1">Code Validation Failed</p>
              <p className="text-muted-foreground">
                {strategy.validation.message}
              </p>
            </AlertDescription>
          </Alert>
        )}
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid grid-cols-4 mb-4 bg-slate-950/50">
          <TabsTrigger value="overview" className="data-[state=active]:bg-primary/20">
            <FileText className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="code" className="data-[state=active]:bg-primary/20">
            <Code className="h-4 w-4 mr-2" />
            Code
          </TabsTrigger>
          <TabsTrigger value="parameters" className="data-[state=active]:bg-primary/20">
            <TrendingUp className="h-4 w-4 mr-2" />
            Parameters
          </TabsTrigger>
          <TabsTrigger value="risk" className="data-[state=active]:bg-primary/20">
            <Shield className="h-4 w-4 mr-2" />
            Risk Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="space-y-4">
            <div className="relative p-6 bg-gradient-to-br from-slate-950 via-slate-900/90 to-slate-950 rounded-xl border border-primary/20 shadow-[0_0_30px_-5px_hsl(var(--primary)/0.15)] overflow-hidden group hover:shadow-[0_0_40px_-5px_hsl(var(--primary)/0.25)] transition-all duration-500">
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-50"></div>
              
              {/* Content */}
              <div className="relative">
                <h3 className="font-bold mb-4 text-lg bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary animate-pulse" />
                  Strategy Explanation
                </h3>
                <div 
                  className="text-[15px] leading-[2] tracking-wide text-foreground/90 [&_strong]:font-semibold [&_strong]:text-primary/90 [&_strong]:text-[1.02em]"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formatExplanation(strategy.explanation)) }}
                />
              </div>
              
              {/* Bottom accent line */}
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-success/5 rounded-lg border border-success/20">
                <h4 className="font-semibold mb-2 text-success">Entry Logic</h4>
                <p className="text-sm text-muted-foreground">{strategy.strategy.entry_logic}</p>
              </div>
              
              <div className="p-4 bg-destructive/5 rounded-lg border border-destructive/20">
                <h4 className="font-semibold mb-2 text-destructive">Exit Logic</h4>
                <p className="text-sm text-muted-foreground">{strategy.strategy.exit_logic}</p>
              </div>
            </div>

            <div className="p-4 bg-warning/5 rounded-lg border border-warning/20">
              <h4 className="font-semibold mb-2 text-warning flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Risk Limits
              </h4>
              <ul className="space-y-1">
                {strategy.strategy.risk_limits.map((limit, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                    <span className="text-warning">•</span>
                    {limit}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="code">
          <ScrollArea className="h-[400px] w-full rounded-lg border border-slate-700 bg-slate-950/80 p-4">
            <pre className="text-sm text-muted-foreground font-mono">
              <code>{strategy.code}</code>
            </pre>
          </ScrollArea>
          <Alert className="mt-4 bg-primary/5 border-primary/20">
            <Code className="h-4 w-4 text-primary" />
            <AlertDescription className="text-sm">
              This code is sandboxed and validated. No external API calls, file operations, or unsafe functions are allowed.
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="parameters">
          <div className="space-y-6">
            <Alert className="bg-accent/5 border-accent/20">
              <RefreshCw className="h-4 w-4 text-accent" />
              <AlertDescription className="text-sm">
                Adjust parameters below and re-run backtest to see the impact. Changes are applied in real-time.
              </AlertDescription>
            </Alert>
            
            <div className="grid gap-6">
              {Object.entries(parameters).map(([key, value]) => {
                if (typeof value !== 'number') {
                  return (
                    <div key={key} className="p-4 bg-slate-950/50 rounded-lg border border-slate-700">
                      <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                        {key.replace(/_/g, ' ')}
                      </div>
                      <div className="text-xl font-bold text-primary">{value}</div>
                    </div>
                  );
                }
                
                // Determine range based on parameter name
                let min = 0, max = 100, step = 1;
                if (key.includes('period')) { min = 5; max = 50; step = 1; }
                else if (key.includes('stop') || key.includes('loss')) { min = 1; max = 50; step = 0.5; }
                else if (key.includes('profit') || key.includes('take')) { min = 1; max = 100; step = 1; }
                else if (key.includes('size') || key.includes('position')) { min = 0.5; max = 10; step = 0.1; }
                
                return (
                  <div key={key} className="p-4 bg-slate-950/50 rounded-lg border border-slate-700">
                    <div className="flex justify-between items-center mb-3">
                      <Label className="text-sm font-semibold uppercase tracking-wide">
                        {key.replace(/_/g, ' ')}
                      </Label>
                      <span className="text-2xl font-bold text-primary">
                        {parameters[key].toFixed(key.includes('period') ? 0 : 2)}
                      </span>
                    </div>
                    <Slider
                      value={[parameters[key]]}
                      onValueChange={([val]) => handleParameterChange(key, val)}
                      min={min}
                      max={max}
                      step={step}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-2">
                      <span>{min}</span>
                      <span>{max}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="risk">
          <div className="grid md:grid-cols-2 gap-4">
            {Object.entries(strategy.risk_analysis).map(([key, value]) => (
              <div key={key} className="p-4 bg-slate-950/50 rounded-lg border border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-warning" />
                  <h4 className="font-semibold text-sm uppercase tracking-wide">
                    {key.replace(/_/g, ' ')}
                  </h4>
                </div>
                <p className="text-lg font-bold text-foreground">{value}</p>
              </div>
            ))}
          </div>
          
          <Alert className="mt-4 bg-warning/5 border-warning/20">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <AlertDescription className="text-sm">
              All strategies are subject to position limits, leverage caps, and concentration controls.
              Paper trading is required for 90 days before live deployment.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </Card>
  );
};
