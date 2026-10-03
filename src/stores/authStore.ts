import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  isSetup: boolean;
  isLocked: boolean;
  storeName: string;
  ownerName: string;
  setup: (storeName: string, ownerName: string) => void;
  lock: () => void;
  unlock: () => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isSetup: false,
      isLocked: false,
      storeName: 'Sari-Sari Store',
      ownerName: '',

      setup: (storeName, ownerName) =>
        set({ isSetup: true, storeName, ownerName, isLocked: false }),

      lock: () => set({ isLocked: true }),
      unlock: () => set({ isLocked: false }),

      reset: () =>
        set({ isSetup: false, isLocked: false, storeName: 'Sari-Sari Store', ownerName: '' }),
    }),
    { name: 'pos-auth' }
  )
);
