import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { FileText, TrendingUp, TrendingDown, AlertTriangle, Shield, Zap, Target } from 'lucide-react';

interface NLPReportProps {
  data: {
    analysisMode: string;
    validCount: number;
    timestamp: string;
    signalScores: { ticker: string; score: number; signals: { [alphaId: string]: number } }[];
    portfolioWeights: {
      weights: { [ticker: string]: number };
      expectedVolatility: number;
      totalLeverage: number;
      netExposure: number;
    };
    alphaScoresRaw: { [ticker: string]: { [alphaId: string]: number } };
    selectedAlphaIds: string[];
    concentration: number;
  };
}

const ALPHA_NAMES: Record<string, string> = {
  momentum21: '21-day momentum',
  momentum63: '63-day momentum',
  meanReversion: 'mean reversion',
  liquidity: 'liquidity',
  volatility: 'low volatility',
  rsi: 'RSI mean reversion',
};

function getSignalLabel(score: number): string {
  if (score > 2) return 'exceptional bullish';
  if (score > 1) return 'strong bullish';
  if (score > 0.3) return 'moderate bullish';
  if (score > -0.3) return 'neutral';
  if (score > -1) return 'moderate bearish';
  if (score > -2) return 'strong bearish';
  return 'exceptional bearish';
}

function getActionWord(weight: number, score: number): string {
  if (weight <= 0 && score < -1) return 'SHORT';
  if (weight <= 0) return 'AVOID';
  if (score > 1.5) return 'STRONG BUY';
  if (score > 0.5) return 'BUY';
  return 'HOLD';
}

function getRiskLevel(vol: number): string {
  if (vol > 0.35) return 'extremely high';
  if (vol > 0.25) return 'high';
  if (vol > 0.15) return 'moderate';
  if (vol > 0.08) return 'low';
  return 'very low';
}

function getConcentrationComment(hhi: number, count: number): string {
  if (hhi > 0.5) return `highly concentrated — top position dominates. Consider diversifying across more names for better risk-adjusted returns.`;
  if (hhi > 0.25) return `moderately concentrated across ${count} positions. Acceptable for a focused alpha strategy but monitor single-name risk.`;
  return `well-diversified across ${count} positions. The portfolio is balanced with no single name dominating.`;
}

export function NLPReport({ data }: NLPReportProps) {
  const report = useMemo(() => {
    const { signalScores, portfolioWeights, alphaScoresRaw, selectedAlphaIds, analysisMode, validCount, concentration } = data;
    const weights = portfolioWeights.weights;

    // Sort by score
    const ranked = [...signalScores].sort((a, b) => b.score - a.score);
    const topPicks = ranked.filter(s => s.score > 0.3);
    const bottomPicks = ranked.filter(s => s.score < -0.3);
    const neutrals = ranked.filter(s => s.score >= -0.3 && s.score <= 0.3);

    // Best and worst ticker details
    const best = ranked[0];
    const worst = ranked[ranked.length - 1];

    // Dominant alpha factors for top pick
    const bestAlphas = best ? Object.entries(alphaScoresRaw[best.ticker] || {})
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3) : [];

    // Generate sections
    const sections: { icon: any; title: string; content: string; color: string }[] = [];

    // 1. Executive Summary
    const longCount = Object.values(weights).filter(w => w > 0.01).length;
    const shortCount = Object.values(weights).filter(w => w < -0.01).length;
    const vol = portfolioWeights.expectedVolatility;
    const exposure = portfolioWeights.netExposure;

    sections.push({
      icon: FileText,
      title: 'EXECUTIVE SUMMARY',
      color: 'text-amber-400',
      content: `The ${analysisMode} scan processed ${validCount} assets and identified ${topPicks.length} actionable opportunity${topPicks.length !== 1 ? 'ies' : 'y'} with positive alpha signals, ${neutrals.length} neutral holding${neutrals.length !== 1 ? 's' : ''}, and ${bottomPicks.length} name${bottomPicks.length !== 1 ? 's' : ''} flagged for caution. The optimized portfolio carries ${longCount} long position${longCount !== 1 ? 's' : ''}${shortCount > 0 ? ` and ${shortCount} short position${shortCount !== 1 ? 's' : ''}` : ''} with a net exposure of ${(exposure * 100).toFixed(1)}% and expected annualized volatility of ${(vol * 100).toFixed(1)}%.`,
    });

    // 2. Top Conviction Picks
    if (best) {
      const bestWeight = (weights[best.ticker] || 0) * 100;
      const dominantFactors = bestAlphas
        .filter(([, v]) => v > 0.3)
        .map(([k, v]) => `${ALPHA_NAMES[k] || k} (+${v.toFixed(2)}σ)`)
        .join(', ');

      let topPicksText = `**${best.ticker}** leads the universe with a composite z-score of ${best.score > 0 ? '+' : ''}${best.score.toFixed(3)}, earning a ${bestWeight.toFixed(1)}% allocation. `;
      if (dominantFactors) {
        topPicksText += `The signal is driven primarily by ${dominantFactors}. `;
      }

      if (topPicks.length > 1) {
        const others = topPicks.slice(1, 4).map(s =>
          `${s.ticker} (${s.score > 0 ? '+' : ''}${s.score.toFixed(2)}σ, ${((weights[s.ticker] || 0) * 100).toFixed(1)}%)`
        ).join(', ');
        topPicksText += `Other names with positive alpha: ${others}.`;
      }

      sections.push({
        icon: TrendingUp,
        title: 'TOP CONVICTION PICKS',
        color: 'text-emerald-400',
        content: topPicksText,
      });
    }

    // 3. Underperformers / Shorts
    if (worst && worst.score < -0.3) {
      const worstAlphas = Object.entries(alphaScoresRaw[worst.ticker] || {})
        .sort(([, a], [, b]) => a - b)
        .slice(0, 2)
        .filter(([, v]) => v < -0.3)
        .map(([k, v]) => `${ALPHA_NAMES[k] || k} (${v.toFixed(2)}σ)`)
        .join(', ');

      let underText = `**${worst.ticker}** shows the weakest profile at ${worst.score.toFixed(3)}σ composite. `;
      if (worstAlphas) {
        underText += `Key drag factors: ${worstAlphas}. `;
      }
      underText += `Recommendation: ${getActionWord(weights[worst.ticker] || 0, worst.score)}.`;

      if (bottomPicks.length > 1) {
        const otherbad = bottomPicks.slice(0, -1).map(s => `${s.ticker} (${s.score.toFixed(2)}σ)`).join(', ');
        underText += ` Other underperformers: ${otherbad}.`;
      }

      sections.push({
        icon: TrendingDown,
        title: 'UNDERPERFORMERS',
        color: 'text-rose-400',
        content: underText,
      });
    }

    // 4. Alpha Factor Breakdown
    const factorSummaries = selectedAlphaIds.map(alpha => {
      const values = signalScores.map(s => alphaScoresRaw[s.ticker]?.[alpha] || 0);
      const avgSignal = values.reduce((a, b) => a + b, 0) / values.length;
      const dispersion = Math.sqrt(values.reduce((s, v) => s + Math.pow(v - avgSignal, 2), 0) / values.length);
      const strongBuy = values.filter(v => v > 1).length;
      const strongSell = values.filter(v => v < -1).length;

      return {
        name: ALPHA_NAMES[alpha] || alpha,
        avg: avgSignal,
        dispersion,
        strongBuy,
        strongSell,
      };
    });

    const mostDispersed = factorSummaries.sort((a, b) => b.dispersion - a.dispersion)[0];
    const factorText = factorSummaries.map(f =>
      `• **${f.name}**: avg signal ${f.avg > 0 ? '+' : ''}${f.avg.toFixed(2)}σ, dispersion ${f.dispersion.toFixed(2)} — ${f.strongBuy} strong buy${f.strongBuy !== 1 ? 's' : ''}, ${f.strongSell} strong sell${f.strongSell !== 1 ? 's' : ''}`
    ).join('\n');

    sections.push({
      icon: Target,
      title: 'FACTOR ANALYSIS',
      color: 'text-blue-400',
      content: `${factorText}\n\nHighest signal dispersion in **${mostDispersed.name}** (${mostDispersed.dispersion.toFixed(2)}), suggesting the strongest stock-picking power from this factor in the current regime.`,
    });

    // 5. Risk Assessment
    const riskLevel = getRiskLevel(vol);
    const concComment = getConcentrationComment(concentration, longCount);

    sections.push({
      icon: Shield,
      title: 'RISK ASSESSMENT',
      color: 'text-amber-400',
      content: `Portfolio risk is **${riskLevel}** at ${(vol * 100).toFixed(1)}% expected volatility. The Herfindahl concentration index is ${concentration.toFixed(4)} — ${concComment} Net exposure of ${(exposure * 100).toFixed(1)}% indicates a ${exposure > 0.8 ? 'fully directional long' : exposure > 0.5 ? 'net long with partial hedging' : exposure > 0 ? 'balanced long-biased' : 'market-neutral'} stance.`,
    });

    // 6. Action Items
    const actionItems = ranked.slice(0, 5).map(s => {
      const w = (weights[s.ticker] || 0) * 100;
      const action = getActionWord(weights[s.ticker] || 0, s.score);
      return `→ **${action}** ${s.ticker} at ${w.toFixed(1)}% weight (signal: ${s.score > 0 ? '+' : ''}${s.score.toFixed(3)}σ)`;
    }).join('\n');

    sections.push({
      icon: Zap,
      title: 'RECOMMENDED ACTIONS',
      color: 'text-emerald-400',
      content: actionItems,
    });

    // 7. Caveats
    sections.push({
      icon: AlertTriangle,
      title: 'IMPORTANT CAVEATS',
      color: 'text-white/40',
      content: `This analysis is based on historical price data and statistical factors. Past performance does not guarantee future results. Z-scores are cross-sectional (relative ranking) — a positive score means better than peers, not necessarily profitable. Position sizes assume no transaction costs or market impact. Always validate with fundamental research before trading.`,
    });

    return sections;
  }, [data]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/[0.02] border border-white/10 rounded-lg overflow-hidden"
    >
      <div className="px-5 py-3 bg-gradient-to-r from-amber-500/10 to-transparent border-b border-white/5 flex items-center gap-3">
        <FileText className="w-4 h-4 text-amber-400" />
        <span className="text-[11px] text-amber-400 tracking-widest uppercase font-bold">
          Intelligence Report — Plain English Summary
        </span>
      </div>

      <div className="p-5 space-y-6">
        {report.map((section, i) => {
          const Icon = section.icon;
          return (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <div className={`flex items-center gap-2 mb-2 ${section.color}`}>
                <Icon className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase">{section.title}</span>
              </div>
              <div className="text-sm leading-7 text-white/70 pl-5 border-l border-white/[0.06]">
                {section.content.split('\n').map((line, j) => {
                  // Parse bold markers **text**
                  const parts = line.split(/\*\*(.*?)\*\*/g);
                  return (
                    <p key={j} className={j > 0 ? 'mt-1.5' : ''}>
                      {parts.map((part, k) =>
                        k % 2 === 1 ? (
                          <span key={k} className="text-white font-semibold">{part}</span>
                        ) : (
                          <span key={k}>{part}</span>
                        )
                      )}
                    </p>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
