import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, Target } from 'lucide-react';

interface ScenarioData {
  title?: string;
  description?: string;
  setup?: {
    stock?: string;
    position?: string;
    entry?: string;
    [key: string]: any;
  };
  outcomes?: Array<{
    condition: string;
    result: string;
    profitLoss?: string;
    probability?: string;
  }>;
  lesson?: string;
}

interface ScenarioComponentProps {
  data: ScenarioData;
}

export const ScenarioComponent = ({ data }: ScenarioComponentProps) => {
  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          📊 {data.title || 'Practice Scenario'}
        </CardTitle>
        {data.description && (
          <p className="text-sm text-muted-foreground mt-2">{data.description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Setup */}
        {data.setup && (
          <Card className="bg-muted/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Target className="h-4 w-4" />
                Trade Setup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(data.setup).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground capitalize">{key}:</span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Possible Outcomes */}
        {data.outcomes && (
          <div className="space-y-3">
            <p className="text-sm font-semibold">Possible Outcomes:</p>
            {data.outcomes.map((outcome, index) => {
              const isProfit = outcome.profitLoss?.includes('+') || outcome.profitLoss?.includes('profit');
              const isLoss = outcome.profitLoss?.includes('-') || outcome.profitLoss?.includes('loss');
              
              return (
                <Card 
                  key={index}
                  className={`border-l-4 ${
                    isProfit 
                      ? 'border-l-green-500 bg-green-500/5' 
                      : isLoss 
                      ? 'border-l-red-500 bg-red-500/5'
                      : 'border-l-yellow-500 bg-yellow-500/5'
                  }`}
                >
                  <CardContent className="py-3 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="text-sm font-medium mb-1">{outcome.condition}</p>
                        <p className="text-sm text-muted-foreground">{outcome.result}</p>
                      </div>
                      {outcome.probability && (
                        <Badge variant="secondary" className="flex-shrink-0">
                          {outcome.probability}
                        </Badge>
                      )}
                    </div>
                    {outcome.profitLoss && (
                      <div className={`flex items-center gap-2 text-sm font-semibold ${
                        isProfit ? 'text-green-600 dark:text-green-400' : isLoss ? 'text-red-600 dark:text-red-400' : ''
                      }`}>
                        {isProfit ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : isLoss ? (
                          <TrendingDown className="h-4 w-4" />
                        ) : (
                          <DollarSign className="h-4 w-4" />
                        )}
                        <span>{outcome.profitLoss}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Lesson */}
        {data.lesson && (
          <div className="mt-4 p-4 bg-primary/10 border border-primary/20 rounded-lg">
            <p className="text-sm font-semibold mb-1">📚 What You Learn:</p>
            <p className="text-sm">{data.lesson}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
