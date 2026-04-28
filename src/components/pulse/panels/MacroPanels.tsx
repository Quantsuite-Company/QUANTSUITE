import { PulsePanel } from '../PulseGrid';
import { LightweightChart, MiniSparkline, BarSparkline } from '@/components/chart/ChartContainer';

interface PanelExpandProps {
  panelId?: string;
  onExpand?: (id: string) => void;
  expanded?: boolean;
  onClose?: () => void;
}

function genVolatileData(startVal: number, volatility: number, length = 60) {
  let val = startVal;
  return Array.from({ length }).map((_, i) => {
    const trend = Math.sin(i / 8) * volatility * 0.3;
    val += trend + (Math.random() - 0.5) * volatility;
    return { time: Math.floor(Date.now() / 1000) - (length - i) * 86400, value: val };
  });
}

export function MacroStressPanel(props: PanelExpandProps) {
  const vixData = genVolatileData(19, 1.2, 30);

  return (
    <PulsePanel title="Macro Stress" category="MACRO" className={props.expanded ? '' : 'row-span-2'} {...props}
      analysis="VIX at 19.23 reflects moderate hedging activity — below the 20 threshold signals institutions are not panic-buying protection. The -0.26 move suggests put sellers are absorbing demand. Fed Funds at 3.64% with zero change means the market has fully priced the current rate regime. The 10Y-2Y spread remains inverted at -0.42, but the +0.05 improvement indicates the curve is slowly normalizing — historically a precursor to economic recovery. Overall positioning: stay risk-on with selective hedging via VIX call spreads above 22."
      expandedContent={
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-bg-elevated/30 border border-white/5 rounded-lg p-3">
              <span className="text-[9px] font-mono text-slate-500 uppercase">Real GDP Growth (Q/Q)</span>
              <div className="text-xl font-bold text-positive mt-1">+2.1%</div>
              <span className="text-[10px] text-slate-400">Above trend, supportive</span>
            </div>
            <div className="bg-bg-elevated/30 border border-white/5 rounded-lg p-3">
              <span className="text-[9px] font-mono text-slate-500 uppercase">Core PCE (YoY)</span>
              <div className="text-xl font-bold text-amber-400 mt-1">2.8%</div>
              <span className="text-[10px] text-slate-400">Above 2% target</span>
            </div>
            <div className="bg-bg-elevated/30 border border-white/5 rounded-lg p-3">
              <span className="text-[9px] font-mono text-slate-500 uppercase">ISM Manufacturing</span>
              <div className="text-xl font-bold text-negative mt-1">48.7</div>
              <span className="text-[10px] text-negative">Contraction zone</span>
            </div>
            <div className="bg-bg-elevated/30 border border-white/5 rounded-lg p-3">
              <span className="text-[9px] font-mono text-slate-500 uppercase">Consumer Confidence</span>
              <div className="text-xl font-bold text-blue-400 mt-1">103.2</div>
              <span className="text-[10px] text-positive">+2.4 MoM</span>
            </div>
          </div>
          <div>
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">VIX 30-Day Trend</span>
            <LightweightChart data={vixData} height={100} hideAxes lineColor="#ef4444" type="area" />
          </div>
        </div>
      }>
      <div className="flex-1 flex flex-col gap-4">
        <div className="bg-bg-elevated/40 p-3 rounded-lg border border-white/5">
          <span className="text-[10px] text-slate-400 font-mono tracking-widest uppercase block mb-1">Indicators</span>
          <h4 className="text-2xl font-bold text-slate-200 mb-1">Steady</h4>
          <p className="text-xs text-slate-400 leading-relaxed">Macro conditions are stable for now.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 flex-1">
          {[
            { label: 'VIX', code: 'VIRCLS', val: '19.23', chg: '-0.26', color: 'text-red-400' },
            { label: 'Fed Funds', code: 'FEDFUNDS', val: '3.64%', chg: '0%', color: 'text-slate-400' },
            { label: '10Y-2Y', code: 'T10Y2Y', val: '-0.42', chg: '+0.05', color: 'text-positive' },
            { label: 'Unemploy.', code: 'UNRATE', val: '3.9%', chg: '0%', color: 'text-slate-400' },
          ].map(m => (
            <div key={m.label} className="flex flex-col justify-center">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-mono text-slate-400">{m.label}</span>
                <span className="text-[8px] font-mono text-slate-500">{m.code}</span>
              </div>
              <div className="text-xl font-bold text-slate-200">{m.val}</div>
              <div className={`text-xs font-mono ${m.color}`}>{m.chg}</div>
            </div>
          ))}
        </div>
      </div>
    </PulsePanel>
  );
}

export function TradePolicyPanel(props: PanelExpandProps) {
  const tariffBars = [
    { name: 'BHS', value: 30.3, color: '#ef4444' }, { name: 'TUN', value: 19.4, color: '#ef4444' },
    { name: 'IND', value: 13.8, color: '#eab308' }, { name: 'BRA', value: 11.2, color: '#eab308' },
    { name: 'CHN', value: 7.5, color: '#22c55e' }, { name: 'EU', value: 5.1, color: '#22c55e' },
  ];

  return (
    <PulsePanel title="Trade Policy" category="TRADE" className={props.expanded ? '' : 'row-span-2'} {...props}
      analysis="WTO MFN baseline tariffs for Bahamas (30.3%) and Tunisia (19.4%) represent the maximum tariff floor. These are NOT the effective rates for major trading partners — the US/EU/China effective rates are significantly lower due to FTAs. Watch for executive orders targeting these corridors — they'd directly impact supply chain costs in Consumer Discretionary and Industrials."
      expandedContent={
        <div className="space-y-3">
          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">MFN Rate Comparison (Top 6 Partners)</span>
          <BarSparkline data={tariffBars} height={90} color="#ef4444" />
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-bg-elevated/30 border border-white/5 rounded-lg p-2 text-center">
              <span className="text-[9px] font-mono text-slate-500">Active Disputes</span>
              <div className="text-lg font-bold text-amber-400">23</div>
            </div>
            <div className="bg-bg-elevated/30 border border-white/5 rounded-lg p-2 text-center">
              <span className="text-[9px] font-mono text-slate-500">New Tariffs YTD</span>
              <div className="text-lg font-bold text-red-400">8</div>
            </div>
            <div className="bg-bg-elevated/30 border border-white/5 rounded-lg p-2 text-center">
              <span className="text-[9px] font-mono text-slate-500">FTAs in Effect</span>
              <div className="text-lg font-bold text-positive">14</div>
            </div>
          </div>
        </div>
      }>
      <div className="flex-1 flex flex-col gap-3">
        <div className="text-xs text-slate-400 border-l-[3px] border-amber-500/50 pl-3 py-1">
          These figures are WTO MFN baseline rates, not the current tariff burden from unilateral tariff actions.
        </div>
        {[
          { country: 'Bahamas', rate: '30.3%', risk: 'High' },
          { country: 'Tunisia', rate: '19.4%', risk: 'High' },
        ].map(t => (
          <div key={t.country} className="bg-bg-elevated/30 border border-white/5 p-3 rounded-lg flex-1">
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="font-bold text-slate-200 text-sm">{t.country}</div>
                <div className="text-[9px] font-mono text-slate-500">WTO MFN Baseline</div>
              </div>
              <span className="text-[9px] px-1.5 py-0.5 bg-red-500/10 text-red-400 rounded border border-red-500/20 font-bold">{t.risk}</span>
            </div>
            <div className="text-xs text-slate-300">WTO MFN baseline: {t.rate}</div>
          </div>
        ))}
      </div>
    </PulsePanel>
  );
}

export function CentralBankWatchPanel(props: PanelExpandProps) {
  const rateData = genVolatileData(3.64, 0.05, 30);

  return (
    <PulsePanel title="Central Bank Watch" category="MACRO" badge="Update 2m ago" {...props}
      analysis="The hawkish stance with 68% hike probability is the dominant market pricing. Bond futures are already discounting another 25bps. The 22% hold scenario is your contrarian trade: if upcoming CPI prints below consensus, the hold probability spikes and you'd want to be long TLT calls. Key dates: next FOMC meeting, CPI release, and Non-Farm Payrolls."
      expandedContent={
        <div className="space-y-3">
          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Fed Funds Rate (30d)</span>
          <LightweightChart data={rateData} height={100} hideAxes lineColor="#eab308" type="area" />
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-bg-elevated/30 border border-white/5 rounded-lg p-2 text-center">
              <span className="text-[9px] font-mono text-slate-500">ECB Rate</span>
              <div className="text-lg font-bold text-blue-400">4.50%</div>
            </div>
            <div className="bg-bg-elevated/30 border border-white/5 rounded-lg p-2 text-center">
              <span className="text-[9px] font-mono text-slate-500">BOJ Rate</span>
              <div className="text-lg font-bold text-purple-400">0.10%</div>
            </div>
            <div className="bg-bg-elevated/30 border border-white/5 rounded-lg p-2 text-center">
              <span className="text-[9px] font-mono text-slate-500">BOE Rate</span>
              <div className="text-lg font-bold text-amber-400">5.25%</div>
            </div>
          </div>
        </div>
      }>
      <div className="flex-1 flex flex-col justify-center items-center relative">
        <div className="text-4xl font-bold text-slate-200 mb-2">Hawkish</div>
        <p className="text-xs text-slate-400 text-center max-w-[200px]">Probability of 25bps hike at next FOMC remains elevated.</p>
        <div className="w-full mt-4 h-1.5 bg-bg-elevated rounded-full overflow-hidden flex">
          <div className="h-full bg-red-500" style={{ width: '68%' }} />
          <div className="h-full bg-slate-500" style={{ width: '22%' }} />
          <div className="h-full bg-emerald-500" style={{ width: '10%' }} />
        </div>
        <div className="w-full flex justify-between mt-2 text-[9px] font-mono text-slate-500">
          <span>Hike 68%</span> <span>Hold 22%</span> <span>Cut 10%</span>
        </div>
      </div>
    </PulsePanel>
  );
}
