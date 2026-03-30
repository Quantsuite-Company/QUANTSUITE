import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { alphaVantageService, ApiUsageStats } from '@/lib/alphaVantageApi';
import { Activity, Data, Flash, RefreshCircle } from 'iconsax-react';

export const ApiHealthDashboard = () => {
  const [apiStats, setApiStats] = React.useState<ApiUsageStats>(alphaVantageService.getApiUsage());
  const [cacheStats, setCacheStats] = React.useState(alphaVantageService.getCacheStats());

  const refreshStats = () => {
    setApiStats(alphaVantageService.getApiUsage());
    setCacheStats(alphaVantageService.getCacheStats());
  };

  const clearCache = () => {
    alphaVantageService.clearCache();
    refreshStats();
  };

  const successRate = apiStats.totalRequests > 0 
    ? (apiStats.successfulRequests / apiStats.totalRequests) * 100 
    : 0;

  const getHealthStatus = () => {
    if (successRate >= 90) return { status: 'Excellent', color: 'bg-green-500', variant: 'default' as const };
    if (successRate >= 70) return { status: 'Good', color: 'bg-yellow-500', variant: 'secondary' as const };
    return { status: 'Poor', color: 'bg-red-500', variant: 'destructive' as const };
  };

  const healthStatus = getHealthStatus();

  React.useEffect(() => {
    const interval = setInterval(refreshStats, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity size={20} variant="Bold" className="text-primary" />
              API Health Dashboard
            </CardTitle>
            <CardDescription>
              Monitor Alpha Vantage API usage and performance
            </CardDescription>
          </div>
          <Button onClick={refreshStats} variant="outline" size="sm">
            <RefreshCircle size={16} className="mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Health Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${healthStatus.color}`} />
              <span className="text-sm font-medium">API Health</span>
            </div>
            <Badge variant={healthStatus.variant}>{healthStatus.status}</Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Flash size={16} className="text-muted-foreground" />
              <span className="text-sm font-medium">Success Rate</span>
            </div>
            <div className="space-y-1">
              <Progress value={successRate} className="h-2" />
              <span className="text-xs text-muted-foreground">{successRate.toFixed(1)}%</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Data size={16} className="text-muted-foreground" />
              <span className="text-sm font-medium">Cache Entries</span>
            </div>
            <div className="text-2xl font-bold text-primary">{cacheStats.size}</div>
          </div>
        </div>

        {/* Detailed Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Total Requests</div>
            <div className="text-xl font-semibold">{apiStats.totalRequests}</div>
          </div>
          
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Successful</div>
            <div className="text-xl font-semibold text-green-600">{apiStats.successfulRequests}</div>
          </div>
          
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Rate Limited</div>
            <div className="text-xl font-semibold text-red-600">{apiStats.rateLimitHits}</div>
          </div>
          
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Uptime</div>
            <div className="text-xl font-semibold">
              {Math.floor((Date.now() - apiStats.lastResetTime) / (1000 * 60))}m
            </div>
          </div>
        </div>

        {/* Cache Management */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium">Cache Management</h4>
            <Button onClick={clearCache} variant="outline" size="sm">
              Clear Cache
            </Button>
          </div>
          
          <div className="text-sm text-muted-foreground mb-2">
            Cached endpoints ({cacheStats.size} total):
          </div>
          
          <div className="max-h-32 overflow-y-auto space-y-1">
            {cacheStats.entries.length > 0 ? (
              cacheStats.entries.map((entry, index) => (
                <div key={index} className="text-xs bg-muted/50 rounded px-2 py-1">
                  {entry}
                </div>
              ))
            ) : (
              <div className="text-xs text-muted-foreground italic">No cached entries</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};