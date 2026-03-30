import Papa from 'papaparse';

export interface Position {
  instrument: string;
  type: string; // EQ, OPT, FUT
  quantity: number;
  avgPrice: number;
  lastPrice: number;
  pnl: number;
  broker: 'zerodha' | 'upstox';
}

// Unified position format for both CSV and Portfolio Builder formats
export interface UnifiedPosition {
  symbol: string;      // instrument OR ticker
  type: string;        // type OR 'EQ'
  quantity: number;    // quantity OR shares
  avgPrice: number;    // avgPrice OR entryPrice
  lastPrice: number;   // lastPrice OR entryPrice
  pnl: number;         // pnl OR calculated
  value: number;       // quantity × lastPrice
}

export interface ParsedPortfolio {
  positions: Position[];
  broker: 'zerodha' | 'upstox';
  parseDate: Date;
}

const ZERODHA_HEADERS = ['instrument', 'type', 'quantity', 'avg', 'price', 'last', 'p&l'];
const UPSTOX_HEADERS = ['instrument', 'product', 'qty', 'avg', 'price', 'ltp', 'pnl'];

export const detectBroker = (headers: string[]): 'zerodha' | 'upstox' | 'unknown' => {
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim());
  
  const zerodhaMatch = ZERODHA_HEADERS.every(h => 
    normalizedHeaders.some(nh => nh.includes(h))
  );
  
  if (zerodhaMatch) return 'zerodha';
  
  const upstoxMatch = UPSTOX_HEADERS.every(h => 
    normalizedHeaders.some(nh => nh.includes(h))
  );
  
  if (upstoxMatch) return 'upstox';
  
  return 'unknown';
};

const normalizeZerodhaRow = (row: any): Position | null => {
  try {
    const instrument = row['Instrument'] || row['instrument'] || '';
    const type = row['Type'] || row['type'] || '';
    const quantity = parseFloat(row['Quantity'] || row['quantity'] || '0');
    const avgPrice = parseFloat(row['Avg Price'] || row['Avg. Price'] || row['avg price'] || row['avg. price'] || '0');
    const lastPrice = parseFloat(row['Last Price'] || row['LTP'] || row['last price'] || row['ltp'] || '0');
    const pnl = parseFloat(row['P&L'] || row['p&l'] || '0');

    if (!instrument || isNaN(quantity) || isNaN(avgPrice)) {
      console.log('Invalid row - instrument:', instrument, 'quantity:', quantity, 'avgPrice:', avgPrice);
      return null;
    }

    return {
      instrument,
      type,
      quantity,
      avgPrice,
      lastPrice: isNaN(lastPrice) ? avgPrice : lastPrice,
      pnl: isNaN(pnl) ? (quantity * (lastPrice - avgPrice)) : pnl,
      broker: 'zerodha'
    };
  } catch (error) {
    console.error('Error normalizing Zerodha row:', error);
    return null;
  }
};

const normalizeUpstoxRow = (row: any): Position | null => {
  try {
    const instrument = row['Instrument'] || row['instrument'] || '';
    const type = row['Product'] || row['product'] || '';
    const quantity = parseFloat(row['Qty'] || row['qty'] || '0');
    const avgPrice = parseFloat(row['Avg Price'] || row['avg price'] || '0');
    const lastPrice = parseFloat(row['LTP'] || row['ltp'] || '0');
    const pnl = parseFloat(row['PnL'] || row['pnl'] || '0');

    if (!instrument || isNaN(quantity) || isNaN(avgPrice)) return null;

    return {
      instrument,
      type,
      quantity,
      avgPrice,
      lastPrice: isNaN(lastPrice) ? avgPrice : lastPrice,
      pnl: isNaN(pnl) ? (quantity * (lastPrice - avgPrice)) : pnl,
      broker: 'upstox'
    };
  } catch (error) {
    console.error('Error normalizing Upstox row:', error);
    return null;
  }
};

export const parseCSV = (file: File): Promise<ParsedPortfolio> => {
  return new Promise((resolve, reject) => {
    console.log('Starting CSV parse for file:', file.name);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          console.log('Parse complete. Results:', results);
          const headers = results.meta.fields || [];
          console.log('Detected headers:', headers);
          const broker = detectBroker(headers);
          console.log('Detected broker:', broker);

          if (broker === 'unknown') {
            console.error('Unknown broker format. Headers:', headers);
            reject(new Error('Unrecognized CSV format. Please upload a Zerodha or Upstox portfolio CSV.'));
            return;
          }

          const positions: Position[] = results.data
            .map((row: any) => {
              const normalized = broker === 'zerodha' 
                ? normalizeZerodhaRow(row) 
                : normalizeUpstoxRow(row);
              if (!normalized) {
                console.warn('Failed to normalize row:', row);
              }
              return normalized;
            })
            .filter((p): p is Position => p !== null);

          console.log('Parsed positions:', positions.length);

          if (positions.length === 0) {
            console.error('No valid positions found');
            reject(new Error('No valid positions found in CSV.'));
            return;
          }

          resolve({
            positions,
            broker,
            parseDate: new Date()
          });
        } catch (error) {
          console.error('Error during parsing:', error);
          reject(error);
        }
      },
      error: (error) => {
        console.error('PapaParse error:', error);
        reject(error);
      }
    });
  });
};

// Normalize both CSV and Portfolio Builder positions to unified format
export const normalizeToUnified = (position: any): UnifiedPosition => {
  // Detect format: CSV has 'instrument', Portfolio Builder has 'ticker'
  const isCSVFormat = 'instrument' in position && !('ticker' in position);
  
  if (isCSVFormat) {
    // CSV format (Zerodha/Upstox) - has real P&L data
    return {
      symbol: position.instrument,
      // @ts-expect-error - instrument field for backward compatibility
      instrument: position.instrument,
      type: position.type || 'EQ',
      quantity: position.quantity,
      avgPrice: position.avgPrice,
      lastPrice: position.lastPrice,
      pnl: position.pnl,
      value: position.quantity * position.lastPrice
    };
  } else {
    // Portfolio Builder format - prefer stored currentPrice, value and pnl if present
    const qty = position.shares || position.quantity || 0;
    const entryPrice = position.entryPrice || position.avgPrice || 0;

    // Use currentPrice if it exists, otherwise fall back to entryPrice
    const currentPrice =
      typeof position.currentPrice === 'number' && !isNaN(position.currentPrice)
        ? position.currentPrice
        : entryPrice;

    // Prefer an explicit value field if it exists, otherwise compute from qty × currentPrice
    const positionValue =
      typeof position.value === 'number' && !isNaN(position.value)
        ? position.value
        : qty * currentPrice;

    // Prefer an explicit pnl field if it exists, otherwise default to 0 (no market data)
    const calculatedPnL =
      typeof position.pnl === 'number' && !isNaN(position.pnl)
        ? position.pnl
        : 0;
    
    return {
      symbol: position.ticker || position.instrument || '',
      // @ts-expect-error - instrument is used by existing components expecting CSV format
      instrument: position.ticker || position.instrument || '',
      type: position.type || 'EQ',
      quantity: qty,
      avgPrice: entryPrice,
      lastPrice: currentPrice,
      pnl: calculatedPnL,
      value: positionValue
    };
  }
};

// Detect currency based on portfolio format
export const detectCurrency = (positions: any[]): '₹' | '$' => {
  if (positions.length === 0) return '$';
  
  // CSV format (Zerodha/Upstox) uses rupees
  const isCSVFormat = positions.some(p => 'instrument' in p && !('ticker' in p));
  return isCSVFormat ? '₹' : '$';
};
