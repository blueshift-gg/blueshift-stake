import { create } from 'zustand';
import { PublicKey } from '@solana/web3.js';
import { StakeAccount, StakingStats, stakingService } from '@/services/stakingService';

interface StakingState {
  // Wallet state
  isConnected: boolean;
  publicKey: PublicKey | null;
  balance: number;

  // Staking data
  stakeAccounts: StakeAccount[];
  stakingStats: StakingStats;

  // UI state
  isLoading: boolean;
  error: string | null;
  lastUpdated: number;

  // Network data
  networkStats: {
    currentEpoch: number;
    epochProgress: number;
    totalSupply: number;
    totalStaked: number;
    stakingRatio: number;
    tps: number;
  };

  // Validator-specific data

  // Actions
  setWallet: (publicKey: PublicKey | null) => void;
  fetchUserData: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  refreshData: () => Promise<void>;
}

export const useStakingStore = create<StakingState>((set, get) => ({
  // Initial state
  isConnected: false,
  publicKey: null,
  balance: 0,
  stakeAccounts: [],
  stakingStats: {
    totalStaked: 0,
    availableBalance: 0,
    apy: 0,
  },
  isLoading: false,
  error: null,
  lastUpdated: 0,
  networkStats: {
    currentEpoch: 0,
    epochProgress: 0,
    totalSupply: 0,
    totalStaked: 0,
    stakingRatio: 0,
    tps: 0,
  },
  // Actions
  setWallet: (publicKey) => {
    set({
      publicKey,
      isConnected: !!publicKey,
      // Reset user data when wallet changes
      balance: 0,
      stakeAccounts: [],
      stakingStats: {
        totalStaked: 0,
        availableBalance: 0,
        apy: 0,
      },
    });

    // Fetch new data if wallet is connected
    if (publicKey) {
      get().fetchUserData();
    }
  },

  fetchUserData: async () => {
    const { publicKey } = get();
    if (!publicKey) return;

    set({ isLoading: true, error: null });

    try {
      const balance = await stakingService.getBalance(publicKey);

      set({
        balance,
        lastUpdated: Date.now(),
        isLoading: false,
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch user data',
        isLoading: false,
      });
    }
  },

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  refreshData: async () => {
    const { publicKey, fetchUserData } = get();

    if (publicKey) {
      await fetchUserData();
    }
  },
}));
