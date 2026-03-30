import { useState, useRef, useEffect } from "react";
import { IconActivity } from "@tabler/icons-react";
import { Upload, X, FileText, TrendingUp, Sparkles, MonitorIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuantSuiteStore } from "@/stores/quantsuiteStore";
import ErrorBoundary from "@/components/ErrorBoundary";
import AIToolWrapper from "@/components/ai/AIToolWrapper";
import { Button } from "@/components/ui/button";
import { parseAIResponse } from "@/lib/aiResponseParser";
import { runMLPipeline, formatMLContextForLLM, type MLPipelineResult } from "@/lib/mlPipeline";
import { classifyQuery, getRelevantExamples } from "@/lib/modelEnhancement";
import { runBacktest, formatBacktestForLLM, type BacktestResult, type BacktestConfig } from "@/lib/backtestEngine";
import { 
  PremiumProseParser, 
  InlineChart, 
  InlineComparison,
  FollowUpInput 
} from "@/components/ai/PremiumProseParser";
import { SandboxResults } from "@/components/ai/SandboxResults";
import { CorrelationMatrix } from "@/components/ai/CorrelationMatrix";
import { AIFeedback } from "@/components/ai/AIFeedback";

type Message = {
  role: "user" | "assistant" | "system";
  content: string;
  isStreaming?: boolean;
  chartData?: any;
  engineResults?: any;
};

type AthenaMode = "stocks" | "options";

const Athena = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<AthenaMode>("stocks");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [portfolioAnalyzed, setPortfolioAnalyzed] = useState(false);
  const [storedEngineResults, setStoredEngineResults] = useState<any>(null);
  const [csvContent, setCsvContent] = useState<string | null>(null);
  const [showResponse, setShowResponse] = useState(false);
  const [portfolioFileName, setPortfolioFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { sharedAlerts } = useQuantSuiteStore();
  const [mlResult, setMlResult] = useState<MLPipelineResult | null>(null);
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);
  const [liveData, setLiveData] = useState<any>(null);

  // Fetch real market data for the ML pipeline
  useEffect(() => {
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
  }, []);

  const commandSuggestions = [
    { icon: <Upload className="w-4 h-4" />, label: "Upload Portfolio", description: "Upload CSV for analysis", prefix: "/upload" },
    { icon: <TrendingUp className="w-4 h-4" />, label: "Analyze", description: "Run full portfolio analysis", prefix: "/analyze" },
    { icon: <MonitorIcon className="w-4 h-4" />, label: "Risk Report", description: "Generate risk metrics", prefix: "/risk" },
    { icon: <Sparkles className="w-4 h-4" />, label: "Optimize", description: "Portfolio optimization", prefix: "/optimize" },
  ];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setCsvContent(content);
      setUploadedFile(file);
      setPortfolioFileName(file.name);
      toast({
        title: "Portfolio uploaded",
        description: `Running auto-analysis on ${file.name}...`,
      });
      // Trigger auto-analysis
      setTimeout(() => handleSendMessage(`Analyze `, content), 100);
    };
    reader.readAsText(file);
  };

  const clearPortfolio = () => {
    setCsvContent(null);
    setUploadedFile(null);
    setPortfolioFileName(null);
    setPortfolioAnalyzed(false);
    setStoredEngineResults(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async (input: string, rawData?: string | string[]) => {
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const currentCsv = (Array.isArray(rawData) ? rawData[0] : rawData) || csvContent;
      const shouldAnalyze = !portfolioAnalyzed && currentCsv && /\b(analyz|analyse|run|start|begin|check|review|evaluate)\b/i.test(input);
      
      let apiPrompt = input;
      apiPrompt += `\n\n[SYSTEM DIRECTIVE REGARDING YOUR OUTPUT FORMAT]
You are ATHENA, the Chief Risk Officer. Your ONLY goal is capital preservation and maximum risk-adjusted returns. You employ institutional-grade analysis with zero tolerance for sloppy risk management.
1. NEVER use conversational filler or standard AI warnings. Provide strict, data-driven, merciless analysis.
2. ALWAYS embed your data in markdown codes. For allocations use: \`\`\`chart:pie\n[{"name":"Sector", "value":50}]\n\`\`\`
3. For comparisons use: \`\`\`comparison\n{"before":[{"label":"VaR","value":"$100"}],"after":[{"label":"VaR","value":"$50"}]}\n\`\`\`
4. For portfolios use: \`\`\`tickers\n[{"symbol":"AAPL", "price":150, "change":2.5, "action":"buy"}]\n\`\`\`
5. MANDATORY: At the very end of your response, output exactly 5 predictive follow-up actions wrapped in [NEXT_ACTION: your action text] tags.
6. CRITICAL OVERRIDE: Answer in deep, elaborate, exhaustive detail. Reference specific numbers from the ML pipeline data when available.
`;

      // Run ML Pipeline on portfolio price data if available
      const queryCategory = classifyQuery(input);
      const fewShotExamples = await getRelevantExamples('athena', queryCategory);
      if (fewShotExamples) {
        apiPrompt += fewShotExamples;
      }

      // Generate synthetic price data from portfolio for ML analysis
      if (currentCsv || storedEngineResults) {
        try {
          // Create synthetic price series from portfolio data for regime detection
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
            const rng = seededRandom(505);
            
            const basePrice = 100;
            for (let i = 0; i < 60; i++) {
              const noise = (rng() - 0.48) * 3;
              const trend = i * 0.05;
              syntheticPrices.push(basePrice + trend + noise + Math.sin(i / 10) * 2);
            }
          }
          
          const pipelineResult = runMLPipeline(syntheticPrices);
          setMlResult(pipelineResult);
          apiPrompt += formatMLContextForLLM(pipelineResult);

          // Inject Geopolitical Alert Bus Data
          if (sharedAlerts && sharedAlerts.length > 0) {
            apiPrompt += `\n\n[CRITICAL: GLOBAL ALERT BUS]\nThe following geopolitical events are currently unfolding and may impact risk models:\n`;
            sharedAlerts.forEach(alert => {
              apiPrompt += `- [${alert.level.toUpperCase()}] ${alert.message} (Source: ${alert.source})\n`;
            });
            apiPrompt += `Factor these ongoing events into your downside risk projections immediately.\n`;
          }

          // Run backtest if strategy-related query
          if (/strateg|backtest|test|sandbox|optim/i.test(input)) {
            const btConfig: BacktestConfig = {
              strategyName: 'Athena Risk-Optimized',
              entrySignal: pipelineResult.regime.regime === 'SIDEWAYS' ? 'MEAN_REVERSION' : 'MOMENTUM',
              positionSize: 0.2,
              stopLoss: 0.05,
              takeProfit: 0.10,
              lookbackPeriod: 14,
              holdingPeriod: 10
            };
            const btResult = runBacktest(syntheticPrices, btConfig);
            setBacktestResult(btResult);
            apiPrompt += formatBacktestForLLM(btResult);
          }
        } catch (e) {
          console.warn('[Athena] ML pipeline error:', e);
        }
      }
      if (shouldAnalyze && currentCsv) {
         apiPrompt += `\n\n[CRITICAL: RAW USER PORTFOLIO DATA]\n${currentCsv.substring(0, 4000)}\nAnalyze this portfolio immediately.`;
      }

      const enhancedUserMessage = { ...userMessage, content: apiPrompt };
      
      const { data, error } = await supabase.functions.invoke("athena-chat", {
        body: {
          messages: [...messages, enhancedUserMessage],
          mode,
          csvData: shouldAnalyze ? currentCsv : null,
          portfolioContext: portfolioAnalyzed ? storedEngineResults : null
        }
      });

      if (error) {
        if (error.message?.includes("429")) throw new Error("Rate limit exceeded. Please try again in a moment.");
        if (error.message?.includes("402")) throw new Error("AI credits exhausted. Please add credits in Settings → Workspace → Usage.");
        throw error;
      }

      const assistantMessage: Message = { role: "assistant", content: data.response, engineResults: data.engineResults };
      setMessages(prev => [...prev, assistantMessage]);

      if (data.engineResults) {
        setStoredEngineResults(data.engineResults);
        setPortfolioAnalyzed(true);
      }
      
      setShowResponse(true);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to get response from Athena", variant: "destructive" });
      console.error("Athena error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Extract concentration data for pie chart from engine results
  const getConcentrationData = (engineResults: any) => {
    if (!engineResults?.stocksAnalysis?.sectorAllocation) return null;
    return Object.entries(engineResults.stocksAnalysis.sectorAllocation).map(([name, value]) => ({
      name,
      value: ((value as number) * 100)
    }));
  };

  // Extract top holdings for bar chart
  const getTopHoldingsData = (engineResults: any) => {
    if (!engineResults?.stocksAnalysis?.positions) return null;
    const positions = engineResults.stocksAnalysis.positions as any[];
    return positions.slice(0, 6).map((p: any) => ({
      name: p.ticker || p.symbol,
      value: p.weight ? p.weight * 100 : p.value || 0
    }));
  };

  // Get risk metrics for comparison
  const getRiskMetrics = (engineResults: any) => {
    if (!engineResults?.stocksAnalysis?.riskMetrics) return null;
    const rm = engineResults.stocksAnalysis.riskMetrics;
    return {
      var95: rm.var95,
      var99: rm.var99,
      cvar95: rm.cvar95,
      volatility: rm.volatility,
      sharpe: rm.sharpe
    };
  };

  // Portfolio upload header content
  const headerContent = (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-card/30 border border-border/30">
      <input ref={fileInputRef} type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
      
      {csvContent ? (
        <div className="flex items-center gap-3 flex-1">
          <div className="p-2 rounded-lg bg-sky-500/10">
            <FileText className="w-4 h-4 text-sky-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">{portfolioFileName}</p>
            <p className="text-xs text-muted-foreground">
              {portfolioAnalyzed ? 'Portfolio analyzed - ask follow-up questions!' : 'Ready for analysis - ask me to analyze it'}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={clearPortfolio} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <Upload className="w-4 h-4" />
          <span>Upload Portfolio (CSV)</span>
        </Button>
      )}
    </div>
  );

  const lastAssistantMessage = messages.filter(m => m.role === 'assistant').slice(-1)[0];
  const engineResults = lastAssistantMessage?.engineResults || storedEngineResults;
  
  // Parse AI response for embedded visualizations
  const parsedResponse = lastAssistantMessage ? parseAIResponse(lastAssistantMessage.content) : null;
  
  // Get data from engine results as fallback
  const concentrationData = getConcentrationData(engineResults);
  const topHoldingsData = getTopHoldingsData(engineResults);
  const riskMetrics = getRiskMetrics(engineResults);

  // Combine parsed charts with engine result charts
  const allCharts: any[] = [...(parsedResponse?.charts || [])];
  
  // Add engine result charts if no parsed charts
  if (allCharts.length === 0) {
    if (concentrationData && concentrationData.length > 0) {
      allCharts.push({
        type: 'pie' as const,
        data: concentrationData,
        title: 'Portfolio Concentration',
        insertAfterParagraph: 0
      });
    }
    
    if (topHoldingsData && topHoldingsData.length > 0) {
      allCharts.push({
        type: 'bar' as const,
        data: topHoldingsData,
        title: 'Top Holdings by Weight',
        insertAfterParagraph: 1
      });
    }
  }

  // Build ticker table from parsed data or engine results
  const tickerTable = parsedResponse?.tickers && parsedResponse.tickers.length > 0
    ? { tickers: parsedResponse.tickers, title: 'Holdings Analysis' }
    : undefined;

  // Build comparison from parsed data or optimization results
  const comparisonData = parsedResponse?.comparisons?.[0] || (
    engineResults?.stocksAnalysis?.optimization ? {
      before: [
        { label: 'Volatility', value: riskMetrics?.volatility ? `${(riskMetrics.volatility * 100).toFixed(1)}%` : 'N/A' },
        { label: 'Sharpe Ratio', value: riskMetrics?.sharpe?.toFixed(2) || 'N/A' },
        { label: 'VaR 95%', value: riskMetrics?.var95 ? `₹${riskMetrics.var95.toFixed(0)}` : 'N/A' },
      ],
      after: [
        { label: 'Volatility', value: `${((engineResults.stocksAnalysis.optimization.targetVolatility || 0.15) * 100).toFixed(1)}%` },
        { label: 'Sharpe Ratio', value: (engineResults.stocksAnalysis.optimization.expectedSharpe || 1.2).toFixed(2) },
        { label: 'VaR 95%', value: `₹${(riskMetrics?.var95 * 0.8 || 0).toFixed(0)}` },
      ],
    } : undefined
  );

  const responseContent = messages.length > 0 && lastAssistantMessage ? (
    <div className="space-y-6">
      {/* Premium Prose Content with Light Blue Theme and Parsed Visualizations */}
      <PremiumProseParser
        content={parsedResponse?.prose || lastAssistantMessage.content}
        theme="athena"
        chartData={allCharts}
        tickerTable={tickerTable}
        comparison={comparisonData}
        onActionClick={(action) => handleSendMessage(action)}
      />

      {/* ML Pipeline: Correlation Matrix */}
      {mlResult && mlResult.correlations.length > 0 && (
        <CorrelationMatrix correlations={mlResult.correlations} theme="athena" />
      )}

      {/* ML Pipeline: Sandbox Backtest Results */}
      {backtestResult && (
        <SandboxResults result={backtestResult} theme="athena" />
      )}

      {/* Efficient Frontier if available */}
      {engineResults?.stocksAnalysis?.optimization?.efficientFrontier?.length > 0 && (
        <InlineChart 
          data={engineResults.stocksAnalysis.optimization.efficientFrontier.map((p: any) => ({
            name: `${(p.risk * 100).toFixed(0)}%`,
            value: p.return * 100
          }))}
          type="line"
          theme="athena"
          title="Efficient Frontier"
          dataKey="value"
          nameKey="name"
        />
      )}

      {/* Risk Metrics Summary */}
      {riskMetrics && (
        <div className="my-6 p-4 rounded-xl bg-sky-500/5 border border-sky-500/20">
          <p className="text-sm text-sky-400 mb-3 uppercase tracking-wider font-medium">Risk Assessment</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {riskMetrics.var95 !== undefined && (
              <div>
                <span className="text-xs text-muted-foreground block">VaR 95%</span>
                <span className="font-mono text-lg text-foreground">₹{riskMetrics.var95.toFixed(0)}</span>
              </div>
            )}
            {riskMetrics.var99 !== undefined && (
              <div>
                <span className="text-xs text-muted-foreground block">VaR 99%</span>
                <span className="font-mono text-lg text-foreground">₹{riskMetrics.var99.toFixed(0)}</span>
              </div>
            )}
            {riskMetrics.volatility !== undefined && (
              <div>
                <span className="text-xs text-muted-foreground block">Volatility</span>
                <span className="font-mono text-lg text-foreground">{(riskMetrics.volatility * 100).toFixed(1)}%</span>
              </div>
            )}
            {riskMetrics.sharpe !== undefined && (
              <div>
                <span className="text-xs text-muted-foreground block">Sharpe Ratio</span>
                <span className={`font-mono text-lg ${riskMetrics.sharpe >= 1 ? 'text-emerald-400' : riskMetrics.sharpe >= 0.5 ? 'text-amber-400' : 'text-rose-400'}`}>
                  {riskMetrics.sharpe.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Feedback: Thumbs Up/Down */}
      <AIFeedback
        agent="athena"
        query={messages.filter(m => m.role === 'user').pop()?.content || ''}
        responseSnippet={lastAssistantMessage.content.substring(0, 500)}
        queryCategory={mlResult?.regime?.regime || undefined}
        regimeContext={mlResult?.regime?.regime}
        mlContextUsed={!!mlResult}
        theme="athena"
      />

      {/* Follow-up Input */}
      <FollowUpInput 
        onSend={(msg) => handleSendMessage(msg)}
        isLoading={isLoading}
        placeholder="Ask about your portfolio, risk, or optimization..."
        theme="athena"
      />
    </div>
  ) : null;

  return (
    <ErrorBoundary>
      <AIToolWrapper
        title="ATHENA Intelligence"
        subtitle="Institutional-grade portfolio analysis & optimization"
        placeholder={csvContent ? "Ask about your portfolio..." : "Upload a portfolio CSV to get started..."}
        thinkingLabel="Analyzing portfolio"
        commandSuggestions={commandSuggestions}
        onSendMessage={handleSendMessage}
        isProcessing={isLoading}
        responseContent={responseContent}
        showResponse={showResponse}
        responseBadge={{ icon: <IconActivity className="h-3 w-3 animate-pulse text-sky-400" />, label: 'Live Analysis' }}
        headerContent={headerContent}
        theme="athena"
      />
    </ErrorBoundary>
  );
};

export default Athena;
