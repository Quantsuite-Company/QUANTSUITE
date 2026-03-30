import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, Zap, TrendingUp, AlertTriangle, Play, RefreshCw, 
  Target, Shield, BarChart3, Activity
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { StrategyAwakening } from '@/components/quantscript/StrategyAwakening';

interface StrategyConfig {
  universe: string;
  frequency: string;
  maxPositionSize: number;
  stopLoss: number;
  takeProfit: number;
}

interface GeneratedStrategy {
  strategy: {
    name: string;
    philosophy: string;
    market_conditions?: string;
    timeframe?: string;
    asset_classes?: string[];
    entry_rules: string[];
    exit_rules: string[];
    risk_parameters: {
      max_position_pct?: number;
      stop_loss_pct?: number;
      take_profit_pct?: number;
      max_drawdown_pct?: number;
      risk_reward_ratio?: string;
      max_open_positions?: number;
    };
  };
  code?: string;
  explanation?: {
    edge?: string;
    when_it_works?: string;
    when_it_fails?: string;
    key_risks?: string[];
    improvements?: string[];
  };
  backtest_config?: {
    suggested_symbols?: string[];
    suggested_period?: string;
    initial_capital?: number;
    slippage_bps?: number;
    commission_bps?: number;
  };
  metrics_expected?: {
    target_sharpe?: string;
    target_win_rate?: string;
    expected_max_drawdown?: string;
    expected_cagr?: string;
  };
  validation?: {
    safe: boolean;
    message: string;
  };
}

type ViewState = 'input' | 'generating' | 'result';

export default function StrategyBuilder() {
  const [viewState, setViewState] = useState<ViewState>('input');
  const [prompt, setPrompt] = useState('');
  const [config, setConfig] = useState<StrategyConfig>({
    universe: 'NSE',
    frequency: 'daily',
    maxPositionSize: 10,
    stopLoss: 5,
    takeProfit: 15,
  });
  const [generatedStrategy, setGeneratedStrategy] = useState<GeneratedStrategy | null>(null);
  const [backtestData, setBacktestData] = useState<any>(null);
  const [isBacktesting, setIsBacktesting] = useState(false);
  const { toast } = useToast();

  const strategyTemplates = [
    { 
      label: 'RSI Mean Reversion', 
      prompt: 'Create a mean reversion strategy using RSI. Buy when 14-day RSI drops below 30 and price is below 50-day SMA. Sell when RSI rises above 70 or price drops 5%. Use 2% position sizing with weekly rebalancing.' 
    },
    { 
      label: 'Momentum Breakout', 
      prompt: 'Build a momentum breakout strategy. Enter long when price breaks above 52-week high with volume 2x above 20-day average. Exit on 15% profit or 10% loss. Trail stop at 2 ATR after 10% gain.' 
    },
    { 
      label: 'MACD Crossover', 
      prompt: 'Design a MACD crossover strategy. Buy when MACD line crosses above signal line and both are below zero (early momentum). Sell when MACD crosses below signal or -5% stop loss.' 
    },
    { 
      label: 'Bollinger Squeeze', 
      prompt: 'Create a Bollinger Band squeeze breakout strategy. Enter when bandwidth is in lowest 10% of 120-day range and price breaks above upper band. Exit at 2x ATR take profit or lower band touch.' 
    },
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({ title: "Please enter a strategy description", variant: "destructive" });
      return;
    }

    setViewState('generating');

    try {
      const fullPrompt = `${prompt}

Configuration Requirements:
- Universe: ${config.universe}
- Frequency: ${config.frequency}
- Max Position Size: ${config.maxPositionSize}%
- Stop Loss: ${config.stopLoss}%
- Take Profit: ${config.takeProfit}%

Please generate a complete, institutional-grade trading strategy with clear entry/exit rules, risk parameters, and backtestable code.`;

      const { data, error } = await supabase.functions.invoke('quantscript-generate', {
        body: { prompt: fullPrompt, action: 'generate' },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Failed to generate strategy');

      setGeneratedStrategy(data.result);
      setViewState('result');
      
      toast({
        title: "Strategy Awakened! ⚡",
        description: data.result.validation?.safe 
          ? "Your strategy passed all safety checks."
          : "Strategy generated but needs review.",
      });
    } catch (error: any) {
      console.error('Generation error:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate strategy.",
        variant: "destructive",
      });
      setViewState('input');
    }
  };

  const handleRunBacktest = async (symbol: string, startDate: string, endDate: string) => {
    if (!generatedStrategy) return;
    
    setIsBacktesting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('run-backtest', {
        body: {
          code: generatedStrategy.code,
          symbol,
          startDate,
          endDate,
          initialCapital: generatedStrategy.backtest_config?.initial_capital || 100000,
          parameters: generatedStrategy.strategy?.risk_parameters,
        },
      });
      
      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Failed to run backtest');
      
      setBacktestData(data);
      
      toast({
        title: "Backtest Complete! 📊",
        description: `Return: ${data.metrics.totalReturn}%, Sharpe: ${data.metrics.sharpeRatio}`,
      });
    } catch (error: any) {
      toast({
        title: "Backtest Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsBacktesting(false);
    }
  };

  const resetToInput = () => {
    setViewState('input');
    setGeneratedStrategy(null);
    setBacktestData(null);
  };

  // Split-Pane IDE view
  const renderInputView = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-screen w-full flex flex-col bg-[#0a0a0a] text-white font-mono overflow-hidden"
    >
      {/* TOP COMMAND DECK */}
      <div className="flex-none h-14 bg-black/90 border-b border-indigo-500/30 flex items-center px-4 z-20 shadow-[0_4px_20px_rgba(79,70,229,0.1)]">
         <div className="flex items-center gap-3 border-r border-indigo-500/30 pr-6 mr-6 h-full py-2">
            <Zap className="w-5 h-5 text-indigo-500" />
            <div className="text-[10px] uppercase tracking-[0.2em] leading-tight text-indigo-400 font-bold">
               SYS.QUANT_SCRIPT <br/>
               <span className="text-white/40 font-light">NL_TO_CODE COMPILER</span>
            </div>
         </div>
         
         <div className="flex-1 flex items-center gap-6">
            <div className="text-[10px] uppercase tracking-widest text-indigo-300">
               ENGINE: <span className="text-emerald-400">ONLINE</span>
            </div>
            <div className="text-[10px] uppercase tracking-widest text-white/40">
               MODE: <span className="text-indigo-400">NATURAL LANGUAGE IDE</span>
            </div>
         </div>

         <div className="flex items-center gap-4 text-[9px] tracking-widest uppercase text-white/30 border-l border-indigo-500/30 pl-6 cursor-pointer hover:text-white transition-colors" onClick={() => resetToInput()}>
            RESET_IDE
         </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANE: IDE EDITOR */}
        <div className="flex-1 flex flex-col border-r border-indigo-500/20 bg-black/50 relative">
           <div className="h-8 flex-none bg-[#111] border-b border-white/5 flex items-center px-4 text-[10px] text-white/50 tracking-widest">
              index.qs <span className="text-indigo-500 ml-2">- QUANT_SCRIPT //</span>
           </div>
           
           <div className="flex-1 flex w-full relative group">
              {/* Line numbers (fake) */}
              <div className="w-12 h-full border-r border-white/5 bg-[#0a0a0a] text-right py-4 pr-3 text-[10px] text-white/20 select-none font-mono flex flex-col gap-1">
                 {Array.from({length: 30}).map((_, i) => <div key={i}>{i+1}</div>)}
              </div>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="// Enter natural language strategy logic here...&#10;// Example:&#10;// Buy when 14-day RSI drops below 30 and price is below 50-day SMA.&#10;// Sell when RSI rises above 70 or price drops 5%.&#10;// Use 2% position sizing with weekly rebalancing."
                className="flex-1 h-full bg-transparent border-none resize-none focus:ring-0 text-[13px] text-indigo-100 placeholder:text-indigo-900/50 p-4 font-mono leading-relaxed"
                spellCheck={false}
              />
           </div>

           <div className="h-14 flex-none border-t border-indigo-500/20 bg-[#0a0a0a] flex items-center justify-between px-4">
              <div className="text-[10px] text-indigo-500/50 flex items-center gap-2">
                 <AlertTriangle size={12} /> {prompt.length} chars / ready to compile
              </div>
              <Button
                onClick={handleGenerate}
                disabled={!prompt.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] tracking-widest uppercase h-8 rounded-sm px-6 font-bold"
              >
                COMPILE_AND_AWAKEN <Play size={10} className="ml-2" />
              </Button>
           </div>
        </div>

        {/* RIGHT PANE: CONFIG & TERMINAL */}
        <div className="w-[400px] flex-none flex flex-col bg-[#050505]">
           <div className="p-5 border-b border-indigo-500/20 shadow-[0_0_30px_rgba(79,70,229,0.02)_inset]">
              <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                 <Target size={14} /> Compilation Parameters
              </div>
              
              <div className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                       <label className="text-[9px] text-white/50 uppercase tracking-widest">Universe</label>
                       <select value={config.universe} onChange={(e) => setConfig({ ...config, universe: e.target.value })} className="w-full bg-[#111] border border-white/10 px-2 py-1.5 rounded text-[11px] text-indigo-300 focus:outline-none focus:border-indigo-500 transition-colors">
                          <option value="NSE">NSE</option><option value="BSE">BSE</option><option value="NYSE">NYSE</option><option value="NASDAQ">NASDAQ</option>
                       </select>
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[9px] text-white/50 uppercase tracking-widest">Frequency</label>
                       <select value={config.frequency} onChange={(e) => setConfig({ ...config, frequency: e.target.value })} className="w-full bg-[#111] border border-white/10 px-2 py-1.5 rounded text-[11px] text-indigo-300 focus:outline-none focus:border-indigo-500 transition-colors">
                          <option value="daily">DAILY</option><option value="hourly">HOURLY</option><option value="weekly">WEEKLY</option>
                       </select>
                    </div>
                 </div>
                 
                 <div className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                       <div className="flex justify-between items-center text-[9px] text-white/50 uppercase tracking-widest">
                          <label>Max Position Size</label><span>{config.maxPositionSize}%</span>
                       </div>
                       <input type="range" min="1" max="100" value={config.maxPositionSize} onChange={(e) => setConfig({ ...config, maxPositionSize: Number(e.target.value) })} className="w-full accent-indigo-500 h-1 bg-white/10 rounded-full appearance-none" />
                    </div>
                    <div className="space-y-1.5">
                       <div className="flex justify-between items-center text-[9px] text-white/50 uppercase tracking-widest">
                          <label>Stop Loss (Hard)</label><span>{config.stopLoss}%</span>
                       </div>
                       <input type="range" min="1" max="50" value={config.stopLoss} onChange={(e) => setConfig({ ...config, stopLoss: Number(e.target.value) })} className="w-full accent-red-500 h-1 bg-white/10 rounded-full appearance-none" />
                    </div>
                    <div className="space-y-1.5">
                       <div className="flex justify-between items-center text-[9px] text-white/50 uppercase tracking-widest">
                          <label>Take Profit (Hard)</label><span>{config.takeProfit}%</span>
                       </div>
                       <input type="range" min="1" max="100" value={config.takeProfit} onChange={(e) => setConfig({ ...config, takeProfit: Number(e.target.value) })} className="w-full accent-green-500 h-1 bg-white/10 rounded-full appearance-none" />
                    </div>
                 </div>
              </div>
           </div>

           <div className="flex-1 p-5 overflow-y-auto no-scrollbar flex flex-col">
              <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-[0.2em] mb-4">Command Palette // Macros</div>
              <div className="space-y-2 flex-1">
                 {strategyTemplates.map((template, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => setPrompt(template.prompt)}
                      className="p-3 border border-white/5 bg-[#111] hover:bg-white/[0.02] hover:border-indigo-500/30 cursor-pointer rounded transition-all group"
                    >
                       <div className="text-[10px] text-indigo-300 tracking-widest uppercase mb-1">{template.label}</div>
                       <div className="text-[10px] text-white/40 leading-relaxed line-clamp-2 group-hover:text-white/60">{template.prompt}</div>
                    </div>
                 ))}
              </div>
              
              <div className="mt-4 pt-4 border-t border-white/5">
                 <div className="text-[9px] text-white/20 uppercase tracking-widest font-mono">
                    &gt; SYSTEM_READY<br/>
                    &gt; WAITING_FOR_INPUT...
                 </div>
              </div>
           </div>
        </div>
      </div>
    </motion.div>
  );

  // Generating View - Terminal compilation style
  const renderGeneratingView = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-screen w-full flex flex-col bg-[#050505] text-white font-mono items-center justify-center relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.1)_0%,transparent_50%)]"></div>
      
      <div className="w-full max-w-3xl border border-indigo-500/30 bg-black/80 backdrop-blur shadow-[0_0_50px_rgba(79,70,229,0.15)] rounded-sm overflow-hidden z-10 flex flex-col h-[500px]">
         <div className="h-8 flex-none bg-indigo-950/50 border-b border-indigo-500/30 flex items-center px-4">
            <div className="flex gap-1.5">
               <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
               <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50"></div>
               <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50"></div>
            </div>
            <div className="mx-auto text-[10px] text-indigo-400 tracking-[0.2em] uppercase">quantsuite_compiler_v2.1</div>
         </div>
         
         <div className="flex-1 p-6 font-mono text-xs overflow-hidden relative">
            <div className="space-y-4">
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-white/50">
                  <span className="text-emerald-500">&gt;</span> Initializing NL processor... <span className="text-emerald-500">[OK]</span>
               </motion.div>
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="text-white/50">
                  <span className="text-emerald-500">&gt;</span> Parsing natural language strategy definition...
               </motion.div>
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }} className="text-indigo-400 ml-4 border-l border-indigo-500/30 pl-4 py-2">
                  Extracting alpha signals...<br/>
                  Identifying entry/exit logic...<br/>
                  Applying rigid bounds: MaxPos: {config.maxPositionSize}% | SL: {config.stopLoss}% | TP: {config.takeProfit}%
               </motion.div>
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.2 }} className="text-white/50">
                  <span className="text-emerald-500">&gt;</span> Compiling to executable logic... <span className="text-emerald-500 animate-pulse">_</span>
               </motion.div>
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3.5 }} className="text-white/70">
                  <span className="text-amber-500">&gt;</span> Validating edge cases and safety parameters... 
               </motion.div>
               
               <motion.div 
                 className="absolute bottom-6 right-6"
                 animate={{ rotate: 360 }}
                 transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
               >
                 <RefreshCw size={24} className="text-indigo-500 opacity-20" />
               </motion.div>
            </div>
         </div>
      </div>
    </motion.div>
  );

  return (
    <AnimatePresence mode="wait">
      {viewState === 'input' && renderInputView()}
      {viewState === 'generating' && renderGeneratingView()}
      {viewState === 'result' && generatedStrategy && (
        <StrategyAwakening
          strategy={generatedStrategy}
          onBacktest={handleRunBacktest}
          onReset={resetToInput}
          isBacktesting={isBacktesting}
          backtestData={backtestData}
          config={config}
        />
      )}
    </AnimatePresence>
  );
}
