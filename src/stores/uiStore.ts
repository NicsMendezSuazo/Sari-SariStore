import { create } from 'zustand';

interface UIState {
  cartOpen: boolean;
  paymentOpen: boolean;
  scannerOpen: boolean;
  heldListOpen: boolean;
  receiptData: any | null;
  setCartOpen: (open: boolean) => void;
  setPaymentOpen: (open: boolean) => void;
  setScannerOpen: (open: boolean) => void;
  setHeldListOpen: (open: boolean) => void;
  setReceiptData: (data: any | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  cartOpen: false,
  paymentOpen: false,
  scannerOpen: false,
  heldListOpen: false,
  receiptData: null,

  setCartOpen: (cartOpen) => set({ cartOpen }),
  setPaymentOpen: (paymentOpen) => set({ paymentOpen }),
  setScannerOpen: (scannerOpen) => set({ scannerOpen }),
  setHeldListOpen: (heldListOpen) => set({ heldListOpen }),
  setReceiptData: (receiptData) => set({ receiptData }),
}));
