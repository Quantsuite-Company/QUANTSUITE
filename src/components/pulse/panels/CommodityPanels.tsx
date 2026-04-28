import { PulsePanel } from '../PulseGrid';
import { LightweightChart, MiniSparkline, BarSparkline } from '@/components/chart/ChartContainer';
import { useState } from 'react';

interface PanelExpandProps {
  panelId?: string;
  onExpand?: (id: string) => void;
  expanded?: boolean;
  onClose?: () => void;
}

// Realistic volatile data generator (no flat lines)
function genVolatileData(startVal: number, volatility: number, length = 60) {
  let val = startVal;
  return Array.from({ length }).map((_, i) => {
    const trend = Math.sin(i / 8) * volatility * 0.3;
    const noise = (Math.random() - 0.5) * volatility;
    val += trend + noise;
    return { time: Math.floor(Date.now() / 1000) - (length - i) * 86400, value: val };
  });
}

function genBarData(base: number, vol: number, len = 12) {
  return Array.from({ length: len }).map((_, i) => ({
    name: `W${i + 1}`,
    value: base + (Math.random() - 0.5) * vol,
    color: Math.random() > 0.5 ? '#22c55e' : '#ef4444',
  }));
}

export function EnergyComplexPanel(props: PanelExpandProps) {
  const oilData = Array.from({ length: 30 }).map((_, i) => {
    const base = 82 + Math.sin(i / 4) * 3;
    return base + (Math.random() - 0.5) * 2;
  });
  const brentData = Array.from({ length: 30 }).map((_, i) => {
    const base = 87 + Math.sin(i / 5) * 2.5;
    return base + (Math.random() - 0.5) * 1.5;
  });
  const inventoryBars = genBarData(870, 50, 12);
  const natGasBars = genBarData(1900, 80, 12);

  return (
    <PulsePanel title="Energy Complex" category="COMMODITIES" className={props.expanded ? '' : 'row-span-2'} {...props}
      analysis="US Crude inventories rising +1,342 MB week-over-week is bearish for near-term oil prices — builds above 1,000 MB typically pressure WTI by 1-2% within 48 hours. However, the absolute level at 876K MB is still below the 5-year average, providing a structural floor. Nat Gas storage at 1,911 Bcf with +50 WoW build is seasonal and expected. The OIL tape showing -0.4% while BRENT holds +0.2% creates a widening WTI-Brent spread — this favors refiners (VLO, MPC) over E&P companies."
      expandedContent={
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-bg-elevated/30 border border-white/5 rounded-lg p-3">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">WTI 52-Week Range</span>
            <div className="flex justify-between mt-2 text-xs font-mono">
              <span className="text-negative">Low: $67.20</span>
              <span className="text-positive">High: $93.40</span>
            </div>
            <div className="w-full h-2 bg-bg-elevated rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-red-500 via-amber-500 to-green-500 rounded-full" style={{ width: '62%' }} />
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Current: $84.60 (62nd percentile)</span>
          </div>
          <div className="bg-bg-elevated/30 border border-white/5 rounded-lg p-3">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">OPEC+ Compliance</span>
            <div className="text-2xl font-bold text-amber-400 mt-1">94.2%</div>
            <span className="text-[10px] text-slate-400">Members adhering to cuts, Saudi leading at 100%</span>
          </div>
          <div className="bg-bg-elevated/30 border border-white/5 rounded-lg p-3">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Refinery Utilization</span>
            <div className="text-2xl font-bold text-blue-400 mt-1">91.8%</div>
            <span className="text-[10px] text-slate-400">+1.2% WoW — seasonal ramp</span>
          </div>
          <div className="bg-bg-elevated/30 border border-white/5 rounded-lg p-3">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Rig Count (Baker Hughes)</span>
            <div className="text-2xl font-bold text-slate-200 mt-1">584</div>
            <span className="text-[10px] text-negative">-6 WoW — continued decline</span>
          </div>
        </div>
      }>
      <div className="flex-1 flex flex-col gap-3">
        <div>
          <div className="text-[10px] text-slate-400 font-mono uppercase tracking-widest mb-1">US Crude Inventories (MB) — 12 Week</div>
          <div className="flex items-end gap-2 mb-2">
            <span className="text-xl font-bold text-slate-200">876,042 MB</span>
            <span className="text-xs font-bold text-negative mb-0.5">+1,342 WoW</span>
          </div>
          <BarSparkline data={inventoryBars} height={props.expanded ? 100 : 45} color="#ef4444" />
        </div>
        <div>
          <div className="text-[10px] text-slate-400 font-mono uppercase tracking-widest mb-1">US Nat Gas Storage (Bcf) — 12 Week</div>
          <div className="flex items-end gap-2 mb-2">
            <span className="text-xl font-bold text-slate-200">1,911 Bcf</span>
            <span className="text-xs font-bold text-negative mb-0.5">+50 WoW</span>
          </div>
          <BarSparkline data={natGasBars} height={props.expanded ? 100 : 45} color="#3b82f6" />
        </div>
        <div className="mt-auto">
          <div className="text-[10px] text-slate-400 font-mono uppercase tracking-widest mb-2 border-b border-white/5 pb-1">Live Tape</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-slate-300">OIL (WTI)</span>
                <span className="text-[8px] text-negative font-mono">-0.4%</span>
              </div>
              <MiniSparkline data={oilData} height={30} color="#ef4444" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-slate-300">BRENT</span>
                <span className="text-[8px] text-positive font-mono">+0.2%</span>
              </div>
              <MiniSparkline data={brentData} height={30} color="#22c55e" />
            </div>
          </div>
        </div>
      </div>
    </PulsePanel>
  );
}

export function SupplyChainPanel(props: PanelExpandProps) {
  const [activeTab, setActiveTab] = useState<'chokepoints' | 'shipping'>('chokepoints');

  const routes = [
    { name: 'Strait of Hormuz', risk: 'critical', warning: 'ATS disruption(s)', hti: 80, vessels: '+145.8%' },
    { name: 'Bab el-Mandeb', risk: 'high', warning: 'Active', hti: 65, vessels: '-18.3%' },
    { name: 'Suez Canal', risk: 'elevated', warning: 'Transit delays', hti: 45, vessels: '-45.2%' },
  ];

  const shippingRates = [
    { route: 'Shanghai → Rotterdam', type: '40ft Container', rate: '$4,250', change: '+12.3%', trend: 'up' },
    { route: 'Shanghai → LA', type: '40ft Container', rate: '$3,180', change: '+8.7%', trend: 'up' },
    { route: 'Rotterdam → New York', type: '40ft Container', rate: '$2,450', change: '-2.1%', trend: 'down' },
    { route: 'Singapore → Dubai', type: 'Bulk Carrier', rate: '$18,500/day', change: '+22.5%', trend: 'up' },
    { route: 'Brazil → China', type: 'Capesize', rate: '$24,300/day', change: '+5.8%', trend: 'up' },
    { route: 'Baltic Dry Index', type: 'Composite', rate: '1,842', change: '+3.2%', trend: 'up' },
  ];

  return (
    <PulsePanel title="Supply Chain" category="COMMODITIES" className={props.expanded ? '' : 'row-span-2'} {...props}
      analysis="Strait of Hormuz at CRITICAL with +145.8% vessel traffic increase signals major rerouting from Bab el-Mandeb (-18.3%) and Suez (-45.2%). Shipping rates on the Shanghai-Rotterdam corridor are up 12.3% — direct fallout from Red Sea disruptions forcing Asia-Europe traffic around the Cape. The Baltic Dry Index at 1,842 (+3.2%) confirms broad shipping demand. Winners: tanker companies (STNG, FRO), container lines (ZIM). Losers: European importers, automotive supply chains."
      expandedContent={
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-bg-elevated/30 border border-white/5 rounded-lg p-3 text-center">
            <span className="text-[9px] font-mono text-slate-500 uppercase">Global Fleet Utilization</span>
            <div className="text-2xl font-bold text-amber-400 mt-1">87.4%</div>
          </div>
          <div className="bg-bg-elevated/30 border border-white/5 rounded-lg p-3 text-center">
            <span className="text-[9px] font-mono text-slate-500 uppercase">Port Congestion Index</span>
            <div className="text-2xl font-bold text-red-400 mt-1">72/100</div>
          </div>
          <div className="bg-bg-elevated/30 border border-white/5 rounded-lg p-3 text-center">
            <span className="text-[9px] font-mono text-slate-500 uppercase">Avg Transit Delay</span>
            <div className="text-2xl font-bold text-slate-200 mt-1">+4.2 days</div>
          </div>
        </div>
      }>
      <div className="flex-1 flex flex-col gap-3 pt-2">
        <div className="flex items-center gap-4 border-b border-white/5 pb-2 text-xs font-bold text-slate-300">
          <span onClick={() => setActiveTab('chokepoints')} className={`uppercase cursor-pointer pb-1 transition-colors ${activeTab === 'chokepoints' ? 'text-slate-200 border-b-2 border-[#3b82f6]' : 'text-slate-500 hover:text-slate-300'}`}>Chokepoints</span>
          <span onClick={() => setActiveTab('shipping')} className={`uppercase cursor-pointer pb-1 transition-colors ${activeTab === 'shipping' ? 'text-slate-200 border-b-2 border-[#3b82f6]' : 'text-slate-500 hover:text-slate-300'}`}>Shipping Rates</span>
        </div>
        
        {activeTab === 'chokepoints' ? (
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {routes.map(r => (
              <div key={r.name} className="bg-bg-elevated/40 border border-white/5 p-2.5 rounded-lg text-sm">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-slate-200">{r.name}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase ${r.risk === 'critical' ? 'bg-red-500/20 text-red-500 border border-red-500/30' : r.risk === 'high' ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'}`}>
                    {r.risk}
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
                  <span className="text-[10px] text-slate-400 font-mono">{r.warning}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono border-t border-white/5 pt-1.5 mt-1.5">
                  <span className="text-slate-500">Vessels: <span className={r.vessels.startsWith('+') ? 'text-positive' : 'text-negative'}>{r.vessels}</span></span>
                  <span className="text-slate-500">HTI: <span className="text-slate-300">{r.hti}/100</span></span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {shippingRates.map(s => (
              <div key={s.route} className="bg-bg-elevated/40 border border-white/5 p-2.5 rounded-lg">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-slate-200">{s.route}</span>
                  <span className={`text-[10px] font-mono font-bold ${s.trend === 'up' ? 'text-positive' : 'text-negative'}`}>{s.change}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-slate-500">{s.type}</span>
                  <span className="text-slate-300 font-bold">{s.rate}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PulsePanel>
  );
}

export function GoldIntelligencePanel(props: PanelExpandProps) {
  const gData = genVolatileData(4750, 15);
  const goldBars = genBarData(4750, 30, 10);

  return (
    <PulsePanel title="Gold Intelligence" category="COMMODITIES" {...props}
      analysis="Gold at $4,752.70 with -0.72% is a healthy pullback within a secular bull trend. The Gold/Silver ratio at 64.1 is neutral. Gold's +133.8% premium over Platinum reflects extraordinary safe-haven demand. Accumulate on dips below $4,700 for portfolio insurance."
      expandedContent={
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-bg-elevated/30 border border-white/5 rounded-lg p-3">
            <span className="text-[9px] font-mono text-slate-500 uppercase">Central Bank Buying (tons/mo)</span>
            <div className="text-xl font-bold text-amber-400 mt-1">78.4t</div>
            <span className="text-[10px] text-positive">+14.2% YoY — China, India leading</span>
          </div>
          <div className="bg-bg-elevated/30 border border-white/5 rounded-lg p-3">
            <span className="text-[9px] font-mono text-slate-500 uppercase">ETF Holdings (GLD)</span>
            <div className="text-xl font-bold text-slate-200 mt-1">862.3t</div>
            <span className="text-[10px] text-positive">+2.1% MoM — inflows resuming</span>
          </div>
          <div className="col-span-2">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-2 block">10-Day Volume Profile</span>
            <BarSparkline data={goldBars} height={70} color="#eab308" />
          </div>
        </div>
      }>
      <div className="flex-1 flex flex-col pt-1">
        <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-1 mt-1">Price & Performance</div>
        <div className="flex items-end gap-2 mb-1">
          <span className="text-xl font-bold text-slate-200 tracking-tight">$4,752.70</span>
          <span className="text-xs font-bold font-mono text-negative mb-0.5">-0.72%</span>
        </div>
        <div className="flex items-center gap-1.5 mb-3">
          <div className="w-1 h-1 rounded-full bg-slate-500" />
          <span className="text-[9px] text-slate-500 font-mono">Updated • GC=F front-month</span>
        </div>
        <div className="flex-1 -mx-2 mb-2">
          <LightweightChart data={gData} height={props.expanded ? 150 : 60} hideAxes lineColor="#eab308" type="area" />
        </div>
        <div className="mt-auto space-y-1">
          <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-2 border-b border-white/5 pb-1">Metals Complex</div>
          <div className="flex justify-between items-center text-[10px] font-mono">
            <span className="text-slate-400">Gold/Silver Ratio</span>
            <span className="text-slate-300">64.1 <span className="text-slate-500 ml-1">Neutral</span></span>
          </div>
          <div className="flex justify-between items-center text-[10px] font-mono">
            <span className="text-slate-400">Gold vs Platinum</span>
            <span className="text-positive">+133.8% <span className="text-slate-500 ml-1">premium</span></span>
          </div>
        </div>
      </div>
    </PulsePanel>
  );
}
