import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PersistentStore {
  authToken: string | null;
  setAuthToken: (token: string) => void;
  clearAuthToken: () => void;
}

export const usePersistentStore = create<PersistentStore>()(
  persist(
    (set) => ({
      authToken: null,
      setAuthToken: (token) => set({ authToken: token }),
      clearAuthToken: () => set({ authToken: null }),
    }),
    {
      name: "blueshift-stake-storage",
      version: 2,
    }
  )
);
