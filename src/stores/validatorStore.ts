import { create } from 'zustand';
import { validatorService } from '@/services/validatorService';

type ValidatorStats = {
  totalStake: number;
  apy: number;
  currentSlot: number;
  upcomingLeaderSlots: number[];
};

type ValidatorStatus = 'idle' | 'loading' | 'refreshing' | 'ready' | 'error';

type ValidatorStoreState = {
  stats: ValidatorStats;
  status: ValidatorStatus;
  fetchStats: () => Promise<void>;
  resetStatus: () => void;
};

const initialStats: ValidatorStats = {
  totalStake: 0,
  apy: 0,
  currentSlot: 0,
  upcomingLeaderSlots: [],
};

let inflightRequest: Promise<void> | null = null;

export const useValidatorStore = create<ValidatorStoreState>((set) => ({
  stats: initialStats,
  status: 'idle',
  fetchStats: async () => {
    set((state) => {
      if (state.status === 'loading' || state.status === 'refreshing') {
        return state;
      }

      return {
        ...state,
        status: state.status === 'ready' ? 'refreshing' : 'loading',
      };
    });

    if (!inflightRequest) {
      inflightRequest = (async () => {
        try {
          const stats = await validatorService.getOurValidatorInfo();
          set({ stats, status: 'ready' });
        } catch (error) {
          console.error('Error fetching validator stats:', error);
          set({ status: 'error' });
          throw error;
        } finally {
          inflightRequest = null;
        }
      })();
    }

    try {
      await inflightRequest;
    } catch (error) {
      // Error already logged and state set in the request above
      throw error;
    }
  },
  resetStatus: () => set({ status: 'idle' }),
}));
