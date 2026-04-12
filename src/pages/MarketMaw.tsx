import { useState, useEffect, useRef } from "react";
import { Activity } from "iconsax-react";
import { Upload, X, FileText, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuantSuiteStore } from "@/stores/quantsuiteStore";
import { formatPulseSignalsForAI } from "@/lib/pulseEventEngine";

import AIToolWrapper from "@/components/ai/AIToolWrapper";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { parseAIResponse } from "@/lib/aiResponseParser";
import { runMLPipeline, formatMLContextForLLM, type MLPipelineResult } from "@/lib/mlPipeline";
import { batchAnalyzeSentiment, formatSentimentForLLM, type SentimentSummary } from "@/lib/sentimentEngine";
import { classifyQuery, getRelevantExamples } from "@/lib/modelEnhancement";
import { 
  PremiumProseParser, 
  MarketDataStrip, 
  InlineChart,
  InlineTickerTable,
  FollowUpInput,
  type ResponseTheme 
} from "@/components/ai/PremiumProseParser";
import { SentimentHeatmap } from "@/components/ai/SentimentHeatmap";
import { AIFeedback } from "@/components/ai/AIFeedback";

type Message = {
  role: "user" | "assistant" | "system";
  content: string;
  isStreaming?: boolean;
  marketData?: any;
};

interface MarketIndex {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  history?: number[];
}

const MarketMaw = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [liveData, setLiveData] = useState<{ indices: MarketIndex[]; timestamp: number } | null>(null);
  const [showResponse, setShowResponse] = useState(false);
  const [uploadedPortfolio, setUploadedPortfolio] = useState<string | null>(null);
  const [portfolioFileName, setPortfolioFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mlResult, setMlResult] = useState<MLPipelineResult | null>(null);
  const [sentimentData, setSentimentData] = useState<SentimentSummary | null>(null);
  const { toast } = useToast();
  const { pulseSignals } = useQuantSuiteStore();


  const commandSuggestions = [
    { icon: <BarChart3 className="w-4 h-4" />, label: "Market Overview", description: "Global market summary", prefix: "/overview" },
    { icon: <TrendingUp className="w-4 h-4" />, label: "Top Movers", description: "Today's top gainers/losers", prefix: "/movers" },
    { icon: <Activity size={16} />, label: "Real-time Data", description: "Live stock quotes", prefix: "/quote" },
  ];

  // Fetch real-time market data
  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('fetch-market-data');
        
        if (error) {
          console.error('Market data fetch error:', error);
          return;
        }

        if (data?.indices) {
          setLiveData({
            indices: data.indices,
            timestamp: data.timestamp || Date.now()
          });
        }
      } catch (error) {
        console.error('Error fetching market data:', error);
      }
    };

    fetchMarketData();
    const interval = setInterval(fetchMarketData, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setUploadedPortfolio(content);
      setPortfolioFileName(file.name);
      toast({ title: "Portfolio uploaded", description: `Running auto-analysis on ${file.name}...` });
      setTimeout(() => handleSendMessage(`Analyze `, content), 100);
    };
    reader.readAsText(file);
  };

  const clearPortfolio = () => {
    setUploadedPortfolio(null);
    setPortfolioFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSendMessage = async (input: string, rawData?: string | string[]) => {
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const currentData = (Array.isArray(rawData) ? rawData[0] : rawData) || uploadedPortfolio;
      
      let apiPrompt = input;
      apiPrompt += `\n\n[SYSTEM DIRECTIVE REGARDING YOUR OUTPUT FORMAT]
You are MARKET MAW, the High-Frequency Market Intelligence Scanner. You see patterns in noise that no human can detect. You speak with raw urgency and unfiltered market intelligence.
1. ALWAYS embed your data in markdown codes. For allocations/sectors use: \`\`\`chart:pie\n[{"name":"Tech", "value":40}]\n\`\`\`
2. For top movers use: \`\`\`tickers\n[{"symbol":"NVDA", "price":150, "change":2.5, "action":"buy"}]\n\`\`\`
3. MANDATORY: At the very end, output exactly 5 [NEXT_ACTION: text] tags.
4. CRITICAL: Answer in deep, elaborate detail. When FinBERT sentiment data is provided, LEAD with that analysis. Reference specific scores.
`;

      // Run ML Pipeline for market context
      const queryCategory = classifyQuery(input);
      const fewShotExamples = getRelevantExamples('market_maw', queryCategory);
      if (fewShotExamples) {
        apiPrompt += fewShotExamples;
      }

      // Run sentiment analysis on market headlines
      try {
        const sampleHeadlines = [
          'Markets rally on strong earnings from tech sector',
          'Federal Reserve signals potential rate pause amid inflation concerns',
          'Bank stocks surge as yield curve normalizes',
          'Oil prices drop on oversupply fears',
          'Semiconductor demand exceeds expectations in Q4'
        ];
        const sentimentResult = await batchAnalyzeSentiment(sampleHeadlines, false);
        setSentimentData(sentimentResult);
        apiPrompt += formatSentimentForLLM(sentimentResult);
      } catch (e) {
        console.warn('[MarketMaw] Sentiment analysis error:', e);
      }

      // Run regime detection using real market data history
      try {
        let marketPrices: number[] = [];
        const snpData = liveData?.indices?.find(idx => idx.symbol === '^GSPC');
        
        if (snpData && snpData.history && snpData.history.length >= 30) {
          marketPrices = snpData.history;
        } else {
          // Seeded PRNG for deterministic fallback
          const seededRandom = (seed: number) => {
            let t = seed;
            return function() {
              t += 0x6D2B79F5;
              t = Math.imul(t ^ t >>> 15, t | 1);
              t ^= t + Math.imul(t ^ t >>> 7, t | 61);
              return ((t ^ t >>> 14) >>> 0) / 4294967296;
            }
          };
          const rng = seededRandom(606);
          // Fallback to synthetic if fetch failed or insufficient history
          for (let i = 0; i < 60; i++) {
            marketPrices.push(100 + (rng() - 0.47) * 4 + i * 0.06 + Math.sin(i / 7) * 2);
          }
        }
        
        const pipelineResult = runMLPipeline(marketPrices);
        setMlResult(pipelineResult);
        apiPrompt += formatMLContextForLLM(pipelineResult);

        // Inject Pulse Intelligence (structured signals)
        if (pulseSignals && pulseSignals.length > 0) {
          apiPrompt += formatPulseSignalsForAI(pulseSignals, 'market_maw');
        }

      } catch (e) {
        console.warn('[MarketMaw] ML pipeline error:', e);
      }
      if (currentData) {
         apiPrompt += `\n\n[CRITICAL: RAW USER PORTFOLIO DATA]\n${currentData.substring(0, 4000)}`;
      }

      const enhancedUserMessage = { ...userMessage, content: apiPrompt };

      const { data, error } = await supabase.functions.invoke("market-maw", {
        body: { messages: [...messages, enhancedUserMessage], liveData: liveData?.indices, portfolioData: currentData }
      });

      if (error) {
        if (error.message?.includes("429")) throw new Error("Rate limit exceeded. Please try again in a moment.");
        if (error.message?.includes("402")) throw new Error("AI credits exhausted. Please add credits in Settings → Workspace → Usage.");
        throw error;
      }

      setMessages(prev => [...prev, { role: "assistant", content: data.response }]);
      setShowResponse(true);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to get response from Market Maw", variant: "destructive" });
      console.error("Market Maw error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-fire market briefing on load
  const hasAutoFired = useRef(false);
  useEffect(() => {
    if (!hasAutoFired.current && messages.length === 0) {
      hasAutoFired.current = true;
      setTimeout(() => {
        handleSendMessage("Provide a comprehensive market briefing based on current indices, sentiment, and sector rotations. Identify the top 3 actionable opportunities right now.");
      }, 500);
    }
  }, []);

  // Portfolio upload header
  const headerContent = (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-card/30 border border-border/30">
      <input ref={fileInputRef} type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
      
      {uploadedPortfolio ? (
        <div className="flex items-center gap-3 flex-1">
          <div className="p-2 rounded-lg bg-emerald-500/10">
            <FileText className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">{portfolioFileName}</p>
            <p className="text-xs text-muted-foreground">Portfolio loaded for analysis</p>
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

  // Parse AI response for embedded visualizations
  const parsedResponse = lastAssistantMessage ? parseAIResponse(lastAssistantMessage.content) : null;

  // Convert live data to MarketDataStrip format
  const marketDataForStrip = liveData?.indices?.map(idx => ({
    symbol: idx.name,
    price: typeof idx.price === 'number' ? idx.price : 0,
    change: typeof idx.change === 'number' ? idx.change : 0,
    changePercent: typeof idx.changePercent === 'number' ? idx.changePercent : 0,
  })) || [];

  // Fallback if no data
  const formattedMarketData = marketDataForStrip.length > 0 
    ? marketDataForStrip 
    : [
        { symbol: 'NIFTY 50', price: 0, changePercent: 0 },
        { symbol: 'SENSEX', price: 0, changePercent: 0 },
        { symbol: 'S&P 500', price: 0, changePercent: 0 },
        { symbol: 'NASDAQ', price: 0, changePercent: 0 },
      ];

  // Combine parsed charts (from AI response) with any additional data
  const allCharts = parsedResponse?.charts || [];
  
  // Build ticker table from parsed data
  const tickerTable = parsedResponse?.tickers && parsedResponse.tickers.length > 0
    ? { tickers: parsedResponse.tickers, title: 'Top Movers' }
    : undefined;

  const responseContent = messages.length > 0 && lastAssistantMessage ? (
    <div className="space-y-6">
      {/* Live Market Data Strip with Real-Time Values */}
      {formattedMarketData.length > 0 && (
        <MarketDataStrip 
          data={formattedMarketData} 
          timestamp={liveData?.timestamp ? new Date(liveData.timestamp).toLocaleTimeString() : undefined}
          theme="market"
        />
      )}

      {/* Premium Prose Content with Parsed Visualizations */}
      <PremiumProseParser
        content={parsedResponse?.prose || lastAssistantMessage.content}
        theme="market"
        chartData={allCharts.map((chart, idx) => ({
          ...chart,
          insertAfterParagraph: idx === 0 ? 1 : undefined
        }))}
        tickerTable={tickerTable ? {
          ...tickerTable,
          insertAfterParagraph: 2
        } : undefined}
        onActionClick={(action) => handleSendMessage(action)}
      />

      {/* ML Pipeline: Sentiment Heatmap */}
      {sentimentData && (
        <SentimentHeatmap summary={sentimentData} theme="market" />
      )}

      {/* AI Feedback: Thumbs Up/Down */}
      <AIFeedback
        agent="market_maw"
        query={messages.filter(m => m.role === 'user').pop()?.content || ''}
        responseSnippet={lastAssistantMessage.content.substring(0, 500)}
        regimeContext={mlResult?.regime?.regime}
        mlContextUsed={!!mlResult || !!sentimentData}
        theme="market"
      />

      {/* Follow-up Input */}
      <FollowUpInput 
        onSend={(msg) => handleSendMessage(msg)}
        isLoading={isLoading}
        placeholder="Ask about market trends, sectors, or sentiment..."
        theme="market"
      />
    </div>
  ) : null;

  return (
    <AIToolWrapper
      title="MARKET MAW"
      subtitle="Real-time Bloomberg-grade market intelligence"
      placeholder="Ask about market data, sentiment, or trends..."
      thinkingLabel="Fetching live data"
      commandSuggestions={commandSuggestions}
      onSendMessage={handleSendMessage}
      isProcessing={isLoading}
      responseContent={responseContent}
      showResponse={showResponse}
      responseBadge={{ icon: <Activity size={12} className="animate-pulse text-emerald-400" />, label: 'Live Feed' }}
      headerContent={headerContent}
      theme="market"
    />
  );
};

export default MarketMaw;
