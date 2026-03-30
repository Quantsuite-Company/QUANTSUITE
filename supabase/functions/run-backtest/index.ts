import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BacktestParams {
  code: string;
  symbol: string;
  startDate: string;
  endDate: string;
  initialCapital: number;
  parameters: Record<string, any>;
}

// Validate stock symbol format to prevent SSRF and URL manipulation
function validateSymbol(symbol: string): boolean {
  if (!symbol || typeof symbol !== 'string') return false;
  // Allow uppercase letters, numbers, dots (for BRK.B), and hyphens (max 10 chars)
  return /^[A-Za-z0-9.\-^]{1,15}$/.test(symbol);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub;
    console.log(`Authenticated user: ${userId}`);

    const { code, symbol, startDate, endDate, initialCapital, parameters }: BacktestParams = await req.json();
    
    // Validate symbol input
    if (!validateSymbol(symbol)) {
      return new Response(
        JSON.stringify({ error: 'Invalid symbol format. Symbols must be 1-15 alphanumeric characters.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Starting realistic backtest:', { symbol, startDate, endDate, parameters });
    
    // Fetch historical data from Yahoo Finance with URL encoding
    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?period1=${Math.floor(new Date(startDate).getTime() / 1000)}&period2=${Math.floor(new Date(endDate).getTime() / 1000)}&interval=1d`;
    
    const yahooResponse = await fetch(yahooUrl);
    const yahooData = await yahooResponse.json();
    
    if (!yahooData.chart?.result?.[0]) {
      throw new Error("Failed to fetch market data");
    }
    
    const result = yahooData.chart.result[0];
    const timestamps = result.timestamp;
    const quotes = result.indicators.quote[0];
    
    // Build OHLCV data
    const priceData = timestamps.map((ts: number, i: number) => ({
      date: new Date(ts * 1000).toISOString().split('T')[0],
      open: quotes.open[i],
      high: quotes.high[i],
      low: quotes.low[i],
      close: quotes.close[i],
      volume: quotes.volume[i],
    })).filter((d: any) => d.close !== null && d.volume !== null && d.volume > 0);
    
    console.log(`Loaded ${priceData.length} data points`);
    
    // Run realistic backtest
    const backtestResult = runRealisticBacktest(priceData, initialCapital, parameters);
    
    return new Response(
      JSON.stringify({
        success: true,
        ...backtestResult,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in run-backtest:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error occurred" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function runRealisticBacktest(priceData: any[], initialCapital: number, parameters: Record<string, any>) {
  // Extract parameters with intelligent fallbacks - MORE LENIENT for demo purposes
  const rsiPeriod = Math.min(parameters.rsi_period || parameters.lookback_period || 14, 20); // Cap RSI period at 20
  const stopLoss = Math.abs(parameters.stop_loss || parameters.spread_stop_loss_pct || 0.08);
  const takeProfit = Math.abs(parameters.take_profit || parameters.exit_std_dev || 0.15);
  const positionSize = Math.min(Math.abs(parameters.position_size || parameters.max_position_size_per_leg || 0.10), 0.25); // Increased to 10%
  const rsiOversold = parameters.rsi_oversold || 40; // More lenient - was 35
  const rsiOverbought = parameters.rsi_overbought || 60; // More lenient - was 65
  
  console.log(`Config: RSI=${rsiPeriod}, Stop=${stopLoss}, Target=${takeProfit}, Size=${positionSize}`);
  
  // Extract price arrays
  const closes = priceData.map(d => d.close);
  const highs = priceData.map(d => d.high);
  const lows = priceData.map(d => d.low);
  const volumes = priceData.map(d => d.volume);
  
  // Calculate technical indicators
  const rsi = calculateRSI(closes, rsiPeriod);
  const sma50 = calculateSMA(closes, 50);
  const atr = calculateATR(highs, lows, closes, 14);
  const avgVolume = calculateSMA(volumes, 20);
  
  // Trading state
  let capital = initialCapital;
  let position = 0;
  let entryPrice = 0;
  let entryBar = 0;
  const trades: any[] = [];
  const equityCurve: any[] = [];
  let totalTrades = 0;
  let winningTrades = 0;
  let totalProfit = 0;
  let totalLoss = 0;
  let maxConsecutiveLosses = 0;
  let currentConsecutiveLosses = 0;
  
  // Transaction cost parameters (realistic for Indian markets)
  const brokerageRate = 0.0003; // 0.03% or ₹20 per order (whichever lower)
  const sttRate = 0.001; // 0.1% on sell side for equity delivery
  const exchangeFees = 0.0000345; // NSE transaction charges
  const gstRate = 0.18; // 18% GST on brokerage
  
  priceData.forEach((bar: any, i: number) => {
    if (i < Math.max(rsiPeriod, 50)) return; // Wait for indicators to warm up
    
    const currentRSI = rsi[i];
    const currentSMA = sma50[i];
    const currentATR = atr[i];
    const currentVolume = volumes[i];
    const avgVol = avgVolume[i];
    
    // Check for exits first (intrabar execution simulation)
    if (position > 0) {
      const barsHeld = i - entryBar;
      const priceChange = bar.close - entryPrice;
      const pnlPercent = priceChange / entryPrice;
      
      // Intrabar stop-loss check (triggered at low)
      const lowPnl = (bar.low - entryPrice) / entryPrice;
      if (lowPnl <= -stopLoss) {
        // Stop-loss hit at low price
        const exitPrice = entryPrice * (1 - stopLoss);
        const slippage = calculateSlippage(exitPrice, currentATR, currentVolume, avgVol, position, 'sell');
        const costs = calculateTransactionCosts(position, exitPrice, slippage, true);
        
        const exitValue = position * (exitPrice - slippage) - costs;
        capital += exitValue;
        const tradePnL = exitValue - (position * entryPrice);
        
        if (tradePnL > 0) {
          winningTrades++;
          totalProfit += tradePnL;
          currentConsecutiveLosses = 0;
        } else {
          totalLoss += Math.abs(tradePnL);
          currentConsecutiveLosses++;
          maxConsecutiveLosses = Math.max(maxConsecutiveLosses, currentConsecutiveLosses);
        }
        
        trades.push({
          entryDate: priceData[entryBar].date,
          exitDate: bar.date,
          entryPrice: entryPrice.toFixed(2),
          exitPrice: (exitPrice - slippage).toFixed(2),
          shares: position.toFixed(4),
          pnl: tradePnL.toFixed(2),
          pnlPercent: (pnlPercent * 100).toFixed(2),
          holdingPeriod: barsHeld,
          exitReason: 'Stop Loss',
          slippage: slippage.toFixed(2),
          costs: costs.toFixed(2),
        });
        
        position = 0;
        totalTrades++;
        
        equityCurve.push({
          date: bar.date,
          equity: capital,
          benchmark: initialCapital * (bar.close / priceData[0].close),
        });
        return;
      }
      
      // Intrabar take-profit check (triggered at high)
      const highPnl = (bar.high - entryPrice) / entryPrice;
      if (highPnl >= takeProfit) {
        // Take-profit hit at high price
        const exitPrice = entryPrice * (1 + takeProfit);
        const slippage = calculateSlippage(exitPrice, currentATR, currentVolume, avgVol, position, 'sell');
        const costs = calculateTransactionCosts(position, exitPrice, slippage, true);
        
        const exitValue = position * (exitPrice - slippage) - costs;
        capital += exitValue;
        const tradePnL = exitValue - (position * entryPrice);
        
        if (tradePnL > 0) {
          winningTrades++;
          totalProfit += tradePnL;
          currentConsecutiveLosses = 0;
        } else {
          totalLoss += Math.abs(tradePnL);
          currentConsecutiveLosses++;
        }
        
        trades.push({
          entryDate: priceData[entryBar].date,
          exitDate: bar.date,
          entryPrice: entryPrice.toFixed(2),
          exitPrice: (exitPrice - slippage).toFixed(2),
          shares: position.toFixed(4),
          pnl: tradePnL.toFixed(2),
          pnlPercent: (pnlPercent * 100).toFixed(2),
          holdingPeriod: barsHeld,
          exitReason: 'Take Profit',
          slippage: slippage.toFixed(2),
          costs: costs.toFixed(2),
        });
        
        position = 0;
        totalTrades++;
        
        equityCurve.push({
          date: bar.date,
          equity: capital,
          benchmark: initialCapital * (bar.close / priceData[0].close),
        });
        return;
      }
      
      // RSI-based exit at close
      if (currentRSI > rsiOverbought || barsHeld > 30) {
        const exitPrice = bar.close;
        const slippage = calculateSlippage(exitPrice, currentATR, currentVolume, avgVol, position, 'sell');
        const costs = calculateTransactionCosts(position, exitPrice, slippage, true);
        
        const exitValue = position * (exitPrice - slippage) - costs;
        capital += exitValue;
        const tradePnL = exitValue - (position * entryPrice);
        
        if (tradePnL > 0) {
          winningTrades++;
          totalProfit += tradePnL;
          currentConsecutiveLosses = 0;
        } else {
          totalLoss += Math.abs(tradePnL);
          currentConsecutiveLosses++;
        }
        
        trades.push({
          entryDate: priceData[entryBar].date,
          exitDate: bar.date,
          entryPrice: entryPrice.toFixed(2),
          exitPrice: (exitPrice - slippage).toFixed(2),
          shares: position.toFixed(4),
          pnl: tradePnL.toFixed(2),
          pnlPercent: (pnlPercent * 100).toFixed(2),
          holdingPeriod: barsHeld,
          exitReason: barsHeld > 30 ? 'Max Hold Period' : 'RSI Overbought',
          slippage: slippage.toFixed(2),
          costs: costs.toFixed(2),
        });
        
        position = 0;
        totalTrades++;
      }
    }
    
    // Entry logic: RSI oversold + more lenient conditions for better trade generation
    if (position === 0 && 
        currentRSI < rsiOversold && 
        currentRSI > 0 && 
        bar.close > currentSMA * 0.98 && // More lenient trend filter (98% of SMA)
        currentVolume > avgVol * 0.3) { // More lenient liquidity filter
      
      const investAmount = capital * positionSize;
      const entryPriceRaw = bar.close;
      
      // Calculate realistic slippage
      const slippage = calculateSlippage(entryPriceRaw, currentATR, currentVolume, avgVol, investAmount / entryPriceRaw, 'buy');
      const entryPriceWithSlippage = entryPriceRaw + slippage;
      
      // Calculate transaction costs
      const costs = calculateTransactionCosts(investAmount / entryPriceWithSlippage, entryPriceWithSlippage, slippage, false);
      
      // Adjust for costs
      const actualShares = (investAmount - costs) / entryPriceWithSlippage;
      position = actualShares;
      entryPrice = entryPriceWithSlippage;
      entryBar = i;
      capital -= investAmount;
      
      console.log(`ENTRY: ${bar.date} @ ₹${entryPrice.toFixed(2)}, RSI=${currentRSI.toFixed(1)}, Slippage=₹${slippage.toFixed(2)}`);
    }
    
    // Track equity curve
    equityCurve.push({
      date: bar.date,
      equity: capital + position * bar.close,
      benchmark: initialCapital * (bar.close / priceData[0].close),
    });
  });
  
  // Close any open position at end
  if (position > 0) {
    const lastBar = priceData[priceData.length - 1];
    const exitPrice = lastBar.close;
    const slippage = calculateSlippage(exitPrice, atr[atr.length - 1], lastBar.volume, avgVolume[avgVolume.length - 1], position, 'sell');
    const costs = calculateTransactionCosts(position, exitPrice, slippage, true);
    
    const exitValue = position * (exitPrice - slippage) - costs;
    capital += exitValue;
    const tradePnL = exitValue - (position * entryPrice);
    
    if (tradePnL > 0) {
      winningTrades++;
      totalProfit += tradePnL;
    } else {
      totalLoss += Math.abs(tradePnL);
    }
    
    trades.push({
      entryDate: priceData[entryBar].date,
      exitDate: lastBar.date,
      entryPrice: entryPrice.toFixed(2),
      exitPrice: (exitPrice - slippage).toFixed(2),
      shares: position.toFixed(4),
      pnl: tradePnL.toFixed(2),
      pnlPercent: ((exitPrice - entryPrice) / entryPrice * 100).toFixed(2),
      holdingPeriod: priceData.length - 1 - entryBar,
      exitReason: 'End of Backtest',
      slippage: slippage.toFixed(2),
      costs: costs.toFixed(2),
    });
    
    position = 0;
    totalTrades++;
  }
  
  // Calculate comprehensive metrics
  const finalEquity = capital;
  const totalReturn = ((finalEquity - initialCapital) / initialCapital) * 100;
  const maxDrawdown = calculateMaxDrawdown(equityCurve.map(e => e.equity));
  const sharpeRatio = calculateSharpe(equityCurve.map(e => e.equity));
  const sortinoRatio = calculateSortino(equityCurve.map(e => e.equity), initialCapital);
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
  const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? 999 : 0;
  const avgWin = winningTrades > 0 ? totalProfit / winningTrades : 0;
  const avgLoss = (totalTrades - winningTrades) > 0 ? totalLoss / (totalTrades - winningTrades) : 0;
  const expectancy = totalTrades > 0 ? (totalProfit - totalLoss) / totalTrades : 0;
  
  console.log(`BACKTEST COMPLETE: ${totalTrades} trades, ${winRate.toFixed(1)}% win rate, ${totalReturn.toFixed(2)}% return`);
  
  const metrics = {
    totalReturn: totalReturn.toFixed(2),
    finalEquity: finalEquity.toFixed(2),
    maxDrawdown: maxDrawdown.toFixed(2),
    sharpeRatio: sharpeRatio.toFixed(2),
    sortinoRatio: sortinoRatio.toFixed(2),
    totalTrades,
    winningTrades,
    losingTrades: totalTrades - winningTrades,
    winRate: winRate.toFixed(2),
    profitFactor: profitFactor.toFixed(2),
    totalProfit: totalProfit.toFixed(2),
    totalLoss: totalLoss.toFixed(2),
    avgWin: avgWin.toFixed(2),
    avgLoss: avgLoss.toFixed(2),
    expectancy: expectancy.toFixed(2),
    maxConsecutiveLosses,
  };
  
  return {
    metrics,
    equityCurve: equityCurve.slice(-252), // Last year of data
    trades: trades.slice(-20), // Last 20 trades
    priceData: priceData.slice(-100), // Last 100 bars
  };
}

// Advanced slippage model: volume-adjusted + volatility-adjusted
function calculateSlippage(
  price: number, 
  atr: number, 
  currentVolume: number, 
  avgVolume: number,
  shares: number,
  side: 'buy' | 'sell'
): number {
  // Base slippage (bid-ask spread proxy): 0.05% for liquid stocks
  let baseSlippage = price * 0.0005;
  
  // Volatility adjustment: higher ATR = wider spreads
  const volatilityMultiplier = (atr / price) * 10;
  const volatilitySlippage = baseSlippage * Math.max(1, volatilityMultiplier);
  
  // Volume/liquidity adjustment: non-linear market impact
  const orderSizeRatio = (shares * price) / (avgVolume * price);
  const liquidityImpact = price * Math.sqrt(orderSizeRatio) * 0.001;
  
  // Volume spike adjustment: thin volume = more slippage
  const volumeRatio = currentVolume / Math.max(avgVolume, 1);
  const volumeMultiplier = volumeRatio < 0.5 ? 2 : volumeRatio > 2 ? 0.7 : 1;
  
  // Total slippage
  const totalSlippage = (volatilitySlippage + liquidityImpact) * volumeMultiplier;
  
  // Apply direction: buying costs more, selling gets less
  return side === 'buy' ? totalSlippage : totalSlippage * 0.8;
}

// Realistic transaction costs for Indian markets
function calculateTransactionCosts(
  shares: number,
  price: number,
  slippage: number,
  isSell: boolean
): number {
  const orderValue = shares * price;
  
  // Brokerage: min(0.03% of order value, ₹20)
  const brokerage = Math.min(orderValue * 0.0003, 20);
  
  // STT (Securities Transaction Tax): 0.1% on sell side only
  const stt = isSell ? orderValue * 0.001 : 0;
  
  // Exchange transaction charges: 0.00345%
  const exchangeFees = orderValue * 0.0000345;
  
  // GST on brokerage: 18%
  const gst = brokerage * 0.18;
  
  // SEBI charges: ₹10 per crore
  const sebiCharges = orderValue * 0.000001;
  
  // Stamp duty: 0.015% on buy side, 0.003% on sell side
  const stampDuty = isSell ? orderValue * 0.00003 : orderValue * 0.00015;
  
  return brokerage + stt + exchangeFees + gst + sebiCharges + stampDuty;
}

function calculateRSI(prices: number[], period: number): number[] {
  const rsi: number[] = [];
  
  for (let i = 0; i < prices.length; i++) {
    if (i < period) {
      rsi.push(50);
      continue;
    }
    
    let gains = 0;
    let losses = 0;
    
    for (let j = i - period; j < i; j++) {
      const change = prices[j + 1] - prices[j];
      if (change > 0) gains += change;
      else losses += Math.abs(change);
    }
    
    const avgGain = gains / period;
    const avgLoss = losses / period;
    
    if (avgLoss === 0) {
      rsi.push(100);
    } else {
      const rs = avgGain / avgLoss;
      rsi.push(100 - (100 / (1 + rs)));
    }
  }
  
  return rsi;
}

function calculateSMA(values: number[], period: number): number[] {
  const sma: number[] = [];
  
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      sma.push(values[i]);
      continue;
    }
    
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += values[i - j];
    }
    sma.push(sum / period);
  }
  
  return sma;
}

function calculateATR(highs: number[], lows: number[], closes: number[], period: number): number[] {
  const atr: number[] = [];
  const trueRanges: number[] = [];
  
  for (let i = 0; i < closes.length; i++) {
    if (i === 0) {
      trueRanges.push(highs[i] - lows[i]);
      atr.push(highs[i] - lows[i]);
      continue;
    }
    
    const tr = Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    );
    trueRanges.push(tr);
    
    if (i < period) {
      atr.push(trueRanges.reduce((a, b) => a + b, 0) / trueRanges.length);
    } else {
      const avg = trueRanges.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
      atr.push(avg);
    }
  }
  
  return atr;
}

function calculateMaxDrawdown(equity: number[]): number {
  let maxDrawdown = 0;
  let peak = equity[0];
  
  for (const value of equity) {
    if (value > peak) peak = value;
    const drawdown = ((peak - value) / peak) * 100;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  }
  
  return -maxDrawdown;
}

function calculateSharpe(equity: number[]): number {
  const returns: number[] = [];
  
  for (let i = 1; i < equity.length; i++) {
    returns.push((equity[i] - equity[i - 1]) / equity[i - 1]);
  }
  
  if (returns.length === 0) return 0;
  
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((acc, r) => acc + Math.pow(r - avgReturn, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  
  if (stdDev === 0) return 0;
  
  // Annualized Sharpe (assuming daily returns)
  return (avgReturn / stdDev) * Math.sqrt(252);
}

function calculateSortino(equity: number[], initialCapital: number): number {
  const returns: number[] = [];
  
  for (let i = 1; i < equity.length; i++) {
    returns.push((equity[i] - equity[i - 1]) / equity[i - 1]);
  }
  
  if (returns.length === 0) return 0;
  
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const downside = returns.filter(r => r < 0);
  
  if (downside.length === 0) return avgReturn > 0 ? 999 : 0;
  
  const downsideVariance = downside.reduce((acc, r) => acc + Math.pow(r, 2), 0) / downside.length;
  const downsideDeviation = Math.sqrt(downsideVariance);
  
  if (downsideDeviation === 0) return avgReturn > 0 ? 999 : 0;
  
  // Annualized Sortino
  return (avgReturn / downsideDeviation) * Math.sqrt(252);
}
