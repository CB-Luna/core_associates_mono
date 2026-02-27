import { create } from 'zustand';
import { apiClient } from '@/lib/api-client';
import type { MenuItem } from '@/lib/api-types';

interface MenuState {
  items: MenuItem[];
  loading: boolean;
  error: string | null;
  fetchMenu: () => Promise<void>;
}

export const useMenuStore = create<MenuState>((set, get) => ({
  items: [],
  loading: false,
  error: null,

  fetchMenu: async () => {
    // Skip if already loaded
    if (get().items.length > 0) return;

    set({ loading: true, error: null });
    try {
      const items = await apiClient<MenuItem[]>('/menu');
      set({ items, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Error cargando menú',
        loading: false,
      });
    }
  },
}));
