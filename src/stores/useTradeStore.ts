import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */

export type TradeDirection = 'LONG' | 'SHORT';
export type TradeState = 'IDLE' | 'ENTERING' | 'LIVE' | 'TARGET_HIT' | 'STOP_HIT' | 'POST_ANALYSIS';

export interface CandleData {
  time: number;       // Unix timestamp (seconds)
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface SignalHealth {
  name: string;
  status: 'green' | 'amber' | 'red';
  value: string;
  description: string;
}

export interface CommentaryEntry {
  timestamp: number;    // seconds since trade open
  text: string;
  displayed: boolean;
}

export interface ActiveTrade {
  id: string;
  ticker: string;
  direction: TradeDirection;
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  confidence: number;
  quantity: number;
  openTime: number;           // Date.now() when trade opened
  status: TradeState;
  exitPrice?: number;
  exitTime?: number;
  thesisId?: string;
  reasoning?: string;
  strategyName?: string;
  agentSignals?: { agent: string; direction: string; conviction: number; reason: string }[];
}

export interface TradeHistory {
  id: string;
  ticker: string;
  direction: TradeDirection;
  entryPrice: number;
  exitPrice: number;
  targetPrice: number;
  stopLoss: number;
  pnl: number;
  pnlPercent: number;
  duration: number;
  result: 'WIN' | 'LOSS';
  confidence: number;
  strategyName?: string;
  closedAt: number;
}

/* ═══════════════════════════════════════════════════════════════
   STORE
   ═══════════════════════════════════════════════════════════════ */

interface TradeStore {
  // State
  activeTrade: ActiveTrade | null;
  currentPrice: number;
  conviction: number;
  priceHistory: CandleData[];
  commentary: CommentaryEntry[];
  signalHealth: SignalHealth[];
  tradeHistory: TradeHistory[];
  isMarketOpen: boolean;

  // Actions
  openTrade: (trade: Omit<ActiveTrade, 'id' | 'openTime' | 'status'>) => void;
  updatePrice: (price: number) => void;
  updateConviction: (conviction: number) => void;
  setPriceHistory: (candles: CandleData[]) => void;
  appendCandle: (candle: CandleData) => void;
  updateCurrentCandle: (candle: Partial<CandleData>) => void;
  setCommentary: (entries: CommentaryEntry[]) => void;
  markCommentaryDisplayed: (index: number) => void;
  setSignalHealth: (signals: SignalHealth[]) => void;
  setMarketOpen: (open: boolean) => void;
  closeTrade: (exitPrice: number, result: 'WIN' | 'LOSS') => void;
  setTradeState: (state: TradeState) => void;
  addToPosition: (additionalQty: number) => void;
  reset: () => void;
}

export const useTradeStore = create<TradeStore>()(
  persist(
    (set, get) => ({
      activeTrade: null,
      currentPrice: 0,
      conviction: 0,
      priceHistory: [],
      commentary: [],
      signalHealth: [],
      tradeHistory: [],
      isMarketOpen: false,

      openTrade: (trade) => set({
        activeTrade: {
          ...trade,
          id: `trade_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          openTime: Date.now(),
          status: 'ENTERING',
        },
        currentPrice: trade.entryPrice,
        conviction: trade.confidence,
        commentary: [],
        signalHealth: [],
      }),

      updatePrice: (price) => set({ currentPrice: price }),

      updateConviction: (conviction) => set({ conviction: Math.max(0, Math.min(100, conviction)) }),

      setPriceHistory: (candles) => set({ priceHistory: candles }),

      appendCandle: (candle) => set((state) => ({
        priceHistory: [...state.priceHistory, candle],
      })),

      updateCurrentCandle: (update) => set((state) => {
        if (state.priceHistory.length === 0) return state;
        const history = [...state.priceHistory];
        const last = { ...history[history.length - 1], ...update };
        history[history.length - 1] = last;
        return { priceHistory: history };
      }),

      setCommentary: (entries) => set({ commentary: entries }),

      markCommentaryDisplayed: (index) => set((state) => {
        const updated = [...state.commentary];
        if (updated[index]) updated[index] = { ...updated[index], displayed: true };
        return { commentary: updated };
      }),

      setSignalHealth: (signals) => set({ signalHealth: signals }),

      setMarketOpen: (open) => set({ isMarketOpen: open }),

      closeTrade: (exitPrice, result) => {
        const state = get();
        if (!state.activeTrade) return;
        const trade = state.activeTrade;
        const pnl = trade.direction === 'LONG'
          ? (exitPrice - trade.entryPrice) * trade.quantity
          : (trade.entryPrice - exitPrice) * trade.quantity;
        const pnlPercent = trade.direction === 'LONG'
          ? ((exitPrice - trade.entryPrice) / trade.entryPrice) * 100
          : ((trade.entryPrice - exitPrice) / trade.entryPrice) * 100;
        const duration = Math.floor((Date.now() - trade.openTime) / 1000);

        const historyEntry: TradeHistory = {
          id: trade.id,
          ticker: trade.ticker,
          direction: trade.direction,
          entryPrice: trade.entryPrice,
          exitPrice,
          targetPrice: trade.targetPrice,
          stopLoss: trade.stopLoss,
          pnl,
          pnlPercent,
          duration,
          result,
          confidence: trade.confidence,
          strategyName: trade.strategyName,
          closedAt: Date.now(),
        };

        set({
          activeTrade: {
            ...trade,
            exitPrice,
            exitTime: Date.now(),
            status: result === 'WIN' ? 'TARGET_HIT' : 'STOP_HIT',
          },
          tradeHistory: [historyEntry, ...state.tradeHistory].slice(0, 100),
        });
      },

      setTradeState: (status) => set((state) => ({
        activeTrade: state.activeTrade ? { ...state.activeTrade, status } : null,
      })),

      addToPosition: (additionalQty) => set((state) => ({
        activeTrade: state.activeTrade
          ? { ...state.activeTrade, quantity: state.activeTrade.quantity + additionalQty }
          : null,
      })),

      reset: () => set({
        activeTrade: null,
        currentPrice: 0,
        conviction: 0,
        priceHistory: [],
        commentary: [],
        signalHealth: [],
      }),
    }),
    {
      name: 'trade-store',
      partialize: (state) => ({
        activeTrade: state.activeTrade,
        tradeHistory: state.tradeHistory.slice(0, 50),
      }),
    }
  )
);
