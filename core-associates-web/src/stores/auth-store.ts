import { create } from 'zustand';
import type { User, Tema } from '@/lib/api-types';
import { apiClient } from '@/lib/api-client';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  tema: Tema | null;
  setUser: (user: User) => void;
  loadFromStorage: () => void;
  loadTema: () => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  tema: null,

  setUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, isAuthenticated: true });
  },

  loadFromStorage: () => {
    const token = localStorage.getItem('accessToken');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        set({ user, isAuthenticated: true });
      } catch {
        set({ user: null, isAuthenticated: false });
      }
    }
  },

  loadTema: async () => {
    try {
      const tema = await apiClient<Tema | null>('/temas/mi-tema');
      set({ tema });
      if (tema) {
        localStorage.setItem('serverTema', JSON.stringify(tema));
        // Bridge: apply server tema colors so ThemeProvider picks them up
        if (tema.colores && typeof tema.colores === 'object') {
          localStorage.setItem('themeConfig', JSON.stringify(tema.colores));
          window.dispatchEvent(new StorageEvent('storage', { key: 'themeConfig', newValue: JSON.stringify(tema.colores) }));
        }
      }
    } catch {
      // No tema asignado — usar localStorage local
      set({ tema: null });
    }
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('serverTema');
    set({ user: null, isAuthenticated: false, tema: null });
    window.location.href = '/login';
  },
}));
