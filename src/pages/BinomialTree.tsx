import { useState, useMemo } from 'react';
import { QuantSuiteSEO } from '@/components/QuantSuiteSEO';

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
};

const FONT = '"Times New Roman", Times, serif';

interface BinomialParams {
  S: number;
  K: number;
  T: number;
  r: number;
  sigma: number;
  steps: number;
  isCall: boolean;
}

interface TreeNode {
  price: number;
  optionValue: number;
  intrinsicValue: number;
  step: number;
  upMoves: number;
  exerciseOptimal: boolean;
}

const safeFormat = (val: number, decimals: number = 4) => {
  if (isNaN(val) || !isFinite(val)) return 'NaN';
  if (Math.abs(val) > 1e10 || (Math.abs(val) < 1e-6 && val !== 0)) {
    return val.toExponential(decimals);
  }
  return val.toFixed(decimals);
};

const calculateBinomialTree = (params: BinomialParams): TreeNode[][] => {
  const { S, K, T, r, sigma, steps, isCall } = params;
  
  const dt = T / steps;
  const u = Math.exp(sigma * Math.sqrt(dt));
  const d = 1 / u;
  const p = (Math.exp(r * dt) - d) / (u - d);
  const discount = Math.exp(-r * dt);
  
  const tree: TreeNode[][] = [];
  
  for (let i = 0; i <= steps; i++) {
    tree[i] = [];
    for (let j = 0; j <= i; j++) {
      const stockPrice = S * Math.pow(u, j) * Math.pow(d, i - j);
      const intrinsic = isCall 
        ? Math.max(0, stockPrice - K)
        : Math.max(0, K - stockPrice);
      
      tree[i][j] = {
        price: stockPrice,
        optionValue: 0,
        intrinsicValue: intrinsic,
        step: i,
        upMoves: j,
        exerciseOptimal: false
      };
    }
  }
  
  for (let j = 0; j <= steps; j++) {
    tree[steps][j].optionValue = tree[steps][j].intrinsicValue;
    tree[steps][j].exerciseOptimal = tree[steps][j].intrinsicValue > 0;
  }
  
  for (let i = steps - 1; i >= 0; i--) {
    for (let j = 0; j <= i; j++) {
      const europeanValue = discount * (
        p * tree[i + 1][j + 1].optionValue + 
        (1 - p) * tree[i + 1][j].optionValue
      );
      const intrinsicValue = tree[i][j].intrinsicValue;
      const americanValue = Math.max(europeanValue, intrinsicValue);
      
      tree[i][j].optionValue = americanValue;
      tree[i][j].exerciseOptimal = americanValue > europeanValue + 1e-10;
    }
  }
  
  return tree;
};

const TreeVisualization = ({ tree, params }: { tree: TreeNode[][], params: BinomialParams }) => {
  const maxNodes = Math.min(tree.length, 8);
  
  const getNodeColors = (node: TreeNode) => {
    const isITM = params.isCall ? node.price > params.K : node.price < params.K;
    const isDeepITM = params.isCall ? node.price > params.K * 1.1 : node.price < params.K * 0.9;
    
    if (node.exerciseOptimal) return { border: '#10b981', text: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' };
    if (isDeepITM) return { border: '#3b82f6', text: '#60a5fa', bg: 'rgba(59, 130, 246, 0.1)' };
    if (isITM) return { border: '#06b6d4', text: '#22d3ee', bg: 'rgba(6, 182, 212, 0.1)' };
    return { border: '#f59e0b', text: '#fbbf24', bg: 'transparent' }; // OTM is amber
  };

  return (
    <div className="overflow-x-auto p-6" style={{ backgroundColor: C.panel, borderTop: `1px solid ${C.border}` }}>
      <div className="flex gap-12 min-w-fit">
        {tree.slice(0, maxNodes).map((column, stepIndex) => (
          <div key={stepIndex} className="flex flex-col justify-center gap-8 relative">
            <div className="absolute -top-6 left-0 right-0 text-center text-[9px] uppercase tracking-widest font-bold" style={{ color: C.textD }}>
              t = {stepIndex}
            </div>
            {column.map((node, nodeIndex) => {
              const isOptimal = node.exerciseOptimal;
              const colors = getNodeColors(node);
              
              return (
                <div
                  key={`${stepIndex}-${nodeIndex}`}
                  className="relative flex flex-col items-center justify-center border-2 p-3 min-w-[130px] shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all hover:scale-105"
                  style={{ borderColor: colors.border, backgroundColor: colors.bg }}
                >
                  <div className="text-[10px] tracking-widest uppercase mb-1" style={{ color: C.textM }}>
                    S: {safeFormat(node.price, 2)}
                  </div>
                  <div className="text-xl font-bold mb-1 drop-shadow-md" style={{ color: colors.text }}>
                    {safeFormat(node.optionValue, 4)}
                  </div>
                  <div className="text-[9px] uppercase tracking-widest font-bold" style={{ color: C.textD }}>
                    IV: {safeFormat(node.intrinsicValue, 2)}
                  </div>
                  
                  {isOptimal && (
                    <div className="absolute -top-3 -right-3 text-[9px] px-2 py-0.5 font-bold shadow-[0_0_10px_#10b981] bg-black border-2" style={{ borderColor: C.green, color: C.green }}>
                      EX
                    </div>
                  )}
                  
                  {/* Connectors */}
                  {stepIndex < maxNodes - 1 && (
                    <>
                      {nodeIndex < column.length - 1 && (
                        <svg className="absolute w-16 h-20 pointer-events-none" style={{ top: '50%', right: '-4rem', zIndex: -1 }}>
                          <line x1="0" y1="0" x2="64" y2="-32" stroke={C.border} strokeWidth="2" strokeDasharray="4 2" />
                        </svg>
                      )}
                      {nodeIndex >= 0 && (
                        <svg className="absolute w-16 h-20 pointer-events-none" style={{ top: '50%', right: '-4rem', zIndex: -1 }}>
                          <line x1="0" y1="0" x2="64" y2="32" stroke={C.border} strokeWidth="2" strokeDasharray="4 2" />
                        </svg>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      {tree.length > maxNodes && (
        <div className="text-center text-[10px] uppercase tracking-widest mt-8 font-bold" style={{ color: C.textD }}>
          [TRUNCATED: Showing first {maxNodes} of {tree.length} steps]
        </div>
      )}
    </div>
  );
};

export default function BinomialTree() {
  const [params, setParams] = useState<BinomialParams>({
    S: 100,
    K: 100,
    T: 0.25,
    r: 0.05,
    sigma: 0.2,
    steps: 5,
    isCall: true
  });

  const handleParamChange = (key: keyof BinomialParams, value: number | boolean) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const tree = useMemo(() => {
    try {
      return calculateBinomialTree(params);
    } catch (e) {
      return [];
    }
  }, [params]);

  const dt = params.steps > 0 ? params.T / params.steps : 0;
  const crr_u = params.steps > 0 ? Math.exp(params.sigma * Math.sqrt(dt)) : 0;
  const crr_d = crr_u > 0 ? 1 / crr_u : 0;
  const crr_p = (crr_u - crr_d) !== 0 ? (Math.exp(params.r * dt) - crr_d) / (crr_u - crr_d) : 0;

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
        title="Binomial Options Pricing Tree"
        description="Cox-Ross-Rubinstein Model for American Options"
        path="/binomial-tree"
      />
      
      <div className="min-h-screen w-full flex flex-col p-8" style={{ backgroundColor: C.bg, color: C.textH, fontFamily: FONT }}>
        
        {/* HEADER */}
        <div className="border-b pb-6 mb-8 flex justify-between items-end" style={{ borderColor: C.border }}>
          <div>
            <h1 className="text-3xl font-bold tracking-tight uppercase" style={{ fontVariant: 'small-caps' }}>Binomial Pricing Tree</h1>
            <p className="text-[10px] tracking-widest uppercase mt-2 font-bold" style={{ color: C.textD }}>
              COX-ROSS-RUBINSTEIN (CRR) // AMERICAN & EUROPEAN EARLY EXERCISE 
            </p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => handleParamChange('isCall', true)}
              className="px-6 py-2 border text-[10px] font-bold tracking-widest uppercase transition-all"
              style={{ 
                borderColor: params.isCall ? C.cyan : C.border, 
                color: params.isCall ? C.cyan : C.textM,
                backgroundColor: params.isCall ? `${C.cyan}10` : 'transparent'
              }}
            >
              CALL
            </button>
            <button 
              onClick={() => handleParamChange('isCall', false)}
              className="px-6 py-2 border text-[10px] font-bold tracking-widest uppercase transition-all"
              style={{ 
                borderColor: !params.isCall ? C.purple : C.border, 
                color: !params.isCall ? C.purple : C.textM,
                backgroundColor: !params.isCall ? `${C.purple}10` : 'transparent'
              }}
            >
              PUT
            </button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8">
          
          {/* LEFT: Parameters */}
          <div className="col-span-12 lg:col-span-3 flex flex-col gap-8">
            <div className="border p-6 shadow-2xl" style={{ borderColor: C.border, backgroundColor: C.panel }}>
              <h3 className="text-[10px] tracking-widest uppercase font-bold border-b pb-2 mb-6" style={{ color: C.textD, borderColor: C.border }}>
                State Variables
              </h3>
              <div className="space-y-4">
                <InputField label="Stock Price" param="S" step="1" symbol="S" />
                <InputField label="Strike Price" param="K" step="1" symbol="K" />
                <InputField label="Time (Y)" param="T" step="0.1" symbol="T" />
                <InputField label="Volatility" param="sigma" step="0.01" symbol="σ" />
                <InputField label="Risk-Free Rate" param="r" step="0.01" symbol="r" />
                <InputField label="Time Steps" param="steps" step="1" symbol="N" />
              </div>
            </div>

            <div className="border p-6 shadow-2xl" style={{ borderColor: C.border, backgroundColor: C.panel }}>
              <h3 className="text-[10px] tracking-widest uppercase font-bold border-b pb-2 mb-4" style={{ color: C.textD, borderColor: C.border }}>
                CRR Constants
              </h3>
              <div className="space-y-2 font-mono text-sm">
                <div className="flex justify-between">
                  <span style={{ color: C.textM }}>Up (u)</span>
                  <span style={{ color: C.textH }}>{safeFormat(crr_u, 4)}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: C.textM }}>Down (d)</span>
                  <span style={{ color: C.textH }}>{safeFormat(crr_d, 4)}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: C.textM }}>Prob (p)</span>
                  <span style={{ color: C.textH }}>{safeFormat(crr_p, 4)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Output & Tree */}
          <div className="col-span-12 lg:col-span-9 flex flex-col gap-8">
            <div className="grid grid-cols-2 gap-6">
              <div className="border p-6 flex flex-col justify-center items-center shadow-2xl" style={{ borderColor: C.border, backgroundColor: C.panel }}>
                <span className="text-[10px] tracking-widest uppercase font-bold mb-2" style={{ color: C.textD }}>American Option Value</span>
                <span className="text-4xl font-light" style={{ color: params.isCall ? C.cyan : C.purple }}>
                  ${tree.length > 0 && tree[0][0] ? safeFormat(tree[0][0].optionValue, 4) : 'NaN'}
                </span>
              </div>
              <div className="border p-6 flex flex-col justify-center items-center shadow-2xl" style={{ borderColor: C.border, backgroundColor: C.panel }}>
                <span className="text-[10px] tracking-widest uppercase font-bold mb-2" style={{ color: C.textD }}>Exercise Decision (t=0)</span>
                <span className="text-sm font-bold tracking-widest uppercase" style={{ color: tree.length > 0 && tree[0][0]?.exerciseOptimal ? C.green : C.textH }}>
                  {tree.length > 0 && tree[0][0]?.exerciseOptimal ? 'EARLY EXERCISE OPTIMAL [EX]' : 'HOLD TO MATURITY'}
                </span>
              </div>
            </div>

            <div className="flex-1 border shadow-2xl flex flex-col relative overflow-hidden" style={{ borderColor: C.border, backgroundColor: C.bg }}>
              <div className="p-6">
                <h3 className="text-[10px] tracking-widest uppercase font-bold" style={{ color: C.textD }}>
                  Markov Chain Evolution
                </h3>
              </div>
              <TreeVisualization tree={tree} params={params} />
            </div>
          </div>
          
        </div>
      </div>
    </>
  );
}