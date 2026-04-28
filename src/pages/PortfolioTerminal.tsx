import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Activity, TrendUp, ShieldTick, Danger, Cpu } from 'iconsax-react';
import { useSwarmStore } from '@/stores/useSwarmStore';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
const StatWidget = ({ label, value, icon, trend, trendColor }: any) => (
  <Card className="col-span-1 bg-black/40 border-white/10 p-6 flex flex-col justify-between">
    <div className="flex justify-between items-start">
      <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">{label}</p>
      <div className="text-slate-500">{icon}</div>
    </div>
    <div className="mt-4">
      <h3 className="text-3xl font-light text-white">{value}</h3>
      <p className={`text-xs mt-2 font-mono ${trendColor}`}>{trend}</p>
    </div>
  </Card>
);

export default function PortfolioTerminal() {
  const store = useSwarmStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const executedTheses = store.activeTheses.filter(t => t.status === 'EXECUTED');
  
  // Base 77.5% cash plus unallocated
  const allocatedCapital = executedTheses.reduce((acc, t) => acc + (t.validationMetrics?.sizing || 0), 0);
  const cashReserve = 100 - allocatedCapital;

  if (!mounted) return null;

  return (
    <div className="w-full h-full min-h-screen bg-slate-950 text-slate-200 p-6 font-mono selection:bg-emerald-500/30">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* HEADER PANEL */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-3xl font-light tracking-tight text-white flex items-center gap-3">
              <Briefcase className="w-8 h-8 text-emerald-400" variant="Bulk" />
              PORTFOLIO TERMINAL
            </h1>
            <p className="text-slate-400 mt-1">V7 Institutional Execution & Mark-to-Market</p>
          </div>
          
           <div className="flex items-center gap-3 bg-black/40 p-3 rounded-lg border border-white/5 shadow-inner">
            <Cpu className="w-5 h-5 text-fuchsia-400 animate-pulse" variant="Bulk" />
            <div className="flex flex-col">
              <span className="text-xs text-slate-500 uppercase tracking-widest">CIO Module</span>
              <span className="text-sm font-medium text-fuchsia-400">ACTIVE OVERSIGHT</span>
            </div>
          </div>
        </div>

        {/* TOP METRICS ROW */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           {/* Cash Reserve (Critical Focus) */}
           <Card className="col-span-1 md:col-span-2 bg-gradient-to-br from-emerald-950/40 to-slate-900 border-white/10 p-6 overflow-hidden relative">
            <div className="absolute -right-10 -bottom-10 opacity-5">
              <ShieldTick size={160} variant="Bulk" />
            </div>
            <div className="relative z-10 flex justify-between items-start">
              <div>
                <p className="text-sm text-emerald-400 uppercase tracking-widest font-semibold flex items-center gap-2">
                  <ShieldTick size={16} /> Capital Preservation
                </p>
                <h2 className="text-5xl font-light text-white mt-4">{cashReserve.toFixed(1)}%</h2>
                <p className="text-slate-400 mt-2 text-sm">Target: {'>'}77.5% (V7 Institutional Matrix)</p>
              </div>
              <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
                STABLE
              </Badge>
            </div>
            {/* Progress bar visualizing cash reserve */}
             <div className="mt-8 w-full h-2 bg-slate-800 rounded-full overflow-hidden flex">
                <div className="h-full bg-emerald-500" style={{ width: `${cashReserve}%` }} />
                <div className="h-full bg-fuchsia-500" style={{ width: `${allocatedCapital}%` }} />
            </div>
             <div className="flex justify-between text-xs text-slate-500 mt-2 font-mono">
                <span>Cash Reserve ({cashReserve.toFixed(1)}%)</span>
                <span>Deployed ({allocatedCapital.toFixed(1)}%)</span>
            </div>
          </Card>

          <StatWidget 
            label="Active Theses" 
            value={executedTheses.length.toString()} 
            icon={<Briefcase />}
            trend="Active Deployments"
            trendColor="text-fuchsia-400"
          />

           <StatWidget 
            label="System Risk" 
            value="LOW" 
            icon={<Danger />}
            trend="MacroGuard Armed"
            trendColor="text-emerald-400"
          />
        </div>

        {/* EXECUTION DOSSIER */}
        <h2 className="text-xl font-light text-white mt-10 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-fuchsia-400" />
          Live Execution Book
        </h2>
        
        {executedTheses.length === 0 ? (
          <div className="w-full flex-col p-12 border border-dashed border-white/10 rounded-xl flex items-center justify-center text-slate-500 bg-white/5">
            <Cpu className="w-12 h-12 opacity-50 mb-4" variant="Bulk" />
            <p>No active thess executed. Waiting for Alpha Council consensus.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {executedTheses.map((thesis) => (
              <motion.div 
                key={thesis.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-black/30 border border-white/10 p-5 rounded-xl flex flex-col md:flex-row items-center justify-between gap-6 hover:bg-black/50 transition-colors"
              >
                {/* Ticker & Direction */}
                <div className="flex items-center gap-4 min-w-[200px]">
                  <div className="w-12 h-12 rounded-lg bg-slate-900 border border-white/5 flex items-center justify-center font-bold text-xl text-white">
                    {thesis.symbol.substring(0,2)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-widest">{thesis.symbol}</h3>
                    <Badge variant="outline" className={thesis.direction === 'LONG' ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10' : 'border-rose-500/50 text-rose-400 bg-rose-500/10'}>
                      {thesis.direction}
                    </Badge>
                  </div>
                </div>

                {/* Sizing & Kelly */}
                <div className="flex-1 grid grid-cols-3 gap-4">
                   <div className="flex flex-col">
                     <span className="text-xs text-slate-500 uppercase">Unit Size</span>
                     <span className="text-lg text-white font-mono">{thesis.validationMetrics?.sizing?.toFixed(2)}% NAV</span>
                   </div>
                   <div className="flex flex-col">
                     <span className="text-xs text-slate-500 uppercase">Kelly Ratio</span>
                     <span className="text-lg text-fuchsia-400 font-mono">{(thesis.validationMetrics?.kelly || 0).toFixed(2)}</span>
                   </div>
                   <div className="flex flex-col">
                     <span className="text-xs text-slate-500 uppercase">Drawdown Limit</span>
                     <span className="text-lg text-rose-400 font-mono">-{thesis.validationMetrics?.drawdownLimit?.toFixed(2)}%</span>
                   </div>
                </div>

                {/* Status */}
                 <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    <span className="text-sm text-emerald-400 font-mono uppercase tracking-widest">Live Execution</span>
                 </div>
              </motion.div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
