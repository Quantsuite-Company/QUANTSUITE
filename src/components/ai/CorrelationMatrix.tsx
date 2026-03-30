import { motion } from 'framer-motion';
import type { CorrelationResult } from '@/lib/mlPipeline';

interface CorrelationMatrixProps {
  correlations: CorrelationResult[];
  theme?: 'athena' | 'market' | 'strategy';
}

const themeAccent = { athena: 'text-sky-400', market: 'text-emerald-400', strategy: 'text-cyan-400' };

function getCorrelationColor(corr: number): string {
  if (corr > 0.8) return 'bg-rose-500/40 text-rose-300';
  if (corr > 0.6) return 'bg-orange-500/30 text-orange-300';
  if (corr > 0.3) return 'bg-amber-500/20 text-amber-300';
  if (corr > -0.3) return 'bg-zinc-500/15 text-zinc-400';
  if (corr > -0.6) return 'bg-sky-500/20 text-sky-300';
  return 'bg-emerald-500/30 text-emerald-300';
}

export function CorrelationMatrix({ correlations, theme = 'athena' }: CorrelationMatrixProps) {
  if (!correlations || correlations.length === 0) return null;
  const accent = themeAccent[theme];

  const dangerous = correlations.filter(c => Math.abs(c.correlation) > 0.7);
  const diversifiers = correlations.filter(c => c.correlation < -0.2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="my-6 rounded-xl border border-white/10 bg-card/20 backdrop-blur-sm overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
        <span className={`text-xs font-bold uppercase tracking-wider ${accent}`}>
          Cross-Asset Correlation Matrix
        </span>
        <div className="flex items-center gap-3 text-xs">
          {dangerous.length > 0 && (
            <span className="text-rose-400">⚠ {dangerous.length} high-corr pairs</span>
          )}
          {diversifiers.length > 0 && (
            <span className="text-emerald-400">✓ {diversifiers.length} diversifiers</span>
          )}
        </div>
      </div>

      <div className="p-3 space-y-1.5 max-h-56 overflow-y-auto">
        {correlations.slice(0, 15).map((c, i) => (
          <motion.div
            key={`${c.asset1}-${c.asset2}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.03 }}
            className="flex items-center gap-2"
          >
            <span className="text-xs text-muted-foreground w-24 truncate font-mono">{c.asset1}</span>
            <span className="text-xs text-muted-foreground">↔</span>
            <span className="text-xs text-muted-foreground w-24 truncate font-mono">{c.asset2}</span>
            <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${c.correlation > 0 ? 'bg-rose-500/60' : 'bg-emerald-500/60'}`}
                style={{ width: `${Math.abs(c.correlation) * 100}%` }}
              />
            </div>
            <span className={`text-xs font-mono font-bold w-12 text-right ${getCorrelationColor(c.correlation).split(' ')[1]}`}>
              {c.correlation > 0 ? '+' : ''}{c.correlation.toFixed(2)}
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${getCorrelationColor(c.correlation)}`}>
              {c.strength}
            </span>
          </motion.div>
        ))}
      </div>

      {dangerous.length > 0 && (
        <div className="px-4 py-2 border-t border-white/5 text-xs text-rose-400/80">
          ⚠ High correlation ({'>'}0.7) between {dangerous.map(d => `${d.asset1}-${d.asset2}`).join(', ')} — concentration risk detected
        </div>
      )}
    </motion.div>
  );
}

export default CorrelationMatrix;
