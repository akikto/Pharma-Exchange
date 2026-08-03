import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const MAX_RECENT = 10;

interface RecentSearchesState {
  queries: string[];
  add: (query: string) => void;
  remove: (query: string) => void;
  clearAll: () => void;
}

export const useRecentSearchesStore = create<RecentSearchesState>()(
  persist(
    (set) => ({
      queries: [],
      add: (query) => {
        const trimmed = query.trim();
        if (!trimmed) return;
        set((s) => ({
          queries: [trimmed, ...s.queries.filter((q) => q.toLowerCase() !== trimmed.toLowerCase())].slice(0, MAX_RECENT),
        }));
      },
      remove: (query) => set((s) => ({ queries: s.queries.filter((q) => q !== query) })),
      clearAll: () => set({ queries: [] }),
    }),
    { name: 'pharmex-recent-searches' },
  ),
);
