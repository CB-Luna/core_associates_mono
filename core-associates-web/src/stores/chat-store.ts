import { create } from 'zustand';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  source?: 'clasico' | 'ia';
  intent?: string;
}

interface ChatState {
  messages: ChatMessage[];
  isOpen: boolean;
  isMinimized: boolean;
  mode: 'clasico' | 'avanzado';
  isLoading: boolean;

  toggleOpen: () => void;
  minimize: () => void;
  restore: () => void;
  close: () => void;
  setMode: (mode: 'clasico' | 'avanzado') => void;
  addMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  setLoading: (v: boolean) => void;
  clearHistory: () => void;
}

let msgCounter = 0;

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isOpen: false,
  isMinimized: false,
  mode: 'clasico',
  isLoading: false,

  toggleOpen: () =>
    set((s) => {
      if (s.isMinimized) return { isMinimized: false, isOpen: true };
      return { isOpen: !s.isOpen, isMinimized: false };
    }),

  minimize: () => set({ isMinimized: true }),
  restore: () => set({ isMinimized: false, isOpen: true }),
  close: () => set({ isOpen: false, isMinimized: false }),

  setMode: (mode) => set({ mode }),

  addMessage: (msg) =>
    set((s) => ({
      messages: [
        ...s.messages,
        { ...msg, id: `msg-${++msgCounter}`, timestamp: new Date() },
      ],
    })),

  setLoading: (isLoading) => set({ isLoading }),
  clearHistory: () => set({ messages: [] }),
}));
