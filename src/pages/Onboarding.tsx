import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Cpu, TrendingUp, TrendingDown, Bot, Shield, Zap, ArrowRight, Check } from 'lucide-react';

const AVATARS = [
  { id: 'cyber_quant', name: 'Cyber Quant', icon: Cpu, color: 'from-cyan-500 to-blue-500' },
  { id: 'bull_market', name: 'Bull Rider', icon: TrendingUp, color: 'from-emerald-500 to-teal-500' },
  { id: 'bear_hunter', name: 'Bear Hunter', icon: TrendingDown, color: 'from-orange-500 to-red-500' },
  { id: 'algo_bot', name: 'Algo Bot', icon: Bot, color: 'from-purple-500 to-pink-500' },
];

const QUESTIONS = [
  {
    id: 'style',
    question: 'What is your primary trading style?',
    options: [
      { id: 'day', label: 'Day Trader', desc: 'Fast-paced, intra-day execution' },
      { id: 'swing', label: 'Swing Trader', desc: 'Capturing multi-day momentum' },
      { id: 'quant', label: 'HFT / Quant', desc: 'Algorithm and data-driven' },
      { id: 'long', label: 'Long-term', desc: 'Fundamental value investing' },
    ],
  },
  {
    id: 'risk',
    question: 'What is your risk tolerance?',
    options: [
      { id: 'low', label: 'Conservative', desc: 'Capital preservation first' },
      { id: 'med', label: 'Moderate', desc: 'Balanced growth and risk' },
      { id: 'high', label: 'Aggressive', desc: 'Seeking extreme returns' },
      { id: 'degen', label: 'Degenerate', desc: 'Maximum leverage, maximum risk' },
    ],
  },
];

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleAvatarSelect = (id: string) => {
    setSelectedAvatar(id);
    setStep(2);
  };

  const handleAnswerSelect = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
    
    // If we answered all questions, move to final step or auto-advance
    if (questionId === 'style') {
      // Small delay for smooth transition
      setTimeout(() => setStep(3), 300);
    }
  };

  const handleComplete = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          onboarding_completed: true,
          avatar: selectedAvatar,
          trading_style: answers.style,
          risk_tolerance: answers.risk,
        },
      });

      if (error) throw error;

      toast.success('Profile tailored successfully!');
      navigate('/command-center');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D0D0F] via-[#1A1A1E] to-[#0D0D0F] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glowing Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-2xl relative z-10">
        <Card className="bg-white/5 backdrop-blur-2xl border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] rounded-2xl">
          <CardHeader className="text-center space-y-2">
            <div className="flex justify-center gap-2 mb-4">
              {[1, 2, 3].map((s) => (
                <div 
                  key={s} 
                  className={`w-12 h-1.5 rounded-full transition-all duration-300 ${
                    s === step ? 'bg-cyan-400 glow-cyan w-16' : s < step ? 'bg-cyan-400/50' : 'bg-white/10'
                  }`} 
                />
              ))}
            </div>
            <CardTitle className="text-3xl font-bold text-white">
              {step === 1 && 'Choose Your Persona'}
              {step === 2 && 'Trading Style'}
              {step === 3 && 'Risk Profile'}
            </CardTitle>
            <CardDescription className="text-white/70">
              {step === 1 && 'Select an avatar that represents your trading identity.'}
              {step === 2 && 'How do you navigate the markets?'}
              {step === 3 && 'Define your risk parameters.'}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6">
            {/* Step 1: Avatar Selection */}
            {step === 1 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {AVATARS.map((avatar) => {
                  const Icon = avatar.icon;
                  return (
                    <button
                      key={avatar.id}
                      onClick={() => handleAvatarSelect(avatar.id)}
                      className={`group relative p-6 rounded-2xl bg-white/5 border transition-all duration-300 flex flex-col items-center gap-4 hover:translate-y-[-4px] ${
                        selectedAvatar === avatar.id 
                          ? 'border-cyan-400 bg-cyan-500/10 shadow-[0_0_20px_rgba(34,211,238,0.2)]' 
                          : 'border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className={`p-4 rounded-xl bg-gradient-to-br ${avatar.color} text-white`}>
                        <Icon className="w-8 h-8" />
                      </div>
                      <span className="text-white font-medium text-sm">{avatar.name}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Step 2: Trading Style */}
            {step === 2 && (
              <div className="grid gap-4">
                {QUESTIONS[0].options.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleAnswerSelect('style', option.id)}
                    className={`p-4 rounded-xl bg-white/5 border transition-all duration-300 flex items-center justify-between hover:bg-white/10 ${
                      answers.style === option.id ? 'border-cyan-400 bg-cyan-500/5' : 'border-white/10'
                    }`}
                  >
                    <div className="text-left">
                      <div className="text-white font-medium">{option.label}</div>
                      <div className="text-white/50 text-xs">{option.desc}</div>
                    </div>
                    {answers.style === option.id && <Check className="w-5 h-5 text-cyan-400" />}
                  </button>
                ))}
              </div>
            )}

            {/* Step 3: Risk Profile */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="grid gap-4">
                  {QUESTIONS[1].options.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setAnswers((prev) => ({ ...prev, risk: option.id }))}
                      className={`p-4 rounded-xl bg-white/5 border transition-all duration-300 flex items-center justify-between hover:bg-white/10 ${
                        answers.risk === option.id ? 'border-cyan-400 bg-cyan-500/5' : 'border-white/10'
                      }`}
                    >
                      <div className="text-left">
                        <div className="text-white font-medium">{option.label}</div>
                        <div className="text-white/50 text-xs">{option.desc}</div>
                      </div>
                      {answers.risk === option.id && <Check className="w-5 h-5 text-cyan-400" />}
                    </button>
                  ))}
                </div>

                <Button
                  onClick={handleComplete}
                  disabled={!answers.risk || isSaving}
                  className="w-full bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 text-white font-semibold py-6 rounded-xl shadow-[0_4px_20px_rgba(34,211,238,0.3)] disabled:opacity-50"
                >
                  {isSaving ? 'Tailoring Experience...' : 'Launch Terminal'}
                  {!isSaving && <ArrowRight className="ml-2 w-4 h-4" />}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
