import {
  Connection,
  PublicKey,
  Transaction,
  StakeProgram,
  Authorized,
  Lockup,
  Keypair,
} from '@solana/web3.js';
import { connection, VALIDATOR_VOTE_ACCOUNT, solToLamports, lamportsToSol } from '@/utils/solana';

export interface StakeAccount {
  pubkey: PublicKey;
  lamports: number;
  state: 'active' | 'inactive' | 'activating' | 'deactivating';
  validator?: PublicKey;
  activationEpoch?: number;
  deactivationEpoch?: number;
}

export interface StakingStats {
  totalStaked: number;
  availableBalance: number;
  apy: number;
}

export class StakingService {
  private connection: Connection;

  constructor() {
    this.connection = connection;
  }

  // Get user's SOL balance
  async getBalance(publicKey: PublicKey): Promise<number> {
    try {
      const balance = await this.connection.getBalance(publicKey);
      return lamportsToSol(balance);
    } catch (error) {
      console.error('Error fetching balance:', error);
      return 0;
    }
  }

  // Get all stake accounts for a user
  async getStakeAccounts(publicKey: PublicKey): Promise<StakeAccount[]> {
    try {
      const stakeAccounts = await this.connection.getParsedProgramAccounts(
        StakeProgram.programId,
        {
          filters: [
            {
              memcmp: {
                offset: 12, // Authorized staker offset
                bytes: publicKey.toBase58(),
              },
            },
          ],
        }
      );

      return stakeAccounts.map((account) => {
        const parsedData = account.account.data as {
          parsed?: {
            info?: {
              stake?: {
                delegation?: {
                  voter?: string;
                  activationEpoch?: string;
                  deactivationEpoch?: string;
                };
              };
            };
          };
        };
        const info = parsedData.parsed?.info;

        let state: 'active' | 'inactive' | 'activating' | 'deactivating' = 'inactive';
        if (info?.stake) {
          if (info.stake.delegation?.deactivationEpoch !== '18446744073709551615') {
            state = 'deactivating';
          } else if (info.stake.delegation?.activationEpoch) {
            state = 'active';
          } else {
            state = 'activating';
          }
        }

        return {
          pubkey: account.pubkey,
          lamports: account.account.lamports,
          state,
          validator: info?.stake?.delegation?.voter ? new PublicKey(info.stake.delegation.voter) : undefined,
          activationEpoch: info?.stake?.delegation?.activationEpoch ? parseInt(info.stake.delegation.activationEpoch) : undefined,
          deactivationEpoch: info?.stake?.delegation?.deactivationEpoch && info.stake.delegation.deactivationEpoch !== '18446744073709551615'
            ? parseInt(info.stake.delegation.deactivationEpoch)
            : undefined,
        };
      });
    } catch (error) {
      console.error('Error fetching stake accounts:', error);
      return [];
    }
  }

  // Create stake account and delegate to validator
  async createStake(
    userPublicKey: PublicKey,
    amount: number,
    signTransaction: (transaction: Transaction) => Promise<Transaction>
  ): Promise<{ success: boolean; signature?: string; error?: string }> {
    try {
      const amountLamports = solToLamports(amount);
      const minimumAmount = solToLamports(0.001); // Minimum for rent exemption

      if (amountLamports < minimumAmount) {
        return {
          success: false,
          error: 'Amount too small. Minimum stake is 0.001 SOL',
        };
      }

      // Generate new stake account
      const stakeAccount = Keypair.generate();

      // Create transaction
      const transaction = new Transaction();

      // Create stake account
      transaction.add(
        StakeProgram.createAccount({
          fromPubkey: userPublicKey,
          stakePubkey: stakeAccount.publicKey,
          authorized: new Authorized(userPublicKey, userPublicKey),
          lockup: new Lockup(0, 0, userPublicKey),
          lamports: amountLamports,
        })
      );

      // Delegate stake
      transaction.add(
        StakeProgram.delegate({
          stakePubkey: stakeAccount.publicKey,
          authorizedPubkey: userPublicKey,
          votePubkey: VALIDATOR_VOTE_ACCOUNT,
        })
      );

      // Get recent blockhash
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = userPublicKey;

      // Partially sign with stake account
      transaction.partialSign(stakeAccount);

      // Have user sign the transaction
      const signedTransaction = await signTransaction(transaction);

      // Send transaction
      const signature = await this.connection.sendRawTransaction(
        signedTransaction.serialize()
      );

      // Confirm transaction
      await this.connection.confirmTransaction(signature, 'confirmed');

      return {
        success: true,
        signature,
      };
    } catch (error) {
      console.error('Error creating stake:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // Get staking statistics for user
  async getStakingStats(publicKey: PublicKey): Promise<StakingStats> {
    try {
      const [balance, stakeAccounts] = await Promise.all([
        this.getBalance(publicKey),
        this.getStakeAccounts(publicKey),
      ]);

      const totalStaked = stakeAccounts.reduce((sum, account) =>
        sum + lamportsToSol(account.lamports), 0
      );

      const apy = 6.1;

      return {
        totalStaked,
        availableBalance: balance,
        apy,
      };
    } catch (error) {
      console.error('Error fetching staking stats:', error);
      return {
        totalStaked: 0,
        availableBalance: 0,
        apy: 0,
      };
    }
  }

  async withdrawStake(
    userPublicKey: PublicKey,
    stakeAccount: PublicKey,
    amount: number,
    signTransaction: (transaction: Transaction) => Promise<Transaction>
  ): Promise<{ success: boolean; signature?: string; error?: string }> {
    try {
      const transaction = new Transaction();

      transaction.add(
        StakeProgram.deactivate({
          stakePubkey: stakeAccount,
          authorizedPubkey: userPublicKey,
        })
      );

      transaction.add(
        StakeProgram.withdraw({
          stakePubkey: stakeAccount,
          authorizedPubkey: userPublicKey,
          toPubkey: userPublicKey,
          lamports: solToLamports(amount),
        })
      );

      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = userPublicKey;

      const signedTransaction = await signTransaction(transaction);

      const signature = await this.connection.sendRawTransaction(
        signedTransaction.serialize()
      );

      await this.connection.confirmTransaction(signature, "confirmed");

      return { success: true, signature };
    } catch (error) {
      console.error("Error removing stake:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  async mergeStake(
    userPublicKey: PublicKey,
    sourceAccount: PublicKey,
    destinationAccount: PublicKey,
    signTransaction: (transaction: Transaction) => Promise<Transaction>
  ): Promise<{ success: boolean; signature?: string; error?: string }> {
    try {
      const transaction = new Transaction();

      transaction.add(
        StakeProgram.merge({
          stakePubkey: destinationAccount,
          authorizedPubkey: userPublicKey,
          sourceStakePubKey: sourceAccount,
        })
      );

      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = userPublicKey;

      const signedTransaction = await signTransaction(transaction);

      const signature = await this.connection.sendRawTransaction(
        signedTransaction.serialize()
      );

      await this.connection.confirmTransaction(signature, "confirmed");

      return { success: true, signature };

    } catch (error) {
      console.error("Error merging stake:", error);
      return { success: false, error: error instanceof Error ? error.message : "Unknown error occurred" };
    }
  }
}

export const stakingService = new StakingService();
