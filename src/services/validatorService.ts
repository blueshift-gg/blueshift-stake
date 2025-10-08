import { Connection } from '@solana/web3.js';
import { connection, VALIDATOR_VOTE_ACCOUNT } from '@/utils/solana';

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

  // Get our validator's information and stats using vote account directly
  async getOurValidatorInfo(): Promise<{
    totalStake: number;
    apy: number;
    nextLeaderSlot: number | null;
  }> {
    try {
      const voteAccount = VALIDATOR_VOTE_ACCOUNT.toBase58();

      const [stakeWizData, epochInfo, leaderSchedule] = await Promise.all([
        this.fetchStakeWizValidator(voteAccount),
        this.connection.getEpochInfo(),
        this.connection.getLeaderSchedule().catch(() => null),
      ]);

      const activatedStakeSol = Number(stakeWizData.activated_stake ?? 0);
      const totalStake = Number.isFinite(activatedStakeSol) ? activatedStakeSol : 0;

      const totalApyValue = Number(stakeWizData.total_apy ?? 0);
      const apy = Number.isFinite(totalApyValue) && totalApyValue > 0 ? totalApyValue : 0;
      let validatorIdentity = stakeWizData.identity ?? voteAccount;

      if (leaderSchedule && (!validatorIdentity || !leaderSchedule[validatorIdentity])) {
        const voteAccountInfo = await this.connection.getParsedAccountInfo(VALIDATOR_VOTE_ACCOUNT);
        const parsedInfo =
          voteAccountInfo?.value && typeof voteAccountInfo.value.data !== 'string'
            ? (voteAccountInfo.value.data as {
                parsed: {
                  info?: { nodePubkey?: string };
                };
              })
            : null;
        const nodePubkey = parsedInfo?.parsed?.info?.nodePubkey;
        if (nodePubkey) {
          validatorIdentity = nodePubkey;
        }
      }

      // Find next leader slot using the validator identity
      let nextLeaderSlot: number | null = null;
      if (leaderSchedule && validatorIdentity && leaderSchedule[validatorIdentity]) {
        const slots = leaderSchedule[validatorIdentity];
        const currentSlot = epochInfo.absoluteSlot;

        for (const slot of slots) {
          if (slot > currentSlot) {
            nextLeaderSlot = slot;
            break;
          }
        }
      }

      return {
        totalStake,
        apy,
        nextLeaderSlot,
      };
    } catch (error) {
      console.error('Error fetching validator info:', error);
      return {
        totalStake: 0,
        apy: 0,
        nextLeaderSlot: null,
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
