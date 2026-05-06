export interface Quote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  marketCap?: number;
  pe?: number;
  week52High?: number;
  week52Low?: number;
  timestamp: number;
}

export interface OrderBookLevel {
  price: number;
  size: number;
  total: number;
}

export interface OrderBook {
  asks: OrderBookLevel[];
  bids: OrderBookLevel[];
}

export interface NewsItem {
  id: string;
  headline: string;
  source: string;
  url: string;
  related: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  datetime: number;
}

export interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}
