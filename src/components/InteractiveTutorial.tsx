import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TickCircle, Record, ArrowRight, ArrowLeft, Book, Lamp, Play } from 'iconsax-react';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import { supabase } from '@/integrations/supabase/client';
import { QuizComponent } from './QuizComponent';
import { TryItComponent } from './TryItComponent';
import { ComparisonComponent } from './ComparisonComponent';
import { ScenarioComponent } from './ScenarioComponent';

interface TutorialStep {
  title: string;
  content: string;
  visualDescription: string;
  interactiveElement?: {
    type: 'quiz' | 'tryit' | 'comparison' | 'scenario';
    data: any;
  };
  keyTakeaway: string;
}

interface Tutorial {
  title: string;
  duration: string;
  description: string;
  learningObjectives: string[];
  steps: TutorialStep[];
  practiceScenarios: Array<{
    title: string;
    description: string;
    parameters: any;
    expectedOutcome: string;
    teachingPoint: string;
  }>;
  nextSteps: string[];
  glossaryTerms: Array<{
    term: string;
    definition: string;
    formula?: string;
  }>;
}

interface InteractiveTutorialProps {
  modelName: string;
  onNavigateToModel?: () => void;
}

export const InteractiveTutorial = ({ modelName, onNavigateToModel }: InteractiveTutorialProps) => {
  const [tutorial, setTutorial] = useState<Tutorial | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    loadTutorial();
  }, [modelName]);

  const loadTutorial = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-tutorial', {
        body: { modelName, userLevel: 'beginner' }
      });

      if (error) throw error;
      
      setTutorial(data.tutorial);
      
      // Load progress from localStorage
      const savedProgress = localStorage.getItem(`tutorial-progress-${modelName}`);
      if (savedProgress) {
        const { completed, current } = JSON.parse(savedProgress);
        setCompletedSteps(new Set(completed));
        setCurrentStep(current);
      }
    } catch (error) {
      console.error('Error loading tutorial:', error);
      toast({
        title: 'Error Loading Tutorial',
        description: 'Failed to generate tutorial content. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const saveProgress = (completed: Set<number>, current: number) => {
    localStorage.setItem(
      `tutorial-progress-${modelName}`,
      JSON.stringify({ completed: Array.from(completed), current })
    );
  };

  const markStepComplete = () => {
    const newCompleted = new Set(completedSteps);
    newCompleted.add(currentStep);
    setCompletedSteps(newCompleted);
    saveProgress(newCompleted, currentStep);
  };

  const goToNextStep = () => {
    if (tutorial && currentStep < tutorial.steps.length - 1) {
      markStepComplete();
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      saveProgress(completedSteps, newStep);
    }
  };

  const goToPrevStep = () => {
    if (currentStep > 0) {
      const newStep = currentStep - 1;
      setCurrentStep(newStep);
      saveProgress(completedSteps, newStep);
    }
  };

  const jumpToStep = (stepIndex: number) => {
    setCurrentStep(stepIndex);
    saveProgress(completedSteps, stepIndex);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Generating your personalized tutorial...</p>
        </div>
      </div>
    );
  }

  if (!tutorial) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Failed to load tutorial. Please try again.</p>
          <Button onClick={loadTutorial} className="mt-4">Retry</Button>
        </CardContent>
      </Card>
    );
  }

  const currentStepData = tutorial.steps[currentStep];
  const progressPercent = ((completedSteps.size) / tutorial.steps.length) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-2xl">{tutorial.title}</CardTitle>
              <CardDescription>{tutorial.description}</CardDescription>
              <div className="flex items-center gap-4 text-sm">
                <Badge variant="secondary">{tutorial.duration}</Badge>
                <span className="text-muted-foreground">
                  {completedSteps.size} / {tutorial.steps.length} steps completed
                </span>
              </div>
            </div>
            {onNavigateToModel && (
              <Button onClick={onNavigateToModel} variant="outline" size="sm">
                <Play className="mr-2 h-4 w-4" />
                Try Model
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={progressPercent} className="h-2" />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Sidebar - Progress */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Tutorial Steps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {tutorial.steps.map((step, index) => (
              <button
                key={index}
                onClick={() => jumpToStep(index)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  index === currentStep
                    ? 'bg-primary text-primary-foreground'
                    : completedSteps.has(index)
                    ? 'bg-muted hover:bg-muted/80'
                    : 'hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  {completedSteps.has(index) ? (
                    <TickCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <Record className="h-4 w-4" />
                  )}
                  <span className="text-sm font-medium">
                    {index + 1}. {step.title}
                  </span>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Book className="h-4 w-4" />
                Step {currentStep + 1} of {tutorial.steps.length}
              </div>
              <CardTitle>{currentStepData.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step Content */}
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown>{currentStepData.content}</ReactMarkdown>
              </div>

              {/* Visual Description */}
              {currentStepData.visualDescription && (
                <Card className="bg-muted/50">
                  <CardContent className="py-4">
                    <div className="flex items-start gap-3">
                      <Lamp className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-medium mb-1">Visual Concept:</p>
                        <p className="text-sm text-muted-foreground">
                          {currentStepData.visualDescription}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Interactive Element */}
              {currentStepData.interactiveElement && (
                <>
                  {currentStepData.interactiveElement.type === 'quiz' && (
                    <QuizComponent data={currentStepData.interactiveElement.data} />
                  )}
                  {currentStepData.interactiveElement.type === 'tryit' && (
                    <TryItComponent data={currentStepData.interactiveElement.data} />
                  )}
                  {currentStepData.interactiveElement.type === 'comparison' && (
                    <ComparisonComponent data={currentStepData.interactiveElement.data} />
                  )}
                  {currentStepData.interactiveElement.type === 'scenario' && (
                    <ScenarioComponent data={currentStepData.interactiveElement.data} />
                  )}
                </>
              )}

              {/* Key Takeaway */}
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="py-4">
                  <div className="flex items-start gap-3">
                    <Lamp className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium mb-1">Key Takeaway:</p>
                      <p className="text-sm">{currentStepData.keyTakeaway}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-4">
                <Button
                  onClick={goToPrevStep}
                  disabled={currentStep === 0}
                  variant="outline"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>

                {currentStep === tutorial.steps.length - 1 ? (
                  <Button onClick={markStepComplete} variant="default">
                    <TickCircle className="mr-2 h-4 w-4" />
                    Complete Tutorial
                  </Button>
                ) : (
                  <Button onClick={goToNextStep} variant="default">
                    Next Step
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Additional Resources */}
          {currentStep === tutorial.steps.length - 1 && (
            <Tabs defaultValue="scenarios" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="scenarios">Practice Scenarios</TabsTrigger>
                <TabsTrigger value="glossary">Glossary</TabsTrigger>
                <TabsTrigger value="next">What's Next</TabsTrigger>
              </TabsList>

              <TabsContent value="scenarios" className="space-y-4">
                {tutorial.practiceScenarios.map((scenario, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="text-lg">{scenario.title}</CardTitle>
                      <CardDescription>{scenario.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="text-sm">
                        <span className="font-medium">Expected: </span>
                        {scenario.expectedOutcome}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Lamp size={14} variant="Bold" className="text-primary" />
                        {scenario.teachingPoint}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="glossary" className="space-y-3">
                {tutorial.glossaryTerms.map((term, index) => (
                  <Card key={index}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">{term.term}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm">{term.definition}</p>
                      {term.formula && (
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {term.formula}
                        </code>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="next" className="space-y-3">
                {tutorial.nextSteps.map((step, index) => (
                  <Card key={index}>
                    <CardContent className="py-4">
                      <div className="flex items-start gap-3">
                        <ArrowRight className="h-5 w-5 text-primary mt-0.5" />
                        <p className="text-sm">{step}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
};
