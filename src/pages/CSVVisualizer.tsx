import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { UploadZone } from '@/components/csv/UploadZone';
import { PortfolioDashboard } from '@/components/csv/PortfolioDashboard';
import { TradeAnalysis } from '@/components/csv/TradeAnalysis';
import { OptionsAnalyzer } from '@/components/csv/OptionsAnalyzer';
import { RiskMetrics } from '@/components/csv/RiskMetrics';
import { InsightsEngine } from '@/components/csv/InsightsEngine';
import { ChartGallery } from '@/components/csv/ChartGallery';
import { parseCSV, ParsedPortfolio, normalizeToUnified, UnifiedPosition, detectCurrency } from '@/lib/csvParser';
import { 
  calculatePortfolioMetrics, 
  calculateEquityVsOptions,
  calculateRiskMetrics 
} from '@/lib/portfolioCalculator';
import { generateInsights } from '@/lib/insightRules';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { DocumentDownload, ArrowRotateLeft, Send2, PercentageSquare, ChartSquare, TrendUp, MessageQuestion, ShieldTick } from 'iconsax-react';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import { generatePortfolioPDF } from '@/lib/pdfGenerator';
import { IconWrapper } from '@/components/icons/IconWrapper';
import { iconConfig } from '@/lib/iconConfig';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export default function CSVVisualizer() {
  const [portfolio, setPortfolio] = useState<ParsedPortfolio | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [portfolioName, setPortfolioName] = useState<string>('');
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const portfolioId = searchParams.get('portfolioId');
  const [portfolios, setPortfolios] = useState<any[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>('');
  const [unifiedPositions, setUnifiedPositions] = useState<UnifiedPosition[]>([]);
  const [currency, setCurrency] = useState<'₹' | '$'>('$');

  // Fetch user's portfolios on mount
  useEffect(() => {
    const fetchPortfolios = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('portfolios')
          .select('id, name, created_at, positions, metadata')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        setPortfolios(data || []);
      } catch (error: any) {
        console.error('Error fetching portfolios:', error);
      }
    };

    fetchPortfolios();
  }, [user]);

  // Load saved portfolio data on mount
  useEffect(() => {
    const loadSavedPortfolio = async () => {
      if (!portfolioId || !user) return;

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('portfolios')
          .select('*')
          .eq('id', portfolioId)
          .eq('user_id', user.id)
          .single();

        if (error) throw error;

        if (data && Array.isArray(data.positions) && data.positions.length > 0) {
          const positions = data.positions as any[];
          
          console.log('=== PORTFOLIO LOAD DEBUG ===');
          console.log('Portfolio name:', data.name);
          console.log('Raw positions from DB:', JSON.stringify(positions.slice(0, 2), null, 2));
          
          // Detect currency before normalization
          const detectedCurrency = detectCurrency(positions);
          setCurrency(detectedCurrency);
          
          // Normalize positions to unified format (handles both CSV and Portfolio Builder)
          const unified = positions.map(normalizeToUnified);
          setUnifiedPositions(unified);
          
          console.log('Normalized positions sample:', JSON.stringify(unified.slice(0, 2), null, 2));
          console.log('Currency detected:', detectedCurrency);
          console.log('Total unified positions:', unified.length);
          console.log('Sample values:', unified.slice(0, 3).map(p => ({
            symbol: p.symbol,
            quantity: p.quantity,
            avgPrice: p.avgPrice,
            value: p.value,
            pnl: p.pnl
          })));
          
          // Still set portfolio for broker info if it's CSV format
          const isCSVFormat = positions.some(p => 'instrument' in p && !('ticker' in p));
          if (isCSVFormat) {
            const savedPortfolio: ParsedPortfolio = {
              positions: positions as ParsedPortfolio['positions'],
              broker: (positions[0]?.broker as 'zerodha' | 'upstox') || 'zerodha',
              parseDate: new Date(data.updated_at)
            };
            setPortfolio(savedPortfolio);
          }
          
          setPortfolioName(data.name);
          toast({
            title: "Portfolio Loaded",
            description: `Loaded ${data.name} with ${positions.length} positions (${detectedCurrency})`
          });
        }
      } catch (error: any) {
        console.error('Error loading portfolio:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to load portfolio",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadSavedPortfolio();
  }, [portfolioId, user, toast]);

  // Handle portfolio selection change
  const handlePortfolioSelect = async (portfolioId: string) => {
    if (!user) return;
    
    setIsLoading(true);
    setSelectedPortfolioId(portfolioId);
    
    try {
      const { data, error } = await supabase
        .from('portfolios')
        .select('*')
        .eq('id', portfolioId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (data && Array.isArray(data.positions) && data.positions.length > 0) {
        const positions = data.positions as any[];
        
        console.log('=== PORTFOLIO SELECT DEBUG ===');
        console.log('Portfolio name:', data.name);
        console.log('Raw positions sample (first 2):', JSON.stringify(positions.slice(0, 2), null, 2));
        
        // Detect currency before normalization
        const detectedCurrency = detectCurrency(positions);
        setCurrency(detectedCurrency);
        
        // Normalize to unified format
        const unified = positions.map(normalizeToUnified);
        setUnifiedPositions(unified);
        
        console.log('Normalized sample (first 2):', JSON.stringify(unified.slice(0, 2), null, 2));
        console.log('Currency detected:', detectedCurrency);
        console.log('Value check (first 3):', unified.slice(0, 3).map(p => 
          `${p.symbol}: qty=${p.quantity} × $${p.avgPrice} = $${p.value}`
        ));
        
        // Check if CSV format
        const isCSVFormat = positions.some(p => 'instrument' in p && !('ticker' in p));
        if (isCSVFormat) {
          const savedPortfolio: ParsedPortfolio = {
            positions: positions as ParsedPortfolio['positions'],
            broker: (positions[0]?.broker as 'zerodha' | 'upstox') || 'zerodha',
            parseDate: new Date(data.updated_at)
          };
          setPortfolio(savedPortfolio);
        } else {
          setPortfolio(null); // Clear CSV portfolio if not CSV format
        }
        
        setPortfolioName(data.name);
        toast({
          title: "Portfolio Loaded",
          description: `Loaded ${data.name} with ${positions.length} positions (${detectedCurrency})`
        });
      }
    } catch (error: any) {
      console.error('Error loading portfolio:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load portfolio",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = async (file: File) => {
    setIsLoading(true);
    try {
      const parsed = await parseCSV(file);
      setPortfolio(parsed);
      
      // Detect currency (CSV = rupees)
      setCurrency('₹');
      
      // Convert to unified format
      const unified = parsed.positions.map(normalizeToUnified);
      setUnifiedPositions(unified);

      // Save to database if portfolioId exists
      if (portfolioId && user) {
        const { error } = await supabase
          .from('portfolios')
          .update({
            positions: parsed.positions as any,
            metadata: {
              broker: parsed.broker,
              lastUpdated: new Date().toISOString()
            }
          })
          .eq('id', portfolioId)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error saving portfolio:', error);
          toast({
            title: "Warning",
            description: "Portfolio analyzed but not saved to database",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Portfolio Saved",
            description: `Successfully saved ${parsed.positions.length} positions`
          });
        }
      } else {
        toast({
          title: "Portfolio Loaded",
          description: `Successfully analyzed ${parsed.positions.length} positions from ${parsed.broker.toUpperCase()}`
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to parse CSV",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setPortfolio(null);
    setUnifiedPositions([]);
    setSelectedPortfolioId('');
    setCurrency('$');
    toast({
      title: "Reset",
      description: "Upload a new CSV or select a portfolio"
    });
  };

  const handleExportPDF = async () => {
    if (unifiedPositions.length === 0) return;
    
    const metrics = calculatePortfolioMetrics(unifiedPositions);
    const equityVsOptions = calculateEquityVsOptions(unifiedPositions);
    const riskMetrics = calculateRiskMetrics(unifiedPositions);
    
    toast({
      title: "Generating PDF...",
      description: "Creating your professional portfolio report"
    });
    
    try {
      // Create a mock ParsedPortfolio for PDF generation if using unified positions
      const mockPortfolio = portfolio || {
        positions: unifiedPositions as any,
        broker: 'zerodha' as const,
        parseDate: new Date()
      };
      await generatePortfolioPDF(mockPortfolio, metrics, riskMetrics, equityVsOptions);
      toast({
        title: "PDF Downloaded",
        description: "Your portfolio analysis report is ready"
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to generate PDF",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Loading portfolio data...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (unifiedPositions.length === 0) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">Universal Portfolio Visualizer</h1>
            <p className="text-lg text-muted-foreground">
              Upload a CSV (Zerodha/Upstox) or select an existing portfolio from Portfolio Builder
            </p>
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              <Badge variant="secondary" className="px-4 py-2 text-sm flex items-center gap-2 bg-gradient-to-br from-primary/20 to-accent/20 border-primary/30">
                <Send2 variant="Bold" size={18} className="text-primary" /> No AI Needed
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 text-sm flex items-center gap-2 bg-gradient-to-br from-primary/20 to-accent/20 border-primary/30">
                <PercentageSquare variant="Bold" size={18} className="text-primary" /> 100% Logic-Based
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 text-sm flex items-center gap-2 bg-gradient-to-br from-primary/20 to-accent/20 border-primary/30">
                <ChartSquare variant="Bold" size={18} className="text-primary" /> Deep Insights
              </Badge>
            </div>
          </div>
          
          {/* Portfolio Selector */}
          {portfolios.length > 0 && (
            <Card className="mb-6 glass-card border-border/40">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-foreground">
                  Select Existing Portfolio
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Load and visualize any portfolio from Portfolio Builder or CSV uploads
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {portfolios.map((p) => (
                    <Card
                      key={p.id}
                      className={`cursor-pointer transition-all hover:border-primary/60 ${
                        selectedPortfolioId === p.id ? 'border-primary bg-primary/10' : 'border-border/40'
                      }`}
                      onClick={() => handlePortfolioSelect(p.id)}
                    >
                      <CardContent className="pt-6">
                        <h3 className="font-semibold text-foreground">{p.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {Array.isArray(p.positions) ? p.positions.length : 0} positions • 
                          {new Date(p.created_at).toLocaleDateString()}
                        </p>
                        {p.metadata?.portfolioSize && (
                          <p className="text-sm text-primary font-semibold mt-1">
                            ${p.metadata.portfolioSize.toLocaleString()}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 border-t border-border/40"></div>
            <span className="text-muted-foreground font-medium">OR</span>
            <div className="flex-1 border-t border-border/40"></div>
          </div>

          <UploadZone onFileSelect={handleFileSelect} isLoading={isLoading} />

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="hover:shadow-xl hover:scale-105 transition-all cursor-pointer border-2">
              <CardHeader>
                <IconWrapper 
                  icon={<TrendUp variant="Bulk" />}
                  {...iconConfig.csvVisualizer.features}
                  className="mb-3"
                />
                <CardTitle>Portfolio Metrics</CardTitle>
                <CardDescription>
                  Complete P&L analysis, equity vs options breakdown, and performance tracking
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-xl hover:scale-105 transition-all cursor-pointer border-2">
              <CardHeader>
                <IconWrapper 
                  icon={<MessageQuestion variant="Bulk" />}
                  {...iconConfig.csvVisualizer.features}
                  className="mb-3"
                />
                <CardTitle>Options Analysis</CardTitle>
                <CardDescription>
                  Strategy detection, Greeks analysis, and expiry risk management
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-xl hover:scale-105 transition-all cursor-pointer border-2">
              <CardHeader>
                <IconWrapper 
                  icon={<ShieldTick variant="Bulk" />}
                  {...iconConfig.csvVisualizer.features}
                  className="mb-3"
                />
                <CardTitle>Risk Insights</CardTitle>
                <CardDescription>
                  Concentration risk, position sizing, and diversification analysis
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  // Use unified positions for all calculations
  const metrics = calculatePortfolioMetrics(unifiedPositions);
  const equityVsOptions = calculateEquityVsOptions(unifiedPositions);
  const riskMetrics = calculateRiskMetrics(unifiedPositions);
  const insights = generateInsights(metrics, riskMetrics, equityVsOptions);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">
              {portfolioName || 'Portfolio Analysis'}
            </h1>
            <p className="text-muted-foreground">
              {portfolio ? `${portfolio.broker.toUpperCase()} • ` : ''}
              {unifiedPositions.length} positions
              {portfolio ? ` • Uploaded ${portfolio.parseDate.toLocaleDateString()}` : ''}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset} size="lg" className="gap-2">
              <ArrowRotateLeft variant="Bold" size={20} />
              New Upload
            </Button>
            <Button onClick={handleExportPDF} size="lg" className="gap-2">
              <DocumentDownload variant="Bold" size={20} />
              Export PDF
            </Button>
          </div>
        </div>

        <div className="space-y-8">
          <div data-pdf-section="dashboard">
            <PortfolioDashboard metrics={metrics} currency={currency} hasRealPnL={!!portfolio} />
          </div>
          
          <Separator />
          
          <TradeAnalysis positions={unifiedPositions as any} />
          
          <Separator />
          
          <OptionsAnalyzer positions={unifiedPositions as any} />
          
          <Separator />
          
          <RiskMetrics riskMetrics={riskMetrics} equityVsOptions={equityVsOptions} />
          
          <Separator />
          
          <InsightsEngine insights={insights} positions={unifiedPositions as any} />
          
          <Separator />
          
          <div data-pdf-section="charts">
            <ChartGallery 
              positions={unifiedPositions as any} 
              equityVsOptions={equityVsOptions} 
              currency={currency}
              isPortfolioBuilder={!portfolio}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}
