import { Connection } from '@solana/web3.js';
import { connection, SOLANA_RPC_ENDPOINT, VALIDATOR_VOTE_ACCOUNT } from '@/utils/solana';

interface StakeWizValidatorResponse {
  activated_stake?: number | string;
  total_apy?: number | string;
  identity?: string;
}

export class ValidatorService {
  private connection: Connection;
  private readonly stakeWizEndpoint = 'https://api.stakewiz.com/validator';
  private readonly maxRetries = 3;
  private readonly retryDelayMs = 500;
  private readonly requestTimeoutMs = 5000;

  constructor() {
    this.connection = connection;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async rpcRequestWithRetry<T>(body: unknown, maxAttempts = 3, initialDelayMs = 250): Promise<T> {
    let delayMs = initialDelayMs;
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await this.rpcRequest<T>(body);
      } catch (error) {
        lastError = error;

        if (attempt === maxAttempts) {
          throw lastError;
        }

        await this.delay(delayMs);
        delayMs *= 2;
      }
    }

    throw lastError as Error;
  }

  private async rpcRequest<T>(body: unknown): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);

    try {
      const response = await fetch(SOLANA_RPC_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`RPC request failed with status ${response.status}`);
      }

      const json = await response.json() as {
        result?: T;
        error?: { code: number; message: string; data?: unknown };
      };

      if (json.error) {
        throw new Error(`RPC error ${json.error.code}: ${json.error.message}`);
      }

      if (typeof json.result === 'undefined') {
        throw new Error('RPC response missing result field');
      }

      return json.result;
    } finally {
      clearTimeout(timeout);
    }
  }

  private async getLeaderSlotsForIdentity(identity: string, slot?: number): Promise<number[] | null> {
    if (!identity) {
      return null;
    }

    try {
      const result = await this.rpcRequestWithRetry<Record<string, number[] | undefined> | null>({
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'getLeaderSchedule',
        params: [
          typeof slot === 'number' ? slot : null,
          {
            commitment: 'processed',
            identity,
          },
        ],
      });

      if (!result) {
        return null;
      }

      return result[identity] ?? null;
    } catch (error) {
      console.error('Failed to fetch leader schedule via RPC:', error);
      return null;
    }
  }

  // Get our validator's information and stats using vote account directly
  async getOurValidatorInfo(): Promise<{
    totalStake: number;
    apy: number;
    currentSlot: number;
    upcomingLeaderSlots: number[];
  }> {
    try {
      const voteAccount = VALIDATOR_VOTE_ACCOUNT.toBase58();

      const [stakeWizData, epochInfo] = await Promise.all([
        this.fetchStakeWizValidator(voteAccount),
        this.connection.getEpochInfo()
      ]);

      // Update stake
      const activatedStakeSol = Number(stakeWizData.activated_stake ?? 0);
      const totalStake = Number.isFinite(activatedStakeSol) ? activatedStakeSol : 0;

      // Update APY
      const totalApyValue = Number(stakeWizData.total_apy ?? 0);
      const apy = Number.isFinite(totalApyValue) && totalApyValue > 0 ? totalApyValue : 0;

      // Compute slots for leader schedule
      const absoluteSlot = typeof epochInfo.absoluteSlot === 'number' ? epochInfo.absoluteSlot : 0;
      const slotIndex = typeof epochInfo.slotIndex === 'number' ? epochInfo.slotIndex : 0;
      const epochStartSlot = absoluteSlot - slotIndex;

      const validatorIdentity = stakeWizData.identity;
      const upcomingLeaderSlots: number[] = [];

        // Find scheduled slots for the current epoch
      if (validatorIdentity !== undefined) {
        const leaderSlots = await this.getLeaderSlotsForIdentity(validatorIdentity, epochInfo.absoluteSlot);

        if (Array.isArray(leaderSlots)) {
          const upcomingSlots = leaderSlots
            .filter(relativeSlot => relativeSlot > slotIndex)
            .map(relativeSlot => epochStartSlot + relativeSlot);
          upcomingLeaderSlots.push(...upcomingSlots);
        }
      }

      return {
        totalStake,
        apy,
        currentSlot: absoluteSlot,
        upcomingLeaderSlots,
      };
    } catch (error) {
      console.error('Error fetching validator info:', error);
      return {
        totalStake: 0,
        apy: 0,
        currentSlot: 0,
        upcomingLeaderSlots: [],
      };
    }
  }

  private async fetchStakeWizValidator(voteAccount: string, attempt = 1): Promise<StakeWizValidatorResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(new Error('StakeWiz request timed out')),
      this.requestTimeoutMs
    );

    try {
      const response = await fetch(`${this.stakeWizEndpoint}/${voteAccount}`, {
        headers: {
          accept: 'application/json',
        },
        cache: 'no-store',
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`StakeWiz responded with ${response.status}`);
      }

      return (await response.json()) as StakeWizValidatorResponse;
    } catch (error) {
      if (attempt >= this.maxRetries) {
        throw error;
      }

      await new Promise(resolve => setTimeout(resolve, this.retryDelayMs * attempt));
      return this.fetchStakeWizValidator(voteAccount, attempt + 1);
    } finally {
      clearTimeout(timeout);
    }
  }
}

export const validatorService = new ValidatorService();
