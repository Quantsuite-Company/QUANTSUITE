import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useQuantSuiteStore } from '@/stores/quantsuiteStore';
import { TrendingUp, BarChart3, Shield, Zap, ArrowRight, Check } from 'lucide-react';

type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

interface Goal {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const GOALS: Goal[] = [
  { id: 'portfolio', label: 'Build a Portfolio', icon: <BarChart3 className="w-5 h-5" />, description: 'Construct & optimize holdings' },
  { id: 'trading', label: 'Active Trading', icon: <TrendingUp className="w-5 h-5" />, description: 'Signals, screeners & strategies' },
  { id: 'risk', label: 'Risk Management', icon: <Shield className="w-5 h-5" />, description: 'VaR, Greeks & stress testing' },
  { id: 'quant', label: 'Quant Research', icon: <Zap className="w-5 h-5" />, description: 'Alpha signals & backtesting' },
];

const EXPERIENCE_LEVELS: { level: ExperienceLevel; label: string; description: string }[] = [
  { level: 'beginner', label: 'Getting Started', description: 'New to quantitative finance' },
  { level: 'intermediate', label: 'Experienced Trader', description: 'Comfortable with options & portfolios' },
  { level: 'advanced', label: 'Quant Professional', description: 'Institutional-grade tools & models' },
];

export function OnboardingWizard({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [selectedLevel, setSelectedLevel] = useState<ExperienceLevel | null>(null);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const { setExperienceLevel, completeOnboarding, setUserGoals } = useQuantSuiteStore();

  const toggleGoal = (id: string) => {
    setSelectedGoals(prev =>
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  };

  const handleFinish = () => {
    if (selectedLevel) setExperienceLevel(selectedLevel);
    if (selectedGoals.length > 0) setUserGoals(selectedGoals);
    completeOnboarding();
    onComplete();
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -30 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-xl"
      >
        <div className="w-full max-w-lg px-6">
          {/* Progress dots */}
          <div className="flex justify-center gap-2 mb-10">
            {[0, 1].map(i => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step ? 'w-8 bg-primary' : i < step ? 'w-4 bg-primary/50' : 'w-4 bg-muted'
                }`}
              />
            ))}
          </div>

          {step === 0 && (
            <div className="space-y-8">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-foreground">Welcome to QuantSuite</h2>
                <p className="text-muted-foreground">Your personal hedge fund starts here. What's your experience level?</p>
              </div>

              <div className="space-y-3">
                {EXPERIENCE_LEVELS.map(({ level, label, description }) => (
                  <button
                    key={level}
                    onClick={() => setSelectedLevel(level)}
                    className={`w-full p-4 rounded-xl border text-left transition-all duration-200 ${
                      selectedLevel === level
                        ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                        : 'border-border/50 bg-card/30 hover:border-border hover:bg-card/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">{label}</p>
                        <p className="text-sm text-muted-foreground">{description}</p>
                      </div>
                      {selectedLevel === level && (
                        <Check className="w-5 h-5 text-primary" />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <Button
                onClick={() => setStep(1)}
                disabled={!selectedLevel}
                className="w-full"
                size="lg"
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-8">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-foreground">What's your focus?</h2>
                <p className="text-muted-foreground">Select one or more goals — we'll tailor your dashboard.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {GOALS.map(goal => (
                  <button
                    key={goal.id}
                    onClick={() => toggleGoal(goal.id)}
                    className={`p-4 rounded-xl border text-left transition-all duration-200 ${
                      selectedGoals.includes(goal.id)
                        ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                        : 'border-border/50 bg-card/30 hover:border-border hover:bg-card/50'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className={`${selectedGoals.includes(goal.id) ? 'text-primary' : 'text-muted-foreground'}`}>
                        {goal.icon}
                      </div>
                      <p className="font-medium text-foreground text-sm">{goal.label}</p>
                      <p className="text-xs text-muted-foreground">{goal.description}</p>
                    </div>
                  </button>
                ))}
              </div>

              <Button
                onClick={handleFinish}
                disabled={selectedGoals.length === 0}
                className="w-full"
                size="lg"
              >
                Launch QuantSuite
                <Zap className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
