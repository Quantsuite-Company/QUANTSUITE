import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles, Shield, Zap, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

// Tool theme configurations
type ToolTheme = 'strategy' | 'athena' | 'market' | 'quant' | 'default';

const toolThemes: Record<ToolTheme, { gradient: string; accent: string; glow: string }> = {
  strategy: {
    gradient: 'from-cyan-500/10 via-blue-500/10 to-indigo-500/10',
    accent: 'text-cyan-400',
    glow: 'bg-cyan-500/10'
  },
  athena: {
    gradient: 'from-violet-500/10 via-purple-500/10 to-fuchsia-500/10',
    accent: 'text-violet-400',
    glow: 'bg-violet-500/10'
  },
  market: {
    gradient: 'from-teal-500/10 via-emerald-500/10 to-green-500/10',
    accent: 'text-teal-400',
    glow: 'bg-teal-500/10'
  },
  quant: {
    gradient: 'from-amber-500/10 via-orange-500/10 to-yellow-500/10',
    accent: 'text-amber-400',
    glow: 'bg-amber-500/10'
  },
  default: {
    gradient: 'from-primary/5 via-secondary/5 to-accent/5',
    accent: 'text-primary',
    glow: 'bg-primary/10'
  }
};

interface AIResponseViewProps {
    title: string;
    subtitle?: string;
    badge?: {
        icon?: ReactNode;
        label: string;
    };
    children: ReactNode;
    onNewQuery?: () => void;
    theme?: ToolTheme;
    isLoading?: boolean;
}

export function AIResponseView({ 
    title, 
    subtitle, 
    badge,
    children,
    onNewQuery,
    theme = 'default',
    isLoading = false
}: AIResponseViewProps) {
    const currentTheme = toolThemes[theme];

    return (
        <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
            {/* Animated gradient orbs - themed to tool */}
            <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
                <div className={`absolute top-0 left-1/4 w-96 h-96 ${currentTheme.glow} rounded-full mix-blend-normal filter blur-[128px] animate-pulse`} />
                <div className={`absolute bottom-0 right-1/4 w-96 h-96 ${currentTheme.glow} rounded-full mix-blend-normal filter blur-[128px] animate-pulse delay-700`} />
                <div className="absolute top-1/4 right-1/3 w-64 h-64 bg-fuchsia-500/5 rounded-full mix-blend-normal filter blur-[96px] animate-pulse delay-1000" />
            </div>

            <div className="relative z-10 w-full max-w-4xl mx-auto p-6 md:p-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="space-y-8"
                >
                    {/* Premium Header */}
                    <div className="flex items-center justify-between">
                        <motion.div 
                            className="flex items-center gap-4"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <div className="space-y-1">
                                <h1 className={`text-2xl md:text-3xl font-medium tracking-tight bg-clip-text text-transparent bg-gradient-to-r ${currentTheme.gradient.replace('/10', '/80').replace('/5', '/60')}`}>
                                    {title}
                                </h1>
                                {subtitle && (
                                    <p className="text-sm text-muted-foreground">{subtitle}</p>
                                )}
                            </div>
                        </motion.div>
                        
                        {badge && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.2 }}
                            >
                                <Badge 
                                    variant="secondary" 
                                    className={`gap-1.5 bg-card/50 backdrop-blur-sm border-border/50 ${currentTheme.accent}`}
                                >
                                    {badge.icon || <Sparkles className="h-3 w-3" />}
                                    {badge.label}
                                </Badge>
                            </motion.div>
                        )}
                    </div>

                    {/* Loading State */}
                    {isLoading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-24 w-full rounded-2xl" />
                            <div className="grid gap-4 md:grid-cols-2">
                                <Skeleton className="h-40 rounded-2xl" />
                                <Skeleton className="h-40 rounded-2xl" />
                            </div>
                            <Skeleton className="h-32 rounded-2xl" />
                        </div>
                    ) : (
                        /* Content area */
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15, duration: 0.4 }}
                        >
                            {children}
                        </motion.div>
                    )}

                    {/* Footer with branding and new query */}
                    <motion.div
                        className="flex flex-col items-center gap-4 pt-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                    >
                        {/* Powered by badge */}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground/50">
                            <Zap className="w-3 h-3" />
                            <span>Powered by QuantSuite Intelligence</span>
                        </div>

                        {/* New Query Button */}
                        {onNewQuery && (
                            <button
                                onClick={onNewQuery}
                                className="group flex items-center gap-2 px-6 py-3 rounded-xl bg-card/30 backdrop-blur-xl border border-border/30 text-muted-foreground hover:text-foreground hover:bg-card/50 transition-all duration-300"
                            >
                                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                <span className="text-sm font-medium">Ask another question</span>
                            </button>
                        )}
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
}

// Reusable card component for response content with premium styling
interface ResponseCardProps {
    children: ReactNode;
    className?: string;
    delay?: number;
    variant?: 'default' | 'accent' | 'glow';
}

export function ResponseCard({ children, className = '', delay = 0, variant = 'default' }: ResponseCardProps) {
    const variantStyles = {
        default: 'bg-card/30 border-border/30',
        accent: 'bg-card/40 border-primary/20',
        glow: 'bg-card/30 border-border/30 shadow-lg shadow-primary/5'
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4 }}
            className={`p-6 rounded-2xl backdrop-blur-xl border ${variantStyles[variant]} ${className}`}
        >
            {children}
        </motion.div>
    );
}

// Enhanced Metrics bar component
interface MetricItemProps {
    label: string;
    value: string | number;
    valueClassName?: string;
    icon?: ReactNode;
}

export function MetricItem({ label, value, valueClassName = 'text-foreground', icon }: MetricItemProps) {
    return (
        <div className="flex items-center gap-3">
            {icon && (
                <div className="p-2 rounded-lg bg-muted/30">
                    {icon}
                </div>
            )}
            <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">{label}</span>
                <span className={`text-sm md:text-base font-semibold ${valueClassName}`}>{value}</span>
            </div>
        </div>
    );
}

interface MetricsBarProps {
    metrics: MetricItemProps[];
    delay?: number;
    theme?: ToolTheme;
}

export function MetricsBar({ metrics, delay = 0.1, theme = 'default' }: MetricsBarProps) {
    const currentTheme = toolThemes[theme];
    
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className={`p-4 rounded-xl bg-gradient-to-r ${currentTheme.gradient} backdrop-blur-sm border border-border/30`}
        >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {metrics.map((metric, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: delay + 0.05 * idx }}
                    >
                        <MetricItem {...metric} />
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}

// Premium verified badge
export function VerifiedBadge({ delay = 0 }: { delay?: number }) {
    return (
        <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30"
        >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs font-medium text-emerald-400">QuantSuite Verified</span>
        </motion.div>
    );
}

// Status indicator component
export function StatusIndicator({ status, label }: { status: 'success' | 'warning' | 'error' | 'info'; label: string }) {
    const statusColors = {
        success: 'bg-emerald-500',
        warning: 'bg-amber-500',
        error: 'bg-rose-500',
        info: 'bg-blue-500'
    };

    return (
        <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${statusColors[status]} animate-pulse`} />
            <span className="text-xs text-muted-foreground">{label}</span>
        </div>
    );
}

export default AIResponseView;
