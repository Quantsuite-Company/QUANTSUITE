import { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  TrendingUp, DollarSign, Activity, Zap, Download, 
  Search, Filter, ArrowUpRight, ArrowDownRight, LayoutGrid, X, RotateCcw
} from 'lucide-react';

interface ScreenerResult {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  rsi?: number;
  macd?: number;
  sector?: string;
}

interface ScreenerFilters {
  priceMin?: number;
  priceMax?: number;
  volumeMin?: number;
  changePercentMin?: number;
  changePercentMax?: number;
  rsiMin?: number;
  rsiMax?: number;
  sector?: string;
}

const presetScreens = [
  { name: 'MOMENTUM BURST', desc: 'RSI > 60 | VOL > 1M | CHG > 2%', filters: { rsiMin: 60, volumeMin: 1000000, changePercentMin: 2 } },
  { name: 'OVERSOLD VALUE', desc: 'RSI < 30 | CHG < -2%', filters: { rsiMax: 30, changePercentMax: -2 } },
  { name: 'HIGH VOLUME', desc: 'VOL > 5M', filters: { volumeMin: 5000000 } },
  { name: 'TECH LEADERS', desc: 'TECH | VOL > 1M | CHG > 1%', filters: { sector: 'Technology', volumeMin: 1000000, changePercentMin: 1 } }
];

export default function ScreenerPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ScreenerResult[]>([]);
  
  // draftFilters are what the user is currently tweaking in the left panel.
  const [draftFilters, setDraftFilters] = useState<ScreenerFilters>({});
  
  // activeFilters are the ones currently applied to the results grid.
  const [activeFilters, setActiveFilters] = useState<ScreenerFilters | null>(null);

  const [sortBy, setSortBy] = useState<keyof ScreenerResult>('changePercent');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [hasRun, setHasRun] = useState(false);

  const runScreen = async () => {
    setLoading(true);
    
    // Commit drafts to active
    setActiveFilters({...draftFilters});

    try {
      const { data, error } = await supabase.functions.invoke('run-screener', {
        body: { filters: draftFilters }
      });

      if (error) throw error;

      setResults(data.results || []);
      setHasRun(true);
      toast.success(`Screen executed. ${data.results?.length || 0} assets found.`);
    } catch (error) {
      console.error('Screener error:', error);
      toast.error('Failed to execute screening protocols.');
    } finally {
      setLoading(false);
    }
  };

  const applyPreset = (preset: typeof presetScreens[0]) => {
    // Only load into draft, do not run automatically as requested
    setDraftFilters({...preset.filters});
    toast.info(`Preset Loaded: ${preset.name}. Click Run Screen to execute.`);
  };

  const resetFilters = () => {
    setDraftFilters({});
    setActiveFilters(null);
    setResults([]);
    setHasRun(false);
    toast.info("Filters cleared and screener reset.");
  };

  const exportResults = () => {
    const csv = [
      ['Symbol', 'Price', 'Change %', 'Volume', 'RSI', 'Sector'].join(','),
      ...results.map(r => [
        r.symbol,
        r.price,
        r.changePercent.toFixed(2),
        r.volume,
        r.rsi?.toFixed(2) || 'N/A',
        r.sector || 'N/A'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `screener-export-${Date.now()}.csv`;
    a.click();
  };

  const sortedResults = [...results].sort((a, b) => {
    const aVal = a[sortBy] || 0;
    const bVal = b[sortBy] || 0;
    return sortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
  });

  const getActiveFilterCount = () => {
    if (!activeFilters) return 0;
    return Object.keys(activeFilters).filter(k => activeFilters[k as keyof ScreenerFilters] !== undefined).length;
  };

  return (
    <div className="relative h-screen w-full bg-[#09090b] text-white overflow-hidden font-mono flex flex-col selection:bg-indigo-500/30">
      
      {/* TOP DECK */}
      <div className="flex-none bg-black/80 border-b border-indigo-500/20 px-6 py-3 z-20 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 border-r border-white/10 pr-6">
            <Target className="w-5 h-5 text-emerald-500" />
            <div className="text-[11px] font-bold tracking-widest leading-tight uppercase">
              Quantitative Screener <br/>
              <span className="text-white/40 font-light">Factor Isolation Engine</span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-3">
          {results.length > 0 && (
            <button 
              onClick={exportResults}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-xs transition-colors tracking-widest uppercase"
            >
              <Download className="w-3 h-3" /> Data Export
            </button>
          )}
          <button 
            onClick={resetFilters}
            className="flex items-center gap-2 px-4 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded text-xs transition-colors tracking-widest uppercase"
          >
            <RotateCcw className="w-3 h-3" /> RESET
          </button>
          <button 
            onClick={() => runScreen()}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 rounded text-xs transition-colors tracking-widest uppercase"
          >
            {loading ? <Zap className="w-3 h-3 animate-pulse" /> : <Search className="w-3 h-3" />}
            {loading ? 'EXECUTING...' : 'RUN SCREEN'}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL: FILTERS */}
        <div className="w-[320px] bg-black/40 border-r border-white/5 overflow-y-auto flex flex-col hide-scrollbar p-5 space-y-8">
          
          {/* Presets */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <div className="flex items-center gap-2 text-[10px] text-white/40 tracking-widest uppercase">
                <Zap className="w-3 h-3" /> Tactical Presets
              </div>
            </div>
            <div className="grid gap-2">
              {presetScreens.map((preset) => (
                <div 
                  key={preset.name}
                  onClick={() => applyPreset(preset)}
                  className="cursor-pointer bg-white/5 hover:bg-indigo-500/10 border border-white/5 hover:border-indigo-500/30 p-3 flex flex-col gap-1 transition-all group"
                >
                  <span className="text-xs font-bold text-white group-hover:text-indigo-400">{preset.name}</span>
                  <span className="text-[10px] text-white/40">{preset.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Filters Wrapper */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <div className="flex items-center gap-2 text-[10px] text-white/40 tracking-widest uppercase">
                <Filter className="w-3 h-3" /> Draft Parameters
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] text-white/50 tracking-widest uppercase">Target Sector</label>
                <select 
                  className="w-full bg-[#09090b] border border-white/10 text-xs p-2 rounded text-white focus:border-indigo-500/50 outline-none"
                  value={draftFilters.sector || ''}
                  onChange={e => setDraftFilters({...draftFilters, sector: e.target.value || undefined})}
                >
                  <option value="">ANY SECTOR</option>
                  <option value="Technology">TECHNOLOGY</option>
                  <option value="Finance">FINANCE</option>
                  <option value="Healthcare">HEALTHCARE</option>
                  <option value="Energy">ENERGY</option>
                  <option value="Consumer">CONSUMER</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-white/50 tracking-widest uppercase">Price Range ($)</label>
                <div className="flex gap-2">
                  <input type="number" placeholder="MIN" className="w-full bg-[#09090b] border border-white/10 p-2 text-xs rounded" value={draftFilters.priceMin || ''} onChange={e => setDraftFilters({...draftFilters, priceMin: parseFloat(e.target.value) || undefined})} />
                  <input type="number" placeholder="MAX" className="w-full bg-[#09090b] border border-white/10 p-2 text-xs rounded" value={draftFilters.priceMax || ''} onChange={e => setDraftFilters({...draftFilters, priceMax: parseFloat(e.target.value) || undefined})} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-white/50 tracking-widest uppercase">Volume Min</label>
                <input type="number" placeholder="e.g. 1000000" className="w-full bg-[#09090b] border border-white/10 p-2 text-xs rounded" value={draftFilters.volumeMin || ''} onChange={e => setDraftFilters({...draftFilters, volumeMin: parseFloat(e.target.value) || undefined})} />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-white/50 tracking-widest uppercase">Daily Change (%)</label>
                <div className="flex gap-2">
                  <input type="number" placeholder="MIN" className="w-full bg-[#09090b] border border-white/10 p-2 text-xs rounded" value={draftFilters.changePercentMin || ''} onChange={e => setDraftFilters({...draftFilters, changePercentMin: parseFloat(e.target.value) || undefined})} />
                  <input type="number" placeholder="MAX" className="w-full bg-[#09090b] border border-white/10 p-2 text-xs rounded" value={draftFilters.changePercentMax || ''} onChange={e => setDraftFilters({...draftFilters, changePercentMax: parseFloat(e.target.value) || undefined})} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-white/50 tracking-widest uppercase">RSI(14) Boundaries</label>
                <div className="flex gap-2">
                  <input type="number" placeholder="MIN (0)" className="w-full bg-[#09090b] border border-white/10 p-2 text-xs rounded" value={draftFilters.rsiMin || ''} onChange={e => setDraftFilters({...draftFilters, rsiMin: parseFloat(e.target.value) || undefined})} />
                  <input type="number" placeholder="MAX (100)" className="w-full bg-[#09090b] border border-white/10 p-2 text-xs rounded" value={draftFilters.rsiMax || ''} onChange={e => setDraftFilters({...draftFilters, rsiMax: parseFloat(e.target.value) || undefined})} />
                </div>
              </div>

              {/* Explicit Visual Prompt to Run */}
              {JSON.stringify(draftFilters) !== JSON.stringify(activeFilters) && hasRun && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[10px] uppercase tracking-widest rounded text-center animate-pulse">
                  Draft Filters Modified.<br/>Click 'Run Screen' to apply.
                </div>
              )}

            </div>
          </div>
        </div>

        {/* RIGHT PANEL: DATAGRID */}
        <div className="flex-1 flex flex-col p-6 bg-gradient-to-br from-indigo-500/[0.02] to-transparent">
          
          <div className="flex justify-between items-end mb-4 border-b border-white/10 pb-4">
            <div>
              <h2 className="text-xl font-light tracking-widest">SCREENER_RESULTS</h2>
              <div className="flex items-center gap-2 mt-1">
                {hasRun ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <p className="text-xs text-indigo-400">{results.length} Assets matching {getActiveFilterCount()} active filters</p>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <p className="text-xs text-white/40">SYSTEM STANDBY - READY TO EXECUTE</p>
                  </>
                )}
              </div>
            </div>
            
            {results.length > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-white/50 tracking-widest">SORT:</span>
                <select 
                  className="bg-transparent border-none text-xs text-white focus:outline-none cursor-pointer"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                >
                  <option className="bg-[#09090b]" value="changePercent">CHANGE YIELD</option>
                  <option className="bg-[#09090b]" value="volume">VOLUME</option>
                  <option className="bg-[#09090b]" value="rsi">RSI MOMENTUM</option>
                </select>
                <button 
                  onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')}
                  className="text-white/50 hover:text-white"
                >
                  {sortOrder === 'desc' ? '▼' : '▲'}
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-auto hide-scrollbar">
            {hasRun && results.length > 0 ? (
              <div className="min-w-[800px]">
                {/* Header Row */}
                <div className="grid grid-cols-7 gap-4 px-4 py-2 border-b border-white/5 text-[10px] font-bold tracking-widest text-white/40 uppercase sticky top-0 bg-[#09090b]/90 backdrop-blur z-10">
                  <div className="col-span-1">TICKER</div>
                  <div className="col-span-1 text-right">PRICE</div>
                  <div className="col-span-1 text-right">CHANGE</div>
                  <div className="col-span-1 text-right">VOLUME</div>
                  <div className="col-span-1 text-right">RSI(14)</div>
                  <div className="col-span-1 text-right">MOMENTUM BAR</div>
                  <div className="col-span-1 text-right">SECTOR</div>
                </div>
                
                {/* Data Rows */}
                <div className="divide-y divide-white/5">
                  {sortedResults.map((row, idx) => (
                    <motion.div 
                      key={row.symbol}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      className="grid grid-cols-7 gap-4 px-4 py-3 hover:bg-white/5 transition-colors items-center group cursor-pointer"
                    >
                      <div className="col-span-1 flex flex-col">
                        <span className="font-bold text-white group-hover:text-indigo-400 transition-colors">{row.symbol}</span>
                      </div>
                      
                      <div className="col-span-1 text-right font-light">
                        ${row.price.toFixed(2)}
                      </div>
                      
                      <div className={`col-span-1 flex items-center justify-end gap-1 font-medium ${row.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {row.changePercent >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {Math.abs(row.changePercent).toFixed(2)}%
                      </div>
                      
                      <div className="col-span-1 text-right">
                        {(row.volume / 1e6).toFixed(2)}M
                      </div>
                      
                      <div className={`col-span-1 text-right ${!row.rsi ? 'text-white/20' : row.rsi > 70 ? 'text-rose-400' : row.rsi < 30 ? 'text-emerald-400' : 'text-white/80'}`}>
                        {row.rsi ? row.rsi.toFixed(1) : '—'}
                      </div>
                      
                      <div className="col-span-1 flex items-center justify-end">
                        <div className="w-24 h-1.5 bg-white/10 rounded overflow-hidden">
                          <div 
                            className={`h-full ${row.changePercent >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                            style={{ width: `${Math.min(Math.max(Math.abs(row.changePercent) * 10, 5), 100)}%` }}
                          />
                        </div>
                      </div>
                      
                      <div className="col-span-1 text-right text-[10px] text-white/50 truncate uppercase tracking-widest">
                        {row.sector || 'UNKNOWN'}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-white/20">
                <Search className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-sm tracking-widest uppercase">
                  {hasRun ? '0 ASSETS MATCHING ACTIVE PROTOCOL' : 'AWAITING FILTER ACTIVATION'}
                </p>
                <p className="text-[10px] tracking-widest font-light mt-2 max-w-sm text-center">
                  {hasRun ? 'ADJUST PARAMETERS AND CLICK RUN SCREEN TO RE-EXECUTE.' : 'SELECT FILTERS FROM THE LEFT PANEL AND CLICK "RUN SCREEN" TO INITIATE ASSET DISCOVERY.'}
                </p>
              </div>
            )}
           </div>

        </div>
      </div>
    </div>
  );
}
