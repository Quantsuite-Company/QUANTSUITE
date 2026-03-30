import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Brain, Sparkles, TrendingUp, MonitorIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useQuantSuiteStore } from '@/stores/quantsuiteStore';
import AIToolWrapper from '@/components/ai/AIToolWrapper';
import { Link } from 'react-router-dom';
import { parseAIResponse } from '@/lib/aiResponseParser';
import { runMLPipeline, formatMLContextForLLM, type MLPipelineResult } from '@/lib/mlPipeline';
import { classifyQuery, getRelevantExamples } from '@/lib/modelEnhancement';
import { runBacktest, formatBacktestForLLM, type BacktestResult, type BacktestConfig } from '@/lib/backtestEngine';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  PremiumProseParser, 
  InlineChart,
  InlineTickerTable,
  FollowUpInput 
} from '@/components/ai/PremiumProseParser';
import { SandboxResults } from '@/components/ai/SandboxResults';
import { AIFeedback } from '@/components/ai/AIFeedback';

const AIStrategyAdvisor = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [strategy, setStrategy] = useState<string | null>(null);
  const [portfolioContext, setPortfolioContext] = useState<any>(null);
  const [portfolios, setPortfolios] = useState<any[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>('');
  const [showResponse, setShowResponse] = useState(false);
  const [messages, setMessages] = useState<{role: string, content: string}[]>([]);
  const [mlResult, setMlResult] = useState<MLPipelineResult | null>(null);
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);
  const [liveData, setLiveData] = useState<any>(null);
  const { sharedAlerts } = useQuantSuiteStore();

  const commandSuggestions = [
    { icon: <Brain className="w-4 h-4" />, label: "Hedge Strategy", description: "Get hedging recommendations", prefix: "/hedge" },
    { icon: <TrendingUp className="w-4 h-4" />, label: "Diversify", description: "Portfolio diversification advice", prefix: "/diversify" },
    { icon: <MonitorIcon className="w-4 h-4" />, label: "Rebalance", description: "Rebalancing suggestions", prefix: "/rebalance" },
    { icon: <Sparkles className="w-4 h-4" />, label: "Alpha Signals", description: "Interpret alpha signals", prefix: "/alpha" },
  ];

  useEffect(() => {
    const fetchPortfolios = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('portfolios')
          .select('id, name, created_at, positions')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        setPortfolios(data || []);
        if (data && data.length > 0) setSelectedPortfolioId(data[0].id);
      } catch (error: any) {
        console.error('Error fetching portfolios:', error);
      }
    };

    fetchPortfolios();
    
    // Fetch real market data for the ML pipeline
    const fetchMarketData = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('fetch-market-data');
        if (!error && data?.indices) {
          setLiveData(data);
        }
      } catch (error) {
        console.error('Error fetching market data:', error);
      }
    };
    
    fetchMarketData();
  }, [user]);

  const handleSendMessage = async (query: string) => {
    if (!query.trim()) {
      toast({ title: "Query Required", description: "Please enter a strategy question.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setStrategy(null);
    setMessages(prev => [...prev, { role: 'user', content: query }]);

    try {
      let enhancedQuery = query;
      enhancedQuery += `\n\n[SYSTEM DIRECTIVE REGARDING YOUR OUTPUT FORMAT]
You are THE EXECUTIONER, Chief Strategy Architect. Your ONLY goal is to design and execute winning strategies with surgical precision. Every recommendation has exact entry, exit, and sizing.
1. NEVER use conversational filler. Provide strict, data-driven strategy.
2. ALWAYS embed your data in markdown codes. For strategy allocations use: \`\`\`chart:pie\n[{"name":"Hedge", "value":50}]\n\`\`\`
3. For optimization comparisons use: \`\`\`comparison\n{"before":[{"label":"VaR","value":"$100"}],"after":[{"label":"VaR","value":"$50"}]}\n\`\`\`
4. For recommended trades use: \`\`\`tickers\n[{"symbol":"AAPL", "action":"sell"}]\n\`\`\`
5. MANDATORY: At the very end of your response, output exactly 5 predictive follow-up actions wrapped in [NEXT_ACTION: your action text] tags.
6. CRITICAL: Answer in deep, elaborate detail. Reference ML pipeline data when available.
`;

      // Run ML Pipeline for strategy context
      const queryCategory = classifyQuery(query);
      const fewShotExamples = await getRelevantExamples('strategy_advisor', queryCategory);
      if (fewShotExamples) {
        enhancedQuery += fewShotExamples;
      }

      // Generate ML pipeline analysis
      try {
        let syntheticPrices: number[] = [];
        const snpData = liveData?.indices?.find((idx: any) => idx.symbol === '^GSPC');
        
        if (snpData && snpData.history && snpData.history.length >= 30) {
          syntheticPrices = snpData.history;
        } else {
          // Fallback if fetch failed
          const seededRandom = (seed: number) => {
            let t = seed;
            return function() {
              t += 0x6D2B79F5;
              t = Math.imul(t ^ t >>> 15, t | 1);
              t ^= t + Math.imul(t ^ t >>> 7, t | 61);
              return ((t ^ t >>> 14) >>> 0) / 4294967296;
            }
          };
          const rng = seededRandom(404);
          
          const basePrice = 100;
          for (let i = 0; i < 60; i++) {
            syntheticPrices.push(basePrice + (rng() - 0.48) * 3 + i * 0.04 + Math.sin(i / 8) * 1.5);
          }
        }
        
        const pipelineResult = runMLPipeline(syntheticPrices);
        setMlResult(pipelineResult);
        enhancedQuery += formatMLContextForLLM(pipelineResult);

        // Inject Geopolitical Alert Bus Data
        if (sharedAlerts && sharedAlerts.length > 0) {
          enhancedQuery += `\n\n[CRITICAL: GLOBAL ALERT BUS]\nThe following geopolitical events are currently unfolding and may impact strategy execution:\n`;
          sharedAlerts.forEach(alert => {
            enhancedQuery += `- [${alert.level.toUpperCase()}] ${alert.message} (Source: ${alert.source})\n`;
          });
          enhancedQuery += `Ensure your strategy accounts for these systemic risks.\n`;
        }

        // Auto-run backtest for strategy queries
        const btConfig: BacktestConfig = {
          strategyName: `${pipelineResult.strategyScores[0]?.strategy || 'Momentum'}`,
          entrySignal: pipelineResult.regime.regime === 'SIDEWAYS' ? 'MEAN_REVERSION' 
            : pipelineResult.regime.regime === 'HIGH_VOL' ? 'VOLATILITY' : 'MOMENTUM',
          positionSize: 0.15,
          stopLoss: 0.04,
          takeProfit: 0.08,
          lookbackPeriod: 14,
          holdingPeriod: 10
        };
        const btResult = runBacktest(syntheticPrices, btConfig);
        setBacktestResult(btResult);
        enhancedQuery += formatBacktestForLLM(btResult);
      } catch (e) {
        console.warn('[StrategyAdvisor] ML pipeline error:', e);
      }

      const { data, error } = await supabase.functions.invoke('ai-strategy-advisor', {
        body: { query: enhancedQuery, portfolioId: selectedPortfolioId || undefined },
      });

      if (error) throw error;

      setStrategy(data.strategy);
      setPortfolioContext(data.portfolioContext);
      setMessages(prev => [...prev, { role: 'assistant', content: data.strategy }]);
      setShowResponse(true);

      toast({ title: "Strategy Generated", description: "AI has analyzed your portfolio and generated recommendations." });
    } catch (error: any) {
      console.error('AI Strategy error:', error);
      toast({ title: "Strategy Generation Failed", description: error.message || "Failed to generate strategy.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  // Get currency symbol
  const getCurrencySymbol = () => {
    if (!portfolioContext?.topHoldings) return '$';
    const topHolding = portfolioContext.topHoldings.toLowerCase();
    if (topHolding.includes('.ns') || topHolding.includes('.bse') || 
        topHolding.includes('reliance') || topHolding.includes('tcs')) {
      return '₹';
    }
    return '$';
  };

  // Parse AI response for embedded visualizations
  const parsedResponse = strategy ? parseAIResponse(strategy) : null;

  // Get portfolio allocation for pie chart from portfolio context (fallback)
  const getAllocationData = () => {
    if (!portfolioContext?.allPositions) return null;
    const positions = portfolioContext.allPositions as any[];
    if (!positions.length) return null;
    
    const total = positions.reduce((sum: number, p: any) => sum + (p.value || 0), 0);
    return positions.slice(0, 5).map((p: any) => ({
      name: p.symbol || p.ticker,
      value: total > 0 ? ((p.value || 0) / total) * 100 : 0
    }));
  };

  const allocationData = getAllocationData();

  // Combine parsed charts with fallback data
  const allCharts = parsedResponse?.charts && parsedResponse.charts.length > 0
    ? parsedResponse.charts
    : allocationData && allocationData.length > 0
      ? [{ type: 'pie' as const, data: allocationData, title: 'Current Allocation' }]
      : [];

  // Build ticker table from parsed data
  const tickerTable = parsedResponse?.tickers && parsedResponse.tickers.length > 0
    ? { tickers: parsedResponse.tickers, title: 'Recommended Actions' }
    : undefined;

  // Build comparison from parsed data
  const comparisonData = parsedResponse?.comparisons?.[0];

  const responseContent = strategy ? (
    <div className="space-y-6">
      {/* Portfolio Context Summary */}
      {portfolioContext && portfolioContext.totalPositions > 0 && (
        <div className="flex items-center gap-6 text-sm text-muted-foreground border-b border-cyan-500/20 pb-4 mb-4">
          <span><span className="text-cyan-400 font-medium">{portfolioContext.portfolioName}</span></span>
          <span>{portfolioContext.totalPositions} positions</span>
          <span className="text-cyan-400 font-mono">{getCurrencySymbol()}{portfolioContext.totalValue?.toLocaleString()}</span>
          <span>Top: <span className="text-foreground">{portfolioContext.topHoldings?.split(',')[0]?.trim()}</span></span>
        </div>
      )}

      {/* Premium Prose Content with Cyan Theme and Parsed Visualizations */}
      <PremiumProseParser
        content={parsedResponse?.prose || strategy}
        theme="strategy"
        chartData={allCharts.map((chart, idx) => ({
          ...chart,
          insertAfterParagraph: idx === 0 ? 0 : undefined
        }))}
        tickerTable={tickerTable ? {
          ...tickerTable,
          insertAfterParagraph: 2
        } : undefined}
        comparison={comparisonData}
        onActionClick={(action) => handleSendMessage(action)}
      />

      <FollowUpInput 
        onSend={(msg) => handleSendMessage(msg)}
        isLoading={isLoading}
        placeholder="Ask about strategy refinement or execution..."
        theme="strategy"
      />

      {/* ML Pipeline: Sandbox Backtest Results */}
      {backtestResult && (
        <SandboxResults result={backtestResult} theme="strategy" />
      )}

      {/* AI Feedback: Thumbs Up/Down */}
      <AIFeedback
        agent="strategy_advisor"
        query={messages.filter(m => m.role === 'user').pop()?.content || ''}
        responseSnippet={(strategy || '').substring(0, 500)}
        queryCategory={mlResult?.regime?.regime || undefined}
        regimeContext={mlResult?.regime?.regime}
        mlContextUsed={!!mlResult}
        theme="strategy"
      />
    </div>
  ) : null;

  return (
    <>
      <Helmet>
        <title>AI Strategy Advisor | QuantSuite</title>
        <meta name="description" content="Get personalized trading strategy recommendations powered by AI." />
      </Helmet>

      <AIToolWrapper
        title="AI Strategy Advisor"
        subtitle="Get personalized trading strategies powered by advanced AI"
        placeholder="Ask about hedging, diversification, or portfolio optimization..."
        thinkingLabel="Generating strategy"
        commandSuggestions={commandSuggestions}
        onSendMessage={handleSendMessage}
        isProcessing={isLoading}
        responseContent={responseContent}
        showResponse={showResponse}
        responseBadge={{ icon: <Sparkles className="h-3 w-3 text-cyan-400" />, label: 'AI Generated' }}
        theme="strategy"
        headerContent={
          <div className="w-full max-w-md mx-auto mb-4">
            {portfolios.length === 0 ? (
              <div className="text-center p-4 bg-card/30 backdrop-blur-xl rounded-lg border border-cyan-500/20">
                <p className="text-muted-foreground text-sm mb-2">No portfolios found</p>
                <Link to="/portfolio-builder" className="text-cyan-400 text-sm hover:underline">
                  Create your first portfolio →
                </Link>
              </div>
            ) : (
              <Select value={selectedPortfolioId} onValueChange={setSelectedPortfolioId}>
                <SelectTrigger className="bg-card/30 backdrop-blur-xl border-cyan-500/20 text-foreground">
                  <SelectValue placeholder="Select a portfolio to analyze" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {portfolios.map((portfolio) => (
                    <SelectItem key={portfolio.id} value={portfolio.id}>
                      {portfolio.name} ({(portfolio.positions as any[])?.length || 0} positions)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        }
      />
    </>
  );
};

export default AIStrategyAdvisor;
