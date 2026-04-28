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
                        <div className={`absolute inset-0 bg-gradient-to-br ${themeGradients[theme]} opacity-30 pointer-events-none`} />
                        
                        <div className="relative z-10 w-full max-w-[85rem] mx-auto px-4 py-8 md:py-12">
                            <div className="bg-[#030303]/90 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-2xl p-8 md:p-12 relative overflow-hidden">
                                <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${themeGradients[theme]} opacity-80`} />
                                
                                {/* Header */}
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mb-10 pb-6 border-b border-white/5 flex gap-4 md:gap-8 items-start"
                                >
                                    {responseBadge && (
                                        <div className="w-16 h-16 shrink-0 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10 shadow-lg">
                                            {responseBadge.icon || <Sparkles className="w-8 h-8 opacity-80" />}
                                        </div>
                                    )}
                                    <div>
                                        <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60 mb-2 tracking-tight uppercase" style={{ fontVariant: 'small-caps' }}>{title}</h1>
                                        <p className="text-muted-foreground tracking-wide">{subtitle}</p>
                                    </div>
                                    <div className="ml-auto hidden md:block text-right">
                                        <div className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Target Protocol</div>
                                        <div className="text-xs font-mono font-bold uppercase tracking-wider">{theme} // ACTIVE</div>
                                    </div>
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
                                    className="mt-16 pt-8 border-t border-white/10"
                                >
                                    <button
                                        onClick={handleNewQuery}
                                        className="group flex items-center gap-3 px-6 py-4 rounded-xl bg-white/[0.03] border border-white/10 hover:border-white/20 hover:bg-white/[0.05] transition-all duration-300 mx-auto"
                                    >
                                        <ArrowLeft className="w-5 h-5 text-white/50 group-hover:-translate-x-1 group-hover:text-white transition-all" />
                                        <span className="text-sm font-mono font-bold tracking-widest uppercase text-white/70 group-hover:text-white">Init New Query</span>
                                    </button>
                                </motion.div>

                                {/* Footer */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.6 }}
                                    className="mt-12 flex items-center justify-center gap-2 text-[10px] font-mono tracking-widest uppercase text-white/30"
                                >
                                    <Zap className="w-3 h-3" />
                                    <span>Powered by QuantSuite Intelligence Layer</span>
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default AIToolWrapper;
