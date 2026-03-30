import { PortfolioMetrics, RiskMetrics, EquityVsOptions } from './portfolioCalculator';

export interface InsightCategory {
  trophies: string[];
  warnings: string[];
  recommendations: string[];
  roasts: string[];
}

export const generateInsights = (
  metrics: PortfolioMetrics,
  riskMetrics: RiskMetrics,
  equityVsOptions: EquityVsOptions
): InsightCategory => {
  const insights: InsightCategory = {
    trophies: [],
    warnings: [],
    recommendations: [],
    roasts: []
  };

  // === TROPHIES (Achievements) ===
  if (metrics.winRate >= 80) {
    insights.trophies.push("🏆 Win Master: 80%+ win rate - You're crushing it!");
  }
  if (metrics.profitFactor >= 3) {
    insights.trophies.push("💰 Profit Machine: 3x profit factor - Winners are massive!");
  }
  if (metrics.avgWin > metrics.avgLoss * 2) {
    insights.trophies.push("🎯 Sniper: Wins 2x bigger than losses - Perfect execution!");
  }
  if (metrics.returnPercent >= 20) {
    insights.trophies.push("🚀 Return Champion: 20%+ returns - Outstanding performance!");
  }
  if (riskMetrics.concentrationIndex < 0.15) {
    insights.trophies.push("🛡️ Diversification Pro: Well-balanced portfolio!");
  }

  // === WARNINGS (Risk Alerts) ===
  if (metrics.winRate < 40) {
    insights.warnings.push("⚠️ Low Win Rate: Only " + metrics.winRate.toFixed(1) + "% of trades profitable");
  }
  if (metrics.profitFactor < 1) {
    insights.warnings.push("🔴 Losses Exceed Wins: Profit factor below 1.0");
  }
  if (riskMetrics.largestPositionPercent > 30) {
    insights.warnings.push("🎰 High Concentration: Single position is " + riskMetrics.largestPositionPercent.toFixed(1) + "% of portfolio");
  }
  if (riskMetrics.top3Percent > 60) {
    insights.warnings.push("📊 Top-Heavy Portfolio: Top 3 positions = " + riskMetrics.top3Percent.toFixed(1) + "% of capital");
  }
  if (metrics.returnPercent < -10) {
    insights.warnings.push("📉 Deep Drawdown: Portfolio down " + Math.abs(metrics.returnPercent).toFixed(1) + "%");
  }
  if (metrics.avgLoss > metrics.avgWin) {
    insights.warnings.push("⚡ Risk/Reward Imbalance: Average loss (₹" + metrics.avgLoss.toFixed(0) + ") > Average win (₹" + metrics.avgWin.toFixed(0) + ")");
  }

  // === RECOMMENDATIONS (Actionable) ===
  if (metrics.winRate < 50) {
    insights.recommendations.push("📋 Win rate below 50% - Review entry criteria and wait for better setups");
  }
  if (metrics.avgLoss > metrics.avgWin * 1.5) {
    insights.recommendations.push("🛑 Tighten stop losses - Average loss is 1.5x average win");
  }
  if (riskMetrics.concentrationIndex > 0.25) {
    insights.recommendations.push("🔀 Diversify - High concentration risk detected");
  }
  if (equityVsOptions.options.count > 0) {
    const optionsLossRate = equityVsOptions.options.pnl < 0 ? 100 : 0;
    if (optionsLossRate > 60) {
      insights.recommendations.push("📉 Review options strategy - High loss rate in derivatives");
    }
  }
  if (metrics.totalTrades < 10) {
    insights.recommendations.push("📊 Small sample size - Need more trades for reliable statistics");
  }
  if (metrics.profitFactor > 1 && metrics.profitFactor < 1.5) {
    insights.recommendations.push("⚖️ Marginal edge - Consider improving trade selection quality");
  }

  // === ROASTS (Sarcastic but Data-Driven) ===
  if (metrics.winRate < 40) {
    insights.roasts.push("😬 " + metrics.winRate.toFixed(1) + "% win rate - Even a coin flip would do better at 50%");
  }
  if (metrics.avgLoss > metrics.avgWin * 2) {
    insights.roasts.push("🤦 Cutting winners early, letting losers run - Trading 101 says do the opposite");
  }
  if (riskMetrics.largestPositionPercent > 40) {
    insights.roasts.push("🎲 " + riskMetrics.largestPositionPercent.toFixed(0) + "% in one stock - This is investing, not roulette");
  }
  if (metrics.losingTrades >= 5 && metrics.winningTrades === 0) {
    insights.roasts.push("💀 " + metrics.losingTrades + " losses in a row - Maybe time to take a break?");
  }
  if (metrics.profitFactor < 0.5) {
    insights.roasts.push("🔥 Profit factor 0.5 - For every ₹1 won, you lose ₹2. Math is not on your side");
  }
  if (equityVsOptions.options.capital > equityVsOptions.equity.capital * 2 && equityVsOptions.options.pnl < 0) {
    insights.roasts.push("🎰 2x more capital in options than stocks... and still losing. Bold strategy!");
  }

  return insights;
};

export const getWinRateCommentary = (winRate: number): string => {
  if (winRate >= 70) return "Excellent win rate! 7+ out of 10 trades are profitable.";
  if (winRate >= 60) return "Good win rate at " + winRate.toFixed(1) + "% - Above average performance.";
  if (winRate >= 50) return "Decent win rate at " + winRate.toFixed(1) + "% - Room for improvement.";
  if (winRate >= 40) return "Below average win rate - Consider refining entry strategy.";
  return "Low win rate - Urgent strategy review needed.";
};

export const getProfitFactorCommentary = (profitFactor: number): string => {
  if (profitFactor === Infinity) return "No losses yet - Maintain this streak!";
  if (profitFactor >= 3) return "Exceptional profit factor: Winners are 3x larger than losers!";
  if (profitFactor >= 2) return "Strong profit factor: Winners are 2x larger than losers.";
  if (profitFactor >= 1.5) return "Good profit factor - Positive edge in the market.";
  if (profitFactor >= 1) return "Marginal profit factor - Small edge, needs improvement.";
  return "Caution: Losses exceed wins. Immediate strategy adjustment needed.";
};

export const getReturnCommentary = (returnPercent: number): string => {
  if (returnPercent >= 30) return "🔥 Outstanding returns of " + returnPercent.toFixed(1) + "% - Elite performance!";
  if (returnPercent >= 20) return "💪 Excellent returns of " + returnPercent.toFixed(1) + "% - Well above market.";
  if (returnPercent >= 10) return "👍 Good returns of " + returnPercent.toFixed(1) + "% - Solid performance.";
  if (returnPercent >= 5) return "📊 Modest returns of " + returnPercent.toFixed(1) + "% - Beating inflation.";
  if (returnPercent > 0) return "Slightly positive at " + returnPercent.toFixed(1) + "% - Small gains.";
  if (returnPercent >= -5) return "⚠️ Minor loss of " + Math.abs(returnPercent).toFixed(1) + "% - Recoverable.";
  if (returnPercent >= -15) return "📉 Portfolio down " + Math.abs(returnPercent).toFixed(1) + "% - Risk management needed.";
  return "🚨 Significant drawdown of " + Math.abs(returnPercent).toFixed(1) + "% - Urgent review required.";
};

export const getConcentrationCommentary = (concentrationIndex: number, top3Percent: number): string => {
  if (concentrationIndex < 0.10) return "✅ Well diversified portfolio with low concentration risk.";
  if (concentrationIndex < 0.20) return "📊 Moderately diversified - Acceptable risk level.";
  if (concentrationIndex < 0.30) return "⚠️ Concentrated portfolio - Consider spreading risk.";
  return "🔴 Highly concentrated (" + (concentrationIndex * 100).toFixed(0) + "%) - Top positions dominate portfolio.";
};
