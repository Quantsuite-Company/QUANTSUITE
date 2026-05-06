import React, { useState, useEffect, useMemo } from 'react';
import { BlackScholesParams, calculateBlackScholes } from '@/lib/blackScholes';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, BarChart, Bar, Cell } from 'recharts';

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

const safeFormat = (val: number, decimals: number = 4) => {
  if (isNaN(val) || !isFinite(val)) return 'NaN';
  if (Math.abs(val) > 1e10 || (Math.abs(val) < 1e-6 && val !== 0)) {
    return val.toExponential(decimals);
  }
  return val.toFixed(decimals);
};

export const BlackScholesCalculator: React.FC = () => {
  const [ticker, setTicker] = useState('AAPL');
  const [isLoading, setIsLoading] = useState(false);
  const [priceHistory, setPriceHistory] = useState<{date: string; close: number}[]>([]);
  const [params, setParams] = useState<BlackScholesParams>({
    S: 150,
    K: 150,
    T: 1,
    r: 0.05,
    sigma: 0.2,
    q: 0,
  });

  const { toast } = useToast();

  const fetchStockPrice = async (symbol: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-stock-data', {
        body: { symbol, period: '1y' }
      });

      if (error) throw error;

      const chartData = data?.chartData;
      if (!chartData || chartData.length < 20) {
        toast({ title: "INSUFFICIENT DATA", description: `${symbol}: Not enough historical data`, variant: "destructive" });
        setIsLoading(false);
        return;
      }

      const closes = chartData.map((d: any) => d.close);
      const currentPrice = closes[closes.length - 1];

      // Calculate realized volatility from real data
      const returns: number[] = [];
      for (let i = 1; i < closes.length; i++) {
        returns.push(Math.log(closes[i] / closes[i - 1]));
      }
      const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
      const variance = returns.reduce((s, r) => s + Math.pow(r - meanReturn, 2), 0) / returns.length;
      const realizedVol = Math.sqrt(variance * 252);

      // Store price history for chart
      setPriceHistory(chartData.slice(-90).map((d: any) => ({
        date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        close: d.close
      })));

      setParams(prev => ({
        ...prev,
        S: currentPrice,
        K: Math.round(currentPrice), // ATM strike
        sigma: realizedVol,
      }));

      toast({
        title: "MARKET DATA SYNCED",
        description: `${symbol}: $${currentPrice.toFixed(2)} | σ = ${(realizedVol * 100).toFixed(1)}% (realized)`
      });
    } catch (error: any) {
      toast({ title: "SYNC FAILED", description: error.message || "Falling back to local parameters", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStockPrice('AAPL');
  }, []);

  const handleParamChange = (key: keyof BlackScholesParams, value: number) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const result = useMemo(() => {
    try {
      return calculateBlackScholes(params);
    } catch (error) {
      return null;
    }
  }, [params]);

  // Generate payoff diagram data
  const payoffData = useMemo(() => {
    const data = [];
    const low = params.K * 0.7;
    const high = params.K * 1.3;
    const step = (high - low) / 60;
    const callPremium = result?.prices.call || 0;
    const putPremium = result?.prices.put || 0;

    for (let s = low; s <= high; s += step) {
      const callPayoff = Math.max(0, s - params.K) - callPremium;
      const putPayoff = Math.max(0, params.K - s) - putPremium;
      data.push({
        price: Math.round(s * 100) / 100,
        call: Math.round(callPayoff * 100) / 100,
        put: Math.round(putPayoff * 100) / 100,
      });
    }
    return data;
  }, [params.K, result]);

  // Generate Greeks sensitivity data (Delta vs Stock Price)
  const greeksSensitivity = useMemo(() => {
    const data = [];
    const low = params.K * 0.8;
    const high = params.K * 1.2;
    const step = (high - low) / 30;
    for (let s = low; s <= high; s += step) {
      try {
        const r = calculateBlackScholes({ ...params, S: s });
        if (r) {
          data.push({
            price: Math.round(s * 100) / 100,
            delta: r.greeks.delta.call,
            gamma: r.greeks.gamma * 100, // scale for visibility
            theta: Math.abs(r.greeks.theta.call),
          });
        }
      } catch { /* skip */ }
    }
    return data;
  }, [params]);

  const currencySymbol = ticker.endsWith('.NS') || ticker.endsWith('.BO') ? '₹' : '$';

  const InputField = ({ label, param, step, symbol, multiplier = 1 }: any) => (
    <div className="flex flex-col border-b border-dashed pb-2" style={{ borderColor: C.border }}>
      <label className="text-[10px] uppercase tracking-widest font-bold mb-1 flex justify-between" style={{ color: C.textD }}>
        <span>{label}</span>
        <span style={{ color: C.textH }}>{symbol}</span>
      </label>
      <input
        type="number"
        value={Number((params[param as keyof BlackScholesParams] * multiplier).toFixed(4))}
        onChange={e => handleParamChange(param, (parseFloat(e.target.value) || 0) / multiplier)}
        step={step}
        className="bg-transparent text-lg focus:outline-none font-bold"
        style={{ color: C.cyan }}
      />
    </div>
  );

  return (
    <div className="min-h-screen w-full flex flex-col p-8 overflow-y-auto" style={{ backgroundColor: C.bg, color: C.textH, fontFamily: FONT }}>

      {/* HEADER */}
      <div className="border-b pb-6 mb-8 flex justify-between items-end" style={{ borderColor: C.border }}>
        <div>
          <h1 className="text-3xl font-bold tracking-tight uppercase" style={{ fontVariant: 'small-caps' }}>Black-Scholes Pricing Engine</h1>
          <p className="text-[10px] tracking-widest uppercase mt-2 font-bold" style={{ color: C.textD }}>
            EUROPEAN OPTIONS // CONTINUOUS DIVIDEND // GREEK EXPOSURE // PAYOFF TOPOLOGY
          </p>
        </div>
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2 border-b pb-1" style={{ borderColor: C.border }}>
            <span className="text-[10px] tracking-widest uppercase font-bold" style={{ color: C.textD }}>TICKER</span>
            <input
              type="text"
              value={ticker}
              onChange={e => setTicker(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && fetchStockPrice(ticker)}
              className="bg-transparent w-20 outline-none text-[12px] font-bold tracking-widest uppercase"
              style={{ color: C.cyan }}
            />
          </div>
          <button
            onClick={() => fetchStockPrice(ticker)}
            disabled={isLoading}
            className="px-6 py-2 border text-[10px] font-bold tracking-widest uppercase hover:bg-white/5 transition-all disabled:opacity-30"
            style={{ borderColor: C.cyan, color: C.cyan }}
          >
            {isLoading ? 'SYNCING...' : 'SYNC PRICE'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">

        {/* LEFT: Parameters */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-6">
          <div className="border p-6 shadow-2xl" style={{ borderColor: C.border, backgroundColor: C.panel }}>
            <h3 className="text-[10px] tracking-widest uppercase font-bold border-b pb-2 mb-6" style={{ color: C.textD, borderColor: C.border }}>
              State Variables
            </h3>
            <div className="space-y-4">
              <InputField label="Stock Price" param="S" step="1" symbol="S" />
              <InputField label="Strike Price" param="K" step="1" symbol="K" />
              <InputField label="Time (Y)" param="T" step="0.1" symbol="T" />
              <InputField label="Volatility (%)" param="sigma" step="1" symbol="σ" multiplier={100} />
              <InputField label="Risk-Free Rate (%)" param="r" step="0.1" symbol="r" multiplier={100} />
              <InputField label="Dividend Yield (%)" param="q" step="0.1" symbol="q" multiplier={100} />
            </div>
          </div>

          {/* Moneyness Indicator */}
          <div className="border p-4" style={{ borderColor: C.border, backgroundColor: C.panel }}>
            <h3 className="text-[10px] tracking-widest uppercase font-bold border-b pb-2 mb-4" style={{ color: C.textD, borderColor: C.border }}>
              Moneyness
            </h3>
            {(() => {
              const m = params.S / params.K;
              const label = m > 1.05 ? 'DEEP ITM' : m > 1.0 ? 'IN THE MONEY' : m > 0.95 ? 'AT THE MONEY' : m > 0.9 ? 'OUT OF MONEY' : 'DEEP OTM';
              const color = m > 1.0 ? C.green : m > 0.95 ? C.amber : C.red;
              return (
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color }}>{(m * 100).toFixed(1)}%</div>
                  <div className="text-[9px] tracking-widest uppercase mt-1 font-bold" style={{ color }}>{label}</div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* RIGHT: Output & Charts */}
        <div className="col-span-12 lg:col-span-9 flex flex-col gap-6">

          {/* Price Output Row */}
          <div className="grid grid-cols-2 gap-6">
            <div className="border p-6 flex flex-col justify-center items-center shadow-2xl" style={{ borderColor: C.border, backgroundColor: C.panel }}>
              <span className="text-[10px] tracking-widest uppercase font-bold mb-2" style={{ color: C.textD }}>Theoretical Call Value</span>
              <span className="text-5xl font-light" style={{ color: C.cyan }}>
                {currencySymbol}{result ? safeFormat(result.prices.call, 4) : 'NaN'}
              </span>
            </div>
            <div className="border p-6 flex flex-col justify-center items-center shadow-2xl" style={{ borderColor: C.border, backgroundColor: C.panel }}>
              <span className="text-[10px] tracking-widest uppercase font-bold mb-2" style={{ color: C.textD }}>Theoretical Put Value</span>
              <span className="text-5xl font-light" style={{ color: C.purple }}>
                {currencySymbol}{result ? safeFormat(result.prices.put, 4) : 'NaN'}
              </span>
            </div>
          </div>

          {/* Greeks Matrix */}
          <div className="border shadow-2xl flex flex-col" style={{ borderColor: C.border, backgroundColor: C.panel }}>
            <div className="p-6 border-b" style={{ borderColor: C.border }}>
              <h3 className="text-[10px] tracking-widest uppercase font-bold" style={{ color: C.textD }}>
                First & Second Order Greeks
              </h3>
            </div>
            <div className="p-6 grid grid-cols-2 lg:grid-cols-5 gap-6">
              {[
                { name: 'Delta (Δ)', call: result?.greeks.delta.call, put: result?.greeks.delta.put, desc: 'Directional exposure' },
                { name: 'Gamma (Γ)', call: result?.greeks.gamma, put: result?.greeks.gamma, desc: 'Convexity' },
                { name: 'Theta (Θ)', call: result?.greeks.theta.call, put: result?.greeks.theta.put, desc: 'Time decay / day' },
                { name: 'Vega (ν)', call: result?.greeks.vega, put: result?.greeks.vega, desc: 'Vol sensitivity' },
                { name: 'Rho (ρ)', call: result?.greeks.rho.call, put: result?.greeks.rho.put, desc: 'Rate sensitivity' },
              ].map((greek, i) => (
                <div key={i} className="flex flex-col gap-3">
                  <div className="text-[11px] font-bold uppercase tracking-widest border-b pb-1" style={{ color: C.textH, borderColor: C.border }}>
                    {greek.name}
                  </div>
                  <div className="space-y-2">
                    <div>
                      <div className="text-[9px] uppercase tracking-widest mb-0.5" style={{ color: C.textD }}>Call</div>
                      <div className="text-lg font-bold" style={{ color: C.cyan }}>{greek.call !== undefined ? safeFormat(greek.call, 4) : 'NaN'}</div>
                    </div>
                    <div>
                      <div className="text-[9px] uppercase tracking-widest mb-0.5" style={{ color: C.textD }}>Put</div>
                      <div className="text-lg font-bold" style={{ color: C.purple }}>{greek.put !== undefined ? safeFormat(greek.put, 4) : 'NaN'}</div>
                    </div>
                  </div>
                  <div className="text-[9px] mt-auto uppercase tracking-widest" style={{ color: C.textM }}>{greek.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-2 gap-6">

            {/* Payoff Diagram */}
            <div className="border p-6 h-[280px] flex flex-col" style={{ borderColor: C.border, backgroundColor: C.panel }}>
              <h3 className="text-[10px] tracking-widest uppercase font-bold border-b pb-2 mb-4" style={{ color: C.textD, borderColor: C.border }}>
                P&L at Expiration
              </h3>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={payoffData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="callGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={C.cyan} stopOpacity={0.2}/>
                        <stop offset="95%" stopColor={C.cyan} stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="putGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={C.purple} stopOpacity={0.2}/>
                        <stop offset="95%" stopColor={C.purple} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                    <XAxis dataKey="price" stroke={C.textD} fontSize={8} fontFamily={FONT} tickFormatter={v => `${currencySymbol}${v}`} />
                    <YAxis stroke={C.textD} fontSize={8} fontFamily={FONT} />
                    <Tooltip contentStyle={{ backgroundColor: '#000', borderColor: C.border, fontFamily: FONT, fontSize: 11 }} />
                    <ReferenceLine y={0} stroke={C.textM} strokeDasharray="4 4" />
                    <ReferenceLine x={params.K} stroke={C.amber} strokeDasharray="4 4" label={{ value: 'K', fill: C.amber, fontSize: 9 }} />
                    <Area type="monotone" dataKey="call" name="Call P&L" stroke={C.cyan} strokeWidth={2} fillOpacity={1} fill="url(#callGrad)" />
                    <Area type="monotone" dataKey="put" name="Put P&L" stroke={C.purple} strokeWidth={2} fillOpacity={1} fill="url(#putGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Greeks Sensitivity */}
            <div className="border p-6 h-[280px] flex flex-col" style={{ borderColor: C.border, backgroundColor: C.panel }}>
              <h3 className="text-[10px] tracking-widest uppercase font-bold border-b pb-2 mb-4" style={{ color: C.textD, borderColor: C.border }}>
                Delta & Gamma vs Underlying
              </h3>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={greeksSensitivity} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="deltaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={C.green} stopOpacity={0.2}/>
                        <stop offset="95%" stopColor={C.green} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                    <XAxis dataKey="price" stroke={C.textD} fontSize={8} fontFamily={FONT} tickFormatter={v => `${currencySymbol}${v}`} />
                    <YAxis stroke={C.textD} fontSize={8} fontFamily={FONT} />
                    <Tooltip contentStyle={{ backgroundColor: '#000', borderColor: C.border, fontFamily: FONT, fontSize: 11 }} />
                    <ReferenceLine x={params.K} stroke={C.amber} strokeDasharray="4 4" />
                    <Area type="monotone" dataKey="delta" name="Delta" stroke={C.green} strokeWidth={2} fillOpacity={1} fill="url(#deltaGrad)" />
                    <Area type="monotone" dataKey="gamma" name="Gamma (×100)" stroke={C.amber} strokeWidth={1.5} fillOpacity={0} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Price History Chart */}
          {priceHistory.length > 0 && (
            <div className="border p-6 h-[240px] flex flex-col" style={{ borderColor: C.border, backgroundColor: C.panel }}>
              <h3 className="text-[10px] tracking-widest uppercase font-bold border-b pb-2 mb-4" style={{ color: C.textD, borderColor: C.border }}>
                {ticker} — 90D Price Discovery (Live Data)
              </h3>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={priceHistory} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={C.cyan} stopOpacity={0.15}/>
                        <stop offset="95%" stopColor={C.cyan} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                    <XAxis dataKey="date" stroke={C.textD} fontSize={8} fontFamily={FONT} minTickGap={30} />
                    <YAxis stroke={C.textD} fontSize={8} fontFamily={FONT} domain={['auto', 'auto']} tickFormatter={v => `${currencySymbol}${v}`} />
                    <Tooltip contentStyle={{ backgroundColor: '#000', borderColor: C.border, fontFamily: FONT }} />
                    <ReferenceLine y={params.K} stroke={C.amber} strokeDasharray="4 4" label={{ value: `Strike ${currencySymbol}${params.K}`, fill: C.amber, fontSize: 9, position: 'insideTopRight' }} />
                    <Area type="monotone" dataKey="close" name="Close" stroke={C.cyan} strokeWidth={2} fillOpacity={1} fill="url(#priceGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};