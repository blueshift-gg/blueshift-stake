"use client";
import CrosshairCorners from "@/components/Crosshair/CrosshairCorners";
import classNames from "classnames";
import { anticipate, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useWallet } from "@solana/wallet-adapter-react";
import { stakingService } from "@/services/stakingService";
import { isValidSolAmount, getMinimumStakeAmount } from "@/utils/solana";
import { trpc } from "@/utils/trpc";
import { PublicKey } from "@solana/web3.js";
import {
  formatAmountInput,
  formatNumber,
  normalizeAmountInput,
} from "@/utils/format";
import { StakeTabContent } from "./components/StakeTabContent";
import { MergeTabContent } from "./components/MergeTabContent";
import { UnstakeTabContent } from "./components/UnstakeTabContent";
import type { DeactivationStatus, TransactionStatus, StakeTab } from "./types";

export default function StakeWidget() {
  const [selectedTab, setSelectedTab] = useState<StakeTab>("stake");
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>({
    type: null,
    message: "",
  });
  const [amount, setAmount] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const clearTransactionStatus = useCallback(() => {
    setTransactionStatus({ type: null, message: "" });
  }, [setTransactionStatus]);

  const t = useTranslations();
  const { publicKey, signTransaction, connected } = useWallet();
  const walletAddress = useMemo(
    () => publicKey?.toBase58() ?? "",
    [publicKey]
  );

  const {
    data: balanceData,
    status: balanceStatus,
    fetchStatus: balanceFetchStatus,
    refetch: refetchBalance,
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

  const scheduleBalanceRefresh = useCallback(() => {
    if (!connected) {
      return;
    }

    setTimeout(() => {
      void refetchBalance();
    }, 2000);
  }, [connected, refetchBalance]);

  const solPrice = 165.44; // In production, fetch from price API
  const minStakeAmount = getMinimumStakeAmount();

  const { data: stakeAccounts, refetch: refetchStakeAccounts } = trpc.stake.poolsbyAuthority.useQuery(
    {
      stakingAuthority: publicKey?.toBase58() || "",
    },
    {
      enabled: Boolean(publicKey),
      refetchOnWindowFocus: false,
    }
  );

  const [mergeSource, setMergeSource] = useState<string | undefined>(undefined);
  const [mergeDestination, setMergeDestination] = useState<string | undefined>(undefined);
  const [unstakeAccount, setUnstakeAccount] = useState<string | undefined>(undefined);

  const { data: stakeAccount, refetch: refetchStakeAccount } = trpc.stake.pool.useQuery({
    address: unstakeAccount || ""
  }, {
    enabled: !!unstakeAccount
  });

  const { data: currentEpoch } = trpc.stake.currentEpoch.useQuery(undefined, {
    enabled: !!publicKey,
    refetchInterval: 5000,
  })

  const tabs: Array<{ id: StakeTab; label: string }> = [
    { id: "stake", label: t("ui.stake") },
    { id: "unstake", label: t("ui.unstake") || "Unstake" },
    { id: "merge", label: t("ui.merge") || "Merge" },
  ];

  const normalizedAmount = useMemo(() => normalizeAmountInput(amount), [amount]);
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
    if (selectedTab === "stake") {
      // Leave some SOL for transaction fees
      const maxStakeAmount = Math.max(0, balance - 0.01);
      setAmount(formatAmountInput(maxStakeAmount, 4));
    } else if (selectedTab === "unstake") {
      // For unstaking, show total staked amount
      setAmount(formatAmountInput(stakeAccount?.amountStaked ?? 0, 4));
    } else {
      setAmount("");
    }
  };

  // Handle amount input change
  const handleAmountChange = (value: string) => {
    setAmount(formatAmountInput(value));
  };

  // Handle stake operation
  const handleStake = async () => {
    if (!publicKey || !signTransaction) return;

    if (!isValidSolAmount(normalizedAmount)) {
      return;
    }

    const stakeAmount = numericAmount;
    if (stakeAmount < minStakeAmount) {
      setTransactionStatus({
        type: 'error',
        message: `Minimum stake amount is ${formatNumber(minStakeAmount, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 4,
        })} SOL`
      });
      return;
    }

    if (stakeAmount > balance - 0.01) {
      setTransactionStatus({
        type: 'error',
        message: 'Insufficient balance (leave some SOL for fees)'
      });
      return;
    }

    setIsProcessing(true);
    clearTransactionStatus();

    try {
      const result = await stakingService.createStake(
        publicKey,
        stakeAmount,
        signTransaction
      );

      if (result.success) {
        setTransactionStatus({
          type: 'success',
          message: `Successfully staked ${formatNumber(stakeAmount, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 9,
          })} SOL!`
        });
        setAmount('');
        // Refresh balance after successful transaction
        scheduleBalanceRefresh();
      } else {
        setTransactionStatus({
          type: 'error',
          message: result.error || 'Transaction failed'
        });
      }
    } catch (error) {
      setTransactionStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setIsProcessing(false);
    }

    refetchStakeAccounts();
  };

  // Handle deactivate operation
  const handleDeactivate = async () => {
    if (!connected || !publicKey || !signTransaction) {
      setTransactionStatus({
        type: 'error',
        message: 'Wallet not connected'
      });
      return;
    }

    if (!unstakeAccount) {
      setTransactionStatus({
        type: 'error',
        message: 'Please select a stake account to deactivate'
      });
      return;
    }

    const unstakeAmount = numericAmount;

    if (!isValidSolAmount(normalizedAmount) || unstakeAmount <= 0) {
      setTransactionStatus({
        type: 'error',
        message: 'Enter a valid amount to deactivate'
      });
      return;
    }

    if (!stakeAccount || unstakeAmount > ((stakeAccount.amountStaked + await stakingService.getMinimumBalanceForRentExemption()) || 0)) {
      setTransactionStatus({
        type: 'error',
        message: 'Insufficient staked SOL in selected account'
      });
      return;
    }

    setIsProcessing(true);
    clearTransactionStatus();

    try {
      const result = await stakingService.deactivateStake(
        publicKey,
        new PublicKey(unstakeAccount),
        unstakeAmount,
        signTransaction
      );

      if (result.success) {
        setTransactionStatus({
          type: 'success',
          message: `Successfully deactivated ${formatNumber(unstakeAmount, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 9,
          })} SOL!`
        });
        setAmount('');
        // Refresh balance after successful transaction
        scheduleBalanceRefresh();
      } else {
        setTransactionStatus({
          type: 'error',
          message: result.error || 'Transaction failed'
        });
      }
    } catch (error) {
      setTransactionStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setIsProcessing(false);
    }

    refetchStakeAccounts();
    refetchStakeAccount();
  };

  // Handle withdraw operation
  const handleWithdraw = async () => {
    if (!connected || !publicKey || !signTransaction) {
      setTransactionStatus({
        type: 'error',
        message: 'Wallet not connected'
      });
      return;
    }

    if (!unstakeAccount) {
      setTransactionStatus({
        type: 'error',
        message: 'Please select a stake account to withdraw from'
      });
      return;
    }

    setIsProcessing(true);
    clearTransactionStatus();

    try {
      const result = await stakingService.withdrawStake(
        publicKey,
        new PublicKey(unstakeAccount),
        signTransaction
      );

      if (result.success) {
        setTransactionStatus({
          type: 'success',
          message: `Successfully withdrew SOL!`
        });
        setAmount('');
        // Refresh balance after successful transaction
        scheduleBalanceRefresh();
      } else {
        setTransactionStatus({
          type: 'error',
          message: result.error || 'Transaction failed'
        });
      }
    } catch (error) {
      setTransactionStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setIsProcessing(false);
    }

    refetchStakeAccounts();
    setUnstakeAccount(undefined);
  };

  // Handle merge operation
  const handleMerge = async () => {
    if (!connected || !publicKey || !signTransaction) {
      setTransactionStatus({
        type: 'error',
        message: 'Wallet not connected'
      });
      return;
    }

    if (!mergeSource || !mergeDestination) {
      setTransactionStatus({
        type: 'error',
        message: 'Please select a source and destination account'
      });
      return;
    }

    setIsProcessing(true);
    clearTransactionStatus();

    try {
      const result = await stakingService.mergeStake(
        publicKey,
        new PublicKey(mergeSource),
        new PublicKey(mergeDestination),
        signTransaction
      );

      if (result.success) {
        setTransactionStatus({
          type: 'success',
          message: 'Successfully merged stake accounts'
        });
        setAmount('');
        setMergeSource(undefined);
        setMergeDestination(undefined);
        // Refresh balance after successful transaction
        scheduleBalanceRefresh();
      } else {
        setTransactionStatus({
          type: 'error',
          message: result.error || 'Transaction failed'
        });
      }
    } catch (error) {
      setTransactionStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setIsProcessing(false);
    }

    refetchStakeAccounts();
  };

  const canStakeAction = connected &&
    isValidSolAmount(normalizedAmount) &&
    !isProcessing &&
    !isBalanceLoading &&
    numericAmount <= balance - 0.01;

  const selectedSourceAccount = stakeAccounts?.find((account) => account.address === mergeSource);
  const selectedDestinationAccount = stakeAccounts?.find((account) => account.address === mergeDestination);

  const hasMergeSelection = Boolean(
    mergeSource &&
    mergeDestination &&
    mergeSource !== mergeDestination
  );

  const shareWithdrawAuthority = Boolean(
    selectedSourceAccount &&
    selectedDestinationAccount &&
    selectedSourceAccount.withdrawAuthority === selectedDestinationAccount.withdrawAuthority
  );

  const canMergeAction =
    connected &&
    !isProcessing &&
    !isBalanceLoading &&
    hasMergeSelection &&
    shareWithdrawAuthority;

  const canUnstakeAction = connected &&
    isValidSolAmount(normalizedAmount) &&
    !isProcessing &&
    !isBalanceLoading &&
    !!unstakeAccount &&
    numericAmount <= (stakeAccount?.amountStaked ?? 0);

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

  const deactivationStatus: DeactivationStatus = {
    active: !!stakeAccount && stakeAccount.deactivationEpoch === "18446744073709551615",
    deactivating: !!currentEpoch && !!stakeAccount && stakeAccount.deactivationEpoch !== "18446744073709551615" && (currentEpoch < parseInt(stakeAccount.deactivationEpoch!) + 1),
    withdrawing: !!currentEpoch && !!stakeAccount && (parseInt(stakeAccount.deactivationEpoch!) + 1 <= currentEpoch),
  }

  useEffect(() => {
    const updateAmount = async () => {
      if (!deactivationStatus.withdrawing || !unstakeAccount) {
        return;
      }

      const balanceValue = await stakingService.getBalance(
        new PublicKey(unstakeAccount)
      );

    setAmount(formatAmountInput(balanceValue, 4));
    };

    updateAmount();
  }, [deactivationStatus.withdrawing, unstakeAccount]);

  return (
    <div className="wrapper flex items-center justify-center w-full">
      <div className="w-[550px] rounded-2xl flex flex-col overflow-hidden border border-border">
        <div className="rounded-t-[15px] flex items-center">
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setSelectedTab(id)}
              className={classNames(
                "cursor-pointer hover:bg-background-card/50 transition px-6 py-3 relative font-mono text-tertiary",
                selectedTab === id && "!text-brand-primary"
              )}
            >
              {selectedTab === id && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.15, 0, 0.1, 0, 0.06] }}
                    transition={{ duration: 0.5, ease: anticipate }}
                    className="absolute inset-0 bg-brand-primary"
                  />
                  <CrosshairCorners
                    size={6}
                    strokeWidth={1.5}
                    className="text-brand-primary"
                    corners={["bottom-right"]}
                  />
                </>
              )}
              <span>{label}</span>
            </button>
          ))}
        </div>
        {selectedTab === "stake" && (
          <StakeTabContent
            connected={connected}
            balance={balance}
            amount={amount}
            numericAmount={numericAmount}
            solPrice={solPrice}
            isBalanceLoading={isBalanceLoading}
            isProcessing={isProcessing}
            transactionStatus={transactionStatus}
            onAmountChange={handleAmountChange}
            onMaxClick={handleMaxClick}
            onStake={handleStake}
            canStakeAction={canStakeAction}
          />
        )}
        {selectedTab === "merge" && (
          <MergeTabContent
            connected={connected}
            stakeAccounts={stakeAccounts}
            mergeSource={mergeSource}
            mergeDestination={mergeDestination}
            isProcessing={isProcessing}
            isBalanceLoading={isBalanceLoading}
            canMergeAction={canMergeAction}
            transactionStatus={transactionStatus}
            onMerge={handleMerge}
            onMergeSourceChange={setMergeSource}
            onMergeDestinationChange={setMergeDestination}
          />
        )}
        {selectedTab === "unstake" && (
          <UnstakeTabContent
            connected={connected}
            stakeAccounts={stakeAccounts}
            selectedStakeAccount={unstakeAccount}
            selectedStakeAmount={stakeAccount?.amountStaked ?? 0}
            deactivationStatus={deactivationStatus}
            amount={amount}
            numericAmount={numericAmount}
            solPrice={solPrice}
            isBalanceLoading={isBalanceLoading}
            isProcessing={isProcessing}
            canUnstakeAction={canUnstakeAction}
            transactionStatus={transactionStatus}
            onStakeAccountChange={setUnstakeAccount}
            onAmountChange={handleAmountChange}
            onMaxClick={handleMaxClick}
            onDeactivate={handleDeactivate}
            onWithdraw={handleWithdraw}
          />
        )}
      </div>
    </div>
  );
}
