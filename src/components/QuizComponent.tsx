import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

interface QuizOption {
  text: string;
  correct: boolean;
  explanation?: string;
}

interface QuizQuestion {
  question: string;
  options: QuizOption[];
  hint?: string;
}

interface QuizData {
  questions?: QuizQuestion[];
  question?: string;
  options?: (QuizOption[] | string[]);
  hint?: string;
  correctAnswer?: string;
  explanation?: string;
}

interface QuizComponentProps {
  data: QuizData;
}

export const QuizComponent = ({ data }: QuizComponentProps) => {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // Normalize quiz data to handle both formats
  const normalizeOptions = (
    options: (QuizOption[] | string[]) | undefined,
    correctAnswer?: string,
    explanation?: string
  ): QuizOption[] => {
    if (!options) return [];
    
    // If options are already in the correct format
    if (options.length > 0 && typeof options[0] === 'object' && 'text' in options[0]) {
      return options as QuizOption[];
    }
    
    // Convert simple string array format
    return (options as string[]).map(option => ({
      text: option,
      correct: option === correctAnswer,
      explanation: option === correctAnswer ? explanation : undefined
    }));
  };

  // Handle both single question and multiple questions format
  const questions: QuizQuestion[] = data.questions || [{
    question: data.question || '',
    options: normalizeOptions(data.options, data.correctAnswer, data.explanation),
    hint: data.hint
  }];

  const currentQuestion = questions[0]; // For now, show first question

  const handleOptionClick = (index: number) => {
    setSelectedAnswer(index);
    setShowFeedback(true);
  };

  const resetQuiz = () => {
    setSelectedAnswer(null);
    setShowFeedback(false);
    setShowHint(false);
  };

  const isCorrect = selectedAnswer !== null && currentQuestion.options[selectedAnswer]?.correct;

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            🧠 Quick Quiz
          </CardTitle>
          {currentQuestion.hint && !showFeedback && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowHint(!showHint)}
            >
              <AlertCircle className="h-4 w-4 mr-1" />
              {showHint ? 'Hide' : 'Show'} Hint
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Question */}
        <p className="font-medium text-base">{currentQuestion.question}</p>

        {/* Hint */}
        {showHint && currentQuestion.hint && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
            <p className="text-sm text-yellow-700 dark:text-yellow-400 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{currentQuestion.hint}</span>
            </p>
          </div>
        )}

        {/* Options */}
        <div className="space-y-2">
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const showCorrect = showFeedback && option.correct;
            const showWrong = showFeedback && isSelected && !option.correct;

            return (
              <button
                key={index}
                onClick={() => !showFeedback && handleOptionClick(index)}
                disabled={showFeedback}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  showCorrect
                    ? 'border-green-500 bg-green-500/10'
                    : showWrong
                    ? 'border-red-500 bg-red-500/10'
                    : isSelected
                    ? 'border-primary bg-primary/10'
                    : 'border-muted hover:border-primary/50 hover:bg-muted/50'
                } ${showFeedback ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                      showCorrect
                        ? 'border-green-500 bg-green-500'
                        : showWrong
                        ? 'border-red-500 bg-red-500'
                        : isSelected
                        ? 'border-primary bg-primary'
                        : 'border-muted-foreground/30'
                    }`}>
                      {showCorrect && <CheckCircle2 className="h-4 w-4 text-white" />}
                      {showWrong && <XCircle className="h-4 w-4 text-white" />}
                      {!showFeedback && isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <span className={`text-sm ${showFeedback && !option.correct && !isSelected ? 'opacity-50' : ''}`}>
                      {option.text}
                    </span>
                  </div>
                  {showFeedback && option.correct && (
                    <Badge variant="default" className="bg-green-500">
                      Correct
                    </Badge>
                  )}
                </div>

                {/* Explanation */}
                {showFeedback && (isSelected || option.correct) && option.explanation && (
                  <div className={`mt-3 pt-3 border-t text-sm ${
                    option.correct ? 'border-green-500/20' : 'border-red-500/20'
                  }`}>
                    <p className="text-muted-foreground">{option.explanation}</p>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Feedback */}
        {showFeedback && (
          <div className={`p-4 rounded-lg border-2 ${
            isCorrect
              ? 'border-green-500 bg-green-500/10'
              : 'border-red-500 bg-red-500/10'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {isCorrect ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <p className="font-semibold text-green-700 dark:text-green-400">
                    Excellent! That's correct!
                  </p>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-500" />
                  <p className="font-semibold text-red-700 dark:text-red-400">
                    Not quite. Review the explanation above.
                  </p>
                </>
              )}
            </div>
            <Button 
              onClick={resetQuiz} 
              variant="outline" 
              size="sm"
              className="mt-2"
            >
              Try Again
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
