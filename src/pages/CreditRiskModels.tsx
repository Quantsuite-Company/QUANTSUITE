import React, { useState, useMemo, useEffect } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreditInputPanel } from '@/components/credit/CreditInputPanel';
import { RatingBadge, RatingScale } from '@/components/credit/RatingBadge';
import { PercentileBar } from '@/components/credit/PercentileBar';
import { ScenarioButtons } from '@/components/credit/ScenarioButtons';
import { DeltaIndicator } from '@/components/credit/MetricTooltip';
import { calculateCreditRisk, CreditRiskInputs, CreditRiskOutputs, generateRatingDistribution, generateSensitivityData, SECTOR_BENCHMARKS, DEFAULT_INPUTS } from '@/lib/creditRisk';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Cell, ReferenceLine, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';

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
  red: '#ef4444',
  amber: '#f59e0b',
  rose: '#f43f5e',
};

const FONT = '"Times New Roman", Times, serif';

const getRatingColor = (rating: string) => {
  if (['AAA', 'AA+', 'AA', 'AA-'].includes(rating)) return C.green;
  if (['A+', 'A', 'A-'].includes(rating)) return C.cyan;
  if (['BBB+', 'BBB', 'BBB-'].includes(rating)) return C.amber;
  if (['BB+', 'BB', 'BB-'].includes(rating)) return '#f97316';
  return C.red;
};

const getPDSeverity = (pd: number) => {
  if (pd < 0.5) return { label: 'INVESTMENT GRADE', color: C.green };
  if (pd < 2) return { label: 'ELEVATED RISK', color: C.amber };
  if (pd < 5) return { label: 'HIGH YIELD', color: '#f97316' };
  return { label: 'DISTRESSED', color: C.red };
};

export default function CreditRiskModels() {
  const [inputs, setInputs] = useState<CreditRiskInputs>(DEFAULT_INPUTS);
  const [prevOutputs, setPrevOutputs] = useState<CreditRiskOutputs | null>(null);
  const [selectedSector, setSelectedSector] = useState('Default');
  const [seniority, setSeniority] = useState<'senior_secured' | 'senior_unsecured' | 'subordinated' | 'junior'>('senior_unsecured');
  const [recoveryRateOverride, setRecoveryRateOverride] = useState(40);

  const outputs = useMemo(() => calculateCreditRisk({ ...inputs, sector: selectedSector }), [inputs, selectedSector]);
  const sensitivityData = useMemo(() => generateSensitivityData(inputs, calculateCreditRisk), [inputs]);
  const ratingDistribution = useMemo(() => generateRatingDistribution(outputs.defaultRating), [outputs.defaultRating]);

  useEffect(() => {
    const timer = setTimeout(() => setPrevOutputs(outputs), 500);
    return () => clearTimeout(timer);
  }, [outputs]);

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
  const pdSeverity = getPDSeverity(outputs.defaultProbability1Y);
  const ratingColor = getRatingColor(outputs.defaultRating);

  // Gauge data for the radial chart
  const gaugeData = [{ value: Math.min(outputs.defaultProbability1Y, 100), fill: pdSeverity.color }];

  return (
    <TooltipProvider>
      <div className="min-h-screen w-full flex flex-col p-8" style={{ backgroundColor: C.bg, color: C.textH, fontFamily: FONT }}>

        {/* HEADER */}
        <div className="border-b pb-6 mb-8 flex justify-between items-end" style={{ borderColor: C.border }}>
          <div>
            <h1 className="text-3xl font-bold tracking-tight uppercase" style={{ fontVariant: 'small-caps' }}>Credit Risk Assessment</h1>
            <p className="text-[10px] tracking-widest uppercase mt-2 font-bold" style={{ color: C.textD }}>
              MERTON STRUCTURAL MODEL // KMV DISTANCE-TO-DEFAULT // LOSS GIVEN DEFAULT
            </p>
          </div>
          <div className="flex gap-6 items-center">
            <div className="flex items-center gap-2">
              <span className="text-[10px] tracking-widest uppercase font-bold" style={{ color: C.textD }}>SECTOR</span>
              <select
                value={selectedSector}
                onChange={e => setSelectedSector(e.target.value)}
                className="bg-transparent border-b pb-1 text-[11px] font-bold tracking-widest uppercase outline-none cursor-pointer"
                style={{ borderColor: C.border, color: C.cyan }}
              >
                {Object.keys(SECTOR_BENCHMARKS).map(s => (
                  <option key={s} value={s} className="bg-black">{s === 'Default' ? 'GLOBAL' : s.toUpperCase()}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] tracking-widest uppercase font-bold" style={{ color: C.textD }}>SENIORITY</span>
              <select
                value={seniority}
                onChange={e => setSeniority(e.target.value as any)}
                className="bg-transparent border-b pb-1 text-[11px] font-bold tracking-widest uppercase outline-none cursor-pointer"
                style={{ borderColor: C.border, color: C.amber }}
              >
                <option value="senior_secured" className="bg-black">SENIOR SECURED</option>
                <option value="senior_unsecured" className="bg-black">SENIOR UNSECURED</option>
                <option value="subordinated" className="bg-black">SUBORDINATED</option>
                <option value="junior" className="bg-black">JUNIOR</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6 flex-1">

          {/* LEFT: Inputs & Scenarios */}
          <div className="col-span-12 lg:col-span-3 flex flex-col gap-6 overflow-y-auto max-h-[calc(100vh-180px)]" style={{ scrollbarWidth: 'none' }}>
            <div className="border p-5" style={{ borderColor: C.border, backgroundColor: C.panel }}>
              <h3 className="text-[10px] tracking-widest uppercase font-bold border-b pb-2 mb-4" style={{ color: C.textD, borderColor: C.border }}>
                Issuer Fundamentals
              </h3>
              <CreditInputPanel inputs={inputs} onChange={setInputs} />
            </div>
            <div className="border p-5" style={{ borderColor: C.border, backgroundColor: C.panel }}>
              <h3 className="text-[10px] tracking-widest uppercase font-bold border-b pb-2 mb-4" style={{ color: C.textD, borderColor: C.border }}>
                Stress Scenarios
              </h3>
              <ScenarioButtons inputs={inputs} onApplyScenario={setInputs} />
            </div>
            <div className="border p-5" style={{ borderColor: C.border, backgroundColor: C.panel }}>
              <h3 className="text-[10px] tracking-widest uppercase font-bold border-b pb-2 mb-4" style={{ color: C.textD, borderColor: C.border }}>
                Loss Severity Override
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="text-[9px] tracking-widest uppercase mb-2 flex justify-between" style={{ color: C.textD }}>
                    <span>Recovery Rate</span>
                    <span className="font-bold" style={{ color: C.textH }}>{recoveryRateOverride}%</span>
                  </div>
                  <input
                    type="range" min="10" max="80" step="5"
                    value={recoveryRateOverride}
                    onChange={e => setRecoveryRateOverride(Number(e.target.value))}
                    className="w-full h-1 bg-white/10 appearance-none rounded accent-amber-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="border p-3 text-center" style={{ borderColor: C.border }}>
                    <div className="text-[8px] tracking-widest uppercase mb-1" style={{ color: C.textD }}>Custom LGD</div>
                    <div className="text-xl font-bold" style={{ color: C.amber }}>{(customLGD * 100).toFixed(0)}%</div>
                  </div>
                  <div className="border p-3 text-center" style={{ borderColor: C.border }}>
                    <div className="text-[8px] tracking-widest uppercase mb-1" style={{ color: C.textD }}>Expected Loss</div>
                    <div className="text-xl font-bold" style={{ color: C.red }}>${customExpectedLoss.toFixed(2)}M</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CENTER: Core Output */}
          <div className="col-span-12 lg:col-span-6 flex flex-col gap-6">

            {/* Primary Metrics Row */}
            <div className="grid grid-cols-3 gap-6">
              {/* Rating */}
              <div className="border p-6 flex flex-col items-center justify-center" style={{ borderColor: C.border, backgroundColor: C.panel }}>
                <span className="text-[10px] tracking-widest uppercase font-bold mb-3" style={{ color: C.textD }}>Credit Rating</span>
                <div className="text-5xl font-bold tracking-tight" style={{ color: ratingColor }}>{outputs.defaultRating}</div>
                <span className="text-[9px] tracking-widest uppercase mt-2 font-bold" style={{ color: pdSeverity.color }}>{pdSeverity.label}</span>
              </div>

              {/* Default Probability */}
              <div className="border p-6 flex flex-col items-center justify-center" style={{ borderColor: C.border, backgroundColor: C.panel }}>
                <span className="text-[10px] tracking-widest uppercase font-bold mb-3" style={{ color: C.textD }}>1Y Default Probability</span>
                <div className="text-5xl font-light tracking-tight" style={{ color: pdSeverity.color }}>
                  {outputs.defaultProbability1Y.toFixed(2)}<span className="text-2xl">%</span>
                </div>
                <div className="mt-2">
                  <DeltaIndicator current={outputs.defaultProbability1Y} previous={prevOutputs?.defaultProbability1Y || null} higherIsBetter={false} format="percent" />
                </div>
              </div>

              {/* Distance to Default */}
              <div className="border p-6 flex flex-col items-center justify-center" style={{ borderColor: C.border, backgroundColor: C.panel }}>
                <span className="text-[10px] tracking-widest uppercase font-bold mb-3" style={{ color: C.textD }}>Distance to Default</span>
                <div className="text-5xl font-light tracking-tight">{outputs.distanceToDefault.toFixed(2)}<span className="text-2xl">σ</span></div>
                <div className="mt-2">
                  <DeltaIndicator current={outputs.distanceToDefault} previous={prevOutputs?.distanceToDefault || null} higherIsBetter />
                </div>
              </div>
            </div>

            {/* Solvency Metrics */}
            <div className="border p-6" style={{ borderColor: C.border, backgroundColor: C.panel }}>
              <h3 className="text-[10px] tracking-widest uppercase font-bold border-b pb-2 mb-6" style={{ color: C.textD, borderColor: C.border }}>
                Solvency & Coverage Matrix
              </h3>
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: 'Model CDS (5Y)', value: `${outputs.modelCDS5Y.toFixed(0)}`, unit: 'bps', color: C.cyan },
                  { label: 'D/E Ratio', value: `${outputs.debtToEquity.toFixed(1)}`, unit: '%', color: C.amber },
                  { label: 'Interest Coverage', value: `${outputs.interestCoverage.toFixed(1)}`, unit: 'x', color: C.green },
                  { label: '3Y / 5Y PD', value: `${outputs.defaultProbability3Y.toFixed(1)} / ${outputs.defaultProbability5Y.toFixed(1)}`, unit: '%', color: C.purple },
                ].map((m, i) => (
                  <div key={i} className="border-l-2 pl-4 py-2" style={{ borderColor: m.color }}>
                    <div className="text-[9px] tracking-widest uppercase mb-1" style={{ color: C.textD }}>{m.label}</div>
                    <div className="text-2xl font-bold" style={{ color: m.color }}>
                      {m.value}<span className="text-xs ml-1 font-normal" style={{ color: C.textM }}>{m.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sensitivity Surface */}
            <div className="border p-6 flex-1 flex flex-col" style={{ borderColor: C.border, backgroundColor: C.panel }}>
              <h3 className="text-[10px] tracking-widest uppercase font-bold border-b pb-2 mb-4" style={{ color: C.textD, borderColor: C.border }}>
                Default Probability Sensitivity Surface
              </h3>
              <div className="flex-1 min-h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sensitivityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="pdGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={C.red} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={C.red} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                    <XAxis dataKey="change" stroke={C.textD} fontSize={9} fontFamily={FONT} />
                    <YAxis stroke={C.textD} fontSize={9} fontFamily={FONT} tickFormatter={(v) => `${v.toFixed(0)}%`} orientation="right" />
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: '#000', borderColor: C.border, fontFamily: FONT }}
                      itemStyle={{ color: C.red }}
                      labelStyle={{ color: C.textD, fontSize: 10 }}
                    />
                    <ReferenceLine x="0%" stroke={C.amber} strokeDasharray="4 4" />
                    <Area type="monotone" dataKey="pd" name="PD (%)" stroke={C.red} strokeWidth={2} fillOpacity={1} fill="url(#pdGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* RIGHT: Comparisons & Percentiles */}
          <div className="col-span-12 lg:col-span-3 flex flex-col gap-6 overflow-y-auto max-h-[calc(100vh-180px)]" style={{ scrollbarWidth: 'none' }}>

            {/* Rating Cross-Section */}
            <div className="border p-5 h-[240px] flex flex-col" style={{ borderColor: C.border, backgroundColor: C.panel }}>
              <h3 className="text-[10px] tracking-widest uppercase font-bold border-b pb-2 mb-4" style={{ color: C.textD, borderColor: C.border }}>
                Rating Distribution
              </h3>
              <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ratingDistribution} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                    <XAxis dataKey="rating" tick={{ fontSize: 8, fill: C.textD }} stroke="none" fontFamily={FONT} />
                    <YAxis tick={{ fontSize: 8, fill: C.textD }} stroke="none" />
                    <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                      {ratingDistribution.map((entry, index) => (
                        <Cell
                          key={entry.rating}
                          fill={entry.isCurrentRating ? C.cyan : 'rgba(255,255,255,0.08)'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Peer Percentiles */}
            <div className="border p-5 flex-1 flex flex-col" style={{ borderColor: C.border, backgroundColor: C.panel }}>
              <h3 className="text-[10px] tracking-widest uppercase font-bold border-b pb-2 mb-4" style={{ color: C.textD, borderColor: C.border }}>
                Peer Percentile Ranking
              </h3>
              <div className="space-y-4 pt-2 flex-1">
                <PercentileBar label="D/E Ratio" value={outputs.percentiles.debtToEquity.value} p10={outputs.percentiles.debtToEquity.p10} p50={outputs.percentiles.debtToEquity.p50} p90={outputs.percentiles.debtToEquity.p90} />
                <PercentileBar label="Int. Cov" value={outputs.percentiles.interestCoverage.value} unit="x" p10={outputs.percentiles.interestCoverage.p10} p50={outputs.percentiles.interestCoverage.p50} p90={outputs.percentiles.interestCoverage.p90} higherIsBetter />
                <PercentileBar label="ROA" value={outputs.percentiles.roa.value} p10={outputs.percentiles.roa.p10} p50={outputs.percentiles.roa.p50} p90={outputs.percentiles.roa.p90} higherIsBetter />
                <PercentileBar label="Liab/EBITDA" value={outputs.percentiles.liabToEbitda.value} p10={outputs.percentiles.liabToEbitda.p10} p50={outputs.percentiles.liabToEbitda.p50} p90={outputs.percentiles.liabToEbitda.p90} />
                <PercentileBar label="EBIT/Int" value={outputs.percentiles.ebitToInterest.value} unit="x" p10={outputs.percentiles.ebitToInterest.p10} p50={outputs.percentiles.ebitToInterest.p50} p90={outputs.percentiles.ebitToInterest.p90} higherIsBetter />
              </div>
              <div className="mt-6 pt-4 border-t" style={{ borderColor: C.border }}>
                <RatingScale currentRating={outputs.defaultRating} />
              </div>
            </div>
          </div>

        </div>
      </div>
    </TooltipProvider>
  );
}
