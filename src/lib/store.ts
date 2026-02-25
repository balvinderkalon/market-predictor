import { create } from 'zustand';

type Filter = 'all' | 'stocks' | 'crypto' | 'indices';

interface AppState {
  filter: Filter;
  setFilter: (f: Filter) => void;
}

export const useAppStore = create<AppState>((set) => ({
  filter: 'all',
  setFilter: (filter) => set({ filter }),
}));
