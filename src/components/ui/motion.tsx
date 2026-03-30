import { motion, AnimatePresence, Variants } from 'framer-motion';
import { forwardRef, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

// Stagger animation for lists
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 },
  },
};

// Page transition variants
export const pageTransition: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
};

export const pageTransitionConfig = {
  duration: 0.3,
  ease: [0.16, 1, 0.3, 1] as any,
};

// Fade variants
export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

// Scale variants
export const scaleVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

// Slide variants
export const slideUpVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

// MotionDiv with common animations
interface MotionDivProps {
  variant?: 'fade' | 'scale' | 'slideUp' | 'stagger';
  delay?: number;
  className?: string;
  children?: React.ReactNode;
}

export const MotionDiv = forwardRef<HTMLDivElement, MotionDivProps>(
  ({ variant = 'fade', delay = 0, className, children, ...props }, ref) => {
    const variants = {
      fade: fadeVariants,
      scale: scaleVariants,
      slideUp: slideUpVariants,
      stagger: staggerItem,
    }[variant];

    return (
      <motion.div
        ref={ref}
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={variants}
        transition={{ delay, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className={cn(className)}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
MotionDiv.displayName = 'MotionDiv';

// AnimatedList component
interface AnimatedListProps {
  children: React.ReactNode;
  className?: string;
}

export function AnimatedList({ children, className }: AnimatedListProps) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}

// PageTransition wrapper
interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageTransition}
      transition={pageTransitionConfig}
      className={cn('w-full', className)}
    >
      {children}
    </motion.div>
  );
}

export { AnimatePresence };
