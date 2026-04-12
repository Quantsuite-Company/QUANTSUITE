/**
 * ═══════════════════════════════════════════════════════════
 * PULSE EVENT ENGINE
 * Self-contained geopolitical event system with propagation chains
 * No external API — deterministic events from built-in templates
 * ═══════════════════════════════════════════════════════════
 */

/* ═══════════════ TYPES ═══════════════ */
export interface PropagationNode {
  system: string;
  direction: 'up' | 'down' | 'neutral';
  magnitude: number; // 0-1
  children?: PropagationNode[];
}

export interface MarketSignal {
  sectors: { name: string; impact: number }[]; // impact: -1 to 1
  volatilityDelta: number;
  riskLevel: 'low' | 'moderate' | 'elevated' | 'high' | 'extreme';
  inflationPressure: number; // -1 to 1
  currencyImpact: { pair: string; direction: 'up' | 'down'; magnitude: number }[];
}

export interface PulseEvent {
  id: string;
  title: string;
  description: string;
  type: 'geopolitical' | 'economic' | 'commodity' | 'central_bank' | 'trade' | 'earnings';
  location: string;
  region: string;
  intensity: number;        // 0-10
  confidence: number;       // 0-1
  timeCategory: 'immediate' | 'short_term' | 'long_term';
  timestamp: number;
  affectedSystems: string[];
  propagation: PropagationNode[];
  signal: MarketSignal;
  insight: string;          // Natural language summary of the chain
}

export interface PulseSignal {
  id: string;
  eventId: string;
  timestamp: number;
  source: 'PULSE';
  level: 'info' | 'warning' | 'critical';
  message: string;
  signal: MarketSignal;
  riskIndex: number;
}

/* ═══════════════ DETERMINISTIC HASH ═══════════════ */
function seedHash(seed: string): () => number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  let t = Math.abs(h) || 1;
  return () => {
    t += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ═══════════════ EVENT TEMPLATES ═══════════════ */
interface EventTemplate {
  title: string;
  description: string;
  type: PulseEvent['type'];
  location: string;
  region: string;
  baseIntensity: number;
  affectedSystems: string[];
  propagation: PropagationNode[];
  sectorImpacts: { name: string; impact: number }[];
  volatilityDelta: number;
  riskLevel: MarketSignal['riskLevel'];
  inflationPressure: number;
  insight: string;
  currencyImpact: { pair: string; direction: 'up' | 'down'; magnitude: number }[];
  timeCategory: PulseEvent['timeCategory'];
}

const TEMPLATES: EventTemplate[] = [
  {
    title: 'Middle East Oil Supply Disruption',
    description: 'Escalating tensions in the Strait of Hormuz threaten 20% of global oil transit. OPEC emergency session expected.',
    type: 'geopolitical',
    location: 'Strait of Hormuz',
    region: 'MENA',
    baseIntensity: 8.2,
    affectedSystems: ['Energy', 'Logistics', 'Inflation', 'Currency', 'Defense'],
    propagation: [
      { system: 'Oil Supply', direction: 'down', magnitude: 0.8, children: [
        { system: 'Crude Oil Price', direction: 'up', magnitude: 0.9, children: [
          { system: 'Energy Stocks', direction: 'up', magnitude: 0.7 },
          { system: 'Airlines', direction: 'down', magnitude: 0.6 },
          { system: 'Shipping Costs', direction: 'up', magnitude: 0.5, children: [
            { system: 'Consumer Prices', direction: 'up', magnitude: 0.4 },
          ]},
        ]},
        { system: 'Inflation Expectations', direction: 'up', magnitude: 0.6, children: [
          { system: 'Interest Rate Path', direction: 'up', magnitude: 0.5 },
          { system: 'Growth Equities', direction: 'down', magnitude: 0.4 },
        ]},
      ]},
    ],
    sectorImpacts: [{ name: 'Energy', impact: 0.8 }, { name: 'Defense', impact: 0.5 }, { name: 'Airlines', impact: -0.6 }, { name: 'Consumer Discretionary', impact: -0.3 }, { name: 'Utilities', impact: 0.2 }],
    volatilityDelta: 4.5,
    riskLevel: 'high',
    inflationPressure: 0.7,
    insight: 'Oil supply disruption increases energy sector momentum while pressuring transportation and raising inflation risk. Defense stocks benefit from geopolitical premium. Central banks may delay rate cuts.',
    currencyImpact: [{ pair: 'USD/RUB', direction: 'down', magnitude: 0.6 }, { pair: 'USD/CAD', direction: 'down', magnitude: 0.3 }],
    timeCategory: 'immediate',
  },
  {
    title: 'Federal Reserve Rate Decision',
    description: 'FOMC holds rates steady at 5.25-5.50%, signals potential cut in September. Dot plot shifts dovish.',
    type: 'central_bank',
    location: 'Washington D.C.',
    region: 'Americas',
    baseIntensity: 7.5,
    affectedSystems: ['Interest Rates', 'Equities', 'Bonds', 'USD', 'Real Estate'],
    propagation: [
      { system: 'Fed Funds Rate', direction: 'neutral', magnitude: 0.0, children: [
        { system: 'Forward Guidance', direction: 'down', magnitude: 0.7, children: [
          { system: 'Bond Yields', direction: 'down', magnitude: 0.6 },
          { system: 'Growth Stocks', direction: 'up', magnitude: 0.8 },
          { system: 'USD Index', direction: 'down', magnitude: 0.5, children: [
            { system: 'EM Currencies', direction: 'up', magnitude: 0.4 },
            { system: 'Gold', direction: 'up', magnitude: 0.5 },
          ]},
        ]},
      ]},
    ],
    sectorImpacts: [{ name: 'Technology', impact: 0.7 }, { name: 'Real Estate', impact: 0.6 }, { name: 'Financials', impact: -0.3 }, { name: 'Utilities', impact: 0.4 }, { name: 'Healthcare', impact: 0.2 }],
    volatilityDelta: -2.0,
    riskLevel: 'moderate',
    inflationPressure: -0.2,
    insight: 'Dovish Fed signals rotate capital into duration-sensitive assets. Growth stocks rally on lower discount rates. Banks lose NIM advantage. Dollar weakness benefits commodity exporters.',
    currencyImpact: [{ pair: 'EUR/USD', direction: 'up', magnitude: 0.4 }, { pair: 'USD/JPY', direction: 'down', magnitude: 0.5 }],
    timeCategory: 'immediate',
  },
  {
    title: 'China Economic Slowdown Data',
    description: 'China Q2 GDP growth at 4.0%, below 5.0% target. Manufacturing PMI contracts for 3rd consecutive month.',
    type: 'economic',
    location: 'Beijing',
    region: 'Asia',
    baseIntensity: 6.8,
    affectedSystems: ['Global Trade', 'Commodities', 'EM Markets', 'Supply Chains', 'FX'],
    propagation: [
      { system: 'China GDP', direction: 'down', magnitude: 0.7, children: [
        { system: 'Commodity Demand', direction: 'down', magnitude: 0.6, children: [
          { system: 'Iron Ore', direction: 'down', magnitude: 0.7 },
          { system: 'Copper', direction: 'down', magnitude: 0.5 },
          { system: 'Australian Economy', direction: 'down', magnitude: 0.4 },
        ]},
        { system: 'Global Supply Chains', direction: 'down', magnitude: 0.5, children: [
          { system: 'Semiconductor Orders', direction: 'down', magnitude: 0.4 },
          { system: 'Luxury Goods', direction: 'down', magnitude: 0.6 },
        ]},
      ]},
    ],
    sectorImpacts: [{ name: 'Materials', impact: -0.6 }, { name: 'Luxury', impact: -0.5 }, { name: 'Technology', impact: -0.3 }, { name: 'US Domestic', impact: 0.2 }, { name: 'Gold', impact: 0.3 }],
    volatilityDelta: 2.5,
    riskLevel: 'elevated',
    inflationPressure: -0.4,
    insight: 'China slowdown is deflationary for global commodities. Materials and luxury exporters most exposed. Flight to quality favors US Treasuries and gold. Paradoxically bullish for Fed cut timeline.',
    currencyImpact: [{ pair: 'AUD/USD', direction: 'down', magnitude: 0.5 }, { pair: 'USD/CNY', direction: 'up', magnitude: 0.6 }],
    timeCategory: 'short_term',
  },
  {
    title: 'US-China Tech Sanctions Escalation',
    description: 'New export controls on AI chips to China. NVIDIA, AMD, Intel face restricted access to $50B market.',
    type: 'trade',
    location: 'Washington / Beijing',
    region: 'Global',
    baseIntensity: 7.0,
    affectedSystems: ['Semiconductors', 'AI Supply Chain', 'Tech Valuations', 'Trade Relations'],
    propagation: [
      { system: 'Export Controls', direction: 'up', magnitude: 0.8, children: [
        { system: 'China AI Chip Access', direction: 'down', magnitude: 0.9, children: [
          { system: 'NVDA/AMD Revenue', direction: 'down', magnitude: 0.5 },
          { system: 'China Domestic Chip', direction: 'up', magnitude: 0.6 },
        ]},
        { system: 'Supply Chain Reshoring', direction: 'up', magnitude: 0.5, children: [
          { system: 'US/EU Fab Investment', direction: 'up', magnitude: 0.6 },
          { system: 'Equipment Makers', direction: 'up', magnitude: 0.4 },
        ]},
      ]},
    ],
    sectorImpacts: [{ name: 'Semiconductors', impact: -0.4 }, { name: 'AI/Cloud', impact: -0.3 }, { name: 'Defense Tech', impact: 0.5 }, { name: 'Equipment', impact: 0.3 }, { name: 'Software', impact: 0.1 }],
    volatilityDelta: 3.0,
    riskLevel: 'elevated',
    inflationPressure: 0.1,
    insight: 'Sanctions hurt near-term chip revenue but accelerate reshoring capex. Defense tech and equipment makers benefit. Long-term bullish for US semiconductor sovereignty at the cost of short-term earnings.',
    currencyImpact: [{ pair: 'USD/CNY', direction: 'up', magnitude: 0.3 }],
    timeCategory: 'short_term',
  },
  {
    title: 'European Energy Crisis Deepens',
    description: 'Natural gas inventories 15% below 5-year average. Nord Stream capacity reduced to 20%.',
    type: 'commodity',
    location: 'Brussels',
    region: 'Europe',
    baseIntensity: 7.8,
    affectedSystems: ['Natural Gas', 'Electricity', 'Manufacturing', 'EUR', 'Equities'],
    propagation: [
      { system: 'Gas Supply', direction: 'down', magnitude: 0.8, children: [
        { system: 'Wholesale Energy Prices', direction: 'up', magnitude: 0.9, children: [
          { system: 'Manufacturing Costs', direction: 'up', magnitude: 0.7, children: [
            { system: 'European GDP', direction: 'down', magnitude: 0.5 },
          ]},
          { system: 'Consumer Energy Bills', direction: 'up', magnitude: 0.6 },
        ]},
        { system: 'LNG Demand', direction: 'up', magnitude: 0.7, children: [
          { system: 'US LNG Exporters', direction: 'up', magnitude: 0.6 },
        ]},
      ]},
    ],
    sectorImpacts: [{ name: 'LNG/Gas', impact: 0.7 }, { name: 'EU Industrials', impact: -0.6 }, { name: 'Renewables', impact: 0.4 }, { name: 'US Energy', impact: 0.5 }, { name: 'EUR Banks', impact: -0.3 }],
    volatilityDelta: 3.5,
    riskLevel: 'high',
    inflationPressure: 0.6,
    insight: 'Energy scarcity is stagflationary for Europe. US LNG exporters are clear winners. EUR weakness accelerates as ECB faces impossible trilemma. Renewables capex narrative strengthens.',
    currencyImpact: [{ pair: 'EUR/USD', direction: 'down', magnitude: 0.5 }, { pair: 'GBP/USD', direction: 'down', magnitude: 0.3 }],
    timeCategory: 'immediate',
  },
  {
    title: 'India RBI Holds, GDP at 7.2%',
    description: 'Reserve Bank of India maintains repo rate at 6.50%. Q1 GDP revised up to 7.2%, strongest among G20.',
    type: 'central_bank',
    location: 'Mumbai',
    region: 'Asia',
    baseIntensity: 5.5,
    affectedSystems: ['INR', 'Indian Equities', 'EM Flows', 'IT Services'],
    propagation: [
      { system: 'India GDP', direction: 'up', magnitude: 0.7, children: [
        { system: 'FPI Inflows', direction: 'up', magnitude: 0.6, children: [
          { system: 'NIFTY 50', direction: 'up', magnitude: 0.5 },
          { system: 'INR Strength', direction: 'up', magnitude: 0.3 },
        ]},
        { system: 'Domestic Consumption', direction: 'up', magnitude: 0.5, children: [
          { system: 'FMCG', direction: 'up', magnitude: 0.4 },
          { system: 'Auto Sales', direction: 'up', magnitude: 0.4 },
        ]},
      ]},
    ],
    sectorImpacts: [{ name: 'Indian IT', impact: 0.3 }, { name: 'Indian Banks', impact: 0.5 }, { name: 'FMCG', impact: 0.4 }, { name: 'Infrastructure', impact: 0.6 }, { name: 'Global EM', impact: 0.2 }],
    volatilityDelta: -1.0,
    riskLevel: 'low',
    inflationPressure: 0.1,
    insight: 'India is the bright spot in global macro. Strong GDP attracts foreign portfolio flows, strengthening INR. Infrastructure and banking sectors lead. Stability reduces vol.',
    currencyImpact: [{ pair: 'USD/INR', direction: 'down', magnitude: 0.2 }],
    timeCategory: 'short_term',
  },
  {
    title: 'NVIDIA Earnings Beat +25%',
    description: 'NVIDIA reports Q4 revenue $22.1B vs $20.4B expected. Data center revenue up 409% YoY. Guides up again.',
    type: 'earnings',
    location: 'Santa Clara, CA',
    region: 'Americas',
    baseIntensity: 6.5,
    affectedSystems: ['AI/GPU', 'Semiconductor Index', 'NASDAQ', 'Cloud Capex'],
    propagation: [
      { system: 'NVDA Earnings', direction: 'up', magnitude: 0.9, children: [
        { system: 'AI Spending Validation', direction: 'up', magnitude: 0.8, children: [
          { system: 'Cloud Capex (MSFT/AMZN/GOOGL)', direction: 'up', magnitude: 0.6 },
          { system: 'AI Software Ecosystem', direction: 'up', magnitude: 0.5 },
        ]},
        { system: 'Semiconductor Sentiment', direction: 'up', magnitude: 0.7, children: [
          { system: 'SOX Index', direction: 'up', magnitude: 0.6 },
          { system: 'TSMC Orders', direction: 'up', magnitude: 0.5 },
        ]},
      ]},
    ],
    sectorImpacts: [{ name: 'Semiconductors', impact: 0.8 }, { name: 'AI/Cloud', impact: 0.7 }, { name: 'Software', impact: 0.4 }, { name: 'Utilities (Power)', impact: 0.3 }, { name: 'Value/Dividends', impact: -0.2 }],
    volatilityDelta: -1.5,
    riskLevel: 'moderate',
    inflationPressure: 0.0,
    insight: 'NVIDIA earnings validate the AI capex thesis. Rising tide lifts all boats in the semiconductor supply chain. Power/utilities benefit from data center build-out. Concentration risk in Mag7 intensifies.',
    currencyImpact: [{ pair: 'USD/JPY', direction: 'up', magnitude: 0.2 }],
    timeCategory: 'immediate',
  },
  {
    title: 'Russia-Ukraine Conflict Escalation',
    description: 'New offensive in eastern front. EU announces 14th sanctions package. Grain corridor suspended.',
    type: 'geopolitical',
    location: 'Eastern Europe',
    region: 'Europe',
    baseIntensity: 8.5,
    affectedSystems: ['Grain Supply', 'Energy', 'Defense', 'EUR', 'Safe Havens'],
    propagation: [
      { system: 'Conflict Intensity', direction: 'up', magnitude: 0.9, children: [
        { system: 'Grain Exports', direction: 'down', magnitude: 0.7, children: [
          { system: 'Wheat/Corn Prices', direction: 'up', magnitude: 0.8 },
          { system: 'Food Inflation (EM)', direction: 'up', magnitude: 0.6 },
        ]},
        { system: 'EU/Russia Relations', direction: 'down', magnitude: 0.8, children: [
          { system: 'EU Gas Risk', direction: 'up', magnitude: 0.5 },
          { system: 'Defense Spending', direction: 'up', magnitude: 0.7 },
        ]},
        { system: 'Risk Sentiment', direction: 'down', magnitude: 0.6, children: [
          { system: 'Gold/CHF', direction: 'up', magnitude: 0.5 },
          { system: 'VIX', direction: 'up', magnitude: 0.7 },
        ]},
      ]},
    ],
    sectorImpacts: [{ name: 'Defense', impact: 0.8 }, { name: 'Agriculture', impact: 0.5 }, { name: 'Gold/Precious', impact: 0.6 }, { name: 'EU Equities', impact: -0.5 }, { name: 'Travel/Leisure', impact: -0.3 }],
    volatilityDelta: 5.0,
    riskLevel: 'extreme',
    inflationPressure: 0.5,
    insight: 'Conflict escalation is the highest-intensity risk event. Grain corridor suspension hits EM food security. Defense stocks are the primary beneficiary. Safe havens (gold, CHF, US Treasuries) attract flows.',
    currencyImpact: [{ pair: 'EUR/USD', direction: 'down', magnitude: 0.4 }, { pair: 'XAU/USD', direction: 'up', magnitude: 0.6 }],
    timeCategory: 'immediate',
  },
  {
    title: 'BOJ Exits Negative Rates',
    description: 'Bank of Japan raises rates to 0.1%, ending 8 years of negative interest rate policy. Yen strengthens 2%.',
    type: 'central_bank',
    location: 'Tokyo',
    region: 'Asia',
    baseIntensity: 7.2,
    affectedSystems: ['JPY', 'Carry Trade', 'JGBs', 'Global Bonds'],
    propagation: [
      { system: 'BOJ Rate Hike', direction: 'up', magnitude: 0.8, children: [
        { system: 'JPY Strength', direction: 'up', magnitude: 0.7, children: [
          { system: 'Carry Trade Unwind', direction: 'down', magnitude: 0.8, children: [
            { system: 'EM FX Pressure', direction: 'down', magnitude: 0.5 },
            { system: 'Global Liquidity', direction: 'down', magnitude: 0.4 },
          ]},
        ]},
        { system: 'JGB Yields', direction: 'up', magnitude: 0.6, children: [
          { system: 'Global Bond Yields', direction: 'up', magnitude: 0.3 },
        ]},
      ]},
    ],
    sectorImpacts: [{ name: 'Japanese Banks', impact: 0.6 }, { name: 'US Tech', impact: -0.3 }, { name: 'EM Equities', impact: -0.4 }, { name: 'Japanese Auto', impact: -0.3 }, { name: 'US Bonds', impact: -0.2 }],
    volatilityDelta: 4.0,
    riskLevel: 'high',
    inflationPressure: 0.0,
    insight: 'BOJ normalization triggers carry trade unwind — the most dangerous cross-asset contagion risk. JPY strengthening pressures all yen-funded positions globally. Nikkei exporters suffer. Banks benefit from positive rate environment.',
    currencyImpact: [{ pair: 'USD/JPY', direction: 'down', magnitude: 0.7 }, { pair: 'EUR/JPY', direction: 'down', magnitude: 0.5 }],
    timeCategory: 'immediate',
  },
  {
    title: 'US Jobs Report: NFP +353K',
    description: 'Non-Farm Payrolls smash expectations. Unemployment at 3.5%. Wage growth +4.5% YoY.',
    type: 'economic',
    location: 'Washington D.C.',
    region: 'Americas',
    baseIntensity: 6.0,
    affectedSystems: ['Fed Policy', 'USD', 'Equities', 'Bonds', 'Wage Inflation'],
    propagation: [
      { system: 'Strong Jobs Data', direction: 'up', magnitude: 0.7, children: [
        { system: 'Rate Cut Expectations', direction: 'down', magnitude: 0.6, children: [
          { system: 'Bond Prices', direction: 'down', magnitude: 0.5 },
          { system: 'Growth Stocks', direction: 'down', magnitude: 0.4 },
        ]},
        { system: 'Consumer Spending', direction: 'up', magnitude: 0.5, children: [
          { system: 'Retail', direction: 'up', magnitude: 0.4 },
          { system: 'Financials', direction: 'up', magnitude: 0.3 },
        ]},
        { system: 'Wage Inflation', direction: 'up', magnitude: 0.6, children: [
          { system: 'Margin Pressure', direction: 'up', magnitude: 0.4 },
        ]},
      ]},
    ],
    sectorImpacts: [{ name: 'Financials', impact: 0.4 }, { name: 'Consumer', impact: 0.3 }, { name: 'Growth Tech', impact: -0.4 }, { name: 'Real Estate', impact: -0.3 }, { name: 'Materials', impact: 0.2 }],
    volatilityDelta: 1.5,
    riskLevel: 'moderate',
    inflationPressure: 0.4,
    insight: 'Hot jobs data is a double-edged sword: strong economy but higher-for-longer rates. Cyclicals win, duration assets lose. Wage inflation pressures corporate margins.',
    currencyImpact: [{ pair: 'DXY', direction: 'up', magnitude: 0.4 }, { pair: 'EUR/USD', direction: 'down', magnitude: 0.3 }],
    timeCategory: 'immediate',
  },
  {
    title: 'Global Semiconductor Shortage Returns',
    description: 'TSMC warns of capacity constraints through 2025. Lead times extend to 26 weeks for advanced nodes.',
    type: 'trade',
    location: 'Hsinchu, Taiwan',
    region: 'Asia',
    baseIntensity: 6.5,
    affectedSystems: ['Chip Supply', 'Auto Production', 'Consumer Electronics', 'Cloud Capex'],
    propagation: [
      { system: 'Chip Supply', direction: 'down', magnitude: 0.7, children: [
        { system: 'Auto Production', direction: 'down', magnitude: 0.6, children: [
          { system: 'Used Car Prices', direction: 'up', magnitude: 0.4 },
        ]},
        { system: 'Chip Prices', direction: 'up', magnitude: 0.7, children: [
          { system: 'Chip Makers Revenue', direction: 'up', magnitude: 0.6 },
          { system: 'Consumer Electronics Cost', direction: 'up', magnitude: 0.3 },
        ]},
      ]},
    ],
    sectorImpacts: [{ name: 'Chip Equipment', impact: 0.7 }, { name: 'TSMC/Samsung', impact: 0.5 }, { name: 'Auto OEMs', impact: -0.5 }, { name: 'Consumer Electronics', impact: -0.3 }, { name: 'Memory', impact: 0.4 }],
    volatilityDelta: 2.0,
    riskLevel: 'elevated',
    inflationPressure: 0.2,
    insight: 'Supply constraints are bullish for incumbent fab operators and equipment makers, but drag on downstream consumers. The auto sector is most vulnerable again. Memory pricing power returns.',
    currencyImpact: [{ pair: 'TWD/USD', direction: 'up', magnitude: 0.2 }],
    timeCategory: 'short_term',
  },
  {
    title: 'Bitcoin ETF Record Inflows',
    description: 'Spot Bitcoin ETFs see $2.4B weekly inflows, largest since launch. BTC breaks $75K.',
    type: 'economic',
    location: 'Global',
    region: 'Global',
    baseIntensity: 5.0,
    affectedSystems: ['Crypto', 'Fintech', 'Traditional Finance'],
    propagation: [
      { system: 'BTC ETF Inflows', direction: 'up', magnitude: 0.8, children: [
        { system: 'BTC Price', direction: 'up', magnitude: 0.9, children: [
          { system: 'Alt-Coins', direction: 'up', magnitude: 0.7 },
          { system: 'Crypto Miners', direction: 'up', magnitude: 0.6 },
          { system: 'COIN/MSTR', direction: 'up', magnitude: 0.8 },
        ]},
        { system: 'Institutional Adoption', direction: 'up', magnitude: 0.5, children: [
          { system: 'Traditional Finance', direction: 'neutral', magnitude: 0.2 },
        ]},
      ]},
    ],
    sectorImpacts: [{ name: 'Crypto', impact: 0.9 }, { name: 'Fintech', impact: 0.4 }, { name: 'TradFi', impact: -0.1 }, { name: 'Gold', impact: -0.2 }],
    volatilityDelta: 1.0,
    riskLevel: 'moderate',
    inflationPressure: 0.0,
    insight: 'Institutional BTC adoption accelerates. Crypto-adjacent equities (COIN, MSTR, MARA) benefit directly. Some gold rotation into digital gold narrative. Limited macro impact but strong sentiment signal.',
    currencyImpact: [],
    timeCategory: 'short_term',
  },
];

/* ═══════════════ EVENT GENERATOR ═══════════════ */

/**
 * Generate active events based on current timestamp.
 * Uses time-seeded deterministic selection so events are consistent within a session.
 */
export function generateActiveEvents(count: number = 5): PulseEvent[] {
  const hourSeed = Math.floor(Date.now() / (3600000)); // changes every hour
  const rng = seedHash(`pulse-${hourSeed}`);
  
  // Select random subset of templates
  const shuffled = [...TEMPLATES].sort(() => rng() - 0.5);
  const selected = shuffled.slice(0, Math.min(count, TEMPLATES.length));
  
  return selected.map((t, i) => {
    const noise = (rng() - 0.5) * 1.5;
    const intensity = Math.max(1, Math.min(10, t.baseIntensity + noise));
    
    return {
      id: `evt-${hourSeed}-${i}`,
      title: t.title,
      description: t.description,
      type: t.type,
      location: t.location,
      region: t.region,
      intensity: +intensity.toFixed(1),
      confidence: +(0.7 + rng() * 0.3).toFixed(2),
      timeCategory: t.timeCategory,
      timestamp: Date.now() - Math.floor(rng() * 7200000),
      affectedSystems: t.affectedSystems,
      propagation: t.propagation,
      signal: {
        sectors: t.sectorImpacts,
        volatilityDelta: +(t.volatilityDelta * (0.8 + rng() * 0.4)).toFixed(1),
        riskLevel: t.riskLevel,
        inflationPressure: +t.inflationPressure.toFixed(2),
        currencyImpact: t.currencyImpact,
      },
      insight: t.insight,
    };
  });
}

/**
 * Compute aggregate Geopolitical Risk Index from active events.
 */
export function computeRiskIndex(events: PulseEvent[]): number {
  if (events.length === 0) return 0;
  const weighted = events.reduce((sum, e) => sum + e.intensity * e.confidence, 0);
  return Math.min(10, +(weighted / events.length).toFixed(1));
}

/**
 * Convert PulseEvents to PulseSignals for the store.
 */
export function eventsToSignals(events: PulseEvent[]): PulseSignal[] {
  return events.map(e => ({
    id: `sig-${e.id}`,
    eventId: e.id,
    timestamp: e.timestamp,
    source: 'PULSE' as const,
    level: e.intensity >= 7 ? 'critical' : e.intensity >= 5 ? 'warning' : 'info',
    message: `${e.title}: ${e.description}`,
    signal: e.signal,
    riskIndex: e.intensity,
  }));
}

/**
 * Format PulseSignals for AI model prompt injection.
 * Different formatting per consuming module.
 */
export function formatPulseSignalsForAI(
  signals: PulseSignal[],
  module: 'market_maw' | 'athena' | 'strategy',
  portfolioSectors?: string[]
): string {
  if (signals.length === 0) return '';
  
  let prompt = `\n\n[LIVE PULSE INTELLIGENCE — ${signals.length} Active Events]\n`;
  prompt += `Geopolitical Risk Index: ${computeRiskIndex(signals.map(s => ({ intensity: s.riskIndex }) as any) as any)}/10\n\n`;
  
  signals.forEach(s => {
    prompt += `━━━ ${s.level.toUpperCase()}: ${s.message}\n`;
    
    if (module === 'market_maw') {
      prompt += `  Sector Impacts: ${s.signal.sectors.map(sec => `${sec.name} ${sec.impact > 0 ? '↑' : '↓'}${Math.abs(sec.impact * 100).toFixed(0)}%`).join(', ')}\n`;
      prompt += `  Volatility Change: ${s.signal.volatilityDelta > 0 ? '+' : ''}${s.signal.volatilityDelta.toFixed(1)} pts | Risk: ${s.signal.riskLevel}\n`;
      if (s.signal.currencyImpact.length > 0) {
        prompt += `  FX: ${s.signal.currencyImpact.map(c => `${c.pair} ${c.direction === 'up' ? '↑' : '↓'}`).join(', ')}\n`;
      }
    }
    
    if (module === 'athena') {
      prompt += `  Risk Level: ${s.signal.riskLevel.toUpperCase()} | Inflation Pressure: ${s.signal.inflationPressure > 0 ? 'UP' : 'DOWN'}\n`;
      if (portfolioSectors && portfolioSectors.length > 0) {
        const affected = s.signal.sectors.filter(sec => portfolioSectors.some(ps => sec.name.toLowerCase().includes(ps.toLowerCase())));
        if (affected.length > 0) {
          prompt += `  ⚠️ PORTFOLIO OVERLAP: ${affected.map(a => `${a.name} ${a.impact > 0 ? '+' : ''}${(a.impact * 100).toFixed(0)}%`).join(', ')}\n`;
        }
      }
    }
    
    if (module === 'strategy') {
      prompt += `  Market Regime Signal: Vol ${s.signal.volatilityDelta > 2 ? 'EXPANDING' : s.signal.volatilityDelta < -1 ? 'CONTRACTING' : 'STABLE'} | Risk: ${s.signal.riskLevel}\n`;
      prompt += `  Strategy Bias: ${s.signal.volatilityDelta > 3 ? 'Favor hedging/options strategies' : s.signal.volatilityDelta < -1 ? 'Favor carry/income strategies' : 'Neutral — directional OK'}\n`;
    }
    
    prompt += '\n';
  });
  
  return prompt;
}
