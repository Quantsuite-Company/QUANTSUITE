import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AgentRole = 'ALPHA_1' | 'ALPHA_2' | 'ALPHA_3' | 'ALPHA_4' | 'ALPHA_5' | 'RISK_MANAGER' | 'PORTFOLIO_MANAGER' | 'SYSTEM' | 'USER';

export interface SwarmMessage {
  id: string;
  role: AgentRole;
  content: string;
  timestamp: number;
  dataPayload?: any; // Charts, tickets, backtest results
}

export interface InvestmentThesis {
  id: string;
  symbol: string;
  direction: 'LONG' | 'SHORT';
  confidence: number;
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  timeframe: string;
  reasoning: string;
  validationMetrics?: {
    expectedSharpe: number;
    var95: number;
    winRate: number;
    sizing?: number;
    kelly?: number;
    drawdownLimit?: number;
    volatilityCone?: any[];
    rsiData?: any[];
    radarMap?: any[];
    correlationPenalty?: number;
  };
  status: 'PENDING' | 'REJECTED_BY_RISK' | 'APPROVED_AWAITING_EXECUTION' | 'EXECUTED';
}

interface SwarmState {
  isActive: boolean;
  messages: SwarmMessage[];
  activeTheses: InvestmentThesis[];
  
  // Actions
  toggleSwarm: () => void;
  dispatchMessage: (message: Omit<SwarmMessage, 'id' | 'timestamp'>) => void;
  addThesis: (thesis: InvestmentThesis) => void;
  updateThesisStatus: (id: string, status: InvestmentThesis['status'], metrics?: any) => void;
  clearSwarm: () => void;
}

export const useSwarmStore = create<SwarmState>()(
  persist(
    (set) => ({
      isActive: false,
      messages: [],
      activeTheses: [],
      
      toggleSwarm: () => set((state) => ({ isActive: !state.isActive })),
      
      dispatchMessage: (message) => set((state) => ({
        messages: [
          ...state.messages,
          {
            ...message,
            id: Math.random().toString(36).substring(7),
            timestamp: Date.now(),
          }
        ]
      })),
      
      addThesis: (thesis) => set((state) => ({
        activeTheses: [thesis, ...state.activeTheses]
      })),
      
      updateThesisStatus: (id, status, metrics) => set((state) => ({
        activeTheses: state.activeTheses.map(t => 
          t.id === id ? { 
             ...t, 
             status, 
             validationMetrics: metrics ? { ...t.validationMetrics, ...metrics } : t.validationMetrics 
          } : t
        )
      })),
      
      clearSwarm: () => set({ messages: [], activeTheses: [] }),
    }),
    {
      name: 'swarm-storage',
      partialize: (state) => ({
        messages: state.messages.slice(-50), // keep last 50 for context
        activeTheses: state.activeTheses,
      })
    }
  )
);
