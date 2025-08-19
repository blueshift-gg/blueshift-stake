import { Connection } from '@solana/web3.js';
import { connection, VALIDATOR_VOTE_ACCOUNT } from '@/utils/solana';
import { lamportsToSol } from '@/utils/solana';

export class ValidatorService {
  private connection: Connection;

  constructor() {
    this.connection = connection;
  }

  // Get our validator's information and stats using vote account directly
  async getOurValidatorInfo(): Promise<{
    totalStake: number;
    commission: number;
    apy: number;
    nextLeaderSlot: number | null;
  }> {
    try {
      const [epochInfo, leaderSchedule, voteAccountInfo] = await Promise.all([
        this.connection.getEpochInfo(),
        this.connection.getLeaderSchedule().catch(() => null),
        this.connection.getParsedAccountInfo(VALIDATOR_VOTE_ACCOUNT),
      ]);

      if (!voteAccountInfo?.value?.data || typeof voteAccountInfo.value.data === 'string') {
        console.error('Vote account not found or data not parsed');
        return {
          totalStake: 0,
          commission: 0,
          apy: 0,
          nextLeaderSlot: null,
        };
      }

      // Extract vote account data
      const voteData = voteAccountInfo.value.data as {
        parsed: {
          info: {
            commission: number;
            epochCredits: Array<[number, number, number]>;
            nodePubkey: string;
            votePubkey: string;
          };
        };
      };

      const commission = voteData.parsed.info.commission;

      // Get activated stake directly for our validator
      // Note: We still need getVoteAccounts because the vote account data itself
      // doesn't contain the activated stake amount - that's calculated by the runtime
      const allVoteAccounts = await this.connection.getVoteAccounts('confirmed');
      const ourValidator = allVoteAccounts.current.find(
        v => v.votePubkey === VALIDATOR_VOTE_ACCOUNT.toBase58()
      ) || allVoteAccounts.delinquent.find(
        v => v.votePubkey === VALIDATOR_VOTE_ACCOUNT.toBase58()
      );

      const totalStake = ourValidator ? lamportsToSol(ourValidator.activatedStake) : 0;

      // Calculate APY based on network rewards (simplified)
      const baseAPY = 6.8; // Current Solana network base APY
      const apy = baseAPY * (1 - commission / 100);

      // Find next leader slot using the identity account from vote data
      let nextLeaderSlot: number | null = null;
      if (leaderSchedule && voteData.parsed.info.nodePubkey) {
        const validatorIdentity = voteData.parsed.info.nodePubkey;
        if (leaderSchedule[validatorIdentity]) {
          const slots = leaderSchedule[validatorIdentity];
          const currentSlot = epochInfo.absoluteSlot;

          // Find next slot that's greater than current slot
          for (const slot of slots) {
            if (slot > currentSlot) {
              nextLeaderSlot = slot;
              break;
            }
          }
        }
      }

      return {
        totalStake,
        commission,
        apy,
        nextLeaderSlot,
      };
    } catch (error) {
      console.error('Error fetching validator info:', error);
      return {
        totalStake: 0,
        commission: 0,
        apy: 0,
        nextLeaderSlot: null,
      };
    }
  }
}

export const validatorService = new ValidatorService();
