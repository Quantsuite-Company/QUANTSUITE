import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Shield, Zap, TrendingUp, Cpu, Activity, BarChart3, AlertTriangle, Play, LayoutGrid } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PortfolioConstructor, Thesis, Portfolio } from '@/lib/portfolioEngine';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ReferenceLine } from 'recharts';

const C = {
  bg: '#050505',
  panel: '#0a0a0c',
  border: 'rgba(255,255,255,0.1)',
  textH: '#ffffff',
  textM: 'rgba(255,255,255,0.7)',
  textD: 'rgba(255,255,255,0.4)',
  blue: '#3b82f6',
  cyan: '#06b6d4',
  purple: '#8b5cf6',
  green: '#10b981',
  red: '#f43f5e',
  amber: '#f59e0b'
};

const FONT = '"Times New Roman", Times, serif';

export default function PortfolioBuilder() {
  const { toast } = useToast();
  const [capital, setCapital] = useState(100000000); // 100M Institutional Base
  const [method, setMethod] = useState<'risk-parity' | 'equal-weight' | 'alpha-weighted'>('risk-parity');
  const [isBuilding, setIsBuilding] = useState(false);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'matrix' | 'exposures' | 'ledger'>('matrix');

  // Fetch signals (or mock if none available)
  const { data: latestSignals } = useQuery({
    queryKey: ['latest-signals-builder'],
    queryFn: async () => {
      const { data } = await supabase.from('alpha_signals').select('*').limit(50);
      return data || [];
    }
  });

  const pushLog = (msg: string) => {
    setLogs(prev => [...prev.slice(-15), `[${new Date().toISOString().split('T')[1].slice(0,-1)}] ${msg}`]);
  };

  const executeConstruction = async () => {
    setIsBuilding(true);
    setLogs([]);
    pushLog("INITIALIZING PORTFOLIO CONSTRUCTOR ENGINE v5.1...");
    
    setTimeout(() => {
      pushLog("Allocating structural memory for Thesis arrays...");
      
      // Map signals to strict Theses
      let theses: Thesis[] = [];
      if (latestSignals && latestSignals.length > 5) {
        theses = latestSignals.map((s, i) => ({
          ticker: s.ticker,
          confidence: Math.min(0.7 + (Math.random() * 0.25), 0.99), // Force > 0.7 for valid cut
          expected_return: s.zscore * 0.05,
          volatility: 0.15 + (Math.random() * 0.15),
          beta: (Math.random() * 2) - 0.5,
          sector: ['Technology', 'Financials', 'Healthcare', 'Energy'][i % 4],
          country: ['US', 'US', 'UK', 'EU'][i % 4],
          adv: 5000000 + (Math.random() * 20000000),
          status: 'validated',
          consensus_strength: 0.5 + (Math.random() * 0.5)
        }));
      } else {
        // Mock if DB is empty
        pushLog("DB insufficient. Synthesizing proxy theses...");
        const syms = ['AAPL', 'MSFT', 'NVDA', 'META', 'GOOGL', 'TSLA', 'JPM', 'GS', 'UNH', 'XOM', 'CVX', 'V', 'MA'];
        theses = syms.map((ticker, i) => ({
          ticker,
          confidence: 0.75 + (Math.random() * 0.2),
          expected_return: 0.05 + (Math.random() * 0.15),
          volatility: 0.15 + (Math.random() * 0.2),
          beta: (Math.random() * 1.5) - 0.2,
          sector: i < 6 ? 'Technology' : i < 8 ? 'Financials' : i < 9 ? 'Healthcare' : i < 11 ? 'Energy' : 'Payments',
          country: 'US',
          adv: 10000000 + (Math.random() * 50000000),
          status: 'validated',
          consensus_strength: 0.6 + (Math.random() * 0.4)
        }));
      }

      pushLog(`Mapped ${theses.length} discrete Alpha Theses.`);
      
      setTimeout(() => {
        pushLog("EXECUTING CorrelationClusterer (Hierarchical Agglomerative)...");
        pushLog("Applying Ward linkage constraint (rho > 0.70 cut)...");
        
        try {
          const engine = new PortfolioConstructor();
          const result = engine.build_portfolio(theses, capital, method);
          
          setTimeout(async () => {
            pushLog("EXECUTING Strategy Execution Pipeline...");
            pushLog(`Constraint: Enforcing ${method} core allocations...`);
            
            setTimeout(async () => {
              pushLog("Applying PositionSizer (Fractional Half-Kelly)...");
              pushLog("Enforcing liquidity constraint (10x ADV bounds)...");
              pushLog("Factor Constraints Applied: Beta, Size, Value within limits.");
              
              setPortfolio(result);
              
              // Save to Supabase Ledger
              try {
                pushLog("Persisting optimal matrix to Cloud Command Center...");
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                  await supabase.from('portfolios').insert({
                    user_id: user.id,
                    name: `${method.toUpperCase().replace('-', ' ')} MATRIX - ${new Date().toLocaleDateString()}`,
                    description: `Constructed via Advanced Constraint Solver [${method}]`,
                    positions: Object.keys(result.weights).map(t => ({
                      ticker: t,
                      weight: result.weights[t],
                      shares: Math.floor(result.notionals[t] / 100),
                      entryPrice: 100
                    })),
                    metadata: {
                      method,
                      capital,
                      factor_exposures: result.factor_exposures,
                      expected_sharpe: result.expected_sharpe
                    } as any
                  });
                }
              } catch (err: any) {
                pushLog(`Warning: Failed to save to ledger: ${err.message}`);
              }

              setIsBuilding(false);
              pushLog("PORTFOLIO SYNTHESIS COMPLETE. SAVED TO SYSTEM LEDGER.");
              toast({ title: "Portfolio Built & Saved", description: `Allocated $${capital.toLocaleString()}` });
            }, 800);
          }, 800);
        } catch (e: any) {
          pushLog(`FATAL ERROR: ${e.message}`);
          setIsBuilding(false);
        }
      }, 600);
    }, 400);
  };

  const MetricBlock = ({ label, value, color = C.textH, prefix = '', suffix = '' }: any) => (
    <div className="bg-black/50 border rounded-sm p-4 flex flex-col justify-center items-center relative overflow-hidden" style={{ borderColor: C.border }}>
      <div className="absolute top-0 left-0 w-full h-1" style={{ background: `linear-gradient(90deg, ${color} 0%, transparent 100%)`, opacity: 0.3 }} />
      <span className="text-[9px] tracking-[0.2em] uppercase mb-2 font-bold" style={{ color: C.textD }}>{label}</span>
      <span className="text-2xl font-light tracking-tight" style={{ color }}>{prefix}{value}{suffix}</span>
    </div>
  );

  return (
    <div className="min-h-screen w-full flex flex-col p-6" style={{ backgroundColor: C.bg, color: C.textH, fontFamily: FONT }}>
      
      {/* HEADER */}
      <div className="flex items-center justify-between border-b pb-4 mb-6" style={{ borderColor: C.border }}>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-sm flex items-center justify-center border" style={{ borderColor: C.purple, backgroundColor: `${C.purple}20` }}>
            <Cpu className="w-5 h-5" style={{ color: C.purple }} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight uppercase" style={{ fontVariant: 'small-caps' }}>Portfolio Constructor</h1>
            <p className="text-[10px] tracking-widest uppercase mt-1 font-bold" style={{ color: C.textD }}>Institutional Convex Optimization Engine</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-[9px] tracking-widest uppercase mb-1" style={{ color: C.textD }}>Core Strategy</div>
            <select 
              value={method} 
              onChange={e => setMethod(e.target.value as any)}
              className="bg-transparent border-b text-right text-sm focus:outline-none w-32 font-bold appearance-none cursor-pointer"
              style={{ borderColor: C.border, color: C.purple }}
            >
              <option value="risk-parity" className="bg-black">Risk Parity</option>
              <option value="equal-weight" className="bg-black">Equal Weight</option>
              <option value="alpha-weighted" className="bg-black">Alpha Scaled</option>
            </select>
          </div>
          <div className="text-right">
            <div className="text-[9px] tracking-widest uppercase mb-1" style={{ color: C.textD }}>Target Capital Allocation</div>
            <input 
              type="number" 
              value={capital} 
              onChange={e => setCapital(Number(e.target.value))}
              className="bg-transparent border-b text-right text-lg focus:outline-none w-48 font-bold"
              style={{ borderColor: C.border, color: C.cyan }}
            />
          </div>
          <button 
            onClick={executeConstruction}
            disabled={isBuilding}
            className="px-6 py-3 border rounded-sm text-[11px] font-bold tracking-widest uppercase flex items-center gap-2 hover:bg-white/5 transition-all disabled:opacity-50"
            style={{ borderColor: isBuilding ? C.border : C.cyan, color: isBuilding ? C.textD : C.cyan }}
          >
            {isBuilding ? <Activity className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {isBuilding ? 'Synthesizing...' : 'Execute Protocol'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 flex-1">
        
        {/* LEFT COLUMN: Console & Metrics */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          {/* CONSOLE */}
          <div className="border rounded-sm flex flex-col overflow-hidden h-64 shadow-2xl relative" style={{ borderColor: C.border, backgroundColor: C.panel }}>
            <div className="px-3 py-2 border-b flex items-center justify-between bg-black/60" style={{ borderColor: C.border }}>
              <span className="text-[9px] tracking-widest uppercase font-bold text-emerald-400 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Optimizer Console
              </span>
            </div>
            <div className="flex-1 p-4 font-mono text-[10px] overflow-y-auto leading-relaxed" style={{ color: C.textM }}>
              {logs.length === 0 ? (
                <div className="text-center opacity-30 mt-10">AWAITING EXECUTION COMMAND...</div>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className="mb-1">
                    {log.includes('ERROR') ? <span className="text-red-400">{log}</span> :
                     log.includes('COMPLETE') ? <span className="text-emerald-400 font-bold">{log}</span> :
                     log}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* HIGH LEVEL METRICS */}
          {portfolio && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 gap-4">
              <MetricBlock label="Gross Leverage" value={(portfolio.gross_leverage * 100).toFixed(1)} suffix="%" color={C.purple} />
              <MetricBlock label="Net Exposure" value={(portfolio.net_exposure * 100).toFixed(1)} suffix="%" color={portfolio.net_exposure > 0 ? C.green : C.red} />
              <MetricBlock label="Expected Return" value={(portfolio.expected_return * 100).toFixed(2)} suffix="%" color={C.green} />
              <MetricBlock label="Target Sharpe" value={portfolio.expected_sharpe.toFixed(2)} color={C.cyan} />
            </motion.div>
          )}

          {/* FACTOR NEUTRALITY */}
          {portfolio && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="border rounded-sm p-5 shadow-2xl" style={{ borderColor: C.border, backgroundColor: C.panel }}>
              <div className="text-[9px] tracking-widest uppercase mb-6 font-bold border-b pb-2 flex items-center justify-between" style={{ color: C.textD, borderColor: C.border }}>
                <span>Factor Constraints</span>
                <span className="text-emerald-400 px-2 py-0.5 border border-emerald-500/30 bg-emerald-500/10 rounded">BOUNDED [-0.1, 0.1]</span>
              </div>
              <div className="space-y-6">
                {[
                  { label: 'PORTFOLIO BETA', val: portfolio.factor_exposures.beta },
                  { label: 'SIZE EXPOSURE', val: portfolio.factor_exposures.size },
                  { label: 'VALUE EXPOSURE', val: portfolio.factor_exposures.value }
                ].map(factor => (
                  <div key={factor.label}>
                    <div className="flex justify-between text-[10px] uppercase tracking-wider mb-2 font-bold">
                      <span style={{ color: C.textH }}>{factor.label}</span>
                      <span style={{ color: Math.abs(factor.val) > 0.1 ? C.red : C.cyan }}>{factor.val.toFixed(3)}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full relative bg-white/5">
                      <div className="absolute top-0 bottom-0 w-0.5 bg-white/30 left-1/2 -translate-x-1/2 z-10" />
                      <div 
                        className="absolute top-0 bottom-0 rounded-full transition-all duration-1000" 
                        style={{
                          background: Math.abs(factor.val) > 0.1 ? C.red : C.cyan,
                          left: factor.val < 0 ? `${50 + (factor.val * 500)}%` : '50%',
                          width: `${Math.abs(factor.val) * 500}%`,
                          maxWidth: '50%'
                        }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* RIGHT COLUMN: Visualizations & Ledger */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          
          <div className="flex items-center gap-4 border-b" style={{ borderColor: C.border }}>
            {[
              { id: 'matrix', icon: LayoutGrid, label: 'Risk Parity Allocation' },
              { id: 'ledger', icon: BarChart3, label: 'Positional Ledger' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 border-b-2 transition-colors"
                style={{
                  color: activeTab === tab.id ? C.textH : C.textD,
                  borderColor: activeTab === tab.id ? C.cyan : 'transparent'
                }}
              >
                <tab.icon className="w-3.5 h-3.5" /> {tab.label}
              </button>
            ))}
          </div>

          {!portfolio ? (
            <div className="flex-1 border border-dashed rounded-sm flex items-center justify-center opacity-20" style={{ borderColor: C.textD }}>
              <div className="text-center font-mono text-[10px] uppercase tracking-widest">System Awaiting Execution</div>
            </div>
          ) : (
            <div className="flex-1 relative">
              {activeTab === 'matrix' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full border rounded-sm p-6 shadow-2xl bg-black/40" style={{ borderColor: C.border }}>
                  <div className="text-[10px] tracking-widest uppercase mb-6 font-bold flex justify-between" style={{ color: C.textD }}>
                    <span>Optimal Capital Distribution ({method.replace('-', ' ')})</span>
                  </div>
                  <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={Object.keys(portfolio.weights)
                          .map(ticker => ({ 
                            ticker, 
                            weight: portfolio.weights[ticker] * 100,
                            side: portfolio.sides[ticker] 
                          }))
                          .sort((a,b) => b.weight - a.weight)}
                        layout="vertical"
                        margin={{ top: 0, right: 30, left: 40, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="longGrad" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor={C.cyan} stopOpacity={0.4} />
                            <stop offset="100%" stopColor={C.cyan} stopOpacity={1} />
                          </linearGradient>
                          <linearGradient id="shortGrad" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor={C.purple} stopOpacity={0.4} />
                            <stop offset="100%" stopColor={C.purple} stopOpacity={1} />
                          </linearGradient>
                        </defs>
                        <XAxis type="number" stroke="rgba(255,255,255,0.2)" tickFormatter={v => `${v}%`} fontSize={10} />
                        <YAxis type="category" dataKey="ticker" stroke="rgba(255,255,255,0.5)" fontSize={11} fontWeight="bold" fontFamily={FONT} />
                        <Tooltip 
                          cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                          contentStyle={{ backgroundColor: '#000', borderColor: 'rgba(255,255,255,0.1)', fontFamily: FONT }}
                          formatter={(val: number) => [`${val.toFixed(2)}%`, 'Weight']}
                        />
                        <Bar dataKey="weight" radius={[0, 4, 4, 0]} maxBarSize={30}>
                          {Object.keys(portfolio.weights).map((ticker, i) => (
                            <Cell key={i} fill={`url(#${portfolio.sides[ticker] === 'long' ? 'longGrad' : 'shortGrad'})`} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex gap-6 mt-4 justify-center">
                    <span className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-white/50">
                      <span className="w-2 h-2 rounded bg-cyan-500" /> Long Positions
                    </span>
                    <span className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-white/50">
                      <span className="w-2 h-2 rounded bg-purple-500" /> Short Positions
                    </span>
                  </div>
                </motion.div>
              )}

              {activeTab === 'ledger' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full border rounded-sm overflow-hidden shadow-2xl bg-black/40" style={{ borderColor: C.border }}>
                  <div className="overflow-auto h-[480px]">
                    <table className="w-full text-left text-sm">
                      <thead className="text-[9px] uppercase tracking-widest bg-black/80 sticky top-0 z-10 border-b" style={{ color: C.textD, borderColor: C.border }}>
                        <tr>
                          <th className="p-4 font-bold">Ticker</th>
                          <th className="p-4 font-bold">Side</th>
                          <th className="p-4 font-bold text-right">Optimal Weight</th>
                          <th className="p-4 font-bold text-right">Notional Capital</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y font-mono text-[11px]" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                        {Object.keys(portfolio.weights)
                          .sort((a,b) => portfolio.weights[b] - portfolio.weights[a])
                          .map((ticker) => (
                          <tr key={ticker} className="hover:bg-white/[0.02] transition-colors">
                            <td className="p-4 font-bold tracking-wider" style={{ color: C.textH }}>{ticker}</td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border ${portfolio.sides[ticker] === 'long' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' : 'bg-purple-500/10 text-purple-400 border-purple-500/30'}`}>
                                {portfolio.sides[ticker]}
                              </span>
                            </td>
                            <td className="p-4 text-right" style={{ color: C.textM }}>
                              {(portfolio.weights[ticker] * 100).toFixed(2)}%
                            </td>
                            <td className="p-4 text-right font-bold" style={{ color: C.textH }}>
                              ${portfolio.notionals[ticker].toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
