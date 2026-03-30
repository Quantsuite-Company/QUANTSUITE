/**
 * QuantSuite Sandbox Backtest Engine
 * Runs strategy sandbox tests on historical data
 */

export interface BacktestConfig {
  strategyName: string;
  entrySignal: 'MOMENTUM' | 'MEAN_REVERSION' | 'BREAKOUT' | 'VOLATILITY';
  positionSize: number;
  stopLoss: number;
  takeProfit: number;
  lookbackPeriod: number;
  holdingPeriod: number;
}

export interface BacktestTrade {
  entryDate: number; exitDate: number; entryPrice: number; exitPrice: number;
  pnl: number; pnlPercent: number; type: 'LONG' | 'SHORT';
  exitReason: 'TAKE_PROFIT' | 'STOP_LOSS' | 'HOLDING_PERIOD' | 'SIGNAL_EXIT';
}

export interface BacktestResult {
  strategyName: string;
  equityCurve: { day: number; equity: number; benchmark: number }[];
  totalReturn: number; annualizedReturn: number; sharpeRatio: number;
  maxDrawdown: number; winRate: number; profitFactor: number;
  totalTrades: number; avgWin: number; avgLoss: number;
  avgHoldingPeriod: number; trades: BacktestTrade[];
  monthlyReturns: { month: string; return: number }[];
}

function genMomentumSignals(prices: number[], lb: number): ('BUY'|'SELL'|'HOLD')[] {
  return prices.map((p, i) => {
    if (i < lb) return 'HOLD';
    const mom = (p - prices[i - lb]) / prices[i - lb];
    let gains = 0, losses = 0;
    for (let j = i - 14; j < i && j >= 0; j++) {
      const c = prices[j + 1] - prices[j];
      c > 0 ? gains += c : losses += Math.abs(c);
    }
    const rsi = losses > 0 ? 100 - 100 / (1 + gains / losses) : 100;
    if (mom > 0.02 && rsi > 50 && rsi < 75) return 'BUY';
    if (mom < -0.02 && rsi < 50 && rsi > 25) return 'SELL';
    return 'HOLD';
  });
}

function genMeanRevSignals(prices: number[], lb: number): ('BUY'|'SELL'|'HOLD')[] {
  return prices.map((p, i) => {
    if (i < lb) return 'HOLD';
    const sl = prices.slice(i - lb, i);
    const m = sl.reduce((a, b) => a + b, 0) / lb;
    const s = Math.sqrt(sl.reduce((a, v) => a + (v - m) ** 2, 0) / lb);
    const z = s > 0 ? (p - m) / s : 0;
    if (z < -1.5) return 'BUY';
    if (z > 1.5) return 'SELL';
    return 'HOLD';
  });
}

function genBreakoutSignals(prices: number[], lb: number): ('BUY'|'SELL'|'HOLD')[] {
  return prices.map((p, i) => {
    if (i < lb) return 'HOLD';
    const sl = prices.slice(i - lb, i);
    if (p > Math.max(...sl)) return 'BUY';
    if (p < Math.min(...sl)) return 'SELL';
    return 'HOLD';
  });
}

function genVolSignals(prices: number[], lb: number): ('BUY'|'SELL'|'HOLD')[] {
  return prices.map((p, i) => {
    if (i < lb + 1) return 'HOLD';
    const rets = [];
    for (let j = i - lb; j < i; j++) rets.push((prices[j+1] - prices[j]) / prices[j]);
    const m = rets.reduce((a, b) => a + b, 0) / rets.length;
    const vol = Math.sqrt(rets.reduce((s, r) => s + (r - m) ** 2, 0) / rets.length);
    const cr = (p - prices[i-1]) / prices[i-1];
    if (vol < 0.015 && cr > 0.005) return 'BUY';
    if (vol > 0.03 && cr < -0.005) return 'SELL';
    return 'HOLD';
  });
}

export function runBacktest(prices: number[], config: BacktestConfig, cap: number = 100000): BacktestResult {
  const sigFn = { MOMENTUM: genMomentumSignals, MEAN_REVERSION: genMeanRevSignals, BREAKOUT: genBreakoutSignals, VOLATILITY: genVolSignals };
  const signals = (sigFn[config.entrySignal] || genMomentumSignals)(prices, config.lookbackPeriod);
  const trades: BacktestTrade[] = [];
  let eq = cap;
  let pos: { ep: number; ed: number; t: 'LONG'|'SHORT' } | null = null;
  const curve: BacktestResult['equityCurve'] = [];
  const bs = prices[0];

  for (let i = 0; i < prices.length; i++) {
    const bq = cap * (prices[i] / bs);
    if (pos) {
      const hd = i - pos.ed;
      const pp = pos.t === 'LONG' ? (prices[i] - pos.ep) / pos.ep : (pos.ep - prices[i]) / pos.ep;
      let er: BacktestTrade['exitReason'] | null = null;
      if (pp >= config.takeProfit) er = 'TAKE_PROFIT';
      else if (pp <= -config.stopLoss) er = 'STOP_LOSS';
      else if (hd >= config.holdingPeriod) er = 'HOLDING_PERIOD';
      else if (pos.t === 'LONG' && signals[i] === 'SELL') er = 'SIGNAL_EXIT';
      else if (pos.t === 'SHORT' && signals[i] === 'BUY') er = 'SIGNAL_EXIT';
      if (er) {
        const pv = eq * config.positionSize;
        eq += pv * pp;
        trades.push({ entryDate: pos.ed, exitDate: i, entryPrice: pos.ep, exitPrice: prices[i], pnl: pv * pp, pnlPercent: pp, type: pos.t, exitReason: er });
        pos = null;
      }
    } else {
      if (signals[i] === 'BUY') pos = { ep: prices[i], ed: i, t: 'LONG' };
      else if (signals[i] === 'SELL') pos = { ep: prices[i], ed: i, t: 'SHORT' };
    }
    curve.push({ day: i, equity: Math.round(eq * 100) / 100, benchmark: Math.round(bq * 100) / 100 });
  }

  if (pos) {
    const pp = pos.t === 'LONG' ? (prices[prices.length-1] - pos.ep) / pos.ep : (pos.ep - prices[prices.length-1]) / pos.ep;
    eq += eq * config.positionSize * pp;
    trades.push({ entryDate: pos.ed, exitDate: prices.length-1, entryPrice: pos.ep, exitPrice: prices[prices.length-1], pnl: eq * config.positionSize * pp, pnlPercent: pp, type: pos.t, exitReason: 'HOLDING_PERIOD' });
  }

  const tr = (eq - cap) / cap;
  const ar = Math.pow(1 + tr, 252 / prices.length) - 1;
  const wt = trades.filter(t => t.pnl > 0);
  const lt = trades.filter(t => t.pnl <= 0);
  const wr = trades.length > 0 ? wt.length / trades.length : 0;
  const tw = wt.reduce((s, t) => s + t.pnl, 0);
  const tl = Math.abs(lt.reduce((s, t) => s + t.pnl, 0));
  const pf = tl > 0 ? tw / tl : tw > 0 ? 99 : 0;

  const eqRets = curve.slice(1).map((e, i) => (e.equity - curve[i].equity) / curve[i].equity);
  const mr = eqRets.reduce((a, b) => a + b, 0) / eqRets.length;
  const rs = Math.sqrt(eqRets.reduce((s, r) => s + (r - mr) ** 2, 0) / eqRets.length);
  const sr = rs > 0 ? (mr * 252 - 0.05) / (rs * Math.sqrt(252)) : 0;

  let pk = cap, md = 0;
  for (const p of curve) { if (p.equity > pk) pk = p.equity; const d = (pk - p.equity) / pk; if (d > md) md = d; }

  const monthly: BacktestResult['monthlyReturns'] = [];
  for (let i = 0; i < curve.length; i += 21) {
    const e = Math.min(i + 21, curve.length - 1);
    monthly.push({ month: `M${Math.floor(i/21)+1}`, return: Math.round((curve[e].equity - curve[i].equity) / curve[i].equity * 10000) / 100 });
  }

  return {
    strategyName: config.strategyName,
    equityCurve: curve.filter((_, i) => i % Math.max(1, Math.floor(curve.length / 100)) === 0),
    totalReturn: Math.round(tr * 10000) / 100, annualizedReturn: Math.round(ar * 10000) / 100,
    sharpeRatio: Math.round(sr * 1000) / 1000, maxDrawdown: Math.round(md * 10000) / 100,
    winRate: Math.round(wr * 10000) / 100, profitFactor: Math.round(pf * 100) / 100,
    totalTrades: trades.length,
    avgWin: wt.length > 0 ? Math.round(wt.reduce((s,t) => s + t.pnlPercent, 0) / wt.length * 10000) / 100 : 0,
    avgLoss: lt.length > 0 ? Math.round(lt.reduce((s,t) => s + t.pnlPercent, 0) / lt.length * 10000) / 100 : 0,
    avgHoldingPeriod: trades.length > 0 ? Math.round(trades.reduce((s,t) => s + t.exitDate - t.entryDate, 0) / trades.length * 10) / 10 : 0,
    trades, monthlyReturns: monthly
  };
}

export function formatBacktestForLLM(r: BacktestResult): string {
  return `\n\n[SANDBOX BACKTEST — ${r.strategyName.toUpperCase()}]\n` +
    `Total Return: ${r.totalReturn > 0 ? '+' : ''}${r.totalReturn}% | Annualized: ${r.annualizedReturn}%\n` +
    `Sharpe: ${r.sharpeRatio} | Max DD: -${r.maxDrawdown}% | Win Rate: ${r.winRate}%\n` +
    `Profit Factor: ${r.profitFactor} | Trades: ${r.totalTrades}\n` +
    `Avg Win: +${r.avgWin}% | Avg Loss: ${r.avgLoss}% | Avg Hold: ${r.avgHoldingPeriod}d\n` +
    `REFERENCE these results in your analysis. Equity curve chart rendered in frontend.\n`;
}
