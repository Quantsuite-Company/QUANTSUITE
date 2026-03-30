import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Wallet, TrendingUp, Shield, Zap, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', '#8b5cf6', '#f59e0b'];

const PortfolioBuilder = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isBuilding, setIsBuilding] = useState(false);
  const [portfolioSize, setPortfolioSize] = useState(1000000);
  const [numPositions, setNumPositions] = useState(20);
  const [method, setMethod] = useState<'risk-parity' | 'equal-weight' | 'alpha-weighted'>('risk-parity');

  const { data: latestSignals } = useQuery({
    queryKey: ['latest-signals'],
    queryFn: async () => {
      const { data: recentSignal, error: dateError } = await supabase
        .from('alpha_signals')
        .select('date')
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (dateError) throw dateError;
      if (!recentSignal) return [];

      const { data, error } = await supabase
        .from('alpha_signals')
        .select('*')
        .eq('date', recentSignal.date)
        .order('zscore', { ascending: false });

      if (error) throw error;
      return data || [];
    }
  });

  const { data: alphaMetrics } = useQuery({
    queryKey: ['alpha-metrics-latest'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('alpha_metrics')
        .select('*')
        .order('date', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    }
  });

  const buildPortfolio = async () => {
    setIsBuilding(true);
    try {
      if (!latestSignals || latestSignals.length === 0) {
        toast({
          title: "No alpha signals available",
          description: "Please generate alpha signals first on the Alpha Signals page",
          variant: "destructive",
        });
        return;
      }

      const alphaWeights: { [alphaId: string]: number } = {};
      const healthyMetrics = alphaMetrics?.filter(m => m.is_healthy) || [];
      
      if (healthyMetrics.length > 0) {
        const totalICSharpe = healthyMetrics.reduce((sum, m) => sum + Math.abs(m.ic_sharpe), 0);
        healthyMetrics.forEach(m => {
          alphaWeights[m.alpha_id] = Math.abs(m.ic_sharpe) / totalICSharpe;
        });
      } else {
        const uniqueAlphas = [...new Set(latestSignals.map(s => s.alpha_id))];
        uniqueAlphas.forEach(alphaId => {
          alphaWeights[alphaId] = 1 / uniqueAlphas.length;
        });
      }

      const tickerScores: { [ticker: string]: { score: number; signals: any[] } } = {};
      
      latestSignals.forEach(signal => {
        if (!tickerScores[signal.ticker]) {
          tickerScores[signal.ticker] = { score: 0, signals: [] };
        }
        const weight = alphaWeights[signal.alpha_id] || 0;
        tickerScores[signal.ticker].score += weight * signal.zscore;
        tickerScores[signal.ticker].signals.push(signal);
      });

      const sortedTickers = Object.entries(tickerScores)
        .sort(([, a], [, b]) => b.score - a.score);

      const selectedPositions = sortedTickers.slice(0, numPositions);

      let positions: { ticker: string; weight: number; dollarAmount: number; score: number }[] = [];

      if (method === 'equal-weight') {
        const weightPerPosition = 1 / numPositions;
        positions = selectedPositions.map(([ticker, data]) => ({
          ticker,
          weight: weightPerPosition,
          dollarAmount: portfolioSize * weightPerPosition,
          score: data.score
        }));
      } else if (method === 'alpha-weighted') {
        const totalScore = selectedPositions.reduce((sum, [, data]) => sum + Math.abs(data.score), 0);
        positions = selectedPositions.map(([ticker, data]) => {
          const weight = Math.abs(data.score) / totalScore;
          return {
            ticker,
            weight,
            dollarAmount: portfolioSize * weight,
            score: data.score
          };
        });
      } else if (method === 'risk-parity') {
        const vols: { [ticker: string]: number } = {};
        
        selectedPositions.forEach(([ticker, data]) => {
          const volSignal = data.signals.find((s: any) => s.alpha_id === 'volatility');
          vols[ticker] = volSignal ? Math.abs(volSignal.raw_value) : 0.01;
        });

        const invVols = selectedPositions.map(([ticker]) => 1 / vols[ticker]);
        const sumInvVols = invVols.reduce((sum, v) => sum + v, 0);

        positions = selectedPositions.map(([ticker, data], idx) => {
          const weight = invVols[idx] / sumInvVols;
          return {
            ticker,
            weight,
            dollarAmount: portfolioSize * weight,
            score: data.score
          };
        });
      }

      const portfolioName = `${method.replace('-', ' ')} Portfolio - ${new Date().toLocaleDateString()}`;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const { error: saveError } = await supabase
        .from('portfolios')
        .insert({
          user_id: user.id,
          name: portfolioName,
          description: `${method} portfolio with ${numPositions} positions`,
          positions: positions.map(p => ({
            ticker: p.ticker,
            weight: p.weight,
            shares: Math.floor(p.dollarAmount / 100),
            entryPrice: 100
          })) as any,
          metadata: {
            method,
            portfolioSize,
            alphaWeights,
            buildDate: new Date().toISOString()
          } as any
        } as any);

      if (saveError) throw saveError;

      await queryClient.invalidateQueries({ queryKey: ['portfolios'] });

      toast({
        title: "Success!",
        description: "Portfolio built successfully",
      });
      
    } catch (error: any) {
      console.error('Portfolio build error:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to build portfolio',
        variant: "destructive",
      });
    } finally {
      setIsBuilding(false);
    }
  };

  const { data: portfolios } = useQuery({
    queryKey: ['portfolios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('portfolios')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }
  });

  const latestPortfolio = portfolios?.[0];
  const portfolioPositions = (latestPortfolio?.positions as any) || [];
  const portfolioMetadata = (latestPortfolio?.metadata as any) || {};

  return (
    <div className="relative h-screen w-full bg-[#09090b] text-white overflow-hidden font-mono flex flex-col">
      
      {/* TOP COMMAND DECK */}
      <div className="flex-none h-16 bg-black/80 border-b border-white/10 flex items-center px-6 z-20 backdrop-blur-md">
        <div className="flex items-center gap-3 border-r border-[#8b5cf6]/20 pr-6 mr-6 h-full py-3">
           <Wallet className="w-5 h-5 text-[#8b5cf6]" />
           <div className="text-[10px] uppercase tracking-[0.2em] leading-tight text-[#8b5cf6] font-bold">
              SYS.PORTFOLIO_BUILDER <br/>
              <span className="text-white/40 font-light">ALLOCATION ENGINE</span>
           </div>
        </div>
        
        <div className="flex-1 flex items-center gap-6">
           <div className="text-[9px] uppercase tracking-widest text-white/40">
              STATUS: <span className="text-[#00ff88]">ONLINE</span>
           </div>
           <div className="text-[9px] uppercase tracking-widest text-white/40">
              SIGNALS: {latestSignals ? <span className="text-[#00d5ff]">{latestSignals.length} READY</span> : <span className="text-amber-500">PENDING</span>}
           </div>
        </div>

        <div className="flex items-center gap-4 text-[9px] tracking-widest uppercase text-white/30 border-l border-white/10 pl-6">
           QUANT_OS // RADIAL_HUD_V2
        </div>
      </div>

      {/* THREE-COLUMN HORIZONTAL HUD */}
      <div className="flex-1 flex overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/[0.02] to-transparent">
        
        {/* LEFT COLUMN: CONTROLS & META */}
        <div className="w-[340px] flex-none border-r border-white/10 flex flex-col bg-black/40 backdrop-blur-sm relative z-10">
           <div className="p-5 border-b border-white/10 bg-gradient-to-br from-white/5 to-transparent">
              <div className="text-[10px] tracking-[0.2em] text-[#8b5cf6] font-bold uppercase mb-4 flex items-center gap-2">
                 <Shield className="w-3 h-3" /> Synthesis Parameters
              </div>
              
              <div className="space-y-5">
                 <div className="space-y-2">
                    <label className="text-[9px] tracking-widest uppercase text-white/50">Total Capital ($)</label>
                    <input
                      type="number"
                      value={portfolioSize}
                      onChange={(e) => setPortfolioSize(Number(e.target.value))}
                      className="w-full bg-white/5 border border-white/10 px-3 py-2 rounded text-sm text-[#8b5cf6] focus:outline-none focus:border-[#8b5cf6] transition-colors"
                    />
                 </div>
                 
                 <div className="space-y-2">
                    <label className="text-[9px] tracking-widest uppercase text-white/50">Position Count [{numPositions}]</label>
                    <input
                      type="range"
                      min="5" max="50"
                      value={numPositions}
                      onChange={(e) => setNumPositions(Number(e.target.value))}
                      className="w-full accent-[#8b5cf6] h-1 bg-white/10 rounded-full appearance-none"
                    />
                 </div>

                 <div className="space-y-2">
                    <label className="text-[9px] tracking-widest uppercase text-white/50">Strategy</label>
                    <select
                      value={method}
                      onChange={(e: any) => setMethod(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 px-3 py-2 rounded text-xs focus:outline-none focus:border-[#8b5cf6] transition-colors appearance-none"
                    >
                      <option value="risk-parity">Risk Parity</option>
                      <option value="equal-weight">Equal Weight</option>
                      <option value="alpha-weighted">Alpha Weighted</option>
                    </select>
                 </div>

                 <Button
                    onClick={buildPortfolio}
                    disabled={isBuilding}
                    className="w-full h-10 mt-4 bg-[#8b5cf6]/10 hover:bg-[#8b5cf6]/20 border border-[#8b5cf6]/40 text-[#8b5cf6] tracking-widest uppercase text-[10px] rounded"
                 >
                    {isBuilding ? "GENERATING..." : "EXECUTE_BUILD"}
                 </Button>
              </div>
           </div>

           {/* PORTFOLIO STATS (If Generated) */}
           {latestPortfolio && (
             <div className="flex-1 p-5 overflow-y-auto no-scrollbar">
                <div className="text-[10px] tracking-[0.2em] text-white/40 font-bold uppercase mb-4 flex items-center gap-2">
                   <TrendingUp className="w-3 h-3" /> Deep Statistics
                </div>
                
                <div className="space-y-4 font-mono">
                   <div className="flex justify-between items-center pb-2 border-b border-white/5">
                      <span className="text-[9px] uppercase tracking-widest text-white/40">Creation Date</span>
                      <span className="text-xs">{new Date(latestPortfolio.created_at).toLocaleDateString()}</span>
                   </div>
                   <div className="flex justify-between items-center pb-2 border-b border-white/5">
                      <span className="text-[9px] uppercase tracking-widest text-white/40">Total Value</span>
                      <span className="text-sm font-bold text-[#00ff88]">
                         ${portfolioPositions.reduce((sum: number, p: any) => sum + (p.shares * p.entryPrice), 0).toLocaleString()}
                      </span>
                   </div>
                   <div className="flex justify-between items-center pb-2 border-b border-white/5">
                      <span className="text-[9px] uppercase tracking-widest text-white/40">Active Positions</span>
                      <span className="text-xs">{portfolioPositions.length}</span>
                   </div>
                   <div className="flex justify-between items-center pb-2 border-b border-white/5">
                      <span className="text-[9px] uppercase tracking-widest text-white/40">Methodology</span>
                      <span className="text-[10px] text-[#8b5cf6] uppercase">{portfolioMetadata.method || 'Unknown'}</span>
                   </div>
                </div>
             </div>
           )}
        </div>

        {/* CENTER COLUMN: RADIAL VISUALIZATION */}
        <div className="flex-1 relative flex items-center justify-center p-8 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem]">
           {!latestPortfolio ? (
              <div className="text-center opacity-30">
                 <div className="w-32 h-32 border border-white/10 rounded-full mx-auto flex items-center justify-center mb-6">
                   <Wallet className="w-10 h-10 text-[#8b5cf6]" />
                 </div>
                 <div className="text-xl tracking-[0.4em] uppercase font-light">Radial Core Offline</div>
                 <div className="text-[10px] tracking-widest mt-2 uppercase">Awaiting synthesis parameters...</div>
              </div>
           ) : (
              <div className="relative w-full h-full max-h-[600px] flex items-center justify-center animate-in zoom-in-95 duration-1000">
                 {/* Decorative background rings */}
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] border border-[#8b5cf6]/10 rounded-full"></div>
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] border border-white/5 rounded-full border-dashed animate-[spin_60s_linear_infinite]"></div>
                 
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie
                       data={portfolioPositions.map((pos: any) => ({
                         name: pos.ticker,
                         value: pos.weight * 100
                       }))}
                       cx="50%"
                       cy="50%"
                       innerRadius="60%"
                       outerRadius="85%"
                       paddingAngle={2}
                       dataKey="value"
                       stroke="rgba(0,0,0,0.5)"
                       strokeWidth={2}
                     >
                       {portfolioPositions.map((_: any, index: number) => (
                         <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="hover:opacity-80 transition-opacity cursor-pointer" />
                       ))}
                     </Pie>
                     <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '4px', fontFamily: 'monospace' }}
                        itemStyle={{ color: '#fff' }}
                        formatter={(value: any) => `${Number(value ?? 0).toFixed(2)}%`}
                     />
                   </PieChart>
                 </ResponsiveContainer>
                 
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center text-center">
                    <div className="text-[10px] text-white/40 tracking-[0.2em] uppercase mb-1">Asset Scope</div>
                    <div className="text-4xl font-light text-[#8b5cf6]">{portfolioPositions.length}</div>
                    <div className="text-[9px] text-[#00d5ff] tracking-widest uppercase mt-2 border border-[#00d5ff]/30 px-2 py-0.5 rounded-full bg-[#00d5ff]/10">
                      LIVE ALLOCATION
                    </div>
                 </div>
              </div>
           )}
        </div>

        {/* RIGHT COLUMN: POSITIONS LEDGER */}
        <div className="w-[400px] flex-none border-l border-white/10 bg-black/60 backdrop-blur-md flex flex-col relative z-10">
           <div className="p-4 border-b border-white/10">
              <div className="text-[10px] tracking-[0.2em] text-[#00ff88] font-bold uppercase flex items-center gap-2">
                 <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse"></span>
                 Positional Ledger
              </div>
           </div>
           
           <div className="flex-1 overflow-y-auto no-scrollbar">
              {!latestPortfolio ? (
                <div className="p-6 text-center opacity-30 text-[10px] uppercase tracking-widest mt-10">
                  No active ledger data.
                </div>
              ) : (
                <Table>
                  <TableHeader className="sticky top-0 bg-black/90 backdrop-blur-sm shadow-[0_1px_0_rgba(255,255,255,0.1)]">
                    <TableRow className="border-none hover:bg-transparent">
                      <TableHead className="text-[9px] tracking-widest text-white/30 uppercase py-2 h-auto text-left">Ticker</TableHead>
                      <TableHead className="text-[9px] tracking-widest text-white/30 uppercase py-2 h-auto text-right">Weight</TableHead>
                      <TableHead className="text-[9px] tracking-widest text-white/30 uppercase py-2 h-auto text-right">Value($)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {portfolioPositions.map((pos: any, idx: number) => (
                      <TableRow key={idx} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <TableCell className="font-mono font-bold text-white/90 py-3">{pos.ticker}</TableCell>
                        <TableCell className="font-mono text-right text-[#8b5cf6] py-3">
                           {Number(pos.weight * 100).toFixed(2)}%
                        </TableCell>
                        <TableCell className="font-mono text-right text-white/70 py-3">
                           ${Number((pos.shares ?? 0) * (pos.entryPrice ?? 0)).toFixed(0)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioBuilder;
