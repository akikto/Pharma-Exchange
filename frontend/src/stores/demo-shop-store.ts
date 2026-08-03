import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DemoShopState {
  activeShopId: string | null;
  setActiveShopId: (id: string | null) => void;
}

export const useDemoShopStore = create<DemoShopState>()(
  persist(
    (set) => ({
      activeShopId: null,
      setActiveShopId: (id) => set({ activeShopId: id }),
    }),
    { name: 'pharmex-demo-shop' },
  ),
);
