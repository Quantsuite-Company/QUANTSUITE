import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, PartyPopper, Lightbulb, RotateCcw } from 'lucide-react';

interface QuizOption {
  text: string;
  correct: boolean;
  feedback?: string; // Funny/sarcastic feedback for wrong answers
}

interface Quiz {
  question: string;
  options: QuizOption[];
  explanation: string;
  hint?: string;
  correctMessage?: string;
}

interface ManualQuizComponentProps {
  quiz: Quiz;
  onComplete?: (correct: boolean) => void;
}

export const ManualQuizComponent: React.FC<ManualQuizComponentProps> = ({ quiz, onComplete }) => {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // Shuffle options once when component mounts or quiz changes
  const shuffledOptions = useMemo(() => {
    const optionsWithIndex = quiz.options.map((option, index) => ({ option, originalIndex: index }));
    // Fisher-Yates shuffle
    for (let i = optionsWithIndex.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [optionsWithIndex[i], optionsWithIndex[j]] = [optionsWithIndex[j], optionsWithIndex[i]];
    }
    return optionsWithIndex;
  }, [quiz]);

  // Reset state when quiz changes
  useEffect(() => {
    setSelectedAnswer(null);
    setShowFeedback(false);
    setShowHint(false);
  }, [quiz]);

  const handleOptionClick = (index: number) => {
    if (showFeedback) return; // Prevent changing answer after submission
    
    setSelectedAnswer(index);
    setShowFeedback(true);
    
    const isCorrect = shuffledOptions[index].option.correct;
    onComplete?.(isCorrect);
  };

  const resetQuiz = () => {
    setSelectedAnswer(null);
    setShowFeedback(false);
    setShowHint(false);
  };

  const selectedOption = selectedAnswer !== null ? shuffledOptions[selectedAnswer].option : null;
  const isCorrect = selectedOption?.correct || false;

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-background to-muted/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            🧠 Quick Brain Workout
          </CardTitle>
          {quiz.hint && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHint(!showHint)}
              className="text-xs"
            >
              <Lightbulb className="h-4 w-4 mr-1" />
              {showHint ? 'Hide' : 'Show'} Hint
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Question */}
        <div className="text-base font-medium leading-relaxed">
          {quiz.question}
        </div>

        {/* Hint */}
        {showHint && quiz.hint && (
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-sm">
            <div className="flex items-start gap-2">
              <Lightbulb className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
              <div className="text-muted-foreground">{quiz.hint}</div>
            </div>
          </div>
        )}

        {/* Options */}
        <div className="space-y-2">
          {shuffledOptions.map(({ option }, index) => {
            const isSelected = selectedAnswer === index;
            const showCorrect = showFeedback && option.correct;
            const showWrong = showFeedback && isSelected && !option.correct;

            return (
              <button
                key={index}
                onClick={() => handleOptionClick(index)}
                disabled={showFeedback}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-300 ${
                  showCorrect
                    ? 'border-green-500 bg-green-500/10 scale-[1.02]'
                    : showWrong
                    ? 'border-red-500 bg-red-500/10 shake'
                    : isSelected
                    ? 'border-primary bg-primary/10'
                    : 'border-muted hover:border-primary/50 hover:bg-muted/50'
                } ${showFeedback ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="flex-1">{option.text}</span>
                  {showCorrect && (
                    <CheckCircle2 className="h-5 w-5 text-green-500 animate-in zoom-in" />
                  )}
                  {showWrong && (
                    <XCircle className="h-5 w-5 text-red-500 animate-in zoom-in" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Feedback */}
        {showFeedback && (
          <div className={`p-4 rounded-lg border-2 animate-in slide-in-from-bottom-4 ${
            isCorrect
              ? 'border-green-500 bg-green-500/10'
              : 'border-red-500 bg-red-500/10'
          }`}>
            <div className="space-y-3">
              {/* Correct/Wrong Message */}
              <div className="flex items-start gap-3">
                {isCorrect ? (
                  <PartyPopper className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-bold text-base mb-1">
                    {isCorrect
                      ? quiz.correctMessage || "🎉 Nailed it! You're basically a finance genius now!"
                      : "😬 Oops! Not quite..."}
                  </div>
                  {!isCorrect && selectedOption?.feedback && (
                    <div className="text-sm italic mb-2 text-muted-foreground">
                      {selectedOption.feedback}
                    </div>
                  )}
                </div>
              </div>

              {/* Explanation */}
              <div className="text-sm leading-relaxed pl-9">
                <div className="font-semibold mb-1">💡 The Real Deal:</div>
                {quiz.explanation}
              </div>

              {/* Try Again Button */}
              {!isCorrect && (
                <Button
                  onClick={resetQuiz}
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
