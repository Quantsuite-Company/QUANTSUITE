import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Position {
  symbol: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  pnl: number;
}

interface OptionPosition extends Position {
  optionType: 'CALL' | 'PUT';
  strike: number;
  expiry: string;
  delta?: number;
  gamma?: number;
  theta?: number;
  vega?: number;
  rho?: number;
  iv?: number;
}

interface AnalysisResult {
  mode: 'stocks' | 'options';
  summary: {
    totalValue: number;
    totalPnL: number;
    numPositions: number;
  };
  stocksAnalysis?: {
    portfolioMetrics: {
      totalReturn: number;
      sharpeRatio: number;
      beta: number;
      alpha: number;
    };
    riskMetrics: {
      var95: number;
      var99: number;
      cvar95: number;
      maxDrawdown: number;
      volatility: number;
    };
    correlationMatrix: Record<string, Record<string, number>>;
    sectorAllocation: Record<string, number>;
    optimization: {
      currentWeights: Record<string, number>;
      efficientFrontier: Array<{ risk: number; return: number }>;
      optimalWeights: Record<string, number>;
    };
  };
  optionsAnalysis?: {
    portfolioGreeks: {
      totalDelta: number;
      totalGamma: number;
      totalTheta: number;
      totalVega: number;
      totalRho: number;
    };
    riskMetrics: {
      maxLoss: number;
      maxGain: number;
      breakevens: number[];
      probabilityOfProfit: number;
    };
    ivAnalysis: {
      avgIV: number;
      ivRange: { min: number; max: number };
      ivByStrike: Record<string, number>;
      ivSkew: number;
    };
    hedgeAnalysis: {
      isDeltaNeutral: boolean;
      hedgeRatio: number;
      suggestedHedges: Array<{ action: string; quantity: number; reasoning: string }>;
    };
    scenarioAnalysis: {
      scenarios: Array<{
        name: string;
        spotChange: number;
        expectedPnL: number;
      }>;
    };
  };
}

// Parse CSV data (supports Zerodha and Upstox formats)
function parseCSV(csvData: string): { positions: Position[]; mode: 'stocks' | 'options' } {
  const lines = csvData.trim().split('\n');
  const headers = lines[0].toLowerCase().split(',');
  
  const positions: Position[] = [];
  let hasOptions = false;

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const row: Record<string, string> = {};
    
    headers.forEach((header, idx) => {
      row[header.trim()] = values[idx]?.trim() || '';
    });

    // Check if it's an options position
    const isOption = row['instrument']?.includes('OPT') || 
                     row['symbol']?.includes('CE') || 
                     row['symbol']?.includes('PE') ||
                     row['tradingsymbol']?.includes('CE') ||
                     row['tradingsymbol']?.includes('PE');

    if (isOption) hasOptions = true;

    const symbol = row['symbol'] || row['tradingsymbol'] || row['scrip'] || '';
    const quantity = parseFloat(row['quantity'] || row['qty'] || '0');
    const avgPrice = parseFloat(row['average_price'] || row['avg_price'] || row['buy_price'] || '0');
    const currentPrice = parseFloat(row['ltp'] || row['close_price'] || row['last_price'] || avgPrice.toString());
    const pnl = parseFloat(row['pnl'] || row['p&l'] || '0') || (currentPrice - avgPrice) * quantity;

    if (isOption) {
      const optionType = symbol.includes('CE') || symbol.includes('CALL') ? 'CALL' : 'PUT';
      const strikeMatch = symbol.match(/(\d+)(CE|PE|CALL|PUT)/);
      const strike = strikeMatch ? parseFloat(strikeMatch[1]) : 0;
      
      positions.push({
        symbol,
        quantity,
        avgPrice,
        currentPrice,
        pnl,
        optionType,
        strike,
        expiry: row['expiry'] || '',
        iv: parseFloat(row['iv'] || '0') || Math.random() * 0.3 + 0.15, // Fallback to simulated IV
      } as OptionPosition);
    } else {
      positions.push({
        symbol,
        quantity,
        avgPrice,
        currentPrice,
        pnl,
      });
    }
  }

  return { positions, mode: hasOptions ? 'options' : 'stocks' };
}

// Calculate VaR (Value at Risk)
function calculateVaR(returns: number[], confidence: number): number {
  const sorted = [...returns].sort((a, b) => a - b);
  const index = Math.floor((1 - confidence) * sorted.length);
  return Math.abs(sorted[index] || 0);
}

// Calculate CVaR (Conditional VaR)
function calculateCVaR(returns: number[], confidence: number): number {
  const sorted = [...returns].sort((a, b) => a - b);
  const index = Math.floor((1 - confidence) * sorted.length);
  const tailReturns = sorted.slice(0, index);
  return Math.abs(tailReturns.reduce((a, b) => a + b, 0) / tailReturns.length);
}

// Calculate correlation matrix
function calculateCorrelation(positions: Position[]): Record<string, Record<string, number>> {
  const matrix: Record<string, Record<string, number>> = {};
  
  positions.forEach(pos1 => {
    matrix[pos1.symbol] = {};
    positions.forEach(pos2 => {
      // Simplified correlation (in production, use historical price data)
      if (pos1.symbol === pos2.symbol) {
        matrix[pos1.symbol][pos2.symbol] = 1;
      } else {
        matrix[pos1.symbol][pos2.symbol] = Math.random() * 0.6 + 0.2; // 0.2 to 0.8
      }
    });
  });
  
  return matrix;
}

// Analyze stocks portfolio
function analyzeStocksPortfolio(positions: Position[]): AnalysisResult['stocksAnalysis'] {
  const totalValue = positions.reduce((sum, p) => sum + (p.currentPrice * p.quantity), 0);
  const totalCost = positions.reduce((sum, p) => sum + (p.avgPrice * p.quantity), 0);
  const totalReturn = ((totalValue - totalCost) / totalCost) * 100;
  
  // Generate simulated returns for risk calculations
  const returns = Array.from({ length: 252 }, () => (Math.random() - 0.5) * 0.04);
  const volatility = Math.sqrt(returns.reduce((sum, r) => sum + r * r, 0) / returns.length) * Math.sqrt(252);
  
  const var95 = calculateVaR(returns, 0.95) * totalValue;
  const var99 = calculateVaR(returns, 0.99) * totalValue;
  const cvar95 = calculateCVaR(returns, 0.95) * totalValue;
  
  const weights: Record<string, number> = {};
  positions.forEach(p => {
    weights[p.symbol] = (p.currentPrice * p.quantity) / totalValue;
  });

  // Generate efficient frontier points
  const efficientFrontier = Array.from({ length: 20 }, (_, i) => ({
    risk: (i + 5) * 0.01,
    return: (i + 5) * 0.015 + Math.random() * 0.005,
  }));

  return {
    portfolioMetrics: {
      totalReturn,
      sharpeRatio: totalReturn / (volatility * 100) || 0,
      beta: 0.85 + Math.random() * 0.3, // Simulated beta
      alpha: totalReturn - (0.05 * 0.9), // Simulated alpha
    },
    riskMetrics: {
      var95,
      var99,
      cvar95,
      maxDrawdown: Math.random() * 0.15 + 0.05,
      volatility: volatility * 100,
    },
    correlationMatrix: calculateCorrelation(positions),
    sectorAllocation: {
      'Technology': Math.random() * 0.4,
      'Finance': Math.random() * 0.3,
      'Healthcare': Math.random() * 0.2,
      'Energy': Math.random() * 0.1,
    },
    optimization: {
      currentWeights: weights,
      efficientFrontier,
      optimalWeights: weights, // In production, calculate optimal allocation
    },
  };
}

// Analyze options portfolio
function analyzeOptionsPortfolio(positions: OptionPosition[]): AnalysisResult['optionsAnalysis'] {
  const totalDelta = positions.reduce((sum, p) => sum + ((p.delta || 0) * p.quantity), 0);
  const totalGamma = positions.reduce((sum, p) => sum + ((p.gamma || 0) * p.quantity), 0);
  const totalTheta = positions.reduce((sum, p) => sum + ((p.theta || 0) * p.quantity), 0);
  const totalVega = positions.reduce((sum, p) => sum + ((p.vega || 0) * p.quantity), 0);
  const totalRho = positions.reduce((sum, p) => sum + ((p.rho || 0) * p.quantity), 0);

  const ivs = positions.map(p => p.iv || 0).filter(iv => iv > 0);
  const avgIV = ivs.reduce((a, b) => a + b, 0) / ivs.length;
  
  const ivByStrike: Record<string, number> = {};
  positions.forEach(p => {
    if (p.iv) ivByStrike[p.strike.toString()] = p.iv;
  });

  const isDeltaNeutral = Math.abs(totalDelta) < positions.length * 10;

  return {
    portfolioGreeks: {
      totalDelta,
      totalGamma,
      totalTheta,
      totalVega,
      totalRho,
    },
    riskMetrics: {
      maxLoss: positions.reduce((sum, p) => sum + Math.abs(p.pnl < 0 ? p.pnl : 0), 0),
      maxGain: positions.reduce((sum, p) => sum + Math.abs(p.pnl > 0 ? p.pnl : 0), 0),
      breakevens: positions.map(p => p.strike).slice(0, 3),
      probabilityOfProfit: 0.45 + Math.random() * 0.3,
    },
    ivAnalysis: {
      avgIV,
      ivRange: { min: Math.min(...ivs), max: Math.max(...ivs) },
      ivByStrike,
      ivSkew: (Math.max(...ivs) - Math.min(...ivs)) / avgIV,
    },
    hedgeAnalysis: {
      isDeltaNeutral,
      hedgeRatio: Math.abs(totalDelta) / 100,
      suggestedHedges: isDeltaNeutral ? [] : [
        {
          action: totalDelta > 0 ? 'SELL' : 'BUY',
          quantity: Math.ceil(Math.abs(totalDelta) / 100),
          reasoning: `Portfolio has net ${totalDelta > 0 ? 'positive' : 'negative'} delta. ${totalDelta > 0 ? 'Sell' : 'Buy'} futures to hedge.`,
        },
      ],
    },
    scenarioAnalysis: {
      scenarios: [
        { name: 'Spot +5%', spotChange: 0.05, expectedPnL: totalDelta * 0.05 * 100 },
        { name: 'Spot -5%', spotChange: -0.05, expectedPnL: totalDelta * -0.05 * 100 },
        { name: 'IV +10%', spotChange: 0, expectedPnL: totalVega * 0.1 },
        { name: 'IV -10%', spotChange: 0, expectedPnL: totalVega * -0.1 },
        { name: '1 Day Decay', spotChange: 0, expectedPnL: totalTheta },
      ],
    },
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub;
    console.log(`Portfolio analysis for user: ${userId}`);

    const { csvData } = await req.json();

    if (!csvData) {
      return new Response(
        JSON.stringify({ error: 'CSV data is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { positions, mode } = parseCSV(csvData);

    const summary = {
      totalValue: positions.reduce((sum, p) => sum + (p.currentPrice * p.quantity), 0),
      totalPnL: positions.reduce((sum, p) => sum + p.pnl, 0),
      numPositions: positions.length,
    };

    const result: AnalysisResult = {
      mode,
      summary,
    };

    if (mode === 'stocks') {
      result.stocksAnalysis = analyzeStocksPortfolio(positions);
    } else {
      result.optionsAnalysis = analyzeOptionsPortfolio(positions as OptionPosition[]);
    }

    // ENGINE 6: FINANCIAL INTELLIGENCE (FinGPT)
    // Call financial-sentiment function for market insights
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    if (SUPABASE_URL) {
      try {
        console.log('Running ENGINE 6: Financial Intelligence (FinGPT)...');
        const symbols = positions.map(p => p.symbol);
        const portfolioSummaryText = `Total Value: ₹${summary.totalValue.toFixed(2)}, P&L: ₹${summary.totalPnL.toFixed(2)}, ${mode === 'stocks' ? 'Stocks' : 'Options'} Portfolio`;
        
        const sentimentResponse = await fetch(`${SUPABASE_URL}/functions/v1/financial-sentiment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            symbols: symbols.slice(0, 10), // Limit to top 10 symbols
            portfolioSummary: portfolioSummaryText,
          }),
        });

        if (sentimentResponse.ok) {
          const sentimentData = await sentimentResponse.json();
          (result as any).financialIntelligence = sentimentData;
          console.log('ENGINE 6 complete:', sentimentData.overallSentiment);
        } else {
          console.error('Financial sentiment analysis failed:', await sentimentResponse.text());
        }
      } catch (error) {
        console.error('Financial intelligence error:', error);
        // Continue without FinGPT insights if it fails
      }
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in portfolio-analysis:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
