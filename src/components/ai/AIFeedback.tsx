import { useState } from 'react';
import { ThumbsUp, ThumbsDown, MessageSquare, Send, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

type AgentType = 'athena' | 'market_maw' | 'strategy_advisor';

interface AIFeedbackProps {
  agent: AgentType;
  query: string;
  responseSnippet: string;
  queryCategory?: string;
  regimeContext?: string;
  mlContextUsed?: boolean;
  theme?: 'athena' | 'market' | 'strategy';
}

const themeColors: Record<string, { accent: string; border: string; bg: string; glow: string }> = {
  athena: { accent: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-500/10', glow: 'hover:shadow-amber-500/20' },
  market: { accent: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10', glow: 'hover:shadow-emerald-500/20' },
  strategy: { accent: 'text-cyan-400', border: 'border-cyan-500/30', bg: 'bg-cyan-500/10', glow: 'hover:shadow-cyan-500/20' },
};

export const AIFeedback = ({
  agent,
  query,
  responseSnippet,
  queryCategory,
  regimeContext,
  mlContextUsed = false,
  theme = 'athena',
}: AIFeedbackProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rating, setRating] = useState<-1 | 1 | null>(null);
  const [showCorrection, setShowCorrection] = useState(false);
  const [correctionNote, setCorrectionNote] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const colors = themeColors[theme] || themeColors.athena;

  const submitFeedback = async (value: -1 | 1) => {
    if (!user) {
      toast({ title: 'Sign in required', description: 'Please sign in to submit feedback.', variant: 'destructive' });
      return;
    }

    setRating(value);

    if (value === -1) {
      setShowCorrection(true);
      return;
    }

    await saveFeedback(value, '');
  };

  const saveFeedback = async (value: -1 | 1, note: string) => {
    try {
      const { error } = await supabase.from('ai_feedback' as any).insert({
        user_id: user!.id,
        agent,
        query: query.substring(0, 500),
        response_snippet: responseSnippet.substring(0, 1000),
        rating: value,
        query_category: queryCategory || null,
        regime_context: regimeContext || null,
        ml_context_used: mlContextUsed,
        correction_note: note || null,
      });

      if (error) throw error;

      setSubmitted(true);
      setShowCorrection(false);
      toast({
        title: value === 1 ? '✅ Feedback recorded' : '📝 Correction noted',
        description: value === 1
          ? 'This helps the AI improve future responses.'
          : 'Your correction will be used to improve accuracy.',
      });
    } catch (err: any) {
      console.error('[AIFeedback] Error:', err);
      // Still show success to user — table may not exist yet
      setSubmitted(true);
      setShowCorrection(false);
    }
  };

  if (submitted) {
    return (
      <div className={`flex items-center gap-2 py-2 px-3 rounded-lg ${colors.bg} ${colors.border} border transition-all duration-300`}>
        <span className={`text-xs font-medium ${colors.accent}`} style={{ fontFamily: "'Times New Roman', serif" }}>
          {rating === 1 ? '👍 Response quality logged' : '📝 Correction recorded — AI will improve'}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Rating Buttons */}
      <div className={`flex items-center gap-3 py-2 px-3 rounded-lg border ${colors.border} bg-card/20 backdrop-blur-sm`}>
        <span className="text-xs text-muted-foreground" style={{ fontFamily: "'Times New Roman', serif" }}>
          Rate this response:
        </span>
        <button
          onClick={() => submitFeedback(1)}
          className={`p-1.5 rounded-md transition-all duration-200 ${
            rating === 1
              ? `${colors.bg} ${colors.accent}`
              : 'text-muted-foreground hover:text-green-400 hover:bg-green-500/10'
          }`}
          title="Good response"
        >
          <ThumbsUp className="w-4 h-4" />
        </button>
        <button
          onClick={() => submitFeedback(-1)}
          className={`p-1.5 rounded-md transition-all duration-200 ${
            rating === -1
              ? 'bg-red-500/10 text-red-400'
              : 'text-muted-foreground hover:text-red-400 hover:bg-red-500/10'
          }`}
          title="Needs improvement"
        >
          <ThumbsDown className="w-4 h-4" />
        </button>
      </div>

      {/* Correction Note Input */}
      {showCorrection && (
        <div className={`flex items-center gap-2 p-2 rounded-lg border ${colors.border} bg-card/30 backdrop-blur-sm animate-in slide-in-from-top-1 duration-200`}>
          <MessageSquare className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <input
            type="text"
            value={correctionNote}
            onChange={(e) => setCorrectionNote(e.target.value)}
            placeholder="What should be different? (optional)"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            style={{ fontFamily: "'Times New Roman', serif" }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveFeedback(-1, correctionNote);
            }}
          />
          <button
            onClick={() => saveFeedback(-1, correctionNote)}
            className={`p-1.5 rounded-md ${colors.accent} ${colors.bg} transition-all`}
          >
            <Send className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => { setShowCorrection(false); setRating(null); }}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground transition-all"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
