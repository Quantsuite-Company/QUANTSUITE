export interface ModelInputs {
  price?: number;
  strike?: number;
  vol?: number;
  expiry?: number;
  riskFreeRate?: number;
  dividendYield?: number;
  optionType?: 'call' | 'put';
  steps?: number;
  simulations?: number;
  
  // Quant Engine specific inputs
  alphaMetrics?: { [alphaId: string]: any };
  alphaWeights?: { [alphaId: string]: number };
  dataQuality?: { [ticker: string]: any };
  portfolioWeights?: { [ticker: string]: number };
  signalScores?: Array<{ ticker: string; score: number; signals: { [alphaId: string]: number } }>;
  targetVolatility?: number;
  maxPerAsset?: number;
  
  [key: string]: any;
}

export interface ModelOutputs {
  // Black-Scholes outputs
  delta?: number;
  gamma?: number;
  theta?: number;
  vega?: number;
  rho?: number;
  optionPrice?: number;
  
  // Monte Carlo outputs
  paths?: number[][];
  finalPrices?: number[];
  probITM?: number;
  
  // Binomial outputs
  earlyExercise?: boolean;
  optimalExerciseStep?: number;
  
  // Arbitrage outputs
  parityCheck?: boolean;
  arbitrageProfit?: number;
  
  // Volatility forecasting outputs
  garchForecast?: number[];
  ewmaForecast?: number[];
  neuralForecast?: number[];
  currentVol?: number;
  
  [key: string]: any;
}

export interface ExplanationResult {
  headline: string;
  simpleInsight: string;
  analogy: string;
  deeperDive: string;
  riskLevel: 'low' | 'medium' | 'high';
  confidence: number;
}

export class ExplanationEngine {
  private modelName: string;
  private inputs: ModelInputs;
  private outputs: ModelOutputs;

  constructor(modelName: string, inputs: ModelInputs, outputs: ModelOutputs) {
    this.modelName = modelName;
    this.inputs = inputs;
    this.outputs = outputs;
  }

  explain(): ExplanationResult {
    switch (this.modelName.toLowerCase()) {
      case 'blackscholes':
      case 'bsm':
        return this.explainBlackScholes();
      case 'montecarlo':
        return this.explainMonteCarlo();
      case 'binomial':
        return this.explainBinomial();
      case 'arbitrage':
      case 'arbitrage detector':
        return this.explainArbitrage();
      case 'volatility':
      case 'mlvolatility':
      case 'ml volatility forecasting':
        return this.explainVolatilityForecasting();
      case 'greeks':
        return this.explainGreeks();
      case 'quantengine-performance':
        return this.explainQuantEnginePerformance();
      case 'quantengine-results':
        return this.explainQuantEngineResults();
      case 'creditrisk':
      case 'credit risk':
      case 'drsk':
        return this.explainCreditRisk();
      case 'mibd':
      case 'market implied':
        return this.explainMIBD();
      case 'defaultprobability':
      case 'default probability':
        return this.explainDefaultProbability();
      case 'lgd':
      case 'ead':
      case 'expected loss':
        return this.explainLGDEAD();
      default:
        return {
          headline: "⚡ Analysis Complete!",
          simpleInsight: "Your calculation is ready - check the results above.",
          analogy: "Think of this like a financial calculator giving you the numbers you need.",
          deeperDive: "This model provides quantitative analysis to help inform your trading decisions.",
          riskLevel: 'medium',
          confidence: 0.8
        };
    }
  }

  private explainBlackScholes(): ExplanationResult {
    const delta = this.outputs.delta || 0;
    const optionPrice = this.outputs.optionPrice || 0;
    const { price = 0, strike = 0, optionType = 'call' } = this.inputs;

    let headline = "";
    let simpleInsight = "";
    let analogy = "";
    let riskLevel: 'low' | 'medium' | 'high' = 'medium';

    if (Math.abs(delta) > 0.7) {
      headline = "🚀 High-Speed Option - Buckle Up!";
      simpleInsight = `Your ${optionType} is super sensitive to stock moves. When the stock moves $1, your option moves about $${Math.abs(delta).toFixed(2)}.`;
      analogy = "Think of it like a sports car - small movements in the gas pedal create big changes in speed!";
      riskLevel = 'high';
    } else if (Math.abs(delta) < 0.3) {
      headline = "🐌 Steady Eddie Option";
      simpleInsight = `Your ${optionType} barely reacts to stock price changes. It's like having cruise control on.`;
      analogy = "Like a heavy truck - takes a lot of force to change direction, but very stable.";
      riskLevel = 'low';
    } else {
      headline = "⚖️ Balanced Option Play";
      simpleInsight = `Your ${optionType} has moderate sensitivity. Nice middle ground between risk and stability.`;
      analogy = "Like a family sedan - responsive but not too wild.";
      riskLevel = 'medium';
    }

    const moneyness = optionType === 'call' ? price - strike : strike - price;
    const deeperDive = `Technical details: Delta ${delta.toFixed(3)} means ${(Math.abs(delta) * 100).toFixed(0)}% correlation with stock moves. 
    ${moneyness > 0 ? 'Currently in-the-money' : 'Currently out-of-the-money'} by $${Math.abs(moneyness).toFixed(2)}.
    Option fair value: $${optionPrice.toFixed(2)}`;

    return {
      headline,
      simpleInsight,
      analogy,
      deeperDive,
      riskLevel,
      confidence: 0.85
    };
  }

  private explainMonteCarlo(): ExplanationResult {
    const paths = this.outputs.paths || [];
    const probITM = this.outputs.probITM || 0;
    const finalPrices = this.outputs.finalPrices || [];
    const { strike = 0, optionType = 'call' } = this.inputs;

    if (finalPrices.length === 0) {
      return {
        headline: "🎲 Monte Carlo Ready",
        simpleInsight: "Run the simulation to see thousands of possible outcomes!",
        analogy: "Like having a crystal ball that shows you all possible futures.",
        deeperDive: "Monte Carlo simulation will generate multiple price paths to estimate probabilities.",
        riskLevel: 'medium',
        confidence: 0.5
      };
    }

    const avgFinalPrice = finalPrices.reduce((a, b) => a + b, 0) / finalPrices.length;
    const sortedPrices = [...finalPrices].sort((a, b) => a - b);
    const p25 = sortedPrices[Math.floor(sortedPrices.length * 0.25)];
    const p75 = sortedPrices[Math.floor(sortedPrices.length * 0.75)];

    let headline = "";
    let riskLevel: 'low' | 'medium' | 'high' = 'medium';

    if (probITM > 70) {
      headline = "🎯 High Probability Play";
      riskLevel = 'low';
    } else if (probITM < 30) {
      headline = "🎰 Long Shot Bet";
      riskLevel = 'high';
    } else {
      headline = "⚖️ Coin Flip Territory";
      riskLevel = 'medium';
    }

    const simpleInsight = `Out of ${finalPrices.length} simulations, ${probITM.toFixed(1)}% ended profitable. Most prices clustered between $${p25.toFixed(2)} and $${p75.toFixed(2)}.`;

    const analogy = probITM > 70 ? 
      "Like betting on a strong favorite - good odds of winning!" :
      probITM < 30 ?
      "Like betting on an underdog - big payoff but risky!" :
      "Like flipping a coin - could go either way.";

    const deeperDive = `Simulation Details:
    • Average final price: $${avgFinalPrice.toFixed(2)}
    • 25th percentile: $${p25.toFixed(2)}
    • 75th percentile: $${p75.toFixed(2)}
    • Strike price: $${strike}
    • Win probability (ITM): ${probITM.toFixed(1)}%
    • Price range covers $${(p75 - p25).toFixed(2)} spread`;

    return {
      headline,
      simpleInsight,
      analogy,
      deeperDive,
      riskLevel,
      confidence: 0.9
    };
  }

  private explainBinomial(): ExplanationResult {
    const earlyExercise = this.outputs.earlyExercise || false;
    const optimalStep = this.outputs.optimalExerciseStep;
    const { optionType = 'call', steps = 0 } = this.inputs;

    let headline = "";
    let simpleInsight = "";
    let analogy = "";

    if (earlyExercise && optimalStep) {
      headline = "⏰ Early Bird Gets the Worm!";
      simpleInsight = `Your American ${optionType} should be exercised early at step ${optimalStep} out of ${steps} for maximum profit.`;
      analogy = "Like leaving a party at the perfect time - before it gets boring but after the fun peaks!";
    } else {
      headline = "🕒 Patience Pays Off";
      simpleInsight = `Hold tight! Your ${optionType} is worth more if you wait until expiration.`;
      analogy = "Like aging wine - gets better with time, so don't open the bottle too early!";
    }

    const deeperDive = `Binomial Tree Analysis:
    • Tree depth: ${steps} steps
    • Option type: American ${optionType}
    • Early exercise: ${earlyExercise ? 'Recommended' : 'Not recommended'}
    ${optimalStep ? `• Optimal exercise: Step ${optimalStep}` : ''}
    • Strategy: ${earlyExercise ? 'Active monitoring required' : 'Hold to expiration'}`;

    return {
      headline,
      simpleInsight,
      analogy,
      deeperDive,
      riskLevel: earlyExercise ? 'high' : 'low',
      confidence: 0.8
    };
  }

  private explainArbitrage(): ExplanationResult {
    const parityCheck = this.outputs.parityCheck ?? true;
    const arbitrageProfit = this.outputs.arbitrageProfit || 0;

    if (!parityCheck && arbitrageProfit > 0) {
      return {
        headline: "💰 Ka-Ching! Free Money Alert!",
        simpleInsight: `Put-Call Parity is broken! Potential risk-free profit of $${arbitrageProfit.toFixed(2)} detected.`,
        analogy: "Like finding a $100 note on the ground - rare, but when it happens, grab it quickly!",
        deeperDive: `Arbitrage Opportunity:
        • Put-Call Parity violation detected
        • Potential profit: $${arbitrageProfit.toFixed(2)}
        • Risk level: Theoretically risk-free
        • Action needed: Execute trades immediately
        • Warning: Opportunities disappear fast in efficient markets`,
        riskLevel: 'low',
        confidence: 0.95
      };
    }

    return {
      headline: "✅ Market is Playing Fair",
      simpleInsight: "Put-Call Parity holds. No arbitrage opportunities found - the market is efficient.",
      analogy: "Like checking all the doors and finding them locked - everything is secure and working as expected.",
      deeperDive: `Arbitrage Analysis:
      • Put-Call Parity: ✅ Satisfied
      • Market efficiency: High
      • Free lunch opportunities: None detected
      • Interpretation: Fair pricing across call and put options`,
      riskLevel: 'low',
      confidence: 0.9
    };
  }

  private explainVolatilityForecasting(): ExplanationResult {
    const garchForecast = this.outputs.garchForecast || [];
    const ewmaForecast = this.outputs.ewmaForecast || [];
    const neuralForecast = this.outputs.neuralForecast || [];
    const currentVol = this.outputs.currentVol || 0.2;
    const detectiveAccuracy = this.outputs.detectiveAccuracy || 0;
    const trendyAccuracy = this.outputs.trendyAccuracy || 0; 
    const geniusAccuracy = this.outputs.geniusAccuracy || 0;
    const bestModel = this.outputs.bestModel || 'Unknown';
    const selectedDataPoint = this.outputs.selectedDataPoint;
    const ticker = this.inputs.ticker || 'this stock';

    // Calculate average forecasts
    const avgGarch = garchForecast.length > 0 ? garchForecast.reduce((a, b) => a + b, 0) / garchForecast.length : currentVol;
    const avgEwma = ewmaForecast.length > 0 ? ewmaForecast.reduce((a, b) => a + b, 0) / ewmaForecast.length : currentVol;
    const avgNeural = neuralForecast.length > 0 ? neuralForecast.reduce((a, b) => a + b, 0) / neuralForecast.length : currentVol;

    const volChange = ((avgGarch - currentVol) / currentVol) * 100;
    const isVolIncreasing = volChange > 5;
    const isVolDecreasing = volChange < -5;
    
    // Determine best performing model
    const accuracies = { Detective: detectiveAccuracy, Trendy: trendyAccuracy, Genius: geniusAccuracy };
    const topModel = Object.entries(accuracies).reduce((a, b) => a[1] > b[1] ? a : b)[0];
    const topAccuracy = Math.max(detectiveAccuracy, trendyAccuracy, geniusAccuracy);

    let headline = "";
    let riskLevel: 'low' | 'medium' | 'high' = 'medium';
    let simpleInsight = "";

    if (selectedDataPoint) {
      // Specific data point analysis
      const day = selectedDataPoint.day;
      const actual = selectedDataPoint.actual * 100;
      const detective = selectedDataPoint.detective * 100;
      const trendy = selectedDataPoint.trendy * 100;
      const genius = selectedDataPoint.genius * 100;
      
      const bestPrediction = Math.min(
        Math.abs(detective - actual),
        Math.abs(trendy - actual), 
        Math.abs(genius - actual)
      );
      
      headline = `🎯 Day ${day}: ${bestPrediction < 2 ? 'Bulls-eye!' : bestPrediction < 5 ? 'Close Call' : 'Learning Moment'}`;
      simpleInsight = `On Day ${day}, ${ticker} had ${actual.toFixed(1)}% volatility. Detective predicted ${detective.toFixed(1)}%, Trendy said ${trendy.toFixed(1)}%, and Genius thought ${genius.toFixed(1)}%.`;
      riskLevel = bestPrediction < 2 ? 'low' : bestPrediction < 5 ? 'medium' : 'high';
    } else if (topAccuracy > 80) {
      headline = `🏆 ${topModel} is on Fire! ${topAccuracy.toFixed(0)}% Accuracy`;
      simpleInsight = `Our ${topModel} model is crushing it with ${topAccuracy.toFixed(1)}% accuracy on ${ticker}. ${isVolIncreasing ? 'Expecting more market drama ahead!' : isVolDecreasing ? 'Calmer seas predicted.' : 'Steady sailing expected.'}`;
      riskLevel = isVolIncreasing ? 'high' : 'low';
    } else if (topAccuracy > 60) {
      headline = `📊 ${topModel} Leading the Pack at ${topAccuracy.toFixed(0)}%`;
      simpleInsight = `${topModel} is your best bet for ${ticker} with ${topAccuracy.toFixed(1)}% accuracy. The market is ${isVolIncreasing ? 'getting wilder' : isVolDecreasing ? 'cooling down' : 'staying steady'}.`;
      riskLevel = 'medium';
    } else {
      headline = `🎲 Market is Being Unpredictable`;
      simpleInsight = `All models are struggling with ${ticker} (best: ${topAccuracy.toFixed(1)}%). This suggests the market is in an unusual state or transitioning between regimes.`;
      riskLevel = 'high';
    }

    const analogy = selectedDataPoint ? 
      "Like reviewing game footage to see which player made the best call on that crucial play!" :
      topAccuracy > 80 ? 
        `Like having a weather forecaster who's right 8 out of 10 times - you can plan your picnic with confidence!` :
        topAccuracy > 60 ?
          `Like having a good but not perfect GPS - mostly gets you there, but keep your eyes open!` :
          `Like trying to predict Mumbai traffic during monsoon - even the experts are scratching their heads!`;

    const deeperDive = selectedDataPoint ? 
      `Data Point Analysis (Day ${selectedDataPoint.day}):
      • Historical volatility: ${(selectedDataPoint.actual * 100).toFixed(2)}%
      • Detective prediction: ${(selectedDataPoint.detective * 100).toFixed(2)}% (Error: ${Math.abs(selectedDataPoint.detective - selectedDataPoint.actual) * 100 < 1 ? '✅' : '❌'} ${(Math.abs(selectedDataPoint.detective - selectedDataPoint.actual) * 100).toFixed(1)}%)
      • Trendy prediction: ${(selectedDataPoint.trendy * 100).toFixed(2)}% (Error: ${Math.abs(selectedDataPoint.trendy - selectedDataPoint.actual) * 100 < 1 ? '✅' : '❌'} ${(Math.abs(selectedDataPoint.trendy - selectedDataPoint.actual) * 100).toFixed(1)}%)
      • Genius prediction: ${(selectedDataPoint.genius * 100).toFixed(2)}% (Error: ${Math.abs(selectedDataPoint.genius - selectedDataPoint.actual) * 100 < 1 ? '✅' : '❌'} ${(Math.abs(selectedDataPoint.genius - selectedDataPoint.actual) * 100).toFixed(1)}%)
      • Best performer: ${Math.abs(selectedDataPoint.detective - selectedDataPoint.actual) <= Math.min(Math.abs(selectedDataPoint.trendy - selectedDataPoint.actual), Math.abs(selectedDataPoint.genius - selectedDataPoint.actual)) ? 'Detective' : Math.abs(selectedDataPoint.trendy - selectedDataPoint.actual) <= Math.abs(selectedDataPoint.genius - selectedDataPoint.actual) ? 'Trendy' : 'Genius'}` :
      `AI Volatility Forecast for ${ticker}:
      • Detective (GARCH): ${(avgGarch * 100).toFixed(2)}% (Accuracy: ${detectiveAccuracy.toFixed(1)}%)
      • Trendy (EWMA): ${(avgEwma * 100).toFixed(2)}% (Accuracy: ${trendyAccuracy.toFixed(1)}%)
      • Genius (Neural): ${(avgNeural * 100).toFixed(2)}% (Accuracy: ${geniusAccuracy.toFixed(1)}%)
      • Current volatility: ${(currentVol * 100).toFixed(2)}%
      • Predicted change: ${volChange > 0 ? '+' : ''}${volChange.toFixed(1)}%
      • Best model: ${topModel} (${topAccuracy.toFixed(1)}% accurate)
      • Model agreement: ${Math.abs(avgGarch - avgEwma) < 0.02 ? 'Strong consensus' : 'Some disagreement'}
      • Recommendation: ${topAccuracy > 70 ? 'High confidence in predictions' : 'Use with caution, consider multiple scenarios'}`;

    return {
      headline,
      simpleInsight,
      analogy,
      deeperDive,
      riskLevel,
      confidence: selectedDataPoint ? 0.95 : (topAccuracy > 70 ? 0.9 : topAccuracy > 50 ? 0.7 : 0.5)
    };
  }

  private explainGreeks(): ExplanationResult {
    const { delta = 0, gamma = 0, theta = 0, vega = 0 } = this.outputs;
    
    // Determine dominant greek
    const greekScores = {
      delta: Math.abs(delta),
      gamma: Math.abs(gamma) * 100, // Scale gamma for comparison
      theta: Math.abs(theta),
      vega: Math.abs(vega) * 10 // Scale vega for comparison
    };

    const dominantGreek = Object.entries(greekScores).reduce((a, b) => 
      greekScores[a[0]] > greekScores[b[0]] ? a : b
    )[0];

    let headline = "";
    let simpleInsight = "";
    let analogy = "";
    let riskLevel: 'low' | 'medium' | 'high' = 'medium';

    switch (dominantGreek) {
      case 'delta':
        headline = "🎢 Price Roller Coaster";
        simpleInsight = `Your option is most sensitive to stock price changes (Delta: ${delta.toFixed(3)}).`;
        analogy = "Like a speedometer - directly connected to how fast the stock is moving.";
        riskLevel = Math.abs(delta) > 0.7 ? 'high' : 'medium';
        break;
      case 'gamma':
        headline = "⚡ Acceleration Mode";
        simpleInsight = `Your Delta is changing rapidly (Gamma: ${gamma.toFixed(4)}) - buckle up for wild rides!`;
        analogy = "Like the accelerator pedal on a race car - small moves create big speed changes.";
        riskLevel = 'high';
        break;
      case 'theta':
        headline = "⏳ Time is Money (Literally)";
        simpleInsight = `Time decay is your biggest factor (Theta: ${theta.toFixed(3)}) - each day costs you money.`;
        analogy = "Like ice cream melting in the sun - gets less valuable every minute.";
        riskLevel = theta < -1 ? 'high' : 'medium';
        break;
      case 'vega':
        headline = "🌪️ Volatility Surfer";
        simpleInsight = `Your option rides the volatility waves (Vega: ${vega.toFixed(3)}) - when fear spikes, you profit!`;
        analogy = "Like a surfer waiting for the big wave - volatility is your friend!";
        riskLevel = 'medium';
        break;
    }

    const deeperDive = `Greek Analysis:
    • Delta: ${delta.toFixed(4)} (directional exposure)
    • Gamma: ${gamma.toFixed(4)} (delta acceleration)
    • Theta: ${theta.toFixed(4)} (time decay)
    • Vega: ${vega.toFixed(4)} (volatility sensitivity)
    • Dominant factor: ${dominantGreek.toUpperCase()}`;

    return {
      headline,
      simpleInsight,
      analogy,
      deeperDive,
      riskLevel,
      confidence: 0.85
    };
  }

  explainStrategy(strategy: any, metrics: any): ExplanationResult {
    const strategyName = strategy.name;
    const maxProfit = metrics.maxProfit;
    const maxLoss = Math.abs(metrics.maxLoss);
    const capital = metrics.capitalRequired;
    const breakevens = metrics.breakevens;
    const netDelta = metrics.netDelta;
    const netTheta = metrics.netTheta;
    const netVega = metrics.netVega;
    
    // Strategy-specific explanations
    const explanations: Record<string, ExplanationResult> = {
      'Iron Condor': {
        headline: "🦅 The Rent Collector - Boring is Beautiful!",
        simpleInsight: `You're betting the stock will be as exciting as watching paint dry. You sold 4 options creating a "profit zone" in the middle. As long as the stock stays in that zone until expiration, you pocket ₹${maxProfit.toFixed(0)}. It's like being a bookie - you win if nothing crazy happens!`,
        analogy: "You're running a carnival game where players win if they throw the ball OUTSIDE the targets. You keep the ticket money as long as all balls land inside!",
        deeperDive: `Capital needed: ₹${capital.toFixed(0)} • Max win: ₹${maxProfit.toFixed(0)} • Max lose: ₹${maxLoss.toFixed(0)} • Safe zone: Between ₹${breakevens[0]?.toFixed(2) || '?'} and ₹${breakevens[1]?.toFixed(2) || '?'} • You earn ₹${Math.abs(netTheta).toFixed(2)} every day time passes!`,
        riskLevel: 'medium',
        confidence: 0.9
      },
      'Long Straddle': {
        headline: "🌪️ The Chaos Lover - Big Moves Only!",
        simpleInsight: `You bought BOTH a call AND a put at the same strike. You're betting the stock will have a massive move - you don't care if it goes up or down, just that it MOVES! You paid ₹${capital.toFixed(0)} for this bet. If stock moves beyond ₹${breakevens[0]?.toFixed(2) || '?'} or ₹${breakevens[1]?.toFixed(2) || '?'}, you start making money!`,
        analogy: "You bought insurance on both your car and your neighbor's car. If EITHER crashes, you win. You just need SOMETHING to happen!",
        deeperDive: `Paid: ₹${capital.toFixed(0)} • Unlimited profit potential! 🚀 • Need stock to move at least ₹${Math.abs(breakevens[1] - breakevens[0]).toFixed(2)} • Losing ₹${Math.abs(netTheta).toFixed(2)} every day (time is enemy!) • Love volatility spikes!`,
        riskLevel: 'high',
        confidence: 0.9
      },
      'Bull Call Spread': {
        headline: "🐂 The Optimist's Bet - Up We Go!",
        simpleInsight: `You're bullish but playing it smart. You bought a call and sold another at a higher strike. This caps your profit at ₹${maxProfit.toFixed(0)} but also reduces your cost to ₹${capital.toFixed(0)}. Stock needs to go above ₹${breakevens[0]?.toFixed(2) || '?'} to start making money!`,
        analogy: "Like betting your team will win by at least 2 goals. You get paid if they win, but profit is capped. But hey, at least the bet was cheap!",
        deeperDive: `Cost: ₹${capital.toFixed(0)} • Max win: ₹${maxProfit.toFixed(0)} (${((maxProfit/capital)*100).toFixed(0)}% return!) • Max lose: ₹${maxLoss.toFixed(0)} • Break even: ₹${breakevens[0]?.toFixed(2) || '?'} • Time decay: ${netTheta > 0 ? 'Helps you!' : 'Hurts a bit'}`,
        riskLevel: 'low',
        confidence: 0.85
      },
      'Covered Call': {
        headline: "🛡️ The Income Farmer - Rent Your Stocks!",
        simpleInsight: `You already own the stock and you're selling someone the right to buy it from you at a higher price. They pay you ₹${maxProfit.toFixed(0)} upfront! If stock stays below ₹${breakevens[0]?.toFixed(2) || '?'}, you keep the money AND the stock. It's like Airbnb for your stocks!`,
        analogy: "You're renting out a parking spot you own. You get rent money every month. If someone wants to buy your spot at the agreed price, you sell it to them (but you already made money on rent!)",
        deeperDive: `Collect: ₹${maxProfit.toFixed(0)} premium • Keep premium if stock below ₹${breakevens[0]?.toFixed(2) || '?'} • Stock gets called away above strike • Time decay helps you! • Perfect for sideways markets`,
        riskLevel: 'low',
        confidence: 0.9
      }
    };

    // Default explanation for other strategies
    return explanations[strategyName] || {
      headline: `${strategy.icon} ${strategyName}`,
      simpleInsight: `${strategy.description} Your max profit is ₹${maxProfit.toFixed(0)} and max loss is ₹${maxLoss.toFixed(0)}. ${netTheta > 0 ? 'Time decay works in your favor!' : 'Watch out for time decay eating your profits!'}`,
      analogy: `This is a ${strategy.riskLevel} risk strategy best used when you expect ${strategy.outlook.join(' or ')} market conditions.`,
      deeperDive: `Capital: ₹${capital.toFixed(0)} • Max profit: ₹${maxProfit.toFixed(0)} • Max loss: ₹${maxLoss.toFixed(0)} • Breakeven: ${breakevens.map(b => `₹${b.toFixed(2)}`).join(', ')} • Net Delta: ${netDelta.toFixed(3)} • Net Theta: ${netTheta.toFixed(3)}`,
      riskLevel: strategy.riskLevel,
      confidence: 0.75
    };
  }

  private explainQuantEnginePerformance(): ExplanationResult {
    const alphaMetrics = this.inputs.alphaMetrics || {};
    const alphaWeights = this.inputs.alphaWeights || {};
    const dataQuality = this.inputs.dataQuality || {};
    
    // Calculate aggregate metrics
    const alphaEntries = Object.entries(alphaMetrics);
    const avgIC = alphaEntries.length > 0 
      ? alphaEntries.reduce((sum, [, m]: [string, any]) => sum + m.ic, 0) / alphaEntries.length 
      : 0;
    const avgSharpe = alphaEntries.length > 0
      ? alphaEntries.reduce((sum, [, m]: [string, any]) => sum + m.icSharpe, 0) / alphaEntries.length
      : 0;
    const healthyAlphas = alphaEntries.filter(([, m]: [string, any]) => m.isHealthy).length;
    const totalAlphas = alphaEntries.length;
    
    // Data quality assessment
    const qualityScores = Object.values(dataQuality).map((report: any) => {
      const score = 100 - (report.missingBars * 2 + report.outliers * 5);
      return Math.max(0, Math.min(100, score));
    });
    const avgQuality = qualityScores.length > 0 
      ? qualityScores.reduce((sum, s) => sum + s, 0) / qualityScores.length 
      : 0;
    
    // Determine best performing alpha
    const bestAlpha = alphaEntries.length > 0
      ? alphaEntries.reduce((best, current) => 
          (current[1] as any).icSharpe > (best[1] as any).icSharpe ? current : best
        )
      : null;
    
    let headline = "";
    let simpleInsight = "";
    let riskLevel: 'low' | 'medium' | 'high' = 'medium';
    
    // Dynamic explanations based on performance
    if (avgIC > 0.08) {
      headline = "🎯 Strong Signals - High Conviction Environment!";
      simpleInsight = `Your signals are crushing it! Average IC of ${(avgIC * 100).toFixed(1)}% means your alphas are predicting the market ${healthyAlphas}/${totalAlphas} signals are healthy and working well. ${bestAlpha ? `${bestAlpha[0]} is your star performer with IC Sharpe of ${(bestAlpha[1] as any).icSharpe.toFixed(2)}.` : ''}`;
      riskLevel = 'low';
    } else if (avgIC > 0.02) {
      headline = "📊 Decent Signals - Cautious Optimism";
      simpleInsight = `Your signals are working, but nothing spectacular. IC of ${(avgIC * 100).toFixed(1)}% is like a baseball player batting .260 - not bad, but not amazing. ${healthyAlphas}/${totalAlphas} alphas are healthy. ${bestAlpha ? `Best bet: ${bestAlpha[0]} (IC Sharpe: ${(bestAlpha[1] as any).icSharpe.toFixed(2)})` : ''}`;
      riskLevel = 'medium';
    } else {
      headline = "⚠️ Weak Signals - Tough Market Conditions";
      simpleInsight = `Your signals are struggling with an average IC of only ${(avgIC * 100).toFixed(1)}%. Only ${healthyAlphas}/${totalAlphas} alphas are healthy. The market might be in transition or your signals need recalibration. ${bestAlpha ? `Even your best alpha (${bestAlpha[0]}) has an IC Sharpe of just ${(bestAlpha[1] as any).icSharpe.toFixed(2)}.` : ''}`;
      riskLevel = 'high';
    }
    
    const analogy = avgIC > 0.08 
      ? "Think of IC like a batting average in baseball. Yours is .${(avgIC * 1000).toFixed(0)} - you're hitting for the All-Star team! Small edges compound into big wins over time."
      : avgIC > 0.02
      ? "IC is like your shooting percentage in basketball. You're making some baskets, but there's room for improvement. Keep taking those shots!"
      : "IC is like weather forecasting accuracy. Right now, you're about as good as guessing. Wait for clearer conditions or recalibrate your models.";
    
    const deeperDive = `Alpha Performance Breakdown:
• Average Information Coefficient (IC): ${(avgIC * 100).toFixed(2)}%
• Average IC Sharpe Ratio: ${avgSharpe.toFixed(2)}
• Healthy Alphas: ${healthyAlphas} out of ${totalAlphas}
• Data Quality Score: ${avgQuality.toFixed(0)}/100
${bestAlpha ? `• Top Performer: ${bestAlpha[0]} (IC: ${((bestAlpha[1] as any).ic * 100).toFixed(2)}%, IC Sharpe: ${(bestAlpha[1] as any).icSharpe.toFixed(2)}, Half-Life: ${(bestAlpha[1] as any).halfLife.toFixed(1)} days)` : ''}

What IC Means:
• IC > 0.05: Strong predictive signal (rare and valuable!)
• IC 0.02-0.05: Decent signal (can be profitable with scale)
• IC < 0.02: Weak signal (be very careful)

Adaptive Weighting: Your alphas are weighted by IC Sharpe - better performers get more influence in the portfolio. This is like letting your best players take more shots.`;
    
    return {
      headline,
      simpleInsight,
      analogy,
      deeperDive,
      riskLevel,
      confidence: avgIC > 0.05 ? 0.9 : avgIC > 0.02 ? 0.7 : 0.5
    };
  }

  private explainQuantEngineResults(): ExplanationResult {
    const portfolioWeights = this.inputs.portfolioWeights || {};
    const signalScores = this.inputs.signalScores || [];
    const targetVol = (this.inputs.targetVolatility || 0.02) * 100;
    const maxPerAsset = (this.inputs.maxPerAsset || 0.1) * 100;
    
    // Portfolio analysis
    const positions = Object.entries(portfolioWeights);
    const numPositions = positions.length;
    const totalWeight = positions.reduce((sum, [, w]) => sum + w, 0);
    const maxWeight = positions.length > 0 ? Math.max(...positions.map(([, w]) => w)) : 0;
    const concentration = numPositions > 0 
      ? positions.reduce((sum, [, w]) => sum + w * w, 0) 
      : 0;
    
    // Signal analysis
    const bullishCount = signalScores.filter(s => s.score > 0.5).length;
    const bearishCount = signalScores.filter(s => s.score < -0.5).length;
    const neutralCount = signalScores.length - bullishCount - bearishCount;
    
    // Top picks
    const topPicks = [...signalScores]
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .filter(s => s.score > 0);
    
    let headline = "";
    let simpleInsight = "";
    let riskLevel: 'low' | 'medium' | 'high' = 'medium';
    
    // Dynamic explanations
    if (numPositions === 0) {
      headline = "🚫 All Cash - No Good Opportunities";
      simpleInsight = `All your signals are negative or too weak. The engine is keeping you in cash because it's not finding attractive risk/reward setups. This is a feature, not a bug - sometimes the best trade is no trade!`;
      riskLevel = 'low';
    } else if (concentration > 0.3) {
      headline = "🎯 Concentrated Bet - High Conviction Play";
      simpleInsight = `You have ${numPositions} positions with ${(maxWeight * 100).toFixed(0)}% in your top pick. This is an aggressive, high-conviction portfolio targeting ${targetVol.toFixed(1)}% volatility. ${bullishCount > bearishCount ? `Going long on ${bullishCount} stocks` : `Mixed signals across positions`}.`;
      riskLevel = 'high';
    } else if (numPositions >= 5) {
      headline = "🛡️ Diversified Approach - Spreading the Risk";
      simpleInsight = `You're diversified across ${numPositions} positions with max ${(maxWeight * 100).toFixed(0)}% per stock. This balanced approach targets ${targetVol.toFixed(1)}% volatility while spreading risk. ${bullishCount} bullish, ${bearishCount} bearish, ${neutralCount} neutral signals.`;
      riskLevel = 'low';
    } else {
      headline = "⚖️ Balanced Portfolio - Middle Ground";
      simpleInsight = `You have ${numPositions} positions targeting ${targetVol.toFixed(1)}% volatility. Portfolio is ${concentration > 0.2 ? 'moderately concentrated' : 'well balanced'} with ${bullishCount} bullish and ${bearishCount} bearish signals. Max position: ${(maxWeight * 100).toFixed(0)}%.`;
      riskLevel = 'medium';
    }
    
    const analogy = numPositions === 0
      ? "Like a poker player folding a bad hand. You're waiting for better cards - that's smart money management."
      : concentration > 0.3
      ? "Like betting big on your favorite horse. You're putting your chips on a few strong bets rather than spreading thin. High risk, high reward!"
      : numPositions >= 5
      ? "Like investing in an index fund - you're spreading your bets across many stocks. You won't hit a home run, but you won't strike out either."
      : "Like a poker player with a decent hand - betting medium. Not all-in, but not folding either.";
    
    const topPicksText = topPicks.length > 0
      ? `\n\nTop Picks:\n${topPicks.map(p => `• ${p.ticker}: Score ${p.score.toFixed(2)} (${(portfolioWeights[p.ticker] * 100).toFixed(1)}% allocation)`).join('\n')}`
      : '';
    
    const deeperDive = `Portfolio Construction:
• Number of Positions: ${numPositions}
• Total Allocated: ${(totalWeight * 100).toFixed(1)}%
• Target Volatility: ${targetVol.toFixed(1)}%
• Max Per Asset: ${maxPerAsset.toFixed(0)}%
• Concentration (HHI): ${concentration.toFixed(3)} ${concentration > 0.3 ? '(High)' : concentration > 0.15 ? '(Medium)' : '(Low)'}
• Market Stance: ${bullishCount} Bullish, ${bearishCount} Bearish, ${neutralCount} Neutral${topPicksText}

How Positions are Sized:
• Risk Parity: Each position is sized by inverse volatility so they contribute equally to portfolio risk
• Z-Score Signals: Stocks are ranked cross-sectionally (relative to each other)
• Constraints Applied: Max ${maxPerAsset.toFixed(0)}% per stock, ${targetVol.toFixed(1)}% total volatility target

Next Steps:
${numPositions > 0 ? `• Review individual positions before executing\n• Consider your own risk tolerance\n• These are model recommendations, not financial advice` : `• Wait for better signals or adjust your alpha selection\n• Consider lowering risk thresholds if you want more action`}`;
    
    return {
      headline,
      simpleInsight,
      analogy,
      deeperDive,
      riskLevel,
      confidence: numPositions >= 3 ? 0.85 : numPositions > 0 ? 0.7 : 0.9
    };
  }

  // ============ CREDIT RISK EXPLANATIONS ============

  private explainCreditRisk(): ExplanationResult {
    const pd = this.outputs.defaultProbability || 0;
    const rating = this.outputs.rating || 'DS5';
    const dd = this.outputs.distanceToDefault || 2;
    
    let headline = "";
    let simpleInsight = "";
    let analogy = "";
    let riskLevel: 'low' | 'medium' | 'high';
    
    // Rating-based explanations
    if (rating.includes('DS1') || rating.includes('DS2')) {
      headline = "✅ Rock-Solid Credit - Investment Grade";
      simpleInsight = `This company has only a ${pd.toFixed(2)}% chance of defaulting in the next year. Like a blue-chip giant - banks fight to lend them money!`;
      analogy = "Think of it like a credit score: This is like having a 800+ FICO score - you're the dream borrower. Loans are cheap, and everyone trusts you.";
      riskLevel = 'low';
    } else if (rating.includes('DS3') || rating.includes('DS4')) {
      headline = "👍 Solid Credit - Lower Investment Grade";
      simpleInsight = `With a ${pd.toFixed(2)}% default probability, this company is creditworthy but not pristine. Like a BBB-rated bond - still investment grade!`;
      analogy = "Like having a 700-750 credit score. You'll get approved, but maybe not the absolute best rates.";
      riskLevel = 'low';
    } else if (rating.includes('DS5') || rating.includes('DS6')) {
      headline = "⚠️ Speculative Grade - Higher Risk";
      simpleInsight = `At ${pd.toFixed(1)}% default probability, this is speculative territory. The company can pay its bills, but a rough patch could cause trouble.`;
      analogy = "Like a 650 credit score - you can still get a loan, but lenders are nervous and charging higher rates.";
      riskLevel = 'medium';
    } else if (rating.includes('DS7') || rating.includes('DS8')) {
      headline = "🔴 High Risk - Substantial Default Risk";
      simpleInsight = `Red flag! At ${pd.toFixed(1)}% default probability, there's a real chance this company struggles to pay debts. Proceed with extreme caution.`;
      analogy = "Like a 550 credit score - you might get turned down at the bank. The credit card rates would be painful.";
      riskLevel = 'high';
    } else {
      headline = "🚨 Distress Warning - Default Likely";
      simpleInsight = `Critical risk! There's a ${pd.toFixed(0)}% chance this company can't meet obligations. This is 'junk bond' territory or worse.`;
      analogy = "Like having a 400 credit score - you're basically in financial trouble. Only predatory lenders are interested.";
      riskLevel = 'high';
    }
    
    const deeperDive = `DRSK Analysis Summary:
• Default Rating: ${rating} (${pd.toFixed(2)}% 1-year PD)
• Distance-to-Default: ${dd.toFixed(2)}σ (standard deviations from trouble)
• What DD means: The company has ${dd.toFixed(1)} "safety cushions" before hitting the debt barrier

Rating Translation:
• DS1-DS2: Investment Grade (AAA to A) - Extremely safe
• DS3-DS4: Investment Grade (BBB) - Safe but monitor
• DS5-DS6: Speculative (BB) - Elevated risk, higher yields
• DS7-DS8: Highly Speculative (B) - Significant risk
• DS9-DS10: Distressed (CCC-D) - Default likely

Key Insight: Distance-to-Default is like your fuel gauge. Higher DD = more fuel in the tank before you run out. A DD below 1.5 is concerning - you're running on fumes!`;
    
    return { headline, simpleInsight, analogy, deeperDive, riskLevel, confidence: 0.85 };
  }

  private explainMIBD(): ExplanationResult {
    const cdsSpread = this.outputs.modelCDS5Y || this.outputs.creditSpread || 100;
    const impliedPD = this.outputs.impliedPD || this.outputs.defaultProbability || 5;
    
    let headline = "";
    let simpleInsight = "";
    let riskLevel: 'low' | 'medium' | 'high';
    
    if (cdsSpread < 100) {
      headline = "💚 Market Says: Safe Bet";
      simpleInsight = `The market charges only ${cdsSpread.toFixed(0)} basis points to insure this company's debt. That's like paying $${(cdsSpread/100).toFixed(2)} per $100 of debt per year - very cheap insurance!`;
      riskLevel = 'low';
    } else if (cdsSpread < 300) {
      headline = "🟡 Market Says: Moderate Risk";
      simpleInsight = `At ${cdsSpread.toFixed(0)} bps, the market sees some risk here. Insurance costs $${(cdsSpread/100).toFixed(2)} per $100 of debt annually. Not alarming, but not worry-free either.`;
      riskLevel = 'medium';
    } else if (cdsSpread < 500) {
      headline = "🟠 Market Says: Elevated Concern";
      simpleInsight = `${cdsSpread.toFixed(0)} bps is getting expensive! The market is charging $${(cdsSpread/100).toFixed(2)} per $100 to insure this debt. Investors are nervous.`;
      riskLevel = 'medium';
    } else {
      headline = "🔴 Market Says: Danger Zone";
      simpleInsight = `At ${cdsSpread.toFixed(0)} bps, the market is screaming risk! Insurance costs $${(cdsSpread/100).toFixed(2)} per $100 of debt. This is distress-level pricing.`;
      riskLevel = 'high';
    }
    
    const analogy = "CDS spreads are like insurance premiums - risky drivers pay more for car insurance. A company with a 500 bps spread is like a teenager who just crashed their car twice - insurance is expensive because the risk is real!";
    
    const deeperDive = `Market-Implied Default (MIBD) Analysis:
• Model CDS Spread: ${cdsSpread.toFixed(0)} bps (${(cdsSpread/100).toFixed(2)}%/year)
• Implied PD: ${impliedPD.toFixed(2)}%
• Annual insurance cost: $${(cdsSpread/100).toFixed(2)} per $100 of debt

What CDS Spreads Tell You:
• <50 bps: Blue-chip, investment grade (think Apple, Microsoft)
• 50-150 bps: Solid investment grade
• 150-300 bps: Lower investment grade / upper speculative
• 300-500 bps: Speculative, significant risk
• >500 bps: Distressed, high default probability

Why This Matters: Unlike credit ratings (which update slowly), CDS spreads update in real-time based on market sentiment. If spreads are widening, the market is getting more worried - even if the rating hasn't changed yet!`;
    
    return { headline, simpleInsight, analogy, deeperDive, riskLevel, confidence: 0.85 };
  }

  private explainDefaultProbability(): ExplanationResult {
    const pd = this.outputs.defaultProbability || 5;
    
    let headline = "";
    let simpleInsight = "";
    let analogy = "";
    let riskLevel: 'low' | 'medium' | 'high';
    
    const oddsRatio = Math.round(100 / pd);
    
    if (pd < 1) {
      headline = "🎯 Minimal Default Risk";
      simpleInsight = `At ${pd.toFixed(2)}% probability, default is very unlikely - about 1-in-${oddsRatio} odds. This is like rolling a specific number on a 100-sided die.`;
      analogy = "Like the chance of rain in the Sahara - technically possible, but you probably don't need an umbrella!";
      riskLevel = 'low';
    } else if (pd < 5) {
      headline = "📊 Low Default Risk";
      simpleInsight = `There's a ${pd.toFixed(1)}% chance this company can't pay debts. That's about 1-in-${oddsRatio} odds - rare, but worth monitoring.`;
      analogy = "Like the chance of your flight being delayed - usually fine, but smart travelers have a backup plan.";
      riskLevel = 'low';
    } else if (pd < 15) {
      headline = "⚡ Moderate Default Risk";
      simpleInsight = `At ${pd.toFixed(1)}%, there's a real possibility of default - roughly 1-in-${oddsRatio}. Not a coin flip, but not negligible either.`;
      analogy = "Like rolling a 1 or 2 on a six-sided die - happens more often than you'd think! Plan accordingly.";
      riskLevel = 'medium';
    } else if (pd < 30) {
      headline = "🔶 Elevated Default Risk";
      simpleInsight = `${pd.toFixed(0)}% default probability means roughly 1-in-${oddsRatio} odds of trouble. This is significant - serious investors hedge this risk.`;
      analogy = "Like drawing a face card from a deck - happens fairly often. You need to be prepared for it.";
      riskLevel = 'high';
    } else {
      headline = "🚨 High Default Risk";
      simpleInsight = `At ${pd.toFixed(0)}%, default is a likely scenario - about 1-in-${oddsRatio} odds. This is distress territory.`;
      analogy = "Like flipping a coin and needing heads - the bad outcome happens often enough that you should expect it!";
      riskLevel = 'high';
    }
    
    const deeperDive = `Default Probability Breakdown:
• 1-Year PD: ${pd.toFixed(2)}%
• Odds ratio: Approximately 1-in-${oddsRatio}
• Historical context: Average corporate default rate is ~2-3%/year

How to Interpret PD:
• <1%: Very safe (equivalent to AA/AAA rating)
• 1-3%: Low risk (A to BBB rating)  
• 3-10%: Moderate risk (BB rating, "junk" territory)
• 10-25%: High risk (B rating)
• >25%: Distressed (CCC or below)

What PD Means for You:
${pd < 5 
  ? "At this PD level, the company is generally considered creditworthy. Bondholders can sleep well at night." 
  : pd < 15 
  ? "This PD level requires active monitoring. The company isn't in crisis, but a downturn could cause problems."
  : "This PD level indicates significant stress. Consider the risk carefully before investing, and hedge if you do."}`;
    
    return { headline, simpleInsight, analogy, deeperDive, riskLevel, confidence: 0.9 };
  }

  private explainLGDEAD(): ExplanationResult {
    const lgd = this.outputs.lgd || 0.6;
    const ead = this.outputs.ead || this.outputs.totalDebt || 100;
    const expectedLoss = this.outputs.expectedLoss || (lgd * ead * 0.05);
    const pd = this.outputs.defaultProbability || 5;
    const recoveryRate = 1 - lgd;
    
    let headline = "";
    let simpleInsight = "";
    let analogy = "";
    let riskLevel: 'low' | 'medium' | 'high';
    
    if (lgd < 0.4) {
      headline = "💰 Strong Recovery Expected";
      simpleInsight = `If default occurs, you'd likely recover ${((1-lgd) * 100).toFixed(0)}% of your money. LGD of ${(lgd * 100).toFixed(0)}% means losing only $${(ead * lgd).toFixed(1)}M of $${ead.toFixed(1)}M exposure.`;
      analogy = "Like a mortgage - even if the borrower defaults, you can sell the house and get most of your money back!";
      riskLevel = 'low';
    } else if (lgd < 0.6) {
      headline = "⚖️ Moderate Recovery Likely";
      simpleInsight = `In a default scenario, expect to recover about ${((1-lgd) * 100).toFixed(0)}% of exposure. That's losing $${(ead * lgd).toFixed(1)}M of $${ead.toFixed(1)}M.`;
      analogy = "Like a car loan - you can repossess the car, but it's depreciated and you won't recover everything.";
      riskLevel = 'medium';
    } else {
      headline = "📉 Limited Recovery Expected";
      simpleInsight = `Only ${((1-lgd) * 100).toFixed(0)}% recovery expected in default. You'd lose $${(ead * lgd).toFixed(1)}M of your $${ead.toFixed(1)}M exposure.`;
      analogy = "Like an unsecured personal loan - if they default, you're mostly out of luck. No collateral to seize!";
      riskLevel = 'high';
    }
    
    const deeperDive = `LGD & EAD Analysis:
• Loss Given Default (LGD): ${(lgd * 100).toFixed(0)}%
• Recovery Rate: ${(recoveryRate * 100).toFixed(0)}%
• Exposure at Default (EAD): $${ead.toFixed(1)}M
• Expected Loss: $${expectedLoss.toFixed(2)}M (PD × LGD × EAD)

The Expected Loss Formula:
Expected Loss = ${pd.toFixed(2)}% × ${(lgd * 100).toFixed(0)}% × $${ead.toFixed(1)}M = $${expectedLoss.toFixed(2)}M

What Affects LGD:
• Seniority: Senior secured (35% LGD) vs Junior unsecured (85% LGD)
• Collateral: Real estate > Equipment > Receivables > Unsecured
• Industry: Banks recover more from utilities than tech startups
• Economic conditions: Recessions increase LGD across the board

Practical Interpretation:
Think of Expected Loss like your "average" loss over many similar loans. If you made 100 loans like this, you'd expect to lose about $${expectedLoss.toFixed(2)}M per loan on average. It's like car insurance - they know not everyone will crash, but they price the average expected payout.`;
    
    return { headline, simpleInsight, analogy, deeperDive, riskLevel, confidence: 0.85 };
  }
}