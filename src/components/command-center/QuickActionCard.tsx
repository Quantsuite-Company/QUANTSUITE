import { motion } from 'framer-motion';
import { ArrowRight, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickActionCardProps {
  icon: LucideIcon;
  label: string;
  description: string;
  color: string;
  onClick: () => void;
  index: number;
}

const colorStyles: Record<string, { border: string; text: string; icon: string }> = {
  cyan: {
    border: 'hover:border-cyan-500/40',
    text: 'group-hover:text-cyan-400',
    icon: 'text-cyan-400',
  },
  amber: {
    border: 'hover:border-amber-500/40',
    text: 'group-hover:text-amber-400',
    icon: 'text-amber-400',
  },
  violet: {
    border: 'hover:border-violet-500/40',
    text: 'group-hover:text-violet-400',
    icon: 'text-violet-400',
  },
  emerald: {
    border: 'hover:border-emerald-500/40',
    text: 'group-hover:text-emerald-400',
    icon: 'text-emerald-400',
  },
};

export function QuickActionCard({ 
  icon: Icon, 
  label, 
  description, 
  color, 
  onClick, 
  index 
}: QuickActionCardProps) {
  const styles = colorStyles[color] || colorStyles.cyan;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        delay: 0.2 + index * 0.05,
        duration: 0.3,
        ease: [0.16, 1, 0.3, 1]
      }}
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className={cn(
        "group relative rounded-xl cursor-pointer",
        "bg-card/30 backdrop-blur-sm border border-border/30",
        "hover:bg-card/50 hover:border-border/60 transition-all duration-200",
        styles.border
      )}
    >
      <div className="p-5">
        {/* Content row - icon inline with text */}
        <div className="flex items-start gap-3">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 3 }}
            transition={{ duration: 0.2 }}
          >
            <Icon className={cn("w-5 h-5 mt-0.5 shrink-0", styles.icon)} />
          </motion.div>
          <div className="flex-1 min-w-0">
            <h3 className={cn(
              "font-semibold text-foreground transition-colors",
              styles.text
            )}>
              {label}
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {description}
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all shrink-0 mt-1" />
        </div>
      </div>
    </motion.div>
  );
}
