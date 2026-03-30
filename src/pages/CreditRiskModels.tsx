import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { GlassCard } from '@/components/ui/glass-card';
import { CreditInputPanel } from '@/components/credit/CreditInputPanel';
import { RatingBadge, RatingScale } from '@/components/credit/RatingBadge';
import { DefaultGauge } from '@/components/credit/DefaultGauge';
import { PercentileBar } from '@/components/credit/PercentileBar';
import { ScenarioButtons } from '@/components/credit/ScenarioButtons';
import { MetricTooltip, DeltaIndicator, RiskLegend } from '@/components/credit/MetricTooltip';
import { UniversalExplanationPanel } from '@/components/UniversalExplanationPanel';
import { calculateCreditRisk, CreditRiskInputs, CreditRiskOutputs, generateRatingDistribution, generateSensitivityData, DEFAULT_RATINGS, DEFAULT_INPUTS, SECTOR_BENCHMARKS } from '@/lib/creditRisk';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Cell, ReferenceLine } from 'recharts';
import { TrendUp, Warning2, Chart1, Calculator, InfoCircle } from 'iconsax-react';
import { motion } from 'framer-motion';

export default function CreditRiskModels() {
  const [inputs, setInputs] = useState<CreditRiskInputs>(DEFAULT_INPUTS);
  const [prevOutputs, setPrevOutputs] = useState<CreditRiskOutputs | null>(null);
  const [activeTab, setActiveTab] = useState('drsk');
  const [selectedSector, setSelectedSector] = useState('Default');
  const [seniority, setSeniority] = useState<'senior_secured' | 'senior_unsecured' | 'subordinated' | 'junior'>('senior_unsecured');
  const [recoveryRateOverride, setRecoveryRateOverride] = useState(40);

  const outputs = useMemo(() => calculateCreditRisk({ ...inputs, sector: selectedSector }), [inputs, selectedSector]);
  const sensitivityData = useMemo(() => generateSensitivityData(inputs, calculateCreditRisk), [inputs]);
  const ratingDistribution = useMemo(() => generateRatingDistribution(outputs.defaultRating), [outputs.defaultRating]);

  // Track previous outputs for delta indicators
  useEffect(() => {
    const timer = setTimeout(() => setPrevOutputs(outputs), 500);
    return () => clearTimeout(timer);
  }, [outputs]);

  // Calculate custom LGD based on seniority
  const customLGD = useMemo(() => {
    const seniorityRates: Record<string, number> = {
      'senior_secured': 0.35,
      'senior_unsecured': 0.55,
      'subordinated': 0.70,
      'junior': 0.85,
    };
    return seniorityRates[seniority] * (1 - (recoveryRateOverride - 40) / 100);
  }, [seniority, recoveryRateOverride]);

  const customExpectedLoss = (outputs.defaultProbability1Y / 100) * customLGD * outputs.ead;

  return (
    <TooltipProvider>
      <div className="relative h-screen w-full bg-[#0a0505] text-white overflow-hidden font-mono flex flex-col mx-0 max-w-none">
        
        {/* TOP COMMAND DECK */}
        <div className="flex-none h-14 bg-black/90 border-b border-red-900/40 flex items-center px-4 z-20 backdrop-blur-md">
           <div className="flex items-center gap-3 border-r border-red-900/40 pr-6 mr-6 h-full py-2">
              <Warning2 className="w-5 h-5 text-red-500 animate-pulse" variant="Bold" />
              <div className="text-[10px] uppercase tracking-widest leading-tight text-red-500 font-bold">
                 THREAT_MATRIX <br/>
                 <span className="text-white/40 font-light">CREDIT DEFAULT ENGINE</span>
              </div>
           </div>
           
           <div className="flex-1 flex items-center gap-6">
              <div className="flex items-center gap-2 text-[10px] tracking-[0.2em] font-bold text-amber-500">
                 SECTOR: 
                 <Select value={selectedSector} onValueChange={setSelectedSector}>
                    <SelectTrigger className="w-32 h-6 border-amber-500/30 bg-amber-500/10 text-amber-500 text-[10px] rounded-none focus:ring-0">
                      <SelectValue placeholder="Sector" />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-amber-500/30 text-amber-500">
                      {Object.keys(SECTOR_BENCHMARKS).map((sector) => (
                        <SelectItem key={sector} value={sector} className="text-[10px]">{sector === 'Default' ? 'GLOBAL' : sector.toUpperCase()}</SelectItem>
                      ))}
                    </SelectContent>
                 </Select>
              </div>
              <div className="flex items-center gap-2 text-[10px] tracking-[0.2em] font-bold text-orange-500">
                 SENIORITY:
                 <Select value={seniority} onValueChange={(v: any) => setSeniority(v)}>
                    <SelectTrigger className="w-40 h-6 border-orange-500/30 bg-orange-500/10 text-orange-500 text-[10px] rounded-none focus:ring-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-orange-500/30 text-orange-500">
                      <SelectItem value="senior_secured" className="text-[10px]">SNR SECURED (LGD 35%)</SelectItem>
                      <SelectItem value="senior_unsecured" className="text-[10px]">SNR UNSECURED (LGD 55%)</SelectItem>
                      <SelectItem value="subordinated" className="text-[10px]">SUBORDINATED (LGD 70%)</SelectItem>
                      <SelectItem value="junior" className="text-[10px]">JUNIOR (LGD 85%)</SelectItem>
                    </SelectContent>
                 </Select>
              </div>
           </div>

           <div className="flex items-center gap-4 text-[9px] tracking-widest uppercase text-white/30 border-l border-red-900/40 pl-6 h-full py-2">
              WAR_ROOM // GLOBAL_CRISIS_V1
           </div>
        </div>

        {/* MAIN MATRIX GRID */}
        <div className="flex-1 flex overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-900/10 to-black p-2 gap-2">
           {/* BACKGROUND GRID */}
           <div className="absolute inset-0 bg-[linear-gradient(to_right,#ff000003_1px,transparent_1px),linear-gradient(to_bottom,#ff000003_1px,transparent_1px)] bg-[size:2rem_2rem] pointer-events-none"></div>
           
           {/* LEFT PANEL: INPUTS & TACTICS */}
           <div className="w-[320px] flex flex-col gap-2 relative z-10 overflow-y-auto no-scrollbar">
              <div className="bg-black/60 border border-red-900/50 rounded-sm backdrop-blur p-4 pb-0">
                 <div className="text-[10px] text-red-500 font-bold uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <Chart1 size={14} /> Telemetry Inputs
                 </div>
                 <div className="scale-90 origin-top-left w-[111%]">
                    <CreditInputPanel inputs={inputs} onChange={setInputs} />
                 </div>
              </div>
              <div className="bg-black/60 border border-red-900/50 rounded-sm backdrop-blur p-4">
                 <div className="text-[10px] text-orange-500 font-bold uppercase tracking-[0.2em] mb-4">
                    Stress Scenarios
                 </div>
                 <ScenarioButtons inputs={inputs} onApplyScenario={setInputs} />
              </div>
              <div className="bg-black/60 border border-red-900/50 rounded-sm backdrop-blur p-4 flex-1 flex flex-col">
                 <div className="text-[10px] text-amber-500 font-bold uppercase tracking-[0.2em] mb-4">
                    Expected Loss Simulation
                 </div>
                 <div className="space-y-4">
                    <div>
                       <div className="text-[9px] text-white/50 tracking-widest uppercase mb-1 flex justify-between">
                          <span>Recovery Override</span>
                          <span>{recoveryRateOverride}%</span>
                       </div>
                       <input 
                         type="range" min="10" max="80" step="5" 
                         value={recoveryRateOverride} 
                         onChange={e => setRecoveryRateOverride(Number(e.target.value))}
                         className="w-full accent-amber-500 h-1 bg-white/10 appearance-none rounded"
                       />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                       <div className="bg-amber-500/10 border border-amber-500/30 p-2 rounded text-center">
                          <div className="text-[8px] text-amber-500/70 tracking-widest uppercase">Custom LGD</div>
                          <div className="text-lg font-bold text-amber-500">{(customLGD * 100).toFixed(0)}%</div>
                       </div>
                       <div className="bg-red-500/10 border border-red-500/30 p-2 rounded text-center">
                          <div className="text-[8px] text-red-500/70 tracking-widest uppercase">Expected Loss</div>
                          <div className="text-lg font-bold text-red-500">${customExpectedLoss.toFixed(2)}M</div>
                       </div>
                    </div>
                 </div>
                 <div className="mt-4 scale-90 origin-top-left w-[111%] opacity-50 hover:opacity-100 transition-opacity">
                    <UniversalExplanationPanel
                      modelName="creditrisk"
                      inputs={inputs}
                      outputs={{
                        defaultProbability: outputs.defaultProbability1Y,
                        rating: outputs.defaultRating,
                        distanceToDefault: outputs.distanceToDefault,
                        modelCDS5Y: outputs.modelCDS5Y,
                        lgd: customLGD,
                        ead: outputs.ead,
                        expectedLoss: customExpectedLoss,
                        impliedPD: outputs.impliedPD,
                      }}
                    />
                 </div>
              </div>
           </div>

           {/* MIDDLE PANEL: CENTRAL THREAT MAP */}
           <div className="flex-1 flex flex-col gap-2 relative z-10">
              {/* TOP: CRITICAL RATING ROW */}
              <div className="flex-none h-[180px] bg-black/60 border border-red-900/50 rounded-sm flex items-center justify-between p-8 backdrop-blur shadow-[0_0_30px_rgba(255,0,0,0.05)]">
                 <div className="flex flex-col">
                    <div className="text-[10px] text-white/40 tracking-[0.3em] uppercase mb-2">Target Default Rating</div>
                    <RatingBadge rating={outputs.defaultRating} size="xl" />
                 </div>
                 <div className="w-[1px] h-full bg-white/10 mx-8"></div>
                 <div className="flex flex-col items-center flex-1">
                    <div className="text-[10px] text-red-500/70 tracking-[0.3em] uppercase mb-4 flex items-center gap-2">
                       <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse blur-[1px]"></span>
                       1Y Default Probability
                    </div>
                    <div className="flex items-end gap-3">
                       <div className="text-6xl font-light text-red-500 tracking-tighter drop-shadow-[0_0_15px_rgba(255,0,0,0.5)]">
                          {outputs.defaultProbability1Y.toFixed(2)}<span className="text-3xl">%</span>
                       </div>
                       <div className="mb-2">
                          <DeltaIndicator current={outputs.defaultProbability1Y} previous={prevOutputs?.defaultProbability1Y || null} higherIsBetter={false} format="percent" />
                       </div>
                    </div>
                 </div>
                 <div className="w-[1px] h-full bg-white/10 mx-8"></div>
                 <div className="flex flex-col text-right">
                    <div className="text-[10px] text-white/40 tracking-[0.3em] uppercase mb-4">Distance to Default</div>
                    <div className="flex items-center justify-end gap-2">
                       <span className="text-4xl font-light text-white">{outputs.distanceToDefault.toFixed(2)}σ</span>
                    </div>
                    <div className="mt-1 flex justify-end">
                       <DeltaIndicator current={outputs.distanceToDefault} previous={prevOutputs?.distanceToDefault || null} higherIsBetter />
                    </div>
                 </div>
              </div>

              {/* BOTTOM: METRICS & SENSITIVITY GRID */}
              <div className="flex-1 grid grid-cols-2 gap-2">
                 <div className="bg-black/60 border border-red-900/50 rounded-sm p-4 flex flex-col">
                    <div className="text-[10px] text-orange-500 font-bold uppercase tracking-[0.2em] mb-4">Core Solvency Metrics</div>
                    <div className="flex-1 flex flex-col justify-between">
                       <div className="flex items-center justify-between p-3 bg-white/[0.02] border-l border-orange-500/50">
                          <span className="text-xs tracking-widest uppercase text-white/50">Model CDS (5Y)</span>
                          <span className="font-mono text-xl text-orange-500">{outputs.modelCDS5Y.toFixed(0)} <span className="text-[10px]">bps</span></span>
                       </div>
                       <div className="flex items-center justify-between p-3 bg-white/[0.02] border-l border-amber-500/50 mt-2">
                          <span className="text-xs tracking-widest uppercase text-white/50">D/E Ratio</span>
                          <span className="font-mono text-xl text-amber-500">{outputs.debtToEquity.toFixed(1)} <span className="text-[10px]">%</span></span>
                       </div>
                       <div className="flex items-center justify-between p-3 bg-white/[0.02] border-l border-yellow-500/50 mt-2">
                          <span className="text-xs tracking-widest uppercase text-white/50">Interest Coverage</span>
                          <span className="font-mono text-xl text-yellow-500">{outputs.interestCoverage.toFixed(1)} <span className="text-[10px]">x</span></span>
                       </div>
                       <div className="flex items-center justify-between p-3 bg-white/[0.02] border-l border-lime-500/50 mt-2">
                          <span className="text-xs tracking-widest uppercase text-white/50">3Y PD / 5Y PD</span>
                          <span className="font-mono text-xl text-lime-500">{outputs.defaultProbability3Y.toFixed(1)}% / {outputs.defaultProbability5Y.toFixed(1)}%</span>
                       </div>
                    </div>
                 </div>

                 <div className="bg-black/60 border border-red-900/50 rounded-sm p-4 flex flex-col">
                    <div className="text-[10px] text-amber-500 font-bold uppercase tracking-[0.2em] mb-4">PD Sensitivity Matrix</div>
                    <div className="flex-1 pt-4 relative">
                       <ResponsiveContainer width="100%" height="100%">
                         <AreaChart data={sensitivityData}>
                           <defs>
                             <linearGradient id="pdWarGradient" x1="0" y1="0" x2="0" y2="1">
                               <stop offset="5%" stopColor="rgba(255, 68, 68, 0.4)" />
                               <stop offset="95%" stopColor="rgba(255, 68, 68, 0)" />
                             </linearGradient>
                           </defs>
                           <CartesianGrid strokeDasharray="2 2" stroke="rgba(255,255,255,0.05)" vertical={false} />
                           <XAxis dataKey="change" tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)' }} stroke="none" />
                           <YAxis tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)' }} stroke="none" tickFormatter={(v) => `${v.toFixed(0)}%`} orientation="right" />
                           <RechartsTooltip 
                             cursor={{ stroke: 'rgba(255,68,68,0.5)', strokeWidth: 1, strokeDasharray: '4 4' }}
                             contentStyle={{ background: '#000', border: '1px solid rgba(255,68,68,0.3)', borderRadius: 2 }} 
                             itemStyle={{ color: '#ff4444', fontSize: '12px' }}
                             labelStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px' }}
                           />
                           <ReferenceLine x="0%" stroke="#ffaa00" strokeDasharray="3 3" />
                           <Area type="monotone" dataKey="pd" stroke="#ff4444" fill="url(#pdWarGradient)" strokeWidth={2} />
                         </AreaChart>
                       </ResponsiveContainer>
                    </div>
                 </div>
              </div>
           </div>

           {/* RIGHT PANEL: COMPARISONS */}
           <div className="w-[320px] flex flex-col gap-2 relative z-10 overflow-y-auto no-scrollbar">
              <div className="bg-black/60 border border-red-900/50 rounded-sm backdrop-blur p-4 h-[220px] flex flex-col">
                 <div className="text-[10px] text-yellow-500 font-bold uppercase tracking-[0.2em] mb-4">Rating Cross-Section</div>
                 <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={ratingDistribution} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="1 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="rating" tick={{ fontSize: 8, fill: 'rgba(255,255,255,0.4)' }} stroke="none" />
                        <YAxis tick={{ fontSize: 8, fill: 'rgba(255,255,255,0.4)' }} stroke="none" />
                        <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                          {ratingDistribution.map((entry, index) => (
                            <Cell 
                              key={entry.rating} 
                              fill={entry.isCurrentRating ? '#ff4444' : 'rgba(255,255,255,0.1)'} 
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                 </div>
              </div>

              <div className="bg-black/60 border border-red-900/50 rounded-sm backdrop-blur p-4 flex-1">
                 <div className="text-[10px] text-white/60 font-bold uppercase tracking-[0.2em] mb-4 text-center">
                    Peer Percentiles
                 </div>
                 <div className="space-y-4 pt-2">
                    <PercentileBar label="D/E Ratio" value={outputs.percentiles.debtToEquity.value} p10={outputs.percentiles.debtToEquity.p10} p50={outputs.percentiles.debtToEquity.p50} p90={outputs.percentiles.debtToEquity.p90} />
                    <PercentileBar label="Int. Cov" value={outputs.percentiles.interestCoverage.value} unit="x" p10={outputs.percentiles.interestCoverage.p10} p50={outputs.percentiles.interestCoverage.p50} p90={outputs.percentiles.interestCoverage.p90} higherIsBetter />
                    <PercentileBar label="ROA" value={outputs.percentiles.roa.value} p10={outputs.percentiles.roa.p10} p50={outputs.percentiles.roa.p50} p90={outputs.percentiles.roa.p90} higherIsBetter />
                    <PercentileBar label="Liab/EBITDA" value={outputs.percentiles.liabToEbitda.value} p10={outputs.percentiles.liabToEbitda.p10} p50={outputs.percentiles.liabToEbitda.p50} p90={outputs.percentiles.liabToEbitda.p90} />
                    <PercentileBar label="EBIT/Int" value={outputs.percentiles.ebitToInterest.value} unit="x" p10={outputs.percentiles.ebitToInterest.p10} p50={outputs.percentiles.ebitToInterest.p50} p90={outputs.percentiles.ebitToInterest.p90} higherIsBetter />
                 </div>
                 <div className="mt-8 pt-4 border-t border-white/5 opacity-50 scale-90 origin-top">
                    <RatingScale currentRating={outputs.defaultRating} />
                 </div>
              </div>
           </div>
        </div>

        {/* BOTTOM TICKER / STATUS TRAY */}
        <div className="h-8 flex-none bg-black border-t border-red-900/50 flex items-center px-4 justify-between text-[9px] font-mono tracking-widest uppercase text-white/40 z-20 shrink-0">
           <div className="flex items-center gap-6">
              <span className="flex items-center gap-2 text-red-500"><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-[ping_2s_infinite]"></span> DEFAULT THREAT ASSESSED</span>
              <span>LGD SCENARIO: {(customLGD * 100).toFixed(0)}%</span>
              <span className="text-amber-500">SYSTEM WARNINGS: NONE</span>
           </div>
           <div className="text-red-500/50">
              C-RISK ENGINE LATENCY: 8ms | QUANT_OS_V2
           </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
