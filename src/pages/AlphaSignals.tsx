import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { QuantSuiteSEO } from "@/components/QuantSuiteSEO";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area, ReferenceLine } from "recharts";
import { useToast } from "@/hooks/use-toast";

const C = {
  bg: '#050505',
  panel: '#0a0a0c',
  border: 'rgba(255,255,255,0.1)',
  textH: '#ffffff',
  textM: 'rgba(255,255,255,0.7)',
  textD: 'rgba(255,255,255,0.4)',
  cyan: '#06b6d4',
  purple: '#8b5cf6',
  green: '#10b981',
  red: '#f43f5e',
  amber: '#f59e0b',
};

const FONT = '"Times New Roman", Times, serif';

export default function AlphaSignals() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [universe, setUniverse] = useState("SP500_TOP50");
  const [isCalculating, setIsCalculating] = useState(false);
  const [activeView, setActiveView] = useState<'signals' | 'metrics'>('signals');
  const [selectedFactor, setSelectedFactor] = useState<string>('');

  const { data: alphaSignals, isLoading: signalsLoading, refetch: refetchSignals } = useQuery({
    queryKey: ["alpha-signals", user?.id, universe],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from("alpha_signals")
        .select("*")
        .eq("user_id", user?.id)
        .eq("date", today)
        .eq("universe", universe)
        .order("zscore", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: alphaMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["alpha-metrics", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alpha_metrics")
        .select("*")
        .eq("user_id", user?.id)
        .order("date", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const calculateAlphas = async () => {
    if (!user) return toast({ title: "AUTHENTICATION REQUIRED", variant: "destructive" });

    setIsCalculating(true);
    try {
      const { data, error } = await supabase.functions.invoke("calculate-alphas", {
        body: { universe, date: new Date().toISOString().split("T")[0] },
      });

      if (error) throw error;

      if (!data || data.signals_calculated === 0) {
        toast({ title: "NO SIGNALS", description: "Algorithm found no actionable edge.", variant: "destructive" });
      } else {
        toast({ title: "SYNTHESIS COMPLETE", description: `Processed ${data.stocks_processed} assets.` });
      }

      if (alphaSignals && alphaSignals.length > 0) {
        const uniqueAlphas = Array.from(new Set(alphaSignals.map(s => s.alpha_id)));
        for (const alphaId of uniqueAlphas) {
          try {
            await supabase.functions.invoke("calculate-ic-metrics", { body: { alphaId, lookbackDays: 60 } });
          } catch (e) {
            console.warn(`IC skip ${alphaId}`, e);
          }
        }
      }
      refetchSignals();
    } catch (error: any) {
      toast({ title: "SYNTHESIS FAILED", description: error.message, variant: "destructive" });
    } finally {
      setIsCalculating(false);
    }
  };

  const isLoading = signalsLoading || metricsLoading;

  const latestMetrics = alphaMetrics?.reduce((acc, metric) => {
    if (!acc[metric.alpha_id] || new Date(metric.date) > new Date(acc[metric.alpha_id].date)) {
      acc[metric.alpha_id] = metric;
    }
    return acc;
  }, {} as Record<string, typeof alphaMetrics[0]>);

  if (latestMetrics && Object.keys(latestMetrics).length > 0 && !selectedFactor) {
    setSelectedFactor(Object.keys(latestMetrics)[0]);
  }

  const decayData = (() => {
    if (!latestMetrics || !selectedFactor || !latestMetrics[selectedFactor]) return [];
    const metric = latestMetrics[selectedFactor];
    const ic0 = metric.ic;
    const lambda = Math.log(2) / metric.half_life_days;
    const data = [];
    for (let t = 0; t <= 30; t++) {
      data.push({
        day: `T+${t}`,
        ic: Math.max(0, ic0 * Math.exp(-lambda * t))
      });
    }
    return data;
  })();

  const topSignals = alphaSignals
    ?.filter(s => Math.abs(s.zscore || 0) > 1.5)
    .sort((a, b) => Math.abs(b.zscore || 0) - Math.abs(a.zscore || 0))
    .slice(0, 16) || [];

  const metricsChartData = latestMetrics ? Object.entries(latestMetrics).map(([alphaId, metric]) => ({
    name: alphaId.replace(/_/g, ' ').slice(0, 15),
    ic: metric.ic || 0,
    icSharpe: metric.ic_sharpe || 0,
  })) : [];

  return (
    <>
      <QuantSuiteSEO title="Alpha Signals Matrix" description="Cross-sectional alpha signals" path="/alpha-signals" />
      
      <div className="min-h-screen w-full flex flex-col p-8" style={{ backgroundColor: C.bg, color: C.textH, fontFamily: FONT }}>
        
        {/* HEADER */}
        <div className="border-b pb-6 mb-8 flex justify-between items-end" style={{ borderColor: C.border }}>
          <div>
            <h1 className="text-3xl font-bold tracking-tight uppercase" style={{ fontVariant: 'small-caps' }}>Alpha Signal Matrix</h1>
            <p className="text-[10px] tracking-widest uppercase mt-2 font-bold" style={{ color: C.textD }}>
              CROSS-SECTIONAL FACTOR SYNTHESIS // RANKING PROPULSION
            </p>
          </div>
          <div className="flex gap-4 items-center">
            <select 
              value={universe} 
              onChange={e => setUniverse(e.target.value)}
              className="bg-transparent border-b pb-1 text-[11px] font-bold tracking-widest uppercase outline-none cursor-pointer"
              style={{ borderColor: C.border, color: C.textM }}
            >
              <option value="SP500_TOP50" className="bg-black">S&P 500 TOP 50</option>
              <option value="TECH" className="bg-black">TECHNOLOGY (NASDAQ)</option>
              <option value="NIFTY50" className="bg-black">NIFTY 50</option>
            </select>
            <button 
              onClick={calculateAlphas}
              disabled={isCalculating}
              className="px-8 py-3 border text-[11px] font-bold tracking-widest uppercase hover:bg-white/5 transition-all"
              style={{ borderColor: C.cyan, color: C.cyan }}
            >
              {isCalculating ? 'EXECUTING PIPELINE...' : 'EXECUTE SYNTHESIS'}
            </button>
          </div>
        </div>

        {/* NAVIGATION */}
        <div className="flex gap-6 mb-8 border-b" style={{ borderColor: C.border }}>
          <button 
            className="pb-2 text-[10px] uppercase tracking-widest font-bold"
            style={{ color: activeView === 'signals' ? C.textH : C.textD, borderBottom: activeView === 'signals' ? `2px solid ${C.cyan}` : 'none' }}
            onClick={() => setActiveView('signals')}
          >
            Terminal Output
          </button>
          <button 
            className="pb-2 text-[10px] uppercase tracking-widest font-bold"
            style={{ color: activeView === 'metrics' ? C.textH : C.textD, borderBottom: activeView === 'metrics' ? `2px solid ${C.cyan}` : 'none' }}
            onClick={() => setActiveView('metrics')}
          >
            Performance Decay
          </button>
        </div>

        {isLoading ? (
          <div className="flex-1 border border-dashed flex items-center justify-center opacity-30" style={{ borderColor: C.textD }}>
            <span className="text-[10px] tracking-widest uppercase font-bold animate-pulse">AWAITING CLUSTER CONNECTIVITY...</span>
          </div>
        ) : activeView === 'signals' ? (
          <div className="grid grid-cols-12 gap-8">
            {/* Top Signals Grid */}
            <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
              <div className="flex justify-between items-end border-b pb-2" style={{ borderColor: C.border }}>
                <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: C.textD }}>Top Conviction Signals (|Z| &gt; 1.5)</span>
                <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: C.textM }}>Count: {topSignals.length}</span>
              </div>
              
              {topSignals.length === 0 ? (
                <div className="flex-1 min-h-[300px] border flex items-center justify-center" style={{ borderColor: C.border, backgroundColor: C.panel }}>
                  <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: C.textD }}>NO STATISTICALLY SIGNIFICANT OUTLIERS DETECTED</span>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-4">
                  {topSignals.map((signal) => {
                    const isPos = (signal.zscore || 0) > 0;
                    return (
                      <div 
                        key={signal.id} 
                        onClick={() => navigate(`/stock-report?ticker=${signal.ticker}`)}
                        className="border p-4 shadow-xl flex flex-col justify-between cursor-pointer hover:bg-white/5 transition-colors" 
                        style={{ borderColor: C.border, backgroundColor: C.panel }}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <span className="text-xl font-bold">{signal.ticker}</span>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 border" style={{ color: isPos ? C.green : C.red, borderColor: isPos ? C.green : C.red }}>
                            {isPos ? 'LONG' : 'SHORT'}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[9px] uppercase tracking-widest">
                            <span style={{ color: C.textD }}>Z-Score</span>
                            <span className="font-bold" style={{ color: isPos ? C.green : C.red }}>{signal.zscore?.toFixed(3)}</span>
                          </div>
                          <div className="flex justify-between text-[9px] uppercase tracking-widest">
                            <span style={{ color: C.textD }}>Factor</span>
                            <span style={{ color: C.textM }}>{signal.alpha_id}</span>
                          </div>
                          <div className="flex justify-between text-[9px] uppercase tracking-widest">
                            <span style={{ color: C.textD }}>Percentile</span>
                            <span style={{ color: C.textM }}>{signal.percentile_rank?.toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Matrix Ledger */}
            <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
              <div className="flex justify-between items-end border-b pb-2" style={{ borderColor: C.border }}>
                <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: C.textD }}>Raw Signal Ledger</span>
              </div>
              <div className="flex-1 border overflow-auto max-h-[600px]" style={{ borderColor: C.border, backgroundColor: C.panel }}>
                <table className="w-full text-left text-[10px] uppercase tracking-widest">
                  <thead className="sticky top-0 bg-black/90 border-b" style={{ borderColor: C.border }}>
                    <tr>
                      <th className="p-3" style={{ color: C.textD }}>Ticker</th>
                      <th className="p-3 text-right" style={{ color: C.textD }}>Z-Score</th>
                      <th className="p-3 text-right" style={{ color: C.textD }}>Rank</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alphaSignals?.map(s => (
                      <tr 
                        key={s.id} 
                        onClick={() => navigate(`/stock-report?ticker=${s.ticker}`)}
                        className="border-b hover:bg-white/10 transition-colors cursor-pointer" 
                        style={{ borderColor: C.border }}
                      >
                        <td className="p-3 font-bold" style={{ color: C.cyan }}>{s.ticker}</td>
                        <td className="p-3 text-right font-bold" style={{ color: (s.zscore || 0) > 0 ? C.green : ((s.zscore || 0) < 0 ? C.red : C.textM) }}>
                          {s.zscore?.toFixed(3)}
                        </td>
                        <td className="p-3 text-right" style={{ color: C.textM }}>{s.percentile_rank?.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            
            {/* Interactive Decay Curve */}
            <div className="border p-6 shadow-2xl h-[400px] flex flex-col relative" style={{ borderColor: C.border, backgroundColor: C.panel }}>
              <div className="flex justify-between items-end border-b pb-2 mb-6" style={{ borderColor: C.border }}>
                <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: C.textD }}>Information Coefficient Decay Simulation</span>
                <select 
                  value={selectedFactor} 
                  onChange={e => setSelectedFactor(e.target.value)}
                  className="bg-transparent border-b pb-1 text-[11px] font-bold tracking-widest uppercase outline-none cursor-pointer"
                  style={{ borderColor: C.border, color: C.cyan }}
                >
                  {Object.keys(latestMetrics || {}).map(f => (
                    <option key={f} value={f} className="bg-black">{f.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={decayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorIC" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={C.cyan} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={C.cyan} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                    <XAxis dataKey="day" stroke={C.textD} fontSize={9} fontFamily={FONT} tickMargin={10} minTickGap={20} />
                    <YAxis stroke={C.textD} fontSize={9} fontFamily={FONT} tickFormatter={(val) => val.toFixed(3)} />
                    <Tooltip contentStyle={{ backgroundColor: '#000', borderColor: C.border, fontFamily: FONT }} itemStyle={{ color: C.cyan }} />
                    <Area type="monotone" dataKey="ic" name="Expected IC" stroke={C.cyan} strokeWidth={2} fillOpacity={1} fill="url(#colorIC)" isAnimationActive={true} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-6">
              {Object.entries(latestMetrics || {}).map(([alphaId, metric]) => (
                <div key={alphaId} className="border p-6 shadow-xl" style={{ borderColor: C.border, backgroundColor: C.panel }}>
                  <span className="text-sm font-bold uppercase tracking-widest block mb-4 border-b pb-2" style={{ color: C.textH, borderColor: C.border }}>
                    {alphaId.replace(/_/g, ' ')}
                  </span>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] uppercase tracking-widest">
                      <span style={{ color: C.textD }}>IC Score</span>
                      <span className="font-bold" style={{ color: C.cyan }}>{metric.ic?.toFixed(3)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] uppercase tracking-widest">
                      <span style={{ color: C.textD }}>IC Sharpe</span>
                      <span className="font-bold" style={{ color: C.purple }}>{metric.ic_sharpe?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] uppercase tracking-widest">
                      <span style={{ color: C.textD }}>Half-Life (Decay)</span>
                      <span style={{ color: C.textM }}>{metric.half_life_days?.toFixed(0)} D</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
