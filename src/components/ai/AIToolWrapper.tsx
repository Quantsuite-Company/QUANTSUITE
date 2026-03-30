import { useState, ReactNode } from 'react';
import { SpiralAnimation } from '@/components/ui/spiral-animation';
import { AnimatedAIChat } from '@/components/ui/animated-ai-chat';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Zap, ArrowLeft } from 'lucide-react';

interface CommandSuggestion {
    icon: ReactNode;
    label: string;
    description: string;
    prefix: string;
}

type ToolTheme = 'athena' | 'market' | 'strategy' | 'quant' | 'default';

interface AIToolWrapperProps {
    title: string;
    subtitle: string;
    placeholder: string;
    thinkingLabel?: string;
    commandSuggestions?: CommandSuggestion[];
    onSendMessage: (message: string, attachments?: string[]) => Promise<void>;
    isProcessing?: boolean;
    responseContent?: ReactNode;
    showResponse?: boolean;
    responseBadge?: {
        icon?: ReactNode;
        label: string;
    };
    headerContent?: ReactNode;
    theme?: ToolTheme;
    onNewQuery?: () => void;
}

const themeGradients: Record<ToolTheme, string> = {
    athena: 'from-violet-500/10 via-purple-500/5 to-fuchsia-500/10',
    market: 'from-teal-500/10 via-emerald-500/5 to-green-500/10',
    strategy: 'from-cyan-500/10 via-blue-500/5 to-indigo-500/10',
    quant: 'from-amber-500/10 via-orange-500/5 to-yellow-500/10',
    default: 'from-primary/5 via-secondary/5 to-accent/5',
};

export function AIToolWrapper({
    title,
    subtitle,
    placeholder,
    thinkingLabel = "Analyzing",
    commandSuggestions,
    onSendMessage,
    isProcessing = false,
    responseContent,
    showResponse = false,
    responseBadge,
    headerContent,
    theme = 'default',
    onNewQuery,
}: AIToolWrapperProps) {
    const [showIntro, setShowIntro] = useState(true);
    const [showChat, setShowChat] = useState(false);

    const handleEnter = () => {
        setShowIntro(false);
        setShowChat(true);
    };

    const handleNewQuery = () => {
        setShowChat(true);
        onNewQuery?.();
    };

    // When showResponse becomes true, hide chat
    const currentView = showResponse ? 'response' : (showChat ? 'chat' : 'intro');

    return (
        <div className="min-h-screen bg-background">
            <AnimatePresence mode="wait">
                {currentView === 'intro' && (
                    <motion.div
                        key="intro"
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <SpiralAnimation onEnter={handleEnter} />
                    </motion.div>
                )}
                
                {currentView === 'chat' && (
                    <motion.div
                        key="chat"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="relative"
                    >
                        <AnimatedAIChat
                            title={title}
                            subtitle={subtitle}
                            placeholder={placeholder}
                            thinkingLabel={thinkingLabel}
                            commandSuggestions={commandSuggestions}
                            onSendMessage={onSendMessage}
                            isProcessing={isProcessing}
                            headerContent={headerContent}
                        />
                    </motion.div>
                )}
                
                {currentView === 'response' && responseContent && (
                    <motion.div
                        key="response"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="relative min-h-screen"
                    >
                        {/* Subtle background gradient based on theme */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${themeGradients[theme]} opacity-50 pointer-events-none`} />
                        
                        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-8">
                            {/* Header */}
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-8"
                            >
                                {responseBadge && (
                                    <div className="flex items-center gap-2 mb-3">
                                        {responseBadge.icon || <Sparkles className="w-4 h-4 text-primary" />}
                                        <span className="text-sm font-medium text-primary">{responseBadge.label}</span>
                                    </div>
                                )}
                                <h1 className="text-2xl font-semibold text-foreground mb-2">{title}</h1>
                                <p className="text-muted-foreground">{subtitle}</p>
                            </motion.div>

                            {/* Main content */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.1 }}
                            >
                                {responseContent}
                            </motion.div>

                            {/* New Query Button */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="mt-12 pt-6 border-t border-border/20"
                            >
                                <button
                                    onClick={handleNewQuery}
                                    className="group flex items-center gap-2 px-5 py-3 rounded-xl bg-card/30 backdrop-blur-sm border border-border/30 text-muted-foreground hover:text-foreground hover:bg-card/50 transition-all duration-300 mx-auto"
                                >
                                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                    <span className="text-sm font-medium">Ask another question</span>
                                </button>
                            </motion.div>

                            {/* Footer */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.6 }}
                                className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground/50"
                            >
                                <Zap className="w-3 h-3" />
                                <span>Powered by QuantSuite Intelligence</span>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default AIToolWrapper;
