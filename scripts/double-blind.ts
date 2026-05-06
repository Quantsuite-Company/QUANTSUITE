/**
 * Hedge Fund 2.0 - Double Blind Backtester CLI
 * 
 * This script runs the MathReasoning engine on historical data WITH A STRICT CUTOFF.
 * It makes a prediction, then peeks at the "forward data" to see if we made money.
 * 
 * Usage: npx tsx scripts/double-blind-test.ts
 */

import { calculateMomentum, calculateZScore, calculateVaR, evaluateQualityGate, kellyCriterion } from '../src/lib/MathReasoning';
import yahooFinance from 'yahoo-finance2';

async function fetchYFData(symbol: string) {
  try {
    const queryOptions = { period1: '2024-01-01', interval: '1d' as const };
    const result: any[] = await yahooFinance.historical(symbol, queryOptions);
    
    return result.map((day: any) => ({
      date: day.date.toISOString().split('T')[0],
      price: day.close
    })).filter((obj: any) => obj.price !== null);
  } catch (e) {
    console.error(`Failed to fetch data for ${symbol}:`, e);
    return [];
  }
}

async function runDoubleBlindSimulation(symbol: string, cutoffDateStr: string) {
  console.log(`\n======================================================`);
  console.log(`[BLIND TEST] ALLOCATING CAPITAL FOR: ${symbol}`);
  console.log(`[CUTOFF DATE] ${cutoffDateStr} (Agents cannot see past this date)`);
  
  const allData = await fetchYFData(symbol);
  if (!allData || !allData.length) {
    console.log(`[ABORT] Could not retrieve data for ${symbol}. (Blocked by Yahoo Finance or rate limited)`);
    return;
  }

  const cutoffDate = new Date(cutoffDateStr);
  const blindData = allData.filter((d: any) => new Date(d.date) <= cutoffDate);
  const forwardData = allData.filter((d: any) => new Date(d.date) > cutoffDate);

  if (!blindData.length || !forwardData.length) {
    console.log(`Insufficient data spanning ${cutoffDateStr}`);
    return;
  }

  const prices = blindData.map((d: any) => d.price);
  const currentPrice = prices[prices.length - 1];

  // --- ALPHA COUNCIL SIMULATION (Math Driven) ---
  
  // 1. Quality Gate
  const momentum = calculateMomentum(prices, 20);
  const volProxy = 0.025; // standard proxy
  const qScore = evaluateQualityGate(Math.abs(momentum), volProxy, 0.4);
  
  if (qScore < 0.35) {
    console.log(`[QUALITY GATE] REJECTED. Score: ${qScore.toFixed(3)}. Too illiquid or low momentum.`);
    return;
  }
  
  // 2. Alpha-4 (Quant Core) Breakdown
  const recentZScores = calculateZScore(prices, 20);
  const latestZ = recentZScores[recentZScores.length - 1].zScore;
  
  let prediction = 'NEUTRAL';
  // Standard reversion / breakout logic
  if (latestZ > 1.5 && momentum > 0) prediction = 'LONG (Breakout)';
  else if (latestZ < -1.5 && momentum < 0) prediction = 'SHORT (Breakdown)';
  else if (latestZ < -2.0) prediction = 'LONG (Mean Reversion Baseline)';
  else if (latestZ > 2.0) prediction = 'SHORT (Overbought Mean Reversion)';
  else if (momentum > 0.05) prediction = 'LONG (Trend Follow)';

  console.log(`[ALPHA-4 QUANT] Z-Score: ${latestZ.toFixed(2)} | Momentum: ${(momentum * 100).toFixed(2)}%`);

  // 3. Risk Manager (VaR Constraint)
  const returns = [];
  for(let i=1; i<prices.length; i++) returns.push((prices[i]/prices[i-1]) - 1);
  const var95 = calculateVaR(returns, 0.95);
  
  console.log(`[RISK MGR] 95% Confidence VaR limits downside to ${(var95 * 100).toFixed(2)}% per day.`);
  
  if (Math.abs(var95) > 0.05) { // Highly conservative rule: Don't risk money if daily drop could exceed 5%
    console.log(`[RISK MGR REJECT] Highly conservative threshold exceeded. Daily VaR too high.`);
    prediction = 'CASH';
  }

  // 4. Portfolio Manager (Kelly Sizing)
  // Assume a 55% win rate historically for our momentum edge with a 1.5 payoff ratio
  const optimalSizing = kellyCriterion(0.55, 1.5);
  
  // --- REVEAL RESULTS ---
  console.log(`\n[CIO VERDICT] Final Allocation Decision: ${prediction}`);
  console.log(`[CIO SIZING] Kelly Criterion suggests committing ${(optimalSizing * 100).toFixed(2)}% of NAV.`);
  console.log(`\n[THE REVEAL] Opening the blindfold to view forward performance...`);
  
  const finalPrice = forwardData[forwardData.length - 1].price;
  const actualReturn = (finalPrice / currentPrice) - 1;
  const daysHeld = forwardData.length;

  console.log(`- Price at Cutoff: $${currentPrice.toFixed(2)}`);
  console.log(`- Price Today (+${daysHeld} days): $${finalPrice.toFixed(2)}`);
  
  const profitStr = actualReturn > 0 ? `+${(actualReturn * 100).toFixed(2)}%` : `${(actualReturn * 100).toFixed(2)}%`;
  
  if (prediction.includes('LONG') && actualReturn > 0) console.log(`[RESULT] WIN (Made ${profitStr}) 💰`);
  else if (prediction.includes('SHORT') && actualReturn < 0) console.log(`[RESULT] WIN (Made ${Math.abs(actualReturn * 100).toFixed(2)}%) 💰`);
  else if (prediction === 'CASH') console.log(`[RESULT] PRESERVED CAPITAL.`);
  else console.log(`[RESULT] LOSS (Prediction failed, actual move ${profitStr}) 🩸`);
  console.log(`======================================================`);
}

async function run() {
  console.log("BOOTING HIGHLY-CONSERVATIVE DOUBLE BLIND SIMULATION...");
  // Cutoff at beginning of 2026. 
  // Testing period: 2026-01-01 to 2026-04-16 (Today)
  const cutoff = '2026-01-01';
  
  await runDoubleBlindSimulation('NVDA', cutoff);
  await runDoubleBlindSimulation('TSLA', cutoff);
  await runDoubleBlindSimulation('AAPL', cutoff);
  await runDoubleBlindSimulation('SMCI', cutoff);
}

run();
