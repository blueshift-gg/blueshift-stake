import {
  Connection,
  PublicKey,
  Transaction,
  StakeProgram,
  Authorized,
  Lockup,
  Keypair,
} from '@solana/web3.js';
import {
  connection,
  VALIDATOR_VOTE_ACCOUNT,
  solToLamports,
  lamportsToSol,
  formatSol,
} from '@/utils/solana';
import {
  getStakeDecoder,
  getMetaDecoder,
  type Meta,
  type Stake as StakeData,
} from '@solana-program/stake';
import { getStakeActivation } from '@anza-xyz/solana-rpc-get-stake-activation';
import type { StakeActivation as StakeActivationStatus } from '@anza-xyz/solana-rpc-get-stake-activation';

const STAKE_DECODER = getStakeDecoder();
const META_DECODER = getMetaDecoder();

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
      console.error("Error fetching balance:", error);
      return 0;
    }
  }

  async getMinimumBalanceForRentExemption(): Promise<number> {
    return await this.connection.getMinimumBalanceForRentExemption(StakeProgram.space);
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

        let state: "active" | "inactive" | "activating" | "deactivating" =
          "inactive";
        if (info?.stake) {
          if (
            info.stake.delegation?.deactivationEpoch !== "18446744073709551615"
          ) {
            state = "deactivating";
          } else if (info.stake.delegation?.activationEpoch) {
            state = "active";
          } else {
            state = "activating";
          }
        }

        return {
          pubkey: account.pubkey,
          lamports: account.account.lamports,
          state,
          validator: info?.stake?.delegation?.voter
            ? new PublicKey(info.stake.delegation.voter)
            : undefined,
          activationEpoch: info?.stake?.delegation?.activationEpoch
            ? parseInt(info.stake.delegation.activationEpoch)
            : undefined,
          deactivationEpoch:
            info?.stake?.delegation?.deactivationEpoch &&
            info.stake.delegation.deactivationEpoch !== "18446744073709551615"
              ? parseInt(info.stake.delegation.deactivationEpoch)
              : undefined,
        };
      });
    } catch (error) {
      console.error("Error fetching stake accounts:", error);
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
      const minimumAmount = solToLamports(0.001) + await this.getMinimumBalanceForRentExemption(); // Minimum for rent exemption

      if (amountLamports < minimumAmount) {
        return {
          success: false,
          error: `Amount too small. Minimum stake is ${formatSol(lamportsToSol(minimumAmount))} SOL`,
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
      await this.connection.confirmTransaction(signature, "confirmed");

      return {
        success: true,
        signature,
      };
    } catch (error) {
      console.error("Error creating stake:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Deactivate a stake account.
   * Returns the transaction signature if successful.
   */
  async deactivateStake(
    userPublicKey: PublicKey,
    stakeAccount: PublicKey,
    withdrawLamports: number,
    signTransaction: (transaction: Transaction) => Promise<Transaction>
  ): Promise<{ success: boolean; signature?: string; error?: string }> {
    try {
      let newStakeAccount: Keypair | undefined = undefined;

      const totalStaked = await this.getBalance(stakeAccount);
      const transaction = new Transaction();

      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = userPublicKey;

      if (solToLamports(withdrawLamports) < solToLamports(totalStaked)) {
        // Partial withdraw: split first
        const rentExemption =
          await this.connection.getMinimumBalanceForRentExemption(
            StakeProgram.space
          );

        newStakeAccount = Keypair.generate();

        transaction.add(
          StakeProgram.split({
            stakePubkey: stakeAccount,
            authorizedPubkey: userPublicKey,
            splitStakePubkey: newStakeAccount.publicKey,
            lamports:
              solToLamports(totalStaked) -
              solToLamports(withdrawLamports)
          },
          rentExemption
        )
        );
      }

      transaction.add(
        StakeProgram.deactivate({
          stakePubkey: stakeAccount,
          authorizedPubkey: userPublicKey,
        })
      );

      // The new account must be a signer for the transaction
      if (newStakeAccount) {
        transaction.partialSign(newStakeAccount);
      }

      const signedTransaction = await signTransaction(transaction);

      const signature = await this.connection.sendRawTransaction(
        signedTransaction.serialize()
      );

      await this.connection.confirmTransaction(signature, "confirmed");

      return { success: true, signature };
    } catch (error) {
      console.error("Error deactivating stake:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Withdraw stake from a (deactivated and fully cooled down) stake account.
   * If withdrawing a partial amount, splits the account first.
   * Checks that the stake is deactivated and cooldown is complete.
   */
  async withdrawStake(
    userPublicKey: PublicKey,
    stakeAccount: PublicKey,
    signTransaction: (transaction: Transaction) => Promise<Transaction>
  ): Promise<{ success: boolean; signature?: string; error?: string }> {
    try {
      // Fetch stake account info
      const stakeAccountInfo = await this.connection.getAccountInfo(stakeAccount);
      if (!stakeAccountInfo) {
        throw new Error("Stake account not found");
      }
  const stakeDecoded = STAKE_DECODER.decode(Buffer.from(stakeAccountInfo.data), 124);

      // Check if stake is deactivated and cooldown is complete
      const deactivationEpoch = stakeDecoded.delegation?.deactivationEpoch;
      const currentEpoch = (await this.connection.getEpochInfo()).epoch;

      if (deactivationEpoch !== undefined && currentEpoch <= deactivationEpoch) {
        throw new Error("Stake account is still in cooldown. Please wait until the deactivation epoch has passed.");
      }

      const stakeAmountLamports = await this.getBalance(stakeAccount);
      const withdrawLamports = solToLamports(stakeAmountLamports);

      const transaction = new Transaction();

      transaction.add(
        StakeProgram.withdraw({
          stakePubkey: stakeAccount,
          authorizedPubkey: userPublicKey,
          toPubkey: userPublicKey,
          lamports: withdrawLamports,
        })
      );

      const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.lastValidBlockHeight = lastValidBlockHeight;
      transaction.feePayer = userPublicKey;

      const signedTransaction = await signTransaction(transaction);

      const signature = await this.connection.sendRawTransaction(
        signedTransaction.serialize()
      );

      await this.connection.confirmTransaction(signature, "confirmed");

      return { success: true, signature };
    } catch (error) {
      console.error("Error withdrawing stake:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  private async validateMergeConditions(
    sourceAccount: PublicKey,
    destinationAccount: PublicKey
  ): Promise<{ success: boolean; error?: string }> {
    const [sourceInfo, destinationInfo] = await Promise.all([
      this.connection.getAccountInfo(sourceAccount),
      this.connection.getAccountInfo(destinationAccount),
    ]);

    if (!sourceInfo) {
      return { success: false, error: "Source stake account not found." };
    }

    if (!destinationInfo) {
      return { success: false, error: "Destination stake account not found." };
    }

    let sourceMeta: Meta;
    let destinationMeta: Meta;

    try {
      sourceMeta = META_DECODER.decode(Buffer.from(sourceInfo.data), 4);
      destinationMeta = META_DECODER.decode(Buffer.from(destinationInfo.data), 4);
    } catch (error) {
      console.error("Failed to decode stake account metadata:", error);
      return {
        success: false,
        error: "Unable to decode stake account metadata for merge validation.",
      };
    }

    if (sourceMeta.authorized.staker !== destinationMeta.authorized.staker) {
      return {
        success: false,
        error: "Stake accounts must share the same authorized staker to merge.",
      };
    }

    if (sourceMeta.authorized.withdrawer !== destinationMeta.authorized.withdrawer) {
      return {
        success: false,
        error: "Stake accounts must share the same withdraw authority to merge.",
      };
    }

    const lockupMatches =
      sourceMeta.lockup.custodian === destinationMeta.lockup.custodian &&
      sourceMeta.lockup.epoch === destinationMeta.lockup.epoch &&
      sourceMeta.lockup.unixTimestamp === destinationMeta.lockup.unixTimestamp;

    if (!lockupMatches) {
      return {
        success: false,
        error: "Stake accounts must share the same lockup configuration to merge.",
      };
    }

    const sourceStakeData = this.decodeStakeData(sourceInfo.data);
    const destinationStakeData = this.decodeStakeData(destinationInfo.data);

    const sourceDelegation = sourceStakeData?.delegation;
    const destinationDelegation = destinationStakeData?.delegation;

    const sourceVoter = sourceDelegation?.voterPubkey;
    const destinationVoter = destinationDelegation?.voterPubkey;

    const sourceCredits = sourceStakeData?.creditsObserved;
    const destinationCredits = destinationStakeData?.creditsObserved;

    const sourceActivationEpoch = sourceDelegation?.activationEpoch;
    const destinationActivationEpoch = destinationDelegation?.activationEpoch;

    let sourceActivation: StakeActivationStatus;
    let destinationActivation: StakeActivationStatus;
    let epochInfo;

    try {
      const [sourceResult, destinationResult, epochResult] = await Promise.all([
        getStakeActivation(this.connection, sourceAccount),
        getStakeActivation(this.connection, destinationAccount),
        this.connection.getEpochInfo(),
      ]);

      sourceActivation = sourceResult;
      destinationActivation = destinationResult;
      epochInfo = epochResult;
    } catch (error) {
      console.error("Failed to fetch stake activation status:", error);
      return {
        success: false,
        error: "Unable to fetch stake activation status for merge validation.",
      };
    }

    const currentEpoch = epochInfo.epoch;
    const currentEpochBigInt = BigInt(currentEpoch);

    if (
      this.isTransientActivation(sourceActivation) ||
      this.isTransientActivation(destinationActivation)
    ) {
      return {
        success: false,
        error: "Cannot merge stakes that are partially activating or deactivating.",
      };
    }

    if (
      sourceActivation.status === "inactive" &&
      destinationActivation.status === "inactive"
    ) {
      return { success: true };
    }

    if (
      sourceActivation.status === "inactive" &&
      destinationActivation.status === "activating"
    ) {
      if (!destinationDelegation) {
        return {
          success: false,
          error: "Destination activating stake is missing delegation data.",
        };
      }

      if (
        destinationActivationEpoch === undefined ||
        destinationActivationEpoch !== currentEpochBigInt
      ) {
        return {
          success: false,
          error:
            "Destination activating stake must be in its activation epoch to merge.",
        };
      }

    if (destinationActivation.active > BigInt(0)) {
        return {
          success: false,
          error:
            "Destination activating stake already has active balance; wait for activation to complete before merging.",
        };
      }

      return { success: true };
    }

    if (
      sourceActivation.status === "activating" &&
      destinationActivation.status === "inactive"
    ) {
      return {
        success: false,
        error: "Select the activating stake as the destination account when merging.",
      };
    }

    if (
      sourceActivation.status === "active" &&
      destinationActivation.status === "active"
    ) {
      if (!sourceDelegation || !destinationDelegation) {
        return {
          success: false,
          error: "Active stakes must include delegation data to merge.",
        };
      }

      if (!sourceVoter || !destinationVoter || sourceVoter !== destinationVoter) {
        return {
          success: false,
          error: "Active stakes must share the same delegated vote account to merge.",
        };
      }

      if (
        sourceCredits === undefined ||
        destinationCredits === undefined ||
        sourceCredits !== destinationCredits
      ) {
        console.log("Source credits:", sourceCredits, "Destination credits:", destinationCredits);
        return {
          success: false,
          error: "Active stakes must share the same vote credits observed to merge.",
        };
      }

      return { success: true };
    }

    if (
      sourceActivation.status === "activating" &&
      destinationActivation.status === "activating"
    ) {
      if (!sourceDelegation || !destinationDelegation) {
        return {
          success: false,
          error: "Activating stakes must include delegation data to merge.",
        };
      }

      if (
        sourceActivationEpoch === undefined ||
        destinationActivationEpoch === undefined ||
        sourceActivationEpoch !== destinationActivationEpoch ||
        sourceActivationEpoch !== currentEpochBigInt
      ) {
        return {
          success: false,
          error:
            "Activating stakes can only be merged during their shared activation epoch.",
        };
      }

      if (!sourceVoter || !destinationVoter || sourceVoter !== destinationVoter) {
        return {
          success: false,
          error: "Activating stakes must share the same delegated vote account to merge.",
        };
      }

      if (
        sourceCredits === undefined ||
        destinationCredits === undefined ||
        sourceCredits !== destinationCredits
      ) {
        console.error("Source credits:", sourceCredits, "Destination credits:", destinationCredits);
        return {
          success: false,
          error:
            "Activating stakes must share identical vote credits observed to merge.",
        };
      }

      if (
        sourceActivation.active > BigInt(0) ||
        destinationActivation.active > BigInt(0)
      ) {
        return {
          success: false,
          error:
            "Cannot merge activating stakes once any portion has become active.",
        };
      }

      return { success: true };
    }

    return {
      success: false,
      error: "Selected stake accounts cannot be merged in their current states.",
    };
  }

  async mergeStake(
    userPublicKey: PublicKey,
    sourceAccount: PublicKey,
    destinationAccount: PublicKey,
    signTransaction: (transaction: Transaction) => Promise<Transaction>
  ): Promise<{ success: boolean; signature?: string; error?: string }> {
    try {
      const validation = await this.validateMergeConditions(sourceAccount, destinationAccount);
      if (!validation.success) {
        return {
          success: false,
          error: validation.error,
        };
      }

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
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  async splitStake(
    userPublicKey: PublicKey,
    stakeAccount: PublicKey,
    amount: number,
    signTransaction: (transaction: Transaction) => Promise<Transaction>
  ): Promise<{ success: boolean; signature?: string; error?: string }> {
    const amountLamports = solToLamports(amount);
    const minimumAmount = solToLamports(0.001); // Minimum for rent exemption

    if (amountLamports < minimumAmount) {
      return {
        success: false,
        error: "Amount too small. Minimum stake is 0.001 SOL",
      };
    }

    const rentExemption =
      await this.connection.getMinimumBalanceForRentExemption(
        StakeProgram.space
      );

    const splitStakeAccount = Keypair.generate();

    try {
      const transaction = new Transaction();
      transaction.add(
        StakeProgram.split(
          {
            stakePubkey: stakeAccount,
            authorizedPubkey: userPublicKey,
            lamports: amountLamports,
            splitStakePubkey: splitStakeAccount.publicKey,
          },
          rentExemption
        )
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
      console.error("Error splitting stake:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  private decodeStakeData(data: Uint8Array | Buffer): StakeData | null {
    try {
      return STAKE_DECODER.decode(Buffer.from(data), 124);
    } catch {
      return null;
    }
  }

  private isTransientActivation(
    activation: StakeActivationStatus | undefined
  ): boolean {
    if (!activation) {
      return false;
    }

    if (
      activation.status === "activating" ||
      activation.status === "deactivating"
    ) {
      return activation.active > BigInt(0);
    }

    return false;
  }
}

export const stakingService = new StakingService();
