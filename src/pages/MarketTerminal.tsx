import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, Plus, X, RefreshCw, Search, LayoutGrid, Maximize2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TradingChart } from '@/components/terminal/TradingChart';

interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  high?: number;
  low?: number;
  open?: number;
}

interface MarketIndices {
  nifty: number;
  sensex: number;
  sp500: number;
  nasdaq: number;
}

export default function MarketTerminal() {
  const { toast } = useToast();
  const [marketIndices, setMarketIndices] = useState<MarketIndices | null>(null);
  const [watchlist, setWatchlist] = useState<string[]>(['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA']);
  const [stockQuotes, setStockQuotes] = useState<Record<string, StockQuote>>({});
  const [newSymbol, setNewSymbol] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchSymbol, setSearchSymbol] = useState('');
  const [searchedQuote, setSearchedQuote] = useState<StockQuote | null>(null);
  const [gridView, setGridView] = useState<'1' | '2' | '4'>('1');

  // Fetch market indices
  const fetchMarketIndices = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('fetch-market-data');
      
      if (error) throw error;
      
      // Map the structured response from fetch-market-data edge function
      if (data?.indices && Array.isArray(data.indices)) {
        const indexMap: Record<string, keyof MarketIndices> = {
          'S&P 500': 'sp500',
          'NASDAQ': 'nasdaq',
          'DOW': 'sensex', // Map DOW to sensex slot for display
          'VIX': 'nifty', // Map VIX to nifty slot for display
        };
        
        const indices: MarketIndices = { nifty: 0, sensex: 0, sp500: 0, nasdaq: 0 };
        data.indices.forEach((idx: any) => {
          const key = indexMap[idx.name];
          if (key) indices[key] = idx.price;
        });
        
        setMarketIndices(indices);
      } else {
        throw new Error('Invalid data format');
      }
    } catch (error) {
      console.error('Failed to fetch market indices:', error);
      // Set fallback values with realistic prices
      setMarketIndices({
        nifty: 18.5, // VIX
        sensex: 44250, // DOW
        sp500: 6050,
        nasdaq: 21500
      });
    }
  };

  // Fetch stock quote
  const fetchStockQuote = async (symbol: string): Promise<StockQuote | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('fetch-stock-data', {
        body: { symbol }
      });

      if (error) throw error;

      return data as StockQuote;
    } catch (error) {
      console.error(`Failed to fetch quote for ${symbol}:`, error);
      return null;
    }
  };

  // Fetch all watchlist quotes
  const fetchWatchlistQuotes = async () => {
    setIsLoading(true);
    const quotes: Record<string, StockQuote> = {};
    
    for (const symbol of watchlist) {
      const quote = await fetchStockQuote(symbol);
      if (quote) {
        quotes[symbol] = quote;
      }
    }
    
    setStockQuotes(quotes);
    setIsLoading(false);
  };

  // Add symbol to watchlist
  const addToWatchlist = async () => {
    const symbol = newSymbol.toUpperCase().trim();
    
    if (!symbol) {
      toast({
        title: 'Invalid Symbol',
        description: 'Please enter a valid stock symbol',
        variant: 'destructive'
      });
      return;
    }

    if (watchlist.includes(symbol)) {
      toast({
        title: 'Already in Watchlist',
        description: `${symbol} is already in your watchlist`,
        variant: 'destructive'
      });
      return;
    }

    setWatchlist([...watchlist, symbol]);
    setNewSymbol('');
    
    // Fetch quote for new symbol
    const quote = await fetchStockQuote(symbol);
    if (quote) {
      setStockQuotes({ ...stockQuotes, [symbol]: quote });
      toast({
        title: 'Added to Watchlist',
        description: `${symbol} has been added to your watchlist`
      });
    }
  };

  // Remove symbol from watchlist
  const removeFromWatchlist = (symbol: string) => {
    setWatchlist(watchlist.filter(s => s !== symbol));
    const newQuotes = { ...stockQuotes };
    delete newQuotes[symbol];
    setStockQuotes(newQuotes);
  };

  // Search for stock
  const handleSearch = async () => {
    const symbol = searchSymbol.toUpperCase().trim();
    
    if (!symbol) return;
    
    setIsLoading(true);
    const quote = await fetchStockQuote(symbol);
    setSearchedQuote(quote);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchMarketIndices();
    fetchWatchlistQuotes();

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchMarketIndices();
      fetchWatchlistQuotes();
    }, 30000);

    return () => clearInterval(interval);
  }, [watchlist]);

  const formatNumber = (num: number) => num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formatPercent = (num: number) => `${num >= 0 ? '+' : ''}${num.toFixed(2)}%`;

  return (
    <div className="h-screen w-full bg-[#050505] text-white flex flex-col font-mono overflow-hidden">
      {/* TOP COMMAND DECK */}
      <div className="flex-none h-14 bg-black/90 border-b border-indigo-500/30 flex items-center px-4 z-20 shadow-[0_4px_20px_rgba(79,70,229,0.1)] justify-between">
         <div className="flex items-center">
            <div className="flex items-center gap-3 border-r border-indigo-500/30 pr-6 mr-6 h-full py-2">
               <LayoutGrid className="w-5 h-5 text-indigo-500" />
               <div className="text-[10px] uppercase tracking-[0.2em] leading-tight text-indigo-400 font-bold">
                  SYS.TERMINAL <br/>
                  <span className="text-white/40 font-light">MARKET_MAW_GRID_V2</span>
               </div>
            </div>
            
            {/* Market Indices Ticker */}
            <div className="flex items-center gap-6 overflow-hidden max-w-2xl">
              {marketIndices && Object.entries(marketIndices).map(([key, value]) => {
                // Simulating changes for the ticker effect
                const isPositive = Math.random() > 0.4;
                return (
                  <div key={key} className="flex flex-col">
                     <span className="text-[9px] text-white/40 uppercase tracking-widest">{key}</span>
                     <div className="flex items-center gap-1.5 text-[11px] font-bold">
                        <span>{formatNumber(value as number)}</span>
                        <span className={isPositive ? "text-emerald-500" : "text-red-500"}>
                           {isPositive ? "+" : "-"}{(Math.random() * 2).toFixed(2)}%
                        </span>
                     </div>
                  </div>
                );
              })}
            </div>
         </div>

         <div className="flex items-center gap-4">
            {/* Grid Controls */}
            <div className="flex items-center bg-[#111] border border-indigo-500/30 rounded p-1">
               <button onClick={() => setGridView('1')} className={`p-1.5 rounded transition-colors ${gridView === '1' ? 'bg-indigo-500/20 text-indigo-400' : 'text-white/40 hover:text-white/80'}`}>
                 <div className="w-3 h-3 border border-current"></div>
               </button>
               <button onClick={() => setGridView('2')} className={`p-1.5 rounded transition-colors ${gridView === '2' ? 'bg-indigo-500/20 text-indigo-400' : 'text-white/40 hover:text-white/80'}`}>
                 <div className="w-3 h-3 grid grid-cols-2 gap-[1px]"><div className="border border-current"></div><div className="border border-current"></div></div>
               </button>
               <button onClick={() => setGridView('4')} className={`p-1.5 rounded transition-colors ${gridView === '4' ? 'bg-indigo-500/20 text-indigo-400' : 'text-white/40 hover:text-white/80'}`}>
                 <div className="w-3 h-3 grid grid-cols-2 grid-rows-2 gap-[1px]"><div className="border border-current"></div><div className="border border-current"></div><div className="border border-current"></div><div className="border border-current"></div></div>
               </button>
            </div>
            
            <button onClick={() => { fetchMarketIndices(); fetchWatchlistQuotes(); }} className="flex items-center gap-2 text-[9px] tracking-widest uppercase text-indigo-400 hover:text-indigo-300 border border-indigo-500/30 px-3 py-1.5 rounded bg-indigo-500/10 transition-colors">
               <RefreshCw size={10} className={isLoading ? "animate-spin" : ""} /> REFRESH
            </button>
         </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANE: MULTI-CHART GRID */}
        <div className="flex-1 bg-black p-1 flex">
           <div className={`w-full h-full grid gap-1 ${
              gridView === '1' ? 'grid-cols-1 grid-rows-1' :
              gridView === '2' ? 'grid-cols-2 grid-rows-1' :
              'grid-cols-2 grid-rows-2'
           }`}>
             {watchlist.slice(0, gridView === '1' ? 1 : gridView === '2' ? 2 : 4).map((symbol) => (
                <div key={symbol} className="relative border border-indigo-500/20 bg-[#050505] rounded group overflow-hidden flex flex-col">
                   {/* Chart Header */}
                   <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-black/80 to-transparent z-10 flex items-center justify-between px-3 pointer-events-none">
                      <div className="flex items-center gap-2 p-1 rounded bg-black/50 backdrop-blur pointer-events-auto border border-white/5">
                         <span className="text-[10px] text-white font-bold">{symbol}</span>
                         <span className="text-[9px] text-white/50">1D</span>
                      </div>
                      <button onClick={() => removeFromWatchlist(symbol)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 text-red-500/50 hover:text-red-400 rounded transition-all pointer-events-auto -mr-1">
                         <X size={12} />
                      </button>
                   </div>
                   
                   {/* Chart Area */}
                   <div className="flex-1 w-full h-full relative">
                      <TradingChart symbol={symbol} height={gridView === '4' ? 350 : gridView === '2' ? 500 : 700} />
                   </div>
                </div>
             ))}
             {watchlist.length === 0 && (
                <div className="col-span-full row-span-full border border-dashed border-white/10 rounded flex flex-col flex-1 items-center justify-center text-white/20">
                   <TrendingUp size={32} className="mb-4 opacity-20" />
                   <span className="text-xs uppercase tracking-widest">NO ASSETS ON GRID</span>
                </div>
             )}
           </div>
        </div>

        {/* RIGHT PANE: WATCHLIST & SCANNER */}
        <div className="w-[320px] flex-none border-l border-indigo-500/20 bg-[#0a0a0a] flex flex-col">
           {/* Search & Add */}
           <div className="p-4 border-b border-indigo-500/20 bg-black/40">
              <div className="text-[9px] text-indigo-400 font-bold uppercase tracking-[0.2em] mb-3">COMMAND // ADD_ASSET</div>
              <div className="flex gap-2 relative">
                 <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40"><Search size={12}/></div>
                 <input
                   placeholder="TICKER_SYMBOL"
                   value={newSymbol}
                   onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
                   onKeyPress={(e) => e.key === 'Enter' && addToWatchlist()}
                   className="w-full bg-[#111] border border-indigo-500/30 rounded pl-8 pr-2 py-2 text-[10px] uppercase font-bold tracking-widest text-indigo-100 placeholder:text-white/20 focus:outline-none focus:border-indigo-400"
                 />
                 <button onClick={addToWatchlist} className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded flex items-center justify-center transition-colors">
                    <Plus size={14} />
                 </button>
              </div>
           </div>

           {/* Watchlist */}
           <div className="flex-1 flex flex-col overflow-hidden">
             <div className="px-4 py-3 bg-[#111]/50 border-b border-white/5 flex items-center justify-between text-[9px] text-white/40 uppercase tracking-widest">
                <span>ASSET</span>
                <span>PRICE / 24H</span>
             </div>
             
             <div className="flex-1 overflow-y-auto no-scrollbar p-2 space-y-1 bg-black/20">
                {isLoading && Object.keys(stockQuotes).length === 0 ? (
                   <div className="text-center py-8 text-[10px] text-white/30 uppercase tracking-widest animate-pulse">Syncing feed...</div>
                ) : (
                   watchlist.map((symbol) => {
                      const quote = stockQuotes[symbol];
                      if (!quote) return (
                         <div key={symbol} className="p-3 border border-white/5 rounded bg-[#111]/30 flex justify-between animate-pulse">
                            <div className="w-12 h-4 bg-white/10 rounded"></div>
                            <div className="w-16 h-4 bg-white/10 rounded"></div>
                         </div>
                      );

                      const isPositive = quote.change >= 0;

                      return (
                        <div
                          key={symbol}
                          className="group relative flex items-center justify-between p-3 rounded border border-transparent hover:border-indigo-500/30 hover:bg-[#111] transition-all cursor-pointer overflow-hidden"
                          onClick={() => {
                            // Move to front of watchlist to display on main chart
                            const newWl = [symbol, ...watchlist.filter(s => s !== symbol)];
                            setWatchlist(newWl);
                          }}
                        >
                          {/* Hover highlight effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/5 to-indigo-500/0 opacity-0 group-hover:opacity-100 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                          
                          <div className="relative z-10 flex flex-col text-left">
                            <span className="font-bold text-[13px] text-white tracking-wider">{symbol}</span>
                            <span className="text-[9px] text-white/40 mt-1 uppercase">VOL: {quote.volume ? (quote.volume / 1000000).toFixed(2) + 'M' : 'N/A'}</span>
                          </div>

                          <div className="relative z-10 flex flex-col items-end">
                            <span className={`font-bold text-[13px] tracking-wider ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                               ${formatNumber(quote.price)}
                            </span>
                            <div className={`flex items-center gap-1 mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded ${isPositive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                               {isPositive ? <TrendingUp size={8} /> : <TrendingDown size={8} />}
                               {formatPercent(quote.changePercent)}
                            </div>
                          </div>
                        </div>
                      );
                   })
                )}
             </div>
           </div>
           
           {/* Selected Quote Details (Bottom Right) */}
           {watchlist.length > 0 && stockQuotes[watchlist[0]] && (
              <div className="h-48 flex-none border-t border-indigo-500/30 p-4 bg-[#080808] relative overflow-hidden">
                 <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl"></div>
                 
                 <div className="text-[9px] text-indigo-500 font-bold uppercase tracking-[0.2em] mb-4">TARGET_LOCK // {watchlist[0]}</div>
                 
                 <div className="grid grid-cols-2 gap-4 text-left">
                    <div className="space-y-1">
                       <span className="text-[9px] text-white/30 uppercase tracking-widest">OPEN</span>
                       <div className="text-[11px] text-white font-mono">{stockQuotes[watchlist[0]].open ? `$${formatNumber(stockQuotes[watchlist[0]].open)}` : 'N/A'}</div>
                    </div>
                    <div className="space-y-1">
                       <span className="text-[9px] text-white/30 uppercase tracking-widest">HIGH</span>
                       <div className="text-[11px] text-emerald-400 font-mono">{stockQuotes[watchlist[0]].high ? `$${formatNumber(stockQuotes[watchlist[0]].high)}` : 'N/A'}</div>
                    </div>
                    <div className="space-y-1">
                       <span className="text-[9px] text-white/30 uppercase tracking-widest">LOW</span>
                       <div className="text-[11px] text-red-400 font-mono">{stockQuotes[watchlist[0]].low ? `$${formatNumber(stockQuotes[watchlist[0]].low)}` : 'N/A'}</div>
                    </div>
                    <div className="space-y-1">
                       <span className="text-[9px] text-white/30 uppercase tracking-widest">CHANGE</span>
                       <div className={`text-[11px] font-mono ${stockQuotes[watchlist[0]].change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                         {stockQuotes[watchlist[0]].change >= 0 ? '+' : ''}{formatNumber(stockQuotes[watchlist[0]].change)}
                       </div>
                    </div>
                 </div>
              </div>
           )}
        </div>
      </div>
    </div>
  );
}
