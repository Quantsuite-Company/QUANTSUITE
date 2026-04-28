type Handler = (data: unknown) => void;

class WSManager {
  private socket: WebSocket | null = null;
  private handlers = new Map<string, Set<Handler>>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  // We use a mock WS connection since we don't have a real backend url initially.
  // In a real app we'd connect to finnhub/alpaca. Here we simulate updates.
  private mockIntervals: ReturnType<typeof setInterval>[] = [];

  connect(url: string) {
    if (url === 'mock') {
        this.startMockFeeds();
        return;
    }
    this.socket = new WebSocket(url);
    this.socket.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      this.handlers.get(msg.type)?.forEach(fn => fn(msg.data));
    };
    this.socket.onclose = () => {
      this.reconnectTimer = setTimeout(() => this.connect(url), 3000);
    };
  }

  subscribe(type: string, handler: Handler) {
    if (!this.handlers.has(type)) this.handlers.set(type, new Set());
    this.handlers.get(type)!.add(handler);
    return () => this.handlers.get(type)?.delete(handler);
  }

  send(msg: any) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(msg));
    }
    // Mock handling
    if (!this.socket && msg.type === 'subscribe') {
        // mock logic handled in startMockFeeds
    }
  }

  // --- MOCK SIMULATION FOR DEMO PURPOSES ---
  private startMockFeeds() {
    const symbols = ['AAPL', 'MSFT', 'BTC/USD', 'ETH/USD', 'TSLA', 'NVDA', 'SPY', 'QQQ'];
    const fakePrices: Record<string, number> = {
        'AAPL': 175.49, 'MSFT': 428.36, 'BTC/USD': 72088.99, 'ETH/USD': 4049.42,
        'TSLA': 179.86, 'NVDA': 951.12, 'SPY': 515.92, 'QQQ': 445.81
    };

    // Emit standard deterministic baseline once globally 
    // instead of rapid Math.random() noise which looks unrealistic.
    setTimeout(() => {
        symbols.forEach(sym => {
            const basePrice = fakePrices[sym];
            const quote = {
                symbol: sym,
                price: basePrice,
                change: 0.05, // static positive baseline
                changePercent: 0.02,
                open: basePrice * 0.99,
                high: basePrice * 1.05,
                low: basePrice * 0.95,
                volume: 852000,
                timestamp: Date.now()
            };
            this.handlers.get(`quote:${sym}`)?.forEach(fn => fn(quote));
        });

        // Initialize Book
        const ob = {
          bids: Array.from({length: 15}, (_, i) => ({ price: 175.0 - i * 0.1, size: 500, total: (i+1)*500 })),
          asks: Array.from({length: 15}, (_, i) => ({ price: 175.5 + i * 0.1, size: 500, total: (i+1)*500 })),
        };
        this.handlers.get('orderbook:AAPL')?.forEach(fn => fn(ob));
    }, 500);
  }
}

export const ws = new WSManager();
