import { motion, HTMLMotionProps } from 'framer-motion';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps extends Omit<HTMLMotionProps<'div'>, 'ref'> {
  variant?: 'default' | 'light' | 'dark' | 'bordered';
  hover?: boolean;
  glow?: boolean;
}

const GlassCardInner = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = 'default', hover = false, glow = false, children, ...props }, ref) => {
    const baseClasses = 'backdrop-blur-[16px] rounded-lg transition-all duration-300';
    
    // Removed neon white borders - now using subtle, muted borders
    const variantClasses = {
      default: 'bg-card/30 border border-border/20',
      light: 'bg-card/40 border border-border/30',
      dark: 'bg-background/40 border border-border/20',
      bordered: 'bg-card/30 border border-primary/20',
    };
    
    const hoverClasses = hover
      ? 'hover:bg-card/50 hover:border-border/40 hover:shadow-lg hover:shadow-primary/5 hover:scale-[1.01] cursor-pointer'
      : '';
    
    // Removed bright cyan glow, using subtle shadows instead
    const glowClasses = glow
      ? 'shadow-lg shadow-primary/5'
      : 'shadow-md shadow-black/20';

    return (
      <motion.div
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          hoverClasses,
          glowClasses,
          className
        )}
        whileHover={hover ? { scale: 1.02 } : undefined}
        whileTap={hover ? { scale: 0.98 } : undefined}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

GlassCardInner.displayName = 'GlassCardInner';

export const GlassCard = motion.create(GlassCardInner);
GlassCard.displayName = 'GlassCard';
