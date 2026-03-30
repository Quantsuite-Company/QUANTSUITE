import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { 
  Target, 
  BarChart3, 
  ListOrdered, 
  ShieldAlert, 
  TrendingUp,
  Search,
  Lightbulb,
  ArrowRightCircle,
  Activity,
  Zap,
  AlertTriangle,
  LucideIcon,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Badge } from '@/components/ui/badge';
import { sectionIconConfig, type SectionIconType } from './PremiumResponseParser';

interface StrategySectionProps {
  title: string;
  content: string;
  icon: SectionIconType;
  delay?: number;
  showBadge?: boolean;
  verified?: boolean;
}

export function StrategySection({ 
  title, 
  content, 
  icon, 
  delay = 0,
  showBadge = false,
  verified = false
}: StrategySectionProps) {
  const config = sectionIconConfig[icon] || sectionIconConfig.overview;
  const { Icon, gradient, bgGlow } = config;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="group relative"
    >
      {/* Animated glow effect on hover */}
      <div className={`absolute inset-0 ${bgGlow} rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      
      <div className="relative p-5 rounded-2xl bg-card/40 backdrop-blur-xl border border-border/40 hover:border-border/60 transition-all duration-300 overflow-hidden">
        {/* Premium corner accent */}
        <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${gradient} opacity-5 blur-2xl`} />
        
        {/* Header with icon and badges */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            {/* Icon with gradient background and pulse animation */}
            <div className={`relative p-2.5 rounded-xl bg-gradient-to-br ${gradient} shadow-lg group-hover:shadow-xl transition-shadow`}>
              <Icon className="w-5 h-5 text-white" />
              {/* Subtle pulse ring */}
              <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${gradient} opacity-50 animate-ping`} style={{ animationDuration: '3s' }} />
            </div>
            <div>
              <h3 className={`text-base font-semibold bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
                {title}
              </h3>
              {showBadge && (
                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 mt-0.5 ${config.badgeColor}`}>
                  {icon.charAt(0).toUpperCase() + icon.slice(1)}
                </Badge>
              )}
            </div>
          </div>
          
          {/* Verified badge */}
          {verified && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: delay + 0.3, type: 'spring' }}
              className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30"
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span className="text-[10px] text-emerald-400 font-medium">Verified</span>
            </motion.div>
          )}
        </div>
        
        {/* Content with styled markdown */}
        <div className="prose prose-sm dark:prose-invert max-w-none prose-p:text-muted-foreground prose-p:leading-relaxed prose-li:text-muted-foreground prose-strong:text-foreground prose-headings:text-foreground prose-ul:my-2 prose-li:my-0.5">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>
    </motion.div>
  );
}

// Metric Badge Component with enhanced styling
interface MetricBadgeProps {
  label: string;
  value: string;
  type?: 'default' | 'risk' | 'return' | 'time';
}

export function MetricBadge({ label, value, type = 'default' }: MetricBadgeProps) {
  const getTypeStyles = () => {
    switch (type) {
      case 'risk':
        const riskLevel = value.toLowerCase();
        if (riskLevel.includes('low') || riskLevel.includes('minimal')) {
          return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
        }
        if (riskLevel.includes('medium') || riskLevel.includes('moderate')) {
          return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
        }
        if (riskLevel.includes('high') || riskLevel.includes('aggressive')) {
          return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
        }
        return 'bg-muted/50 text-muted-foreground border-border/50';
      case 'return':
        const isPositive = value.includes('+') || (!value.includes('-') && parseFloat(value) > 0);
        return isPositive 
          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
          : 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      case 'time':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-muted/50 text-foreground border-border/50';
    }
  };

  return (
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-sm ${getTypeStyles()}`}
    >
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </motion.div>
  );
}

// Parse Key Metrics text into structured badges
export function parseKeyMetrics(metricsText: string): MetricBadgeProps[] {
  const badges: MetricBadgeProps[] = [];
  
  const returnMatch = metricsText.match(/(?:Expected\s+)?Return:\s*([^\n,]+)/i);
  if (returnMatch) {
    badges.push({ label: 'Return', value: returnMatch[1].trim(), type: 'return' });
  }
  
  const riskMatch = metricsText.match(/Risk\s+Level:\s*([^\n,]+)/i);
  if (riskMatch) {
    badges.push({ label: 'Risk', value: riskMatch[1].trim(), type: 'risk' });
  }
  
  const timeMatch = metricsText.match(/(?:Time\s+)?Horizon:\s*([^\n,]+)/i);
  if (timeMatch) {
    badges.push({ label: 'Horizon', value: timeMatch[1].trim(), type: 'time' });
  }
  
  const positionMatch = metricsText.match(/Position\s+Size:\s*([^\n,]+)/i);
  if (positionMatch) {
    badges.push({ label: 'Position', value: positionMatch[1].trim(), type: 'default' });
  }
  
  const winRateMatch = metricsText.match(/Win\s+Rate:\s*([^\n,]+)/i);
  if (winRateMatch) {
    badges.push({ label: 'Win Rate', value: winRateMatch[1].trim(), type: 'return' });
  }

  const sharpeMatch = metricsText.match(/Sharpe(?:\s+Ratio)?:\s*([^\n,]+)/i);
  if (sharpeMatch) {
    badges.push({ label: 'Sharpe', value: sharpeMatch[1].trim(), type: 'return' });
  }

  const drawdownMatch = metricsText.match(/(?:Max\s+)?Drawdown:\s*([^\n,]+)/i);
  if (drawdownMatch) {
    badges.push({ label: 'Drawdown', value: drawdownMatch[1].trim(), type: 'risk' });
  }
  
  return badges;
}

// Key Metrics Bar Component
interface KeyMetricsBarProps {
  metricsText: string;
  delay?: number;
}

export function KeyMetricsBar({ metricsText, delay = 0 }: KeyMetricsBarProps) {
  const badges = parseKeyMetrics(metricsText);
  
  if (badges.length === 0) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/5 via-cyan-500/5 to-violet-500/5 backdrop-blur-sm border border-border/30"
    >
      <div className="flex flex-wrap gap-3 justify-center">
        {badges.map((badge, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: delay + 0.05 * idx }}
          >
            <MetricBadge {...badge} />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// Premium Section Grid Component for displaying multiple sections
interface PremiumSectionGridProps {
  sections: { title: string; content: string; icon: SectionIconType }[];
  baseDelay?: number;
  columns?: 1 | 2;
  showVerifiedBadge?: boolean;
}

export function PremiumSectionGrid({ 
  sections, 
  baseDelay = 0.2, 
  columns = 2,
  showVerifiedBadge = false
}: PremiumSectionGridProps) {
  const gridClass = columns === 2 ? 'grid gap-4 md:grid-cols-2' : 'space-y-4';
  
  return (
    <div className={gridClass}>
      {sections.map((section, idx) => (
        <StrategySection
          key={idx}
          title={section.title}
          content={section.content}
          icon={section.icon}
          delay={baseDelay + idx * 0.08}
          verified={showVerifiedBadge && idx === 0}
        />
      ))}
    </div>
  );
}

// Premium Footer with QuantSuite branding
export function PremiumFooter({ delay = 0.5 }: { delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay }}
      className="flex items-center justify-center gap-2 pt-6 pb-2"
    >
      <Sparkles className="w-3 h-3 text-primary/50" />
      <span className="text-xs text-muted-foreground/50">Powered by QuantSuite Intelligence</span>
    </motion.div>
  );
}

export default StrategySection;
