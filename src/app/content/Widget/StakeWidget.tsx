"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { isValidSolAmount, getMinimumStakeAmount } from "@/utils/solana";
import { trpc } from "@/utils/trpc";
import { Transaction } from "@solana/web3.js";
import { Buffer } from "buffer";
import {
  formatAmountInput,
  formatNumber,
  normalizeAmountInput,
} from "@/utils/format";
import type { TransactionStatus } from "./types";
import { Tabs } from "@blueshift-gg/ui-components";
import { NativeTab } from "./NativeTab";
import { LiquidTab } from "./LiquidTab";
import StakeProjection from "./StakeProjection";

const EXPLORER_BASE_URL = (
  process.env.NEXT_PUBLIC_SOLANA_EXPLORER_BASE_URL ??
  "https://explorer.solana.com/tx"
).replace(/\/$/, "");
const EXPLORER_CLUSTER = process.env.NEXT_PUBLIC_SOLANA_EXPLORER_CLUSTER;

export default function StakeWidget() {
  const [selectedTab, setSelectedTab] = useState<string>("native");
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>(
    {
      type: null,
      message: "",
      link: undefined,
    }
  );
  const [amount, setAmount] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const clearTransactionStatus = useCallback(() => {
    setTransactionStatus({ type: null, message: "", link: undefined });
  }, [setTransactionStatus]);

  const { publicKey, signTransaction, connected } = useWallet();
  const { connection } = useConnection();
  const walletAddress = useMemo(() => publicKey?.toBase58() ?? "", [publicKey]);

  const {
    data: balanceData,
    status: balanceStatus,
    fetchStatus: balanceFetchStatus,
  } = trpc.stake.balance.useQuery(
    { address: walletAddress },
    {
      enabled: Boolean(walletAddress),
      refetchOnWindowFocus: false,
    }
  );

  const balance = balanceData?.balance ?? 0;
  const isBalanceLoading =
    balanceStatus === "pending" && balanceFetchStatus === "fetching";

  const utils = trpc.useUtils();

  const buildExplorerUrl = useCallback((signature: string) => {
    const clusterSuffix = EXPLORER_CLUSTER
      ? `?cluster=${EXPLORER_CLUSTER}`
      : "";
    return `${EXPLORER_BASE_URL}/${signature}${clusterSuffix}`;
  }, []);

  const { data: solPriceData } = trpc.stake.solPrice.useQuery(undefined, {
    refetchInterval: 60_000,
    staleTime: 60_000,
  });

  const solPrice = solPriceData?.price ?? 0;
  const minStakeAmount = getMinimumStakeAmount();

  const { data: stakeAccounts } = trpc.stake.poolsByAuthority.useQuery(
    {
      stakingAuthority: publicKey?.toBase58() || "",
    },
    {
      enabled: Boolean(publicKey),
      refetchOnWindowFocus: false,
    }
  );

  const [mergeSource, setMergeSource] = useState<string | undefined>(undefined);
  const [mergeDestination, setMergeDestination] = useState<string | undefined>(
    undefined
  );
  const [unstakeAccount, setUnstakeAccount] = useState<string | undefined>(
    undefined
  );

  const { data: stakeAccount } = trpc.stake.pool.useQuery(
    {
      address: unstakeAccount || "",
    },
    {
      enabled: !!unstakeAccount,
    }
  );

  const delegatedStake = stakeAccount?.delegatedStake ?? 0;
  const withdrawableAmount = stakeAccount?.withdrawableAmount ?? 0;
  const activeStakeAmount = stakeAccount?.activeStake ?? 0;
  const inactiveStakeAmount = stakeAccount?.inactiveStake ?? 0;
  const activationState = stakeAccount?.status ?? "unknown";
  const rentExemptReserve = stakeAccount?.rentExemptReserve ?? 0;

  const invalidateStakeData = useCallback(
    async (options?: { includeSelectedPool?: boolean }) => {
      if (!walletAddress) {
        return;
      }

      const tasks: Array<Promise<unknown>> = [
        utils.stake.balance.invalidate({ address: walletAddress }),
        utils.stake.poolsByAuthority.invalidate({
          stakingAuthority: walletAddress,
        }),
      ];

      if (options?.includeSelectedPool && unstakeAccount) {
        tasks.push(utils.stake.pool.invalidate({ address: unstakeAccount }));
      }

      await Promise.all(tasks);
    },
    [utils, walletAddress, unstakeAccount]
  );

  const prepareStakeTransaction =
    trpc.stake.prepareStakeTransaction.useMutation();
  // const prepareDeactivateStakeTransaction =
  //   trpc.stake.prepareDeactivateStakeTransaction.useMutation();
  // const prepareWithdrawStakeTransaction =
  //   trpc.stake.prepareWithdrawStakeTransaction.useMutation();
  // const prepareMergeStakeTransaction =
  //   trpc.stake.prepareMergeStakeTransaction.useMutation();

  const sendSignedTransaction = useCallback(
    async (signedTransaction: Transaction) => {
      const serializedTransaction = signedTransaction.serialize();
      const signature = await connection.sendRawTransaction(
        serializedTransaction,
        {
          skipPreflight: false,
          preflightCommitment: "confirmed",
        }
      );

      const blockhashInfo =
        signedTransaction.recentBlockhash &&
          signedTransaction.lastValidBlockHeight
          ? {
            blockhash: signedTransaction.recentBlockhash,
            lastValidBlockHeight: signedTransaction.lastValidBlockHeight,
          }
          : await connection.getLatestBlockhash();

      await connection.confirmTransaction(
        {
          signature,
          blockhash: blockhashInfo.blockhash,
          lastValidBlockHeight: blockhashInfo.lastValidBlockHeight,
        },
        "confirmed"
      );

      return signature;
    },
    [connection]
  );

  const normalizedAmount = useMemo(
    () => normalizeAmountInput(amount),
    [amount]
  );
  const numericAmount = useMemo(() => {
    if (!normalizedAmount) {
      return 0;
    }

    const parsed = Number(normalizedAmount);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [normalizedAmount]);

  useEffect(() => {
    if (connected) {
      return;
    }

    setAmount("");
    setMergeSource(undefined);
    setMergeDestination(undefined);
    setUnstakeAccount(undefined);
    clearTransactionStatus();
  }, [connected, clearTransactionStatus]);

  // Handle max button click
  const handleMaxClick = async () => {
    // Leave some SOL for transaction fees
    const maxStakeAmount = Math.max(0, balance - 0.01);
    setAmount(formatAmountInput(maxStakeAmount, 4));
  };

  // Handle amount input change
  const handleAmountChange = (value: string) => {
    setAmount(formatAmountInput(value));
  };

  // Handle stake operation
  const handleStake = async () => {
    if (!publicKey || !signTransaction) {
      setTransactionStatus({ type: "error", message: "Wallet not ready" });
      return;
    }

    if (!isValidSolAmount(normalizedAmount)) {
      return;
    }

    const stakeAmount = numericAmount;
    if (stakeAmount < minStakeAmount) {
      setTransactionStatus({
        type: "error",
        message: `Minimum stake amount is ${formatNumber(minStakeAmount, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 4,
        })} SOL`,
      });
      return;
    }

    if (stakeAmount > balance - 0.01) {
      setTransactionStatus({
        type: "error",
        message: "Insufficient balance (leave some SOL for fees)",
      });
      return;
    }

    setIsProcessing(true);
    clearTransactionStatus();

    try {
      const preparation = await prepareStakeTransaction.mutateAsync({
        walletAddress,
        amount: stakeAmount,
      });

      if (!preparation.success) {
        setTransactionStatus({
          type: "error",
          message: preparation.error ?? "Failed to prepare stake transaction",
        });
        return;
      }

      const transaction = Transaction.from(
        Buffer.from(preparation.transaction, "base64")
      );
      const signedTransaction = await signTransaction(transaction);

      const signature = await sendSignedTransaction(signedTransaction);
      const explorerUrl = buildExplorerUrl(signature);

      setTransactionStatus({
        type: "success",
        message: "Stake transaction submitted.",
        link: {
          href: explorerUrl,
          label: "View on Solana Explorer",
        },
      });
      setAmount("");
      void invalidateStakeData();
    } catch (error) {
      setTransactionStatus({
        type: "error",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle deactivate operation
  // const handleDeactivate = async () => {
  //   if (!connected || !publicKey || !signTransaction) {
  //     setTransactionStatus({
  //       type: "error",
  //       message: "Wallet not connected",
  //     });
  //     return;
  //   }

  //   if (!unstakeAccount) {
  //     setTransactionStatus({
  //       type: "error",
  //       message: "Please select a stake account to deactivate",
  //     });
  //     return;
  //   }

  //   const unstakeAmount = numericAmount;

  //   if (!isValidSolAmount(normalizedAmount) || unstakeAmount <= 0) {
  //     setTransactionStatus({
  //       type: "error",
  //       message: "Enter a valid amount to deactivate",
  //     });
  //     return;
  //   }

  //   if (unstakeAmount > delegatedStake) {
  //     setTransactionStatus({
  //       type: "error",
  //       message: `Amount exceeds delegated stake (${formatNumber(
  //         delegatedStake,
  //         {
  //           minimumFractionDigits: 0,
  //           maximumFractionDigits: 9,
  //         }
  //       )} SOL)`,
  //     });
  //     return;
  //   }

  //   setIsProcessing(true);
  //   clearTransactionStatus();

  //   try {
  //     const preparation = await prepareDeactivateStakeTransaction.mutateAsync({
  //       walletAddress,
  //       stakeAccountAddress: unstakeAccount,
  //       withdrawAmount: unstakeAmount,
  //     });

  //     if (!preparation.success) {
  //       setTransactionStatus({
  //         type: "error",
  //         message:
  //           preparation.error ?? "Failed to prepare deactivate transaction",
  //       });
  //       return;
  //     }

  //     const transaction = Transaction.from(
  //       Buffer.from(preparation.transaction, "base64")
  //     );
  //     const signedTransaction = await signTransaction(transaction);

  //     const signature = await sendSignedTransaction(signedTransaction);
  //     const explorerUrl = buildExplorerUrl(signature);

  //     setTransactionStatus({
  //       type: "success",
  //       message: `Successfully deactivated ${formatNumber(unstakeAmount, {
  //         minimumFractionDigits: 0,
  //         maximumFractionDigits: 9,
  //       })} SOL!`,
  //       link: {
  //         href: explorerUrl,
  //         label: "View on Solana Explorer",
  //       },
  //     });
  //     setAmount("");
  //     void invalidateStakeData({ includeSelectedPool: true });
  //   } catch (error) {
  //     setTransactionStatus({
  //       type: "error",
  //       message:
  //         error instanceof Error ? error.message : "Unknown error occurred",
  //     });
  //   } finally {
  //     setIsProcessing(false);
  //   }
  // };

  // Handle withdraw operation
  // const handleWithdraw = async () => {
  //   if (!connected || !publicKey || !signTransaction) {
  //     setTransactionStatus({
  //       type: "error",
  //       message: "Wallet not connected",
  //     });
  //     return;
  //   }

  //   if (!unstakeAccount) {
  //     setTransactionStatus({
  //       type: "error",
  //       message: "Please select a stake account to withdraw from",
  //     });
  //     return;
  //   }

  //   if (withdrawableAmount <= 0) {
  //     setTransactionStatus({
  //       type: "error",
  //       message: "No inactive balance available to withdraw yet",
  //     });
  //     return;
  //   }

  //   setIsProcessing(true);
  //   clearTransactionStatus();

  //   try {
  //     const preparation = await prepareWithdrawStakeTransaction.mutateAsync({
  //       walletAddress,
  //       stakeAccountAddress: unstakeAccount,
  //     });

  //     if (!preparation.success) {
  //       setTransactionStatus({
  //         type: "error",
  //         message:
  //           preparation.error ?? "Failed to prepare withdraw transaction",
  //       });
  //       return;
  //     }

  //     const transaction = Transaction.from(
  //       Buffer.from(preparation.transaction, "base64")
  //     );
  //     const signedTransaction = await signTransaction(transaction);

  //     const signature = await sendSignedTransaction(signedTransaction);
  //     const explorerUrl = buildExplorerUrl(signature);

  //     setTransactionStatus({
  //       type: "success",
  //       message: `Successfully withdrew ${formatNumber(withdrawableAmount, {
  //         minimumFractionDigits: 0,
  //         maximumFractionDigits: 9,
  //       })} SOL!`,
  //       link: {
  //         href: explorerUrl,
  //         label: "View on Solana Explorer",
  //       },
  //     });
  //     setAmount("");
  //     void invalidateStakeData({ includeSelectedPool: true });
  //   } catch (error) {
  //     setTransactionStatus({
  //       type: "error",
  //       message:
  //         error instanceof Error ? error.message : "Unknown error occurred",
  //     });
  //   } finally {
  //     setIsProcessing(false);
  //   }
  // };

  // Handle merge operation
  // const handleMerge = async () => {
  //   if (!connected || !publicKey || !signTransaction) {
  //     setTransactionStatus({
  //       type: "error",
  //       message: "Wallet not connected",
  //     });
  //     return;
  //   }

  //   if (!mergeSource || !mergeDestination) {
  //     setTransactionStatus({
  //       type: "error",
  //       message: "Please select a source and destination account",
  //     });
  //     return;
  //   }

  //   setIsProcessing(true);
  //   clearTransactionStatus();

  //   try {
  //     const preparation = await prepareMergeStakeTransaction.mutateAsync({
  //       walletAddress,
  //       sourceStakeAddress: mergeSource,
  //       destinationStakeAddress: mergeDestination,
  //     });

  //     if (!preparation.success) {
  //       setTransactionStatus({
  //         type: "error",
  //         message: preparation.error ?? "Failed to prepare merge transaction",
  //       });
  //       return;
  //     }

  //     const transaction = Transaction.from(
  //       Buffer.from(preparation.transaction, "base64")
  //     );
  //     const signedTransaction = await signTransaction(transaction);

  //     const signature = await sendSignedTransaction(signedTransaction);
  //     const explorerUrl = buildExplorerUrl(signature);

  //     setTransactionStatus({
  //       type: "success",
  //       message: "Successfully merged stake accounts",
  //       link: {
  //         href: explorerUrl,
  //         label: "View on Solana Explorer",
  //       },
  //     });
  //     setAmount("");
  //     setMergeSource(undefined);
  //     setMergeDestination(undefined);
  //     void invalidateStakeData();
  //   } catch (error) {
  //     setTransactionStatus({
  //       type: "error",
  //       message:
  //         error instanceof Error ? error.message : "Unknown error occurred",
  //     });
  //   } finally {
  //     setIsProcessing(false);
  //   }
  // };

  const canStakeAction =
    connected &&
    isValidSolAmount(normalizedAmount) &&
    !isProcessing &&
    !isBalanceLoading &&
    numericAmount <= balance - 0.01;

  // const selectedSourceAccount = stakeAccounts?.find(
  //   (account) => account.address === mergeSource
  // );
  // const selectedDestinationAccount = stakeAccounts?.find(
  //   (account) => account.address === mergeDestination
  // );

  // const hasMergeSelection = Boolean(
  //   mergeSource && mergeDestination && mergeSource !== mergeDestination
  // );

  // const shareWithdrawAuthority = Boolean(
  //   selectedSourceAccount &&
  //   selectedDestinationAccount &&
  //   selectedSourceAccount.withdrawAuthority ===
  //   selectedDestinationAccount.withdrawAuthority
  // );

  // const canMergeAction =
  //   connected &&
  //   !isProcessing &&
  //   !isBalanceLoading &&
  //   hasMergeSelection &&
  //   shareWithdrawAuthority;

  // const canDeactivateAction =
  //   connected &&
  //   isValidSolAmount(normalizedAmount) &&
  //   !isProcessing &&
  //   !isBalanceLoading &&
  //   !!unstakeAccount &&
  //   numericAmount > 0 &&
  //   numericAmount <= delegatedStake;

  // const canWithdrawAction =
  //   connected &&
  //   !isProcessing &&
  //   !isBalanceLoading &&
  //   !!unstakeAccount &&
  //   withdrawableAmount > 0;

  // const stakeAccountSummary = stakeAccount
  //   ? {
  //     totalBalance: stakeAccount.amountStaked,
  //     delegatedStake,
  //     withdrawableAmount,
  //     activeStake: activeStakeAmount,
  //     inactiveStake: inactiveStakeAmount,
  //     status: activationState ?? "unknown",
  //     rentExemptReserve,
  //   }
  //   : undefined;

  // Clear transaction status after 5 seconds
  useEffect(() => {
    if (!transactionStatus.type) {
      return;
    }

    const timer = setTimeout(() => {
      clearTransactionStatus();
    }, 5000);

    return () => clearTimeout(timer);
  }, [transactionStatus, clearTransactionStatus]);

  useEffect(() => {
    if (mergeSource && mergeDestination && mergeSource === mergeDestination) {
      setMergeDestination(undefined);
    }
  }, [mergeSource, mergeDestination]);

  useEffect(() => {
    if (!unstakeAccount) {
      return;
    }

    if (withdrawableAmount > 0) {
      setAmount(formatAmountInput(withdrawableAmount, 9));
    }
  }, [unstakeAccount, withdrawableAmount]);

  return (
    <div className="col-span-1 xl:col-span-5 px-4 py-6 xl:px-6 xl:py-7">
      {!connected ? (
        <StakeProjection />
      ) : (
      <div className="w-full flex flex-col overflow-hidden border border-border">
          <div className="bg-card-solid/50 w-full">
            <div className="p-4 flex items-center gap-x-1 w-full">
              <Tabs
                items={[
                  { label: "Native", value: "native", selected: selectedTab === "native", onClick: () => setSelectedTab("native") },
                  { label: "Liquid", value: "liquid", selected: selectedTab === "liquid", onClick: () => setSelectedTab("liquid") },
                ]}
                variant="segmented"
                theme="primary"
                className="w-full!"
              />
            </div>
          </div>

        {selectedTab === "native" ? (
          <NativeTab
            balance={balance}
            amount={amount}
            onAmountChange={handleAmountChange}
            onMaxClick={handleMaxClick}
            connected={connected}
            isBalanceLoading={isBalanceLoading}
            numericAmount={numericAmount}
            solPrice={solPrice}
            transactionStatus={transactionStatus}
            canStakeAction={canStakeAction}
            isProcessing={isProcessing}
            onStake={handleStake}
          />
        ) : (
          <LiquidTab
            balance={balance}
            amount={amount}
            onAmountChange={handleAmountChange}
            onMaxClick={handleMaxClick}
            connected={connected}
            isBalanceLoading={isBalanceLoading}
            numericAmount={numericAmount}
            solPrice={solPrice}
            transactionStatus={transactionStatus}
            canStakeAction={canStakeAction}
            isProcessing={isProcessing}
            onStake={handleStake}
          />
        )}
      </div>
      )}
    </div>
  );
}
