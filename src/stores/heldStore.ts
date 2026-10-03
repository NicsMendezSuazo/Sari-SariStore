import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { HeldSale, CartItem } from '@/types';

interface HeldState {
  heldSales: HeldSale[];
  hold: (label: string, items: CartItem[], customerId: string | null) => void;
  resume: (id: string) => HeldSale | null;
  remove: (id: string) => void;
  count: () => number;
}

export const useHeldStore = create<HeldState>()(
  persist(
    (set, get) => ({
      heldSales: [],

      hold: (label, items, customerId) => {
        const held: HeldSale = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          label,
          items,
          customerId,
          createdAt: Date.now(),
        };
        set({ heldSales: [held, ...get().heldSales] });
      },

      resume: (id) => {
        const sale = get().heldSales.find((s) => s.id === id);
        if (sale) {
          set({ heldSales: get().heldSales.filter((s) => s.id !== id) });
        }
        return sale || null;
      },

      remove: (id) =>
        set({ heldSales: get().heldSales.filter((s) => s.id !== id) }),

      count: () => get().heldSales.length,
    }),
    { name: 'pos-held' }
  )
);
