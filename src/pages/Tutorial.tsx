import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { InteractiveTutorial } from '@/components/InteractiveTutorial';

const Tutorial = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const modelName = searchParams.get('model') || 'Black-Scholes Calculator';

  const modelRoutes: Record<string, string> = {
    'Black-Scholes Calculator': '/app',
    'Monte Carlo Simulation': '/monte-carlo',
    'Binomial Tree Model': '/binomial-tree',
    'Advanced Greeks Dashboard': '/advanced-greeks',
    'Arbitrage Detector': '/arbitrage-detector',
    'SVI Model': '/svi',
  };

  const handleNavigateToModel = () => {
    const route = modelRoutes[modelName];
    if (route) {
      navigate(route);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container py-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/educational-insight')}
            className="mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Educational Insights
          </Button>
        </div>
      </div>

      <div className="container py-8">
        <InteractiveTutorial 
          modelName={modelName}
          onNavigateToModel={handleNavigateToModel}
        />
      </div>
    </div>
  );
};

export default Tutorial;
