import { create } from 'zustand';

export type ShellModal =
  | 'buyRequest'
  | 'listingEdit'
  | 'bulk'
  | null;

export interface BuyRequestModalContext {
  listingId: string;
  medicineName: string;
  finalPrice: number;
  moq: number;
  availableQty: number;
  sellerId: string;
}

interface ShellState {
  bottomSheetExpanded: boolean;
  activeModal: ShellModal;
  buyRequestContext: BuyRequestModalContext | null;
  listingEditId: string | null;
  setBottomSheetExpanded: (expanded: boolean) => void;
  toggleBottomSheet: () => void;
  openModal: (modal: Exclude<ShellModal, null>, context?: Partial<{ buyRequest: BuyRequestModalContext; listingId: string }>) => void;
  closeModal: () => void;
}

export const useShellStore = create<ShellState>((set) => ({
  bottomSheetExpanded: false,
  activeModal: null,
  buyRequestContext: null,
  listingEditId: null,
  setBottomSheetExpanded: (expanded) => set({ bottomSheetExpanded: expanded }),
  toggleBottomSheet: () => set((s) => ({ bottomSheetExpanded: !s.bottomSheetExpanded })),
  openModal: (modal, context) =>
    set({
      activeModal: modal,
      buyRequestContext: context?.buyRequest ?? null,
      listingEditId: context?.listingId ?? null,
    }),
  closeModal: () =>
    set({ activeModal: null, buyRequestContext: null, listingEditId: null }),
}));
