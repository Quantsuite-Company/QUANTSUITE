/**
 * V7 CIO MODULE — Chief Investment Officer Consensus Engine
 * 
 * Evaluates the 5 siloed agent verdicts, weighs them by historical accuracy,
 * and produces a final institutional-grade allocation decision.
 * 
 * Features:
 * - Weighted consensus from 5 information-asymmetric agents
 * - 77.5% cash allocation default (extreme conservatism)
 * - Disagreement Index for robustness measurement
 * - Override logic with explicit reasoning
 */

import type { FactorZooOutput } from './FactorZoo';

// ============================================================
// INTERFACES
// ============================================================

export interface AgentVerdict {
  agentId: string;
  persona: 'BUFFETT' | 'ACKMAN' | 'COHEN' | 'DALIO' | 'MUNGER';
  direction: 'LONG' | 'SHORT' | 'ABSTAIN';
  conviction: number;       // 0-100
  reasoning: string;
  dataRestriction: string[];  // What data was withheld
  keySignals: string[];       // Top 3 signals the agent used
}

export interface CIODecision {
  finalDirection: 'LONG' | 'SHORT' | 'NO_TRADE';
  portfolioAllocation: number;  // % of NAV (max ~22.5% since 77.5% stays cash)
  cashReserve: number;          // Always >= 77.5%
  disagreementIndex: number;    // 0 = echo chamber, 1 = max conflict
  consensusStrength: number;    // 0-100
  voteSummary: {
    long: number;
    short: number;
    abstain: number;
  };
  overrides: CIOOverride[];
  reasoning: string;
}

interface CIOOverride {
  overriddenAgent: string;
  originalDirection: string;
  reason: string;
}

// ============================================================
// AGENT WEIGHT SYSTEM
// ============================================================

// Historical accuracy weights (will be dynamic in production)
const AGENT_WEIGHTS: Record<string, number> = {
  BUFFETT: 0.25,   // Fundamentals are the bedrock
  ACKMAN: 0.20,    // Insider signals are high-conviction
  COHEN: 0.20,     // Pure technicals provide timing
  DALIO: 0.20,     // Macro context prevents regime blindness
  MUNGER: 0.15,    // Fundamentals + news overlap somewhat with Buffett
};

// ============================================================
// CIO CONSENSUS ENGINE
// ============================================================

export function evaluateCouncil(
  verdicts: AgentVerdict[],
  factorZoo: FactorZooOutput
): CIODecision {
  
  // 1. Count votes
  const longVotes = verdicts.filter(v => v.direction === 'LONG');
  const shortVotes = verdicts.filter(v => v.direction === 'SHORT');
  const abstainVotes = verdicts.filter(v => v.direction === 'ABSTAIN');
  
  const voteSummary = {
    long: longVotes.length,
    short: shortVotes.length,
    abstain: abstainVotes.length,
  };
  
  // 2. Compute weighted consensus
  let longWeight = 0, shortWeight = 0;
  for (const v of verdicts) {
    const weight = AGENT_WEIGHTS[v.persona] || 0.15;
    const convictionWeight = v.conviction / 100;
    if (v.direction === 'LONG') {
      longWeight += weight * convictionWeight;
    } else if (v.direction === 'SHORT') {
      shortWeight += weight * convictionWeight;
    }
  }
  
  // 3. Disagreement Index (0 = unanimous, 1 = split)
  const totalDirectional = longVotes.length + shortVotes.length;
  const disagreementIndex = totalDirectional === 0 ? 1 : 
    1 - Math.abs(longVotes.length - shortVotes.length) / totalDirectional;
  
  // 4. Consensus strength
  const consensusStrength = Math.abs(longWeight - shortWeight) * 100;
  
  // 5. Determine direction
  let finalDirection: 'LONG' | 'SHORT' | 'NO_TRADE' = 'NO_TRADE';
  
  // Require 3/5 majority for action
  if (longVotes.length >= 3 && longWeight > shortWeight) {
    finalDirection = 'LONG';
  } else if (shortVotes.length >= 3 && shortWeight > longWeight) {
    finalDirection = 'SHORT';
  }
  
  // If high disagreement (>0.6) and low consensus (<30), CIO stays out
  if (disagreementIndex > 0.6 && consensusStrength < 30) {
    finalDirection = 'NO_TRADE';
  }
  
  // 6. Portfolio allocation — EXTREME CONSERVATISM
  // Base: 77.5% cash, max 22.5% deployed
  const maxAllocation = 22.5;
  let portfolioAllocation = 0;
  
  if (finalDirection !== 'NO_TRADE') {
    // Scale allocation by consensus strength and quality gate score
    const qualityMultiplier = factorZoo.compositeScore;
    const convictionMultiplier = consensusStrength / 100;
    portfolioAllocation = Math.min(
      maxAllocation,
      maxAllocation * qualityMultiplier * convictionMultiplier
    );
    
    // Floor at 1% for any approved trade
    portfolioAllocation = Math.max(1, portfolioAllocation);
    
    // Reduce by 50% if high disagreement
    if (disagreementIndex > 0.4) {
      portfolioAllocation *= 0.5;
    }
  }
  
  const cashReserve = 100 - portfolioAllocation;
  
  // 7. Detect and document overrides
  const overrides: CIOOverride[] = [];
  const majorityDirection = finalDirection;
  
  for (const v of verdicts) {
    if (majorityDirection !== 'NO_TRADE' && v.direction !== majorityDirection && v.direction !== 'ABSTAIN') {
      overrides.push({
        overriddenAgent: v.persona,
        originalDirection: v.direction,
        reason: `${v.persona} voted ${v.direction} with ${v.conviction}% conviction, but was overridden by ${voteSummary.long > voteSummary.short ? voteSummary.long : voteSummary.short}/5 majority consensus. Key dissent signals: ${v.keySignals.slice(0, 2).join(', ')}.`,
      });
    }
  }
  
  // 8. Generate CIO reasoning
  const reasoning = generateCIOReasoning(
    finalDirection, portfolioAllocation, cashReserve,
    disagreementIndex, voteSummary, overrides, factorZoo
  );
  
  return {
    finalDirection,
    portfolioAllocation: Math.round(portfolioAllocation * 100) / 100,
    cashReserve: Math.round(cashReserve * 100) / 100,
    disagreementIndex: Math.round(disagreementIndex * 1000) / 1000,
    consensusStrength: Math.round(consensusStrength * 10) / 10,
    voteSummary,
    overrides,
    reasoning,
  };
}

// ============================================================
// REASONING GENERATOR
// ============================================================

function generateCIOReasoning(
  direction: string,
  allocation: number,
  cash: number,
  disagreement: number,
  votes: { long: number; short: number; abstain: number },
  overrides: CIOOverride[],
  factors: FactorZooOutput
): string {
  const ticker = factors.ticker;
  const score = (factors.compositeScore * 100).toFixed(1);
  
  if (direction === 'NO_TRADE') {
    return `## CIO Decision: NO TRADE on ${ticker}\n\n` +
      `The Alpha Council produced a **${votes.long}-${votes.short}** split vote with a Disagreement Index of ${disagreement.toFixed(2)}. ` +
      `This level of internal conflict suggests the signal is ambiguous. ` +
      `Quality Gate Score: ${score}%. ` +
      `**Decision: Preserve capital. Maintain ${cash.toFixed(1)}% cash position.**`;
  }
  
  let text = `## CIO Decision: ${direction} ${ticker} at ${allocation.toFixed(2)}% NAV\n\n`;
  text += `The Alpha Council achieved a **${votes.long}-${votes.short} ${direction}** consensus. `;
  text += `Quality Gate Score: ${score}%. Disagreement Index: ${disagreement.toFixed(2)}. `;
  text += `**Cash Reserve: ${cash.toFixed(1)}%** (institutional conservatism enforced).\n\n`;
  
  if (overrides.length > 0) {
    text += `### ⚠️ Dissent Overrides\n`;
    for (const o of overrides) {
      text += `- **${o.overriddenAgent}** voted ${o.originalDirection}: ${o.reason}\n`;
    }
  }
  
  return text;
}
