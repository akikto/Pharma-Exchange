import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WatchlistState {
  medicineIds: string[];
  add: (medicineId: string) => void;
  remove: (medicineId: string) => void;
  toggle: (medicineId: string) => void;
  has: (medicineId: string) => boolean;
  count: () => number;
}

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set, get) => ({
      medicineIds: [],
      add: (medicineId) =>
        set((s) => ({
          medicineIds: s.medicineIds.includes(medicineId)
            ? s.medicineIds
            : [...s.medicineIds, medicineId],
        })),
      remove: (medicineId) =>
        set((s) => ({ medicineIds: s.medicineIds.filter((id) => id !== medicineId) })),
      toggle: (medicineId) => {
        const { has, add, remove } = get();
        if (has(medicineId)) remove(medicineId);
        else add(medicineId);
      },
      has: (medicineId) => get().medicineIds.includes(medicineId),
      count: () => get().medicineIds.length,
    }),
    { name: 'pharmex-watchlist' },
  ),
);
