import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, TickCircle, CloseCircle } from 'iconsax-react';
import { Weight, Lamp } from 'iconsax-react';

interface ComparisonItem {
  label: string;
  value: string | number;
  change?: string;
  better?: boolean;
}

interface ComparisonData {
  title?: string;
  description?: string;
  scenarios?: Array<{
    name: string;
    items: ComparisonItem[];
  }>;
  columns?: Array<{
    name: string;
    items: ComparisonItem[];
  }>;
  takeaway?: string;
}

interface ComparisonComponentProps {
  data: ComparisonData;
}

export const ComparisonComponent = ({ data }: ComparisonComponentProps) => {
  const items = data.scenarios || data.columns || [];

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Weight size={20} variant="Bold" className="text-primary" />
          {data.title || 'Compare Scenarios'}
        </CardTitle>
        {data.description && (
          <p className="text-sm text-muted-foreground mt-2">{data.description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((scenario, index) => (
            <Card key={index} className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full" />
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  {scenario.name}
                  {index === 0 && items.length === 2 && (
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {scenario.items.map((item, itemIndex) => (
                  <div 
                    key={itemIndex}
                    className="flex items-center justify-between py-2 border-b border-muted/50 last:border-0"
                  >
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{item.value}</span>
                      {item.change && (
                        <Badge 
                          variant={item.better ? "default" : "secondary"}
                          className={item.better ? "bg-green-500" : ""}
                        >
                          {item.change}
                        </Badge>
                      )}
                      {item.better !== undefined && (
                        item.better ? (
                          <TickCircle size={16} variant="Bold" className="text-green-500" />
                        ) : (
                          <CloseCircle size={16} variant="Bold" className="text-red-500" />
                        )
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Takeaway */}
        {data.takeaway && (
          <div className="mt-4 p-4 bg-primary/10 border border-primary/20 rounded-lg">
            <p className="text-sm font-semibold mb-1 flex items-center gap-2">
              <Lamp size={16} variant="Bold" className="text-primary" />
              Key Insight:
            </p>
            <p className="text-sm">{data.takeaway}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
