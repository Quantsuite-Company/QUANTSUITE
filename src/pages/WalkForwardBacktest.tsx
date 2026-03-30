import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Play, TrendingUp, Target, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { TerminalBarChart, TerminalAreaChart } from '@/components/charts';
import { TerminalTable, ColumnDef, ValueCell } from '@/components/tables';

// Table columns for window results
const windowColumns: ColumnDef<any>[] = [
  { key: 'windowId', header: 'Window', sortable: true, render: (v) => `#${v}` },
  { key: 'trainPeriod', header: 'Train Period' },
  { key: 'testPeriod', header: 'Test Period' },
  { key: 'returns', header: 'Return', align: 'right', sortable: true, format: 'percentChange', colorByValue: true },
  { key: 'sharpe', header: 'Sharpe', align: 'right', sortable: true, format: 'number' },
  { key: 'maxDrawdown', header: 'Max DD', align: 'right', sortable: true, format: 'percent', colorByValue: true },
];

const WalkForwardBacktest = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [trainDays, setTrainDays] = useState(126);
  const [testDays, setTestDays] = useState(21);
  const [retrainFrequency, setRetrainFrequency] = useState(21);
  const [universe, setUniverse] = useState('SP500_TOP50');

  const { data: results, isLoading, refetch } = useQuery({
    queryKey: ['walk-forward-results'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('walk_forward_results')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }
  });

  const runBacktest = async () => {
    setIsRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke('run-walk-forward', {
        body: { trainDays, testDays, retrainFrequency, universe }
      });

      if (error) throw error;

      toast.success('Walk-forward backtest completed!');
      refetch();
    } catch (error: any) {
      console.error('Backtest error:', error);
      toast.error(error.message || 'Failed to run backtest');
    } finally {
      setIsRunning(false);
    }
  };

  const latestResult = results?.[0];
  const resultConfig = (latestResult?.config as any) || {};
  const resultWindows = (latestResult?.windows as any[]) || [];
  const resultMetrics = (latestResult?.out_of_sample_metrics as any) || {};

  // Transform window data for table and charts
  const windowTableData = resultWindows.map((w: any) => ({
    ...w,
    trainPeriod: `${w.trainStart} → ${w.trainEnd}`,
    testPeriod: `${w.testStart} → ${w.testEnd}`,
    returns: w.returns * 100,
    maxDrawdown: -Math.abs(w.maxDrawdown * 100),
  }));

  // Chart data for bar chart
  const barChartData = resultWindows.map((w: any) => ({
    window: `W${w.windowId}`,
    returns: w.returns * 100,
  }));

  // Chart data for cumulative returns
  const cumulativeData = resultWindows.map((w: any, idx: number) => ({
    window: `W${w.windowId}`,
    cumulative: (resultWindows
      .slice(0, idx + 1)
      .reduce((acc: number, win: any) => acc * (1 + win.returns), 1) - 1) * 100,
  }));

  return (
    <div className="container mx-auto p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Walk-Forward Validation
          </h1>
          <p className="text-muted-foreground mt-2">
            Out-of-sample testing with rolling train/test windows
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <Card className="bg-card/40 backdrop-blur-xl border-border/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Play className="w-5 h-5 text-primary" />
              Run Walk-Forward Backtest
            </CardTitle>
            <CardDescription>
              Configure and execute walk-forward validation on your alpha signals
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-foreground">Training Window (days)</Label>
                <Input
                  type="number"
                  value={trainDays}
                  onChange={(e) => setTrainDays(Number(e.target.value))}
                  min={60}
                  max={252}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">Testing Window (days)</Label>
                <Input
                  type="number"
                  value={testDays}
                  onChange={(e) => setTestDays(Number(e.target.value))}
                  min={5}
                  max={63}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">Retrain Frequency (days)</Label>
                <Input
                  type="number"
                  value={retrainFrequency}
                  onChange={(e) => setRetrainFrequency(Number(e.target.value))}
                  min={5}
                  max={63}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">Universe</Label>
                <Select value={universe} onValueChange={setUniverse}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SP500_TOP50">S&P 500 Top 50</SelectItem>
                    <SelectItem value="TECH">Tech Stocks</SelectItem>
                    <SelectItem value="NIFTY50">NIFTY 50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={runBacktest}
              disabled={isRunning}
              className="w-full"
              size="lg"
            >
              {isRunning ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  Running Backtest...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Run Backtest
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {latestResult && (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="windows">Windows</TabsTrigger>
            <TabsTrigger value="charts">Performance Charts</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  title: "Total Return",
                  icon: TrendingUp,
                  value: `${Number((latestResult?.cumulative_returns ?? 0) * 100).toFixed(2)}%`,
                  description: "Out-of-sample performance",
                },
                {
                  title: "Sharpe Ratio",
                  icon: Target,
                  value: Number(latestResult?.sharpe_ratio ?? 0).toFixed(2),
                  badge: (latestResult?.sharpe_ratio ?? 0) > 1,
                  badgeText: (latestResult?.sharpe_ratio ?? 0) > 1 ? 'Good' : 'Needs Improvement',
                },
                {
                  title: "Max Drawdown",
                  icon: AlertCircle,
                  value: `${Number((latestResult?.max_drawdown ?? 0) * 100).toFixed(2)}%`,
                  valueClass: "text-destructive",
                  description: "Worst peak-to-trough decline",
                },
              ].map((metric, index) => (
                <motion.div
                  key={metric.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  transition={{ delay: 0.2 + index * 0.05, duration: 0.3 }}
                >
                  <Card className="bg-card/40 backdrop-blur-xl border-border/30 hover:border-border/60 transition-all">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg text-foreground">
                        <metric.icon className="w-5 h-5 text-primary" />
                        {metric.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-3xl font-bold ${metric.valueClass || 'text-foreground'}`}>
                        {metric.value}
                      </div>
                      {metric.badge !== undefined && (
                        <Badge variant={metric.badge ? "default" : "secondary"} className="mt-2">
                          {metric.badge ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
                          {metric.badgeText}
                        </Badge>
                      )}
                      {metric.description && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {metric.description}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.4 }}
            >
              <Card className="bg-card/40 backdrop-blur-xl border-border/30">
                <CardHeader>
                  <CardTitle className="text-foreground">Configuration</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Training Window</p>
                      <p className="text-lg font-semibold text-foreground">{resultConfig.trainDays} days</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Testing Window</p>
                      <p className="text-lg font-semibold text-foreground">{resultConfig.testDays} days</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Retrain Frequency</p>
                      <p className="text-lg font-semibold text-foreground">{resultConfig.retrainFrequency} days</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Windows Tested</p>
                      <p className="text-lg font-semibold text-foreground">{resultMetrics.numWindows}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="windows">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">Window-by-Window Results</h3>
                  <p className="text-sm text-muted-foreground">Performance across each train/test cycle</p>
                </div>
                <TerminalTable
                  data={windowTableData}
                  columns={windowColumns}
                  hoverable
                  striped
                  maxHeight={400}
                  getRowId={(row) => row.windowId}
                />
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="charts" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <TerminalBarChart
                data={barChartData}
                bars={[{ dataKey: 'returns', name: 'Return %' }]}
                xAxisKey="window"
                title="Window Returns"
                subtitle="Out-of-sample returns for each testing window"
                height={280}
                colorByValue
                showZeroLine
                yAxisFormatter={(v) => `${v.toFixed(1)}%`}
                tooltipFormatter={(v) => `${v.toFixed(2)}%`}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              <TerminalAreaChart
                data={cumulativeData}
                areas={[{ dataKey: 'cumulative', name: 'Cumulative Return %' }]}
                xAxisKey="window"
                title="Cumulative Returns"
                subtitle="Rolling out-of-sample performance"
                height={280}
                showZeroLine
                yAxisFormatter={(v) => `${v.toFixed(1)}%`}
                tooltipFormatter={(v) => `${v.toFixed(2)}%`}
              />
            </motion.div>
          </TabsContent>
        </Tabs>
      )}

      {!latestResult && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <Card className="bg-card/40 backdrop-blur-xl border-border/30">
            <CardContent className="py-12 text-center">
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              </motion.div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No Results Yet</h3>
              <p className="text-muted-foreground">
                Run your first walk-forward backtest to see results
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default WalkForwardBacktest;
