import { useState } from 'react';
import { QuantSuiteSEO } from '@/components/QuantSuiteSEO';
import { HestonModel as HestonPricer } from '@/lib/advancedPricing';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const C = {
  bg: '#050505',
  panel: '#0a0a0c',
  border: 'rgba(255,255,255,0.1)',
  textH: '#ffffff',
  textM: 'rgba(255,255,255,0.7)',
  textD: 'rgba(255,255,255,0.4)',
  cyan: '#06b6d4',
};

const FONT = '"Times New Roman", Times, serif';

export default function HestonModel() {
  const [params, setParams] = useState({
    S: 100,      // Current stock price
    K: 100,      // Strike price
    T: 1,        // Time to maturity (years)
    r: 0.05,     // Risk-free rate
    v0: 0.04,    // Initial variance
    kappa: 2,    // Mean reversion speed
    theta: 0.04, // Long-term variance
    sigma: 0.3,  // Volatility of volatility
    rho: -0.7,   // Correlation between stock and variance
  });

  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const hestonModel = new HestonPricer();

  const handleParamChange = (key: string, value: number) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const calculatePrice = () => {
    setLoading(true);
    setTimeout(() => {
      try {
        const result = hestonModel.price(params);
        const greeks = result.greeks;
        
        // Generate Volatility Smile Data
        const strikes = [];
        for (let k = 0.7; k <= 1.3; k += 0.05) {
          const moneyness = k;
          const skew = params.rho * params.sigma * (1 - moneyness);
          const convexity = 0.5 * params.sigma * params.sigma * Math.pow(1 - moneyness, 2);
          const vol = Math.sqrt(params.theta) * (1 + skew + convexity);
          strikes.push({
            moneyness: parseFloat((moneyness * 100).toFixed(0)),
            impliedVol: parseFloat((vol * 100).toFixed(2)),
            atmVol: parseFloat((Math.sqrt(params.theta) * 100).toFixed(2)),
          });
        }
        
        setResults({
          ...result,
          greeks,
          smileData: strikes,
        });
      } catch (error) {
        console.error('Heston pricing error:', error);
      }
      setLoading(false);
    }, 100);
  };

  const InputField = ({ label, param, step, symbol }: any) => (
    <div className="flex flex-col border-b border-dashed pb-2" style={{ borderColor: C.border }}>
      <label className="text-[10px] uppercase tracking-widest font-bold mb-1 flex justify-between" style={{ color: C.textD }}>
        <span>{label}</span>
        <span style={{ color: C.textH }}>{symbol}</span>
      </label>
      <input
        type="number"
        value={(params as any)[param]}
        onChange={e => handleParamChange(param, parseFloat(e.target.value) || 0)}
        step={step}
        className="bg-transparent text-lg focus:outline-none font-bold"
        style={{ color: C.cyan }}
      />
    </div>
  );

  return (
    <>
      <QuantSuiteSEO 
        title="Heston Stochastic Volatility Model"
        description="European options pricing via Heston characteristics"
        path="/heston-model"
      />
      
      <div className="min-h-screen w-full flex flex-col p-8" style={{ backgroundColor: C.bg, color: C.textH, fontFamily: FONT }}>
        
        {/* HEADER */}
        <div className="border-b pb-6 mb-8 flex justify-between items-end" style={{ borderColor: C.border }}>
          <div>
            <h1 className="text-3xl font-bold tracking-tight uppercase" style={{ fontVariant: 'small-caps' }}>Heston Stochastic Volatility Model</h1>
            <p className="text-[10px] tracking-widest uppercase mt-2 font-bold" style={{ color: C.textD }}>
              INSTITUTIONAL PRICING ENGINE // STOCHASTIC DIFFERENTIAL EQUATIONS
            </p>
          </div>
          <button 
            onClick={calculatePrice}
            disabled={loading}
            className="px-8 py-3 border text-[11px] font-bold tracking-widest uppercase hover:bg-white/5 transition-all"
            style={{ borderColor: C.cyan, color: C.cyan }}
          >
            {loading ? 'COMPUTING INTEGRALS...' : 'EXECUTE PRICING'}
          </button>
        </div>

        <div className="grid grid-cols-12 gap-8">
          
          {/* LEFT: Parameters */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-8">
            <div className="border p-6 shadow-2xl" style={{ borderColor: C.border, backgroundColor: C.panel }}>
              <h3 className="text-[10px] tracking-widest uppercase font-bold border-b pb-2 mb-6" style={{ color: C.textD, borderColor: C.border }}>
                Market State Variables
              </h3>
              <div className="space-y-4">
                <InputField label="Underlying Price" param="S" step="1" symbol="S" />
                <InputField label="Strike Price" param="K" step="1" symbol="K" />
                <InputField label="Time to Maturity (Y)" param="T" step="0.1" symbol="T" />
                <InputField label="Risk-Free Rate" param="r" step="0.01" symbol="r" />
              </div>
            </div>

            <div className="border p-6 shadow-2xl" style={{ borderColor: C.border, backgroundColor: C.panel }}>
              <h3 className="text-[10px] tracking-widest uppercase font-bold border-b pb-2 mb-6" style={{ color: C.textD, borderColor: C.border }}>
                Stochastic Dynamics
              </h3>
              <div className="space-y-4">
                <InputField label="Initial Variance" param="v0" step="0.01" symbol="v₀" />
                <InputField label="Mean Reversion Speed" param="kappa" step="0.1" symbol="κ" />
                <InputField label="Long-Term Variance" param="theta" step="0.01" symbol="θ" />
                <InputField label="Volatility of Variance" param="sigma" step="0.01" symbol="σᵥ" />
                <InputField label="Correlation (Brownian Motions)" param="rho" step="0.1" symbol="ρ" />
              </div>
            </div>
          </div>

          {/* RIGHT: Output & Visualization */}
          <div className="col-span-12 lg:col-span-8 flex flex-col gap-8">
            {!results ? (
              <div className="flex-1 border border-dashed flex items-center justify-center opacity-30" style={{ borderColor: C.textD }}>
                <span className="text-[10px] tracking-widest uppercase font-bold">AWAITING PARAMETER EXECUTION</span>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-6">
                  <div className="border p-6 flex flex-col justify-center items-center shadow-2xl" style={{ borderColor: C.border, backgroundColor: C.panel }}>
                    <span className="text-[10px] tracking-widest uppercase font-bold mb-2" style={{ color: C.textD }}>European Call Value</span>
                    <span className="text-4xl font-light" style={{ color: C.cyan }}>${results.price.toFixed(4)}</span>
                  </div>
                  <div className="border p-6 shadow-2xl" style={{ borderColor: C.border, backgroundColor: C.panel }}>
                    <span className="text-[10px] tracking-widest uppercase font-bold border-b pb-2 mb-4 block" style={{ color: C.textD, borderColor: C.border }}>Greeks</span>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.keys(results.greeks).map(greek => (
                        <div key={greek} className="flex justify-between items-center text-sm">
                          <span className="capitalize" style={{ color: C.textM }}>{greek}</span>
                          <span className="font-bold" style={{ color: C.textH }}>{results.greeks[greek].toFixed(4)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex-1 border p-6 shadow-2xl flex flex-col" style={{ borderColor: C.border, backgroundColor: C.panel }}>
                  <div className="text-[10px] tracking-widest uppercase font-bold border-b pb-2 mb-6 flex justify-between" style={{ color: C.textD, borderColor: C.border }}>
                    <span>Implied Volatility Smile</span>
                    <span>Heston Stochastic Process</span>
                  </div>
                  <div className="flex-1 min-h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={results.smileData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                        <XAxis 
                          dataKey="moneyness" 
                          stroke={C.textD} 
                          fontSize={10} 
                          tickFormatter={(v) => `${v}%`}
                          fontFamily={FONT}
                        />
                        <YAxis 
                          domain={['dataMin - 2', 'dataMax + 2']} 
                          stroke={C.textD} 
                          fontSize={10}
                          tickFormatter={(v) => `${v}%`}
                          fontFamily={FONT}
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#000', borderColor: C.border, fontFamily: FONT }}
                          itemStyle={{ color: C.cyan }}
                          formatter={(val: number) => [`${val.toFixed(2)}%`, 'Implied Vol']}
                          labelFormatter={(l) => `Moneyness: ${l}%`}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="impliedVol" 
                          stroke={C.cyan} 
                          strokeWidth={2} 
                          dot={{ r: 3, fill: C.cyan }} 
                          activeDot={{ r: 5 }} 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            )}
          </div>
          
        </div>
      </div>
    </>
  );
}
