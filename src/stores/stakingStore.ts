import { create } from 'zustand';

export type StakeTab = 'stake' | 'unstake' | 'merge';

export type TransactionStatus = {
  type: 'success' | 'error' | null;
  message: string;
};

interface StakeUiState {
  selectedTab: StakeTab;
  transactionStatus: TransactionStatus;
  setSelectedTab: (tab: StakeTab) => void;
  setTransactionStatus: (status: TransactionStatus) => void;
  clearTransactionStatus: () => void;
}

const initialTransactionStatus: TransactionStatus = { type: null, message: '' };

export const useStakeUiStore = create<StakeUiState>((set) => ({
  selectedTab: 'stake',
  transactionStatus: initialTransactionStatus,
  setSelectedTab: (tab) => set({ selectedTab: tab }),
  setTransactionStatus: (status) => set({ transactionStatus: status }),
  clearTransactionStatus: () => set({ transactionStatus: initialTransactionStatus }),
}));
