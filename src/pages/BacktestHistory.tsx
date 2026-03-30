import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, TrendingUp, AlertCircle } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { TerminalTable, ColumnDef } from '@/components/tables';

const columns: ColumnDef<any>[] = [
  { key: 'created_at', header: 'Date', sortable: true, render: (v) => new Date(v).toLocaleString() },
  { key: 'strategy_name', header: 'Strategy Name', sortable: true },
  { key: 'symbol', header: 'Symbol', sortable: true },
  { key: 'timeframe', header: 'Timeframe' },
  { key: 'total_return', header: 'Return', align: 'right', sortable: true, format: 'percentChange', colorByValue: true },
  { key: 'win_rate', header: 'Win Rate', align: 'right', sortable: true, format: 'percent' },
  { key: 'max_drawdown', header: 'Max DD', align: 'right', sortable: true, format: 'percent', colorByValue: true },
];

const BacktestHistory = () => {
  const { data: backtests, isLoading } = useQuery({
    queryKey: ['backtest-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('backtests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }
  });

  return (
    <>
      <Helmet>
        <title>Backtest History | QuantSuite</title>
      </Helmet>
      <div className="container mx-auto p-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Backtest History
          </h1>
          <p className="text-muted-foreground mt-2">
            Historical log of all executed algorithmic backtests
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <Card className="bg-card/40 backdrop-blur-xl border-border/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-white/[0.04]">
              <div className="space-y-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Execution Ledger
                </CardTitle>
                <CardDescription>
                  Immutable record of backtest outcomes
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-8 space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse bg-white/[0.03] rounded p-4 h-12" />
                  ))}
                </div>
              ) : backtests && backtests.length > 0 ? (
                <TerminalTable
                  data={backtests.map(b => {
                    const results = (b.results as any) || {};
                    const config = (b.config as any) || {};
                    return {
                      ...b,
                      symbol: config.symbol || 'N/A',
                      timeframe: config.frequency || config.timeframe || 'N/A',
                      total_return: (results.totalReturn || results.total_return || 0) * 100,
                      max_drawdown: -Math.abs((results.maxDrawdown || results.max_drawdown || 0) * 100),
                      win_rate: (results.winRate || results.win_rate || 0) * 100
                    };
                  })}
                  columns={columns}
                  hoverable
                  striped
                  maxHeight={600}
                />
              ) : (
                <div className="py-24 text-center">
                  <motion.div
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                  </motion.div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">No History Found</h3>
                  <p className="text-muted-foreground">
                    Execute a strategy on the Strategy Builder to start logging your experiments.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );
};

export default BacktestHistory;
