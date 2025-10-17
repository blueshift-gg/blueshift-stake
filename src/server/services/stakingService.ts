import {
  Authorized,
  Connection,
  Keypair,
  Lockup,
  PublicKey,
  StakeProgram,
  Transaction,
} from "@solana/web3.js";
import { getStakeActivation } from "@anza-xyz/solana-rpc-get-stake-activation";
import {
  getMetaDecoder,
  getStakeDecoder,
  type Meta,
  type Stake as StakeData,
} from "@solana-program/stake";
import { lamportsToSol, solToLamports, VALIDATOR_VOTE_ACCOUNT, connection } from "@/utils/solana";

const STAKE_DECODER = getStakeDecoder();
const META_DECODER = getMetaDecoder();
const STAKE_PROGRAM_ID = new PublicKey("Stake11111111111111111111111111111111111111");
const WRAPPED_SOL_MINT_ADDRESS = "So11111111111111111111111111111111111111112";
const WRAPPED_SOL_PRICE_ENDPOINT = `https://lite-api.jup.ag/price/v3?ids=${WRAPPED_SOL_MINT_ADDRESS}`;

export interface StakePoolInfo {
  address: string;
  amountStaked: number;
  stakingAuthority: string;
}

export interface StakePoolByAuthorityInfo extends StakePoolInfo {
  withdrawAuthority: string;
}

export interface StakeAccountSummary {
  address: string;
  amountStaked: number;
  delegatedStake: number;
  withdrawableAmount: number;
  activeStake: number;
  inactiveStake: number;
  activationState: string;
  rentExemptReserve: number;
  stakingAuthority: string;
  withdrawAuthority: string;
  status: string;
  deactivationEpoch: string;
}
export type PreparedTransactionResult =
  | { success: true; transaction: string; stakeAccount?: string }
  | { success: false; error: string };

export type SubmitTransactionResult =
  | { success: true; signature: string }
  | { success: false; error: string };

class ServerStakingService {
  private connection: Connection;

  constructor(rpcConnection: Connection) {
    this.connection = rpcConnection;
  }

  async getMinimumBalanceForRentExemption(): Promise<number> {
    return this.connection.getMinimumBalanceForRentExemption(StakeProgram.space);
  }

  async getWalletBalance(address: string): Promise<number> {
    const balance = await this.connection.getBalance(new PublicKey(address));
    return lamportsToSol(balance);
  }

  async getValidatorStakeTotals(): Promise<Array<{ amount: number }>> {
    const voteAccounts = await this.connection.getVoteAccounts();
    const voteAccountPrefix = VALIDATOR_VOTE_ACCOUNT.toBase58();

    const currentMatch = voteAccounts.current.find((account) =>
      account.votePubkey.toString().startsWith(voteAccountPrefix)
    );

    if (currentMatch) {
      return [{ amount: currentMatch.activatedStake }];
    }

    const delinquentMatch = voteAccounts.delinquent.find((account) =>
      account.votePubkey.toString().startsWith(voteAccountPrefix)
    );

    if (delinquentMatch) {
      return [{ amount: delinquentMatch.activatedStake }];
    }

    return [];
  }

  async getStakePools(): Promise<StakePoolInfo[]> {
    const stakeAccounts = await this.connection.getProgramAccounts(STAKE_PROGRAM_ID, {
      commitment: "confirmed",
      filters: [
        {
          memcmp: {
            offset: 124,
            bytes: VALIDATOR_VOTE_ACCOUNT.toBase58(),
          },
        },
      ],
    });

    const results: StakePoolInfo[] = [];

    for (const account of stakeAccounts) {
      try {
        const meta = META_DECODER.decode(account.account.data, 4);
        const stakeInfo = STAKE_DECODER.decode(account.account.data, 124);

        const delegationStake = Number(stakeInfo.delegation?.stake ?? 0);

        results.push({
          address: account.pubkey.toBase58(),
          amountStaked: lamportsToSol(delegationStake),
          stakingAuthority: String(meta.authorized.staker),
        });
      } catch (error) {
        console.error("Failed to decode stake pool account", error, account.pubkey.toBase58());
      }
    }

    return results;
  }

  async getStakePoolsByAuthority(stakingAuthority: string): Promise<StakePoolByAuthorityInfo[]> {
    if (!stakingAuthority) {
      return [];
    }

    const stakeAccounts = await this.connection.getProgramAccounts(STAKE_PROGRAM_ID, {
      commitment: "confirmed",
      filters: [
        {
          memcmp: {
            offset: 124,
            bytes: VALIDATOR_VOTE_ACCOUNT.toBase58(),
          },
        },
        {
          memcmp: {
            offset: 44,
            bytes: stakingAuthority,
          },
        },
      ],
    });

    const results: StakePoolByAuthorityInfo[] = [];

    for (const account of stakeAccounts) {
      try {
        const meta = META_DECODER.decode(account.account.data, 4);
        const stakeInfo = STAKE_DECODER.decode(account.account.data, 124);
        const delegationStake = Number(stakeInfo.delegation?.stake ?? 0);

        results.push({
          address: account.pubkey.toBase58(),
          amountStaked: lamportsToSol(delegationStake),
          stakingAuthority: String(meta.authorized.staker),
          withdrawAuthority: String(meta.authorized.withdrawer),
        });
      } catch (error) {
        console.error(
          "Failed to decode stake pool account for authority",
          error,
          account.pubkey.toBase58()
        );
      }
    }

    return results.sort((a, b) => b.amountStaked - a.amountStaked);
  }

  async getStakeAccountSummary(address: string): Promise<StakeAccountSummary> {
    const pubkey = new PublicKey(address);

    const [stakeAccount, amountStaked, activation, rentExemptLamports] = await Promise.all([
      this.connection.getAccountInfo(pubkey),
      this.connection.getBalance(pubkey),
      getStakeActivation(this.connection, pubkey),
      this.getMinimumBalanceForRentExemption(),
    ]);

    if (!stakeAccount) {
      throw new Error("Stake account not found");
    }

    const stakeBuffer = Buffer.from(stakeAccount.data);
    const stakeData = STAKE_DECODER.decode(stakeBuffer, 124);
    const metaData = META_DECODER.decode(stakeBuffer, 4);

    const activationStatus = activation.status;
    const activeLamports = this.toLamportsNumber(activation.active);
    const inactiveLamports = this.toLamportsNumber(activation.inactive);
    const delegatedLamports = this.toLamportsNumber(stakeData.delegation.stake);

    const isWithdrawable = activationStatus === "inactive" || activationStatus === "deactivating";
    const withdrawableLamports = isWithdrawable ? inactiveLamports : 0;

    const deactivationEpoch = stakeData.delegation?.deactivationEpoch;

    return {
      address,
      amountStaked: lamportsToSol(amountStaked),
      delegatedStake: lamportsToSol(delegatedLamports),
      withdrawableAmount: lamportsToSol(withdrawableLamports),
      activeStake: lamportsToSol(activeLamports),
      inactiveStake: lamportsToSol(inactiveLamports),
      activationState: activationStatus,
      rentExemptReserve: lamportsToSol(rentExemptLamports),
      stakingAuthority: String(metaData.authorized.staker),
      withdrawAuthority: String(metaData.authorized.withdrawer),
      status: activation.status,
      deactivationEpoch: deactivationEpoch !== undefined ? deactivationEpoch.toString() : "",
    } satisfies StakeAccountSummary;
  }

  async getCurrentEpoch(): Promise<number> {
    const epochInfo = await this.connection.getEpochInfo();
    return epochInfo.epoch;
  }

  async getSolPrice(): Promise<number> {
    try {
      const response = await fetch(WRAPPED_SOL_PRICE_ENDPOINT, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Failed with status ${response.status}`);
      }

      const payload = (await response.json()) as Record<string, { usdPrice?: number }>;
      const price = payload[WRAPPED_SOL_MINT_ADDRESS]?.usdPrice;

      if (typeof price !== "number" || Number.isNaN(price)) {
        throw new Error("Malformed price response");
      }

      return price;
    } catch (error) {
      console.error("Failed to fetch SOL price:", error);
      return 0;
    }
  }

  async createStakeTransaction(params: {
    walletAddress: string;
    amount: number;
  }): Promise<PreparedTransactionResult> {
    try {
      const { walletAddress, amount } = params;
      const userPublicKey = new PublicKey(walletAddress);
      const amountLamports = solToLamports(amount);
      const rentExemption = await this.getMinimumBalanceForRentExemption();
      const minimumAmount = solToLamports(0.001) + rentExemption;

      if (amountLamports < minimumAmount) {
        return {
          success: false,
          error: `Amount too small. Minimum stake is ${lamportsToSol(minimumAmount).toFixed(3)} SOL`,
        };
      }

      const stakeAccount = Keypair.generate();
      const transaction = new Transaction();

      transaction.add(
        StakeProgram.createAccount({
          fromPubkey: userPublicKey,
          stakePubkey: stakeAccount.publicKey,
          authorized: new Authorized(userPublicKey, userPublicKey),
          lockup: new Lockup(0, 0, userPublicKey),
          lamports: amountLamports,
        })
      );

      transaction.add(
        StakeProgram.delegate({
          stakePubkey: stakeAccount.publicKey,
          authorizedPubkey: userPublicKey,
          votePubkey: VALIDATOR_VOTE_ACCOUNT,
        })
      );

      const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.lastValidBlockHeight = lastValidBlockHeight;
      transaction.feePayer = userPublicKey;

      transaction.partialSign(stakeAccount);

      const serialized = transaction.serialize({ requireAllSignatures: false });

      return {
        success: true,
        transaction: serialized.toString("base64"),
        stakeAccount: stakeAccount.publicKey.toBase58(),
      };
    } catch (error) {
      console.error("Error preparing create stake transaction:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to prepare stake transaction",
      };
    }
  }

  async deactivateStakeTransaction(params: {
    walletAddress: string;
    stakeAccountAddress: string;
    withdrawAmount: number;
  }): Promise<PreparedTransactionResult> {
    try {
      const { walletAddress, stakeAccountAddress, withdrawAmount } = params;
      const userPublicKey = new PublicKey(walletAddress);
      const stakeAccountPubkey = new PublicKey(stakeAccountAddress);
      const withdrawLamports = solToLamports(withdrawAmount);

      const stakeAccountInfo = await this.connection.getAccountInfo(stakeAccountPubkey);

      if (!stakeAccountInfo) {
        throw new Error("Stake account not found");
      }

      const stakeData = this.decodeStakeData(stakeAccountInfo.data);
      const stakeMeta = META_DECODER.decode(stakeAccountInfo.data, 4);
      const totalStakedLamports = this.toLamportsNumber(stakeData?.delegation?.stake ?? 0);
      const rentExemptReserveLamports = this.toLamportsNumber(stakeMeta?.rentExemptReserve ?? 0);

      if (withdrawLamports <= 0) {
        return { success: false, error: "Enter a valid amount to deactivate" };
      }

      if (withdrawLamports > totalStakedLamports) {
        return { success: false, error: "Insufficient staked SOL in selected account" };
      }

      let stakeToRemainLamports = Math.max(totalStakedLamports - withdrawLamports, 0);

      if (stakeToRemainLamports > 0 && stakeToRemainLamports < rentExemptReserveLamports) {
        stakeToRemainLamports = 0;
      }

      const transaction = new Transaction();
      let splitStakeAccount: Keypair | undefined;

      if (stakeToRemainLamports > 0) {
        splitStakeAccount = Keypair.generate();

        transaction.add(
          StakeProgram.split(
            {
              stakePubkey: stakeAccountPubkey,
              authorizedPubkey: userPublicKey,
              splitStakePubkey: splitStakeAccount.publicKey,
              lamports: stakeToRemainLamports,
            },
            rentExemptReserveLamports
          )
        );
      }

      transaction.add(
        StakeProgram.deactivate({
          stakePubkey: stakeAccountPubkey,
          authorizedPubkey: userPublicKey,
        })
      );

      const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.lastValidBlockHeight = lastValidBlockHeight;
      transaction.feePayer = userPublicKey;



      if (splitStakeAccount) {
        transaction.partialSign(splitStakeAccount);
      }

      const serialized = transaction.serialize({ requireAllSignatures: false });

      return {
        success: true,
        transaction: serialized.toString("base64"),
      };
    } catch (error) {
      console.error("Error preparing deactivate stake transaction:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to prepare deactivate transaction",
      };
    }
  }

  async withdrawStakeTransaction(params: {
    walletAddress: string;
    stakeAccountAddress: string;
  }): Promise<PreparedTransactionResult> {
    try {
      const { walletAddress, stakeAccountAddress } = params;
      const userPublicKey = new PublicKey(walletAddress);
      const stakeAccountPubkey = new PublicKey(stakeAccountAddress);

      const stakeAccountInfo = await this.connection.getAccountInfo(stakeAccountPubkey);
      if (!stakeAccountInfo) {
        return { success: false, error: "Stake account not found" };
      }

      const stakeDecoded = STAKE_DECODER.decode(Buffer.from(stakeAccountInfo.data), 124);
      const deactivationEpoch = stakeDecoded.delegation?.deactivationEpoch;
      const currentEpoch = (await this.connection.getEpochInfo()).epoch;

      if (deactivationEpoch !== undefined && currentEpoch <= Number(deactivationEpoch)) {
        return { success: false, error: "Stake account is still in cooldown. Wait for the next epoch." };
      }

      const stakeLamports = await this.connection.getBalance(stakeAccountPubkey);
      if (stakeLamports === 0) {
        return { success: false, error: "Nothing to withdraw from this stake account" };
      }

      const activation = await getStakeActivation(this.connection, stakeAccountPubkey);
      const rentExemption = await this.getMinimumBalanceForRentExemption();

      const activationStatus = activation.status;
      const inactiveLamports = this.toLamportsNumber(activation.inactive);

      let withdrawLamports: number;

      if (activationStatus === "inactive") {
        withdrawLamports = stakeLamports;
      } else {
        const withdrawableWithoutRent = Math.max(stakeLamports - rentExemption, 0);
        withdrawLamports = Math.min(Math.max(inactiveLamports, 0), withdrawableWithoutRent);
      }

      withdrawLamports = Math.max(0, Math.floor(withdrawLamports));

      if (withdrawLamports === 0) {
        return {
          success: false,
          error: "Stake account has no inactive balance available to withdraw yet.",
        };
      }

      const transaction = new Transaction();
      transaction.add(
        StakeProgram.withdraw({
          stakePubkey: stakeAccountPubkey,
          authorizedPubkey: userPublicKey,
          toPubkey: userPublicKey,
          lamports: withdrawLamports,
        })
      );

      const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.lastValidBlockHeight = lastValidBlockHeight;
      transaction.feePayer = userPublicKey;

      const serialized = transaction.serialize({ requireAllSignatures: false });

      return {
        success: true,
        transaction: serialized.toString("base64"),
      };
    } catch (error) {
      console.error("Error preparing withdraw stake transaction:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to prepare withdraw transaction",
      };
    }
  }

  async mergeStakeTransaction(params: {
    walletAddress: string;
    sourceStakeAddress: string;
    destinationStakeAddress: string;
  }): Promise<PreparedTransactionResult> {
    try {
      const { walletAddress, sourceStakeAddress, destinationStakeAddress } = params;
      const userPublicKey = new PublicKey(walletAddress);
      const sourceAccount = new PublicKey(sourceStakeAddress);
      const destinationAccount = new PublicKey(destinationStakeAddress);

      const validation = await this.validateMergeConditions(sourceAccount, destinationAccount);
      if (!validation.success) {
        return { success: false, error: validation.error ?? "Stake accounts cannot be merged" };
      }

      const transaction = new Transaction();
      transaction.add(
        StakeProgram.merge({
          stakePubkey: destinationAccount,
          authorizedPubkey: userPublicKey,
          sourceStakePubKey: sourceAccount,
        })
      );

      const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.lastValidBlockHeight = lastValidBlockHeight;
      transaction.feePayer = userPublicKey;

      const serialized = transaction.serialize({ requireAllSignatures: false });

      return {
        success: true,
        transaction: serialized.toString("base64"),
      };
    } catch (error) {
      console.error("Error preparing merge stake transaction:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to prepare merge transaction",
      };
    }
  }

  async submitSignedTransaction(serializedTransaction: string): Promise<SubmitTransactionResult> {
    try {
      const buffer = Buffer.from(serializedTransaction, "base64");
      const signature = await this.connection.sendRawTransaction(buffer);
      const latestBlockHash = await this.connection.getLatestBlockhash();

      await this.connection.confirmTransaction({
        signature,
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
      }, "confirmed");

      return { success: true, signature };
    } catch (error) {
      console.error("Error submitting signed transaction:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to submit transaction",
      };
    }
  }

  private toLamportsNumber(value: unknown): number {
    if (typeof value === "bigint") {
      return Number(value);
    }

    if (typeof value === "number") {
      return value;
    }

    if (typeof value === "string") {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    }

    return 0;
  }

  /**
   * Checks whether two stake accounts can be merged.
   * Reference: https://docs.solana.com/staking/stake-accounts#merging-stake-accounts
   */
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

    let sourceActivation;
    let destinationActivation;
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

    if (this.isTransientActivation(sourceActivation) || this.isTransientActivation(destinationActivation)) {
      return {
        success: false,
        error: "Cannot merge stakes that are partially activating or deactivating.",
      };
    }

    if (sourceActivation.status === "inactive" && destinationActivation.status === "inactive") {
      return { success: true };
    }

    if (sourceActivation.status === "inactive" && destinationActivation.status === "activating") {
      if (!destinationDelegation) {
        return {
          success: false,
          error: "Destination activating stake is missing delegation data.",
        };
      }

      if (
        destinationActivationEpoch === undefined ||
        destinationActivationEpoch !== currentEpochBigInt ||
        destinationActivation.active > BigInt(0)
      ) {
        return {
          success: false,
          error: "Destination activating stake must still be activating to merge.",
        };
      }

      return { success: true };
    }

    if (sourceActivation.status === "activating" && destinationActivation.status === "inactive") {
      return {
        success: false,
        error: "Select the activating stake as the destination account when merging.",
      };
    }

    if (sourceActivation.status === "active" && destinationActivation.status === "active") {
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
        return {
          success: false,
          error: "Active stakes must share the same vote credits observed to merge.",
        };
      }

      return { success: true };
    }

    if (sourceActivation.status === "activating" && destinationActivation.status === "activating") {
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
          error: "Activating stakes can only be merged during their shared activation epoch.",
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
        return {
          success: false,
          error: "Activating stakes must share identical vote credits observed to merge.",
        };
      }

      if (sourceActivation.active > BigInt(0) || destinationActivation.active > BigInt(0)) {
        return {
          success: false,
          error: "Cannot merge activating stakes once any portion has become active.",
        };
      }

      return { success: true };
    }

    return {
      success: false,
      error: "Selected stake accounts cannot be merged in their current states.",
    };
  }

  private decodeStakeData(data: Uint8Array | Buffer): StakeData | null {
    try {
      return STAKE_DECODER.decode(Buffer.from(data), 124);
    } catch {
      return null;
    }
  }

  private isTransientActivation(activation: Awaited<ReturnType<typeof getStakeActivation>> | undefined): boolean {
    if (!activation) {
      return false;
    }

    if (activation.status === "activating" || activation.status === "deactivating") {
      return activation.active > BigInt(0);
    }

    return false;
  }
}

export const serverStakingService = new ServerStakingService(connection);
