import { motion } from 'framer-motion';
import type { SentimentResult, SentimentSummary } from '@/lib/sentimentEngine';

interface SentimentHeatmapProps {
  summary: SentimentSummary;
  theme?: 'athena' | 'market' | 'strategy';
}

const themeAccent = {
  athena: 'text-sky-400', market: 'text-emerald-400', strategy: 'text-cyan-400'
};

export function SentimentHeatmap({ summary, theme = 'market' }: SentimentHeatmapProps) {
  const accent = themeAccent[theme];

  const getColor = (s: SentimentResult) => {
    if (s.sentiment === 'BULLISH') return s.confidence > 0.7 ? 'bg-emerald-500/30 border-emerald-500/40' : 'bg-emerald-500/15 border-emerald-500/25';
    if (s.sentiment === 'BEARISH') return s.confidence > 0.7 ? 'bg-rose-500/30 border-rose-500/40' : 'bg-rose-500/15 border-rose-500/25';
    return 'bg-zinc-500/15 border-zinc-500/25';
  };

  const getEmoji = (s: SentimentResult) => {
    if (s.sentiment === 'BULLISH') return s.confidence > 0.7 ? '🟢' : '🔵';
    if (s.sentiment === 'BEARISH') return s.confidence > 0.7 ? '🔴' : '🟠';
    return '⚪';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="my-6 rounded-xl border border-white/10 bg-card/20 backdrop-blur-sm overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
        <span className={`text-xs font-bold uppercase tracking-wider ${accent}`}>
          FinBERT Sentiment Analysis
        </span>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-emerald-400">▲ {summary.bullishCount}</span>
          <span className="text-muted-foreground">— {summary.neutralCount}</span>
          <span className="text-rose-400">▼ {summary.bearishCount}</span>
        </div>
      </div>

      {/* Overall Score Bar */}
      <div className="px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground w-20">Sentiment</span>
          <div className="flex-1 h-3 bg-zinc-800 rounded-full overflow-hidden relative">
            <div
              className="absolute inset-y-0 left-1/2 transition-all duration-500"
              style={{
                width: `${Math.abs(summary.overallScore) * 50}%`,
                transform: summary.overallScore >= 0 ? 'none' : 'translateX(-100%)',
                background: summary.overallScore >= 0 ? 'linear-gradient(90deg, #34d399, #10b981)' : 'linear-gradient(90deg, #f87171, #ef4444)',
              }}
            />
            <div className="absolute inset-y-0 left-1/2 w-px bg-zinc-600" />
          </div>
          <span className={`text-sm font-mono font-bold ${summary.overallScore > 0 ? 'text-emerald-400' : summary.overallScore < 0 ? 'text-rose-400' : 'text-zinc-400'}`}>
            {summary.overallScore > 0 ? '+' : ''}{summary.overallScore.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Headlines Grid */}
      <div className="p-3 grid gap-2 max-h-64 overflow-y-auto">
        {summary.results.slice(0, 8).map((r, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`px-3 py-2 rounded-lg border text-xs ${getColor(r)} flex items-start gap-2`}
          >
            <span>{getEmoji(r)}</span>
            <div className="flex-1 min-w-0">
              <p className="text-foreground/80 truncate">{r.text}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`font-mono font-bold ${r.sentiment === 'BULLISH' ? 'text-emerald-400' : r.sentiment === 'BEARISH' ? 'text-rose-400' : 'text-zinc-400'}`}>
                  {r.sentiment}
                </span>
                <span className="text-muted-foreground">({(r.confidence * 100).toFixed(0)}%)</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

export default SentimentHeatmap;
