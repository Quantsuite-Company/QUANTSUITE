import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ManualQuizComponent } from '@/components/ManualQuizComponent';
import { 
  Calculator, Activity, GitBranch, BarChart3, TrendingUp, 
  AlertTriangle, Waves, LineChart, Sparkles, ChevronRight,
  BookOpen, Target, Zap, GraduationCap
} from 'lucide-react';

interface QuizOption {
  text: string;
  correct: boolean;
  feedback?: string;
}

interface Quiz {
  question: string;
  options: QuizOption[];
  explanation: string;
  hint?: string;
  correctMessage?: string;
}

interface Model {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  hook: string;
  description: string;
  route: string;
  color: string;
  quiz: Quiz;
}

const models: Model[] = [
  {
    id: 'black-scholes',
    title: 'Black-Scholes',
    icon: Calculator,
    hook: "The gold standard for option pricing",
    description: 'Calculate theoretical fair value of European options using the foundational pricing model.',
    route: '/app',
    color: 'from-blue-500 to-cyan-500',
    quiz: {
      question: "What does Black-Scholes calculate?",
      options: [
        { text: "Theoretical fair value of an option", correct: true },
        { text: "Tomorrow's stock price", correct: false, feedback: "If only it were that easy!" },
        { text: "The best time to buy", correct: false, feedback: "That's market timing, not pricing" },
        { text: "Your risk tolerance", correct: false, feedback: "That's behavioral finance" }
      ],
      explanation: "Black-Scholes calculates theoretical fair value based on stock price, strike, time, volatility, and risk-free rate.",
      correctMessage: "Correct! You understand the core concept."
    }
  },
  {
    id: 'monte-carlo',
    title: 'Monte Carlo',
    icon: BarChart3,
    hook: "Simulate thousands of possible futures",
    description: 'Run probabilistic simulations to understand option behavior across multiple scenarios.',
    route: '/monte-carlo',
    color: 'from-orange-500 to-amber-500',
    quiz: {
      question: "What does Monte Carlo simulation do?",
      options: [
        { text: "Runs thousands of random price paths to estimate probabilities", correct: true },
        { text: "Predicts exact future prices", correct: false, feedback: "It estimates ranges, not exact values" },
        { text: "Guarantees profits", correct: false, feedback: "Nothing guarantees profits!" },
        { text: "Copies casino strategies", correct: false, feedback: "Different Monte Carlo!" }
      ],
      explanation: "Monte Carlo simulates thousands of possible outcomes to give probability distributions.",
      correctMessage: "You understand probability-based pricing!"
    }
  },
  {
    id: 'binomial-tree',
    title: 'Binomial Tree',
    icon: GitBranch,
    hook: "Map every possible price path",
    description: 'Visualize option value at each step with discrete time modeling.',
    route: '/binomial-tree',
    color: 'from-emerald-500 to-green-500',
    quiz: {
      question: "What's the main advantage of Binomial Tree over Black-Scholes?",
      options: [
        { text: "Can handle early exercise (American options)", correct: true },
        { text: "It's faster", correct: false, feedback: "It's actually slower with more steps" },
        { text: "Looks better", correct: false, feedback: "Style points don't price options!" },
        { text: "Needs no volatility", correct: false, feedback: "Still requires volatility input" }
      ],
      explanation: "Binomial Trees can price American options by evaluating early exercise at each node.",
      correctMessage: "You understand when to use binomial models!"
    }
  },
  {
    id: 'advanced-greeks',
    title: 'Advanced Greeks',
    icon: Activity,
    hook: "Master second-order sensitivities",
    description: 'Go beyond Delta and Gamma to understand Vanna, Charm, and higher-order Greeks.',
    route: '/advanced-greeks',
    color: 'from-violet-500 to-purple-500',
    quiz: {
      question: "What does Vanna measure?",
      options: [
        { text: "How Delta changes when volatility changes", correct: true },
        { text: "How fast you lose money", correct: false, feedback: "That's called bad trading" },
        { text: "Greek goddess of options", correct: false, feedback: "Wrong mythology!" },
        { text: "How Gamma changes with time", correct: false, feedback: "That's Charm" }
      ],
      explanation: "Vanna = ∂Delta/∂IV. Critical for understanding volatility exposure.",
      correctMessage: "You speak advanced Greek!"
    }
  },
  {
    id: 'volatility-solver',
    title: 'Volatility Solver',
    icon: TrendingUp,
    hook: "Extract implied volatility from prices",
    description: 'Reverse-engineer market expectations from option premiums.',
    route: '/volatility-solver',
    color: 'from-sky-500 to-blue-500',
    quiz: {
      question: "What does Implied Volatility tell you?",
      options: [
        { text: "Market's expectation of future price swings", correct: true },
        { text: "Yesterday's actual movements", correct: false, feedback: "That's historical volatility" },
        { text: "Exact future price", correct: false, feedback: "IV shows range, not exact price" },
        { text: "Your emotional state", correct: false, feedback: "Though they correlate..." }
      ],
      explanation: "IV is the market's forecast embedded in option prices. High IV = expensive options.",
      correctMessage: "You can read the market's mind!"
    }
  },
  {
    id: 'arbitrage-detector',
    title: 'Arbitrage Detector',
    icon: AlertTriangle,
    hook: "Find risk-free profit opportunities",
    description: 'Scan for put-call parity violations and mispriced options.',
    route: '/arbitrage-detector',
    color: 'from-rose-500 to-red-500',
    quiz: {
      question: "What is Put-Call Parity?",
      options: [
        { text: "Mathematical relationship preventing arbitrage between calls and puts", correct: true },
        { text: "Buying equal puts and calls", correct: false, feedback: "That's a straddle" },
        { text: "Option equality movement", correct: false, feedback: "Not a thing" },
        { text: "Puts always equal calls", correct: false, feedback: "They're related but not equal" }
      ],
      explanation: "Put-Call Parity: C - P = S - K*e^(-rT). Violations create arbitrage opportunities.",
      correctMessage: "Now go find those opportunities!"
    }
  },
  {
    id: 'svi-model',
    title: 'SVI Model',
    icon: Waves,
    hook: "Smooth volatility surfaces",
    description: 'Create arbitrage-free volatility surfaces for professional pricing.',
    route: '/svi',
    color: 'from-teal-500 to-cyan-500',
    quiz: {
      question: "What problem does SVI solve?",
      options: [
        { text: "Creates smooth, arbitrage-free volatility surfaces", correct: true },
        { text: "Predicts stock prices", correct: false, feedback: "SVI is about volatility, not prices" },
        { text: "Calculates Greeks", correct: false, feedback: "That's a different tool" },
        { text: "Times entries", correct: false, feedback: "That's technical analysis" }
      ],
      explanation: "SVI parametrizes the volatility smile, ensuring smooth interpolation across strikes.",
      correctMessage: "You understand volatility surface modeling!"
    }
  },
  {
    id: 'technical-indicators',
    title: 'Technical Indicators',
    icon: LineChart,
    hook: "RSI, MACD, Bollinger and more",
    description: 'Combine price action with momentum and volatility signals.',
    route: '/technical-indicators',
    color: 'from-indigo-500 to-violet-500',
    quiz: {
      question: "What does RSI measure?",
      options: [
        { text: "Whether an asset is overbought or oversold", correct: true },
        { text: "Exact future price target", correct: false, feedback: "RSI shows momentum, not targets" },
        { text: "Company fundamentals", correct: false, feedback: "That's fundamental analysis" },
        { text: "Trading volume only", correct: false, feedback: "RSI uses price, not just volume" }
      ],
      explanation: "RSI (0-100) indicates momentum: >70 overbought, <30 oversold.",
      correctMessage: "You can read momentum signals!"
    }
  }
];

export default function EducationalInsight() {
  const navigate = useNavigate();
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [quizCompleted, setQuizCompleted] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Header - removed borders */}
      <div className="bg-card/20">
        <div className="container mx-auto px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4"
          >
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
              <GraduationCap className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Learning Center</h1>
              <p className="text-muted-foreground mt-1">Master quantitative finance models</p>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {!selectedModel ? (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Model Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {models.map((model, index) => (
                  <motion.div
                    key={model.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: -4, scale: 1.02 }}
                    onClick={() => {
                      setSelectedModel(model);
                      setQuizCompleted(false);
                    }}
                    className="group cursor-pointer"
                  >
                    {/* Card with no border, subtle background */}
                    <div className="relative h-full rounded-xl bg-muted/20 p-6 transition-all duration-300 hover:bg-muted/40">
                      {/* Gradient accent line */}
                      <div className={`absolute top-0 left-0 right-0 h-0.5 rounded-t-xl bg-gradient-to-r ${model.color} opacity-40 group-hover:opacity-80 transition-opacity`} />
                      
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg bg-gradient-to-br ${model.color} bg-opacity-10`}>
                          <model.icon className="w-6 h-6 text-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground text-lg mb-1">{model.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">{model.hook}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Quick Start Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                {[
                  { icon: BookOpen, title: 'Beginner', desc: 'Start with Black-Scholes', route: '/app' },
                  { icon: Target, title: 'Intermediate', desc: 'Explore Monte Carlo', route: '/monte-carlo' },
                  { icon: Zap, title: 'Advanced', desc: 'Master Greeks', route: '/advanced-greeks' },
                ].map((item, i) => (
                  <motion.div
                    key={item.title}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => navigate(item.route)}
                    className="p-6 rounded-xl bg-muted/20 hover:bg-muted/30 cursor-pointer transition-all group"
                  >
                    <item.icon className="w-8 h-8 text-primary mb-3" />
                    <h4 className="font-semibold text-foreground mb-1">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {/* Back Button */}
              <Button
                variant="ghost"
                onClick={() => setSelectedModel(null)}
                className="mb-6 text-muted-foreground hover:text-foreground"
              >
                ← Back to Models
              </Button>

              {/* Model Detail */}
              <div className="space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4">
                  <div className={`p-4 rounded-xl bg-gradient-to-br ${selectedModel.color}`}>
                    <selectedModel.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-foreground">{selectedModel.title}</h2>
                    <p className="text-muted-foreground">{selectedModel.description}</p>
                  </div>
                  <Button
                    onClick={() => navigate(selectedModel.route)}
                  >
                    Try It Live
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>

                {/* Quiz */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <ManualQuizComponent 
                    quiz={selectedModel.quiz}
                    onComplete={(correct) => setQuizCompleted(correct)}
                  />
                </motion.div>

                {/* Next Steps */}
                {quizCompleted && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/30"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <Sparkles className="w-6 h-6 text-emerald-500" />
                      <h3 className="font-semibold text-foreground">Ready to apply your knowledge?</h3>
                    </div>
                    <Button
                      onClick={() => navigate(selectedModel.route)}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      Launch {selectedModel.title}
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
