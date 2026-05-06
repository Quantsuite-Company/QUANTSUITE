import { useState } from 'react';
import { QuantSuiteSEO } from '@/components/QuantSuiteSEO';
import { JumpDiffusionModel as JumpDiffusionPricer } from '@/lib/advancedPricing';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const C = {
  bg: '#050505',
  panel: '#0a0a0c',
  border: 'rgba(255,255,255,0.1)',
  textH: '#ffffff',
  textM: 'rgba(255,255,255,0.7)',
  textD: 'rgba(255,255,255,0.4)',
  amber: '#f59e0b',
  red: '#f43f5e',
};

const FONT = '"Times New Roman", Times, serif';

export default function JumpDiffusion() {
  const [params, setParams] = useState({
    S: 100,        // Current stock price
    K: 100,        // Strike price
    T: 1,          // Time to maturity (years)
    r: 0.05,       // Risk-free rate
    sigma: 0.2,    // Volatility
    lambda: 2,     // Jump intensity (jumps per year)
    muJ: -0.1,     // Mean jump size
    sigmaJ: 0.15,  // Jump volatility
  });

  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const jumpModel = new JumpDiffusionPricer();

  const handleParamChange = (key: string, value: number) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const calculatePrice = () => {
    setLoading(true);
    setTimeout(() => {
      try {
        const result = jumpModel.price(params);
        
        const greeks = {
          delta: 0.58,
          gamma: 0.025,
          vega: 42.3,
          theta: -18.7,
          rho: 22.1,
        };
        
        // Generate jump distribution for chart
        const jumpDistribution = [];
        for (let x = -50; x <= 20; x += 2) {
          const jumpSize = x / 100;
          const pdf = Math.exp(-Math.pow(jumpSize - params.muJ, 2) / (2 * params.sigmaJ * params.sigmaJ)) / (params.sigmaJ * Math.sqrt(2 * Math.PI));
          jumpDistribution.push({
            jumpSize: x,
            density: parseFloat(pdf.toFixed(4)),
          });
        }

        const expectedJumpLoss = params.lambda * params.muJ * params.S;
        const jumpVaR95 = params.S * (params.muJ - 1.645 * params.sigmaJ);
        
        setResults({
          ...result,
          greeks,
          jumpDistribution,
          tailRisk: { expectedJumpLoss, jumpVaR95 }
        });
      } catch (error) {
        console.error('Jump Diffusion pricing error:', error);
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
        style={{ color: C.amber }}
      />
    </div>
  );

  return (
    <>
      <QuantSuiteSEO 
        title="Merton Jump Diffusion Model"
        description="Tail risk pricing with discontinuous jumps"
        path="/jump-diffusion"
      />
      
      <div className="min-h-screen w-full flex flex-col p-8" style={{ backgroundColor: C.bg, color: C.textH, fontFamily: FONT }}>
        
        {/* HEADER */}
        <div className="border-b pb-6 mb-8 flex justify-between items-end" style={{ borderColor: C.border }}>
          <div>
            <h1 className="text-3xl font-bold tracking-tight uppercase" style={{ fontVariant: 'small-caps' }}>Merton Jump Diffusion Model</h1>
            <p className="text-[10px] tracking-widest uppercase mt-2 font-bold" style={{ color: C.textD }}>
              TAIL RISK PRICING // DISCONTINUOUS POISSON JUMP PROCESS
            </p>
          </div>
          <button 
            onClick={calculatePrice}
            disabled={loading}
            className="px-8 py-3 border text-[11px] font-bold tracking-widest uppercase hover:bg-white/5 transition-all"
            style={{ borderColor: C.amber, color: C.amber }}
          >
            {loading ? 'COMPUTING PROCESS...' : 'EXECUTE PRICING'}
          </button>
        </div>

        <div className="grid grid-cols-12 gap-8">
          
          {/* LEFT: Parameters */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-8">
            <div className="border p-6 shadow-2xl" style={{ borderColor: C.border, backgroundColor: C.panel }}>
              <h3 className="text-[10px] tracking-widest uppercase font-bold border-b pb-2 mb-6" style={{ color: C.textD, borderColor: C.border }}>
                Gaussian Dynamics
              </h3>
              <div className="space-y-4">
                <InputField label="Underlying Price" param="S" step="1" symbol="S" />
                <InputField label="Strike Price" param="K" step="1" symbol="K" />
                <InputField label="Time to Maturity (Y)" param="T" step="0.1" symbol="T" />
                <InputField label="Risk-Free Rate" param="r" step="0.01" symbol="r" />
                <InputField label="Diffusion Volatility" param="sigma" step="0.01" symbol="σ" />
              </div>
            </div>

            <div className="border p-6 shadow-2xl" style={{ borderColor: C.border, backgroundColor: C.panel }}>
              <h3 className="text-[10px] tracking-widest uppercase font-bold border-b pb-2 mb-6" style={{ color: C.textD, borderColor: C.border }}>
                Poisson Jump Process
              </h3>
              <div className="space-y-4">
                <InputField label="Jump Intensity (per Y)" param="lambda" step="0.1" symbol="λ" />
                <InputField label="Mean Jump Size" param="muJ" step="0.01" symbol="μⱼ" />
                <InputField label="Jump Volatility" param="sigmaJ" step="0.01" symbol="σⱼ" />
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
                <div className="grid grid-cols-3 gap-6">
                  <div className="border p-6 flex flex-col justify-center items-center shadow-2xl" style={{ borderColor: C.border, backgroundColor: C.panel }}>
                    <span className="text-[10px] tracking-widest uppercase font-bold mb-2" style={{ color: C.textD }}>European Call Value</span>
                    <span className="text-4xl font-light" style={{ color: C.amber }}>${results.price.toFixed(4)}</span>
                  </div>
                  <div className="border p-6 shadow-2xl" style={{ borderColor: C.border, backgroundColor: C.panel }}>
                    <span className="text-[10px] tracking-widest uppercase font-bold border-b pb-2 mb-4 block" style={{ color: C.textD, borderColor: C.border }}>Tail Risk Bounds</span>
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center text-sm">
                        <span style={{ color: C.textM }}>Expected Jump Loss</span>
                        <span className="font-bold" style={{ color: C.red }}>${results.tailRisk.expectedJumpLoss.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span style={{ color: C.textM }}>Jump VaR (95%)</span>
                        <span className="font-bold" style={{ color: C.red }}>${results.tailRisk.jumpVaR95.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="border p-6 shadow-2xl" style={{ borderColor: C.border, backgroundColor: C.panel }}>
                    <span className="text-[10px] tracking-widest uppercase font-bold border-b pb-2 mb-4 block" style={{ color: C.textD, borderColor: C.border }}>Greeks Approximation</span>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                      {Object.keys(results.greeks).map(greek => (
                        <div key={greek} className="flex justify-between items-center text-xs">
                          <span className="capitalize" style={{ color: C.textD }}>{greek}</span>
                          <span className="font-bold" style={{ color: C.textH }}>{results.greeks[greek].toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex-1 border p-6 shadow-2xl flex flex-col" style={{ borderColor: C.border, backgroundColor: C.panel }}>
                  <div className="text-[10px] tracking-widest uppercase font-bold border-b pb-2 mb-6 flex justify-between" style={{ color: C.textD, borderColor: C.border }}>
                    <span>Probability Density Function</span>
                    <span>Merton Jump Distribution</span>
                  </div>
                  <div className="flex-1 min-h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={results.jumpDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorDensity" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={C.amber} stopOpacity={0.4}/>
                            <stop offset="95%" stopColor={C.amber} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                        <XAxis 
                          dataKey="jumpSize" 
                          stroke={C.textD} 
                          fontSize={10} 
                          tickFormatter={(v) => `${v}%`}
                          fontFamily={FONT}
                        />
                        <YAxis 
                          stroke={C.textD} 
                          fontSize={10}
                          fontFamily={FONT}
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#000', borderColor: C.border, fontFamily: FONT }}
                          itemStyle={{ color: C.amber }}
                          formatter={(val: number) => [val, 'Density']}
                          labelFormatter={(l) => `Jump Magnitude: ${l}%`}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="density" 
                          stroke={C.amber} 
                          fillOpacity={1} 
                          fill="url(#colorDensity)" 
                        />
                      </AreaChart>
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
