"use client";
import CrosshairCorners from "@/components/Crosshair/CrosshairCorners";
import classNames from "classnames";
import { anticipate, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import Button from "@/components/Button/Button";
import Icon from "@/components/Icon/Icon";
import Badge from "@/components/Badge/Badge";
import { useWallet } from "@solana/wallet-adapter-react";
import { useStakingStore } from "@/stores/stakingStore";
import { stakingService } from "@/services/stakingService";
import { isValidSolAmount, getMinimumStakeAmount } from "@/utils/solana";
import WalletMultiButton from "@/components/Wallet/WalletMultiButton";
import Image from "next/image";
import { trpc } from "@/utils/trpc";
import { PublicKey } from "@solana/web3.js";
import {
  formatAmountInput,
  formatCurrency,
  formatNumber,
  formatSol,
  normalizeAmountInput,
} from "@/utils/format";

export default function StakeWidget() {
  const [selectedTab, setSelectedTab] = useState<"stake" | "unstake" | "merge">("stake");
  const [amount, setAmount] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const t = useTranslations();
  const { publicKey, signTransaction } = useWallet();
  const {
    isConnected,
    balance,
    isLoading,
    refreshData
  } = useStakingStore();

  const solPrice = 165.44; // In production, fetch from price API
  const minStakeAmount = getMinimumStakeAmount();

  const { data: stakeAccounts, refetch: refetchStakeAccounts } = trpc.stake.poolsbyAuthority.useQuery({
    stakingAuthority: publicKey?.toString() || ""
  });

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

  const tabs = [
    { id: "stake", label: t("ui.stake") },
    { id: "unstake", label: t("ui.unstake") || "Unstake" },
    { id: "merge", label: t("ui.merge") || "Merge" },
  ] as const;

  const normalizedAmount = useMemo(() => normalizeAmountInput(amount), [amount]);
  const numericAmount = useMemo(() => {
    if (!normalizedAmount) {
      return 0;
    }

    const parsed = Number(normalizedAmount);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [normalizedAmount]);

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
    setTransactionStatus({ type: null, message: '' });

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
        // Refresh data after successful transaction
        setTimeout(() => refreshData(), 2000);
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
    if (!isConnected || !publicKey || !signTransaction) {
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
    setTransactionStatus({ type: null, message: '' });

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
        // Refresh data after successful transaction
        setTimeout(() => refreshData(), 2000);
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
    if (!isConnected || !publicKey || !signTransaction) {
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
    setTransactionStatus({ type: null, message: '' });

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
        // Refresh data after successful transaction
        setTimeout(() => refreshData(), 2000);
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

  // Handle unstake operation
  const handleMerge = async () => {
    if (!isConnected || !publicKey || !signTransaction) {
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
    setTransactionStatus({ type: null, message: '' });

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
        // Refresh data after successful transaction
        setTimeout(() => refreshData(), 2000);
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

  const canStakeAction = isConnected &&
    isValidSolAmount(normalizedAmount) &&
    !isProcessing &&
    !isLoading &&
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
    isConnected &&
    !isProcessing &&
    !isLoading &&
    hasMergeSelection &&
    shareWithdrawAuthority;

  const canUnstakeAction = isConnected &&
    isValidSolAmount(normalizedAmount) &&
    !isProcessing &&
    !isLoading &&
    !!unstakeAccount &&
    numericAmount <= (stakeAccount?.amountStaked ?? 0);

  // Clear transaction status after 5 seconds
  useEffect(() => {
    if (transactionStatus.type) {
      const timer = setTimeout(() => {
        setTransactionStatus({ type: null, message: '' });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [transactionStatus]);

  useEffect(() => {
    if (mergeSource && mergeDestination && mergeSource === mergeDestination) {
      setMergeDestination(undefined);
    }
  }, [mergeSource, mergeDestination]);

  const deactivationStatus = {
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
        { selectedTab === "stake" &&
          <div className="px-4 py-6 md:px-6 md:py-8 bg-background-card/50 shadow-[inset_0px_0px_12px_rgba(26,30,38,0.2)] flex flex-col gap-y-9">
            <div className="flex flex-col gap-y-5">
              <div className="rounded-xl p-1 border border-border w-full gap-x-1 flex items-center">
                <button className="w-full py-1.5 bg-background-card-foreground rounded-lg">
                  <span className="text-sm font-mono leading-[100%] text-primary">
                    {t("ui.native")}
                  </span>
                </button>
                <button className="w-full py-1.5 rounded-lg opacity-50 cursor-not-allowed">
                  <span className="text-sm font-mono leading-[100%] text-mute">
                    {t("ui.liquid")}
                  </span>
                </button>
              </div>
              <div className="flex flex-col gap-y-1">
                <div className="w-full flex items-center justify-between px-1.5">
                  <span className="font-medium">{t("ui.amount")}</span>
                  <div className="flex items-center gap-x-1.5 text-tertiary">
                    <Icon name="WalletSmall" />
                    <span className="text-sm font-mono">
                      {`${formatSol(balance)} SOL`}
                    </span>
                  </div>
                </div>
                <div className="gap-x-4 relative bg-background rounded-xl border border-border pr-3 py-1.5 pl-1.5 flex items-center justify-between">
                  <div className="flex-shrink-0 flex font-mono items-center text-[#9945ff] gap-x-1.5 px-2 py-1.5 bg-background-card/50 border border-[#AD6AFF]/20 shadow-[inset_0px_0px_9px_rgba(154,70,255,0.2)] rounded-md text-xl">
                    <Image
                      src="/icons/sol.svg"
                      alt="Solana Icon"
                      width={24}
                      height={24}
                    />
                    <span className="leading-[100%]">SOL</span>
                  </div>
                  <input
                    className="disabled:opacity-40 focus:outline-none bg-transparent w-full text-2xl placeholder:text-mute font-mono leading-[100%] text-right"
                    placeholder="0.00"
                    disabled={!isConnected || isLoading}
                    value={amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                  />
                  <Button
                    size="xs"
                    label={t("ui.max")}
                    disabled={!isConnected || isLoading}
                    onClick={handleMaxClick}
                  />
                </div>
                <div className="h-[24px] w-full">
                  {numericAmount > 0 && (
                    <motion.div
                      className="w-full flex"
                      initial={{ opacity: 0 }}
                      animate={{
                        opacity: [0, 1, 0.2, 1, 0.4, 1, 0.6, 1, 0.8, 1],
                      }}
                      transition={{ duration: 0.5, ease: anticipate }}
                    >
                      <Badge
                        color="rgb(173,185,210)"
                        className="font-mono ml-auto"
                        value={`~${formatCurrency(numericAmount * solPrice)} USD`}
                      />
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-y-5 items-center justify-center">
              {/* Transaction Status */}
              {transactionStatus.type && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={classNames(
                    "w-full p-3 rounded-lg text-sm font-mono text-center",
                    transactionStatus.type === 'success'
                      ? "bg-green-500/20 text-green-400 border border-green-500/30"
                      : "bg-red-500/20 text-red-400 border border-red-500/30"
                  )}
                >
                  {transactionStatus.message}
                </motion.div>
              )}
              {!isConnected ? (
                <WalletMultiButton isLoading={isLoading} />
              ) : (
                <Button
                  icon={"Target"}
                  className="w-full relative"
                  label={"Stake SOL"}
                  disabled={!canStakeAction}
                  isLoading={isProcessing}
                  onClick={handleStake}
                />
              )}
              <span className="font-medium text-xs mx-auto w-2/3 sm:w-1/2 text-center text-pretty leading-[140%]">
                <span className="text-secondary">{t("ui.disclaimer")}</span>
                <span className="text-brand-secondary"> {t("ui.terms")}</span>
              </span>
            </div>
          </div>
        }
        { selectedTab === "merge" && (
          <div className="px-4 py-6 md:px-6 md:py-8 bg-background-card/50 shadow-[inset_0px_0px_12px_rgba(26,30,38,0.2)] flex flex-col gap-y-9">
            <div className="flex flex-col gap-y-4">
              <div className="flex flex-col gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-secondary mb-1" htmlFor="mergeSource">
                    {t("ui.mergeSource") || "Source Account"}
                  </label>
                  <select
                    id="mergeSource"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background-card/50 text-primary font-mono focus:outline-none"
                    value={mergeSource}
                    onChange={e => setMergeSource(e.target.value !== '' ? e.target.value : undefined)}
                    disabled={!isConnected || isLoading || isProcessing || !stakeAccounts?.length}
                  >
                    <option value={''}>Select Source</option>
                    {stakeAccounts?.filter((account) => {
                      if (mergeDestination) {
                        return account.address !== mergeDestination;
                      }
                      return true;
                    }).map((account) => (
                      <option key={account.address} value={account.address}>
                        {account.address}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-secondary mb-1" htmlFor="mergeDestination">
                    {t("ui.mergeDestination") || "Destination Account"}
                  </label>
                  <select
                    id="mergeDestination"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background-card/50 text-primary font-mono focus:outline-none"
                    value={mergeDestination}
                    onChange={e => setMergeDestination(e.target.value !== '' ? e.target.value : undefined)}
                    disabled={!isConnected || isLoading || isProcessing || !stakeAccounts?.length}
                  >
                    <option value={''}>Select Destination</option>
                    {stakeAccounts?.filter((account) => {
                      if (mergeSource) {
                        return account.address !== mergeSource;
                      }
                      return true;
                    }).map((account) => (
                      <option key={account.address} value={account.address}>
                        {account.address}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-y-5 items-center justify-center">
              {transactionStatus.type && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={classNames(
                    "w-full p-3 rounded-lg text-sm font-mono text-center",
                    transactionStatus.type === 'success'
                      ? "bg-green-500/20 text-green-400 border border-green-500/30"
                      : "bg-red-500/20 text-red-400 border border-red-500/30"
                  )}
                >
                  {transactionStatus.message}
                </motion.div>
              )}
              {!isConnected ? (
                <WalletMultiButton isLoading={isLoading} />
              ) : (
                <Button
                  className="w-full relative"
                  size="lg"
                  label={t("ui.merge") || "Merge"}
                  disabled={!canMergeAction}
                  isLoading={isProcessing}
                  onClick={handleMerge}
                />
              )}
              <span className="font-medium text-xs mx-auto w-2/3 sm:w-1/2 text-center text-pretty leading-[140%]">
                <span className="text-secondary">{t("ui.disclaimer")}</span>
                <span className="text-brand-secondary"> {t("ui.terms")}</span>
              </span>
            </div>
          </div>
        )}
        { selectedTab === "unstake" && (
          <div className="px-4 py-6 md:px-6 md:py-8 bg-background-card/50 shadow-[inset_0px_0px_12px_rgba(26,30,38,0.2)] flex flex-col gap-y-9">
            <div className="flex flex-col gap-y-5">
              <div className="rounded-xl p-1 border border-border w-full gap-x-1 flex items-center">
                <button className="w-full py-1.5 bg-background-card-foreground rounded-lg">
                  <span className="text-sm font-mono leading-[100%] text-primary">
                    {t("ui.native")}
                  </span>
                </button>
                <button className="w-full py-1.5 rounded-lg opacity-50 cursor-not-allowed">
                  <span className="text-sm font-mono leading-[100%] text-mute">
                    {t("ui.liquid")}
                  </span>
                </button>
              </div>
              <div className="flex flex-col gap-y-2">
                <label htmlFor="unstakeSource" className="text-sm font-medium text-primary">
                  {"Stake Account"}
                </label>
                <select
                  id="unstakeSource"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background-card/50 text-primary font-mono focus:outline-none"
                  value={unstakeAccount}
                  onChange={e => setUnstakeAccount(e.target.value !== '' ? e.target.value : undefined)}
                >
                  <option key="default" value={''}>Select Account</option>
                  {stakeAccounts?.map((account) => (
                    <option key={account.address} value={account.address}>
                      {account.address}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-y-1">
                <div className="w-full flex items-center justify-between px-1.5">
                  <span className="font-medium">{t("ui.amount")}</span>
                  {deactivationStatus.withdrawing ? null : (
                    <div className="flex items-center gap-x-1.5 text-tertiary">
                      <Icon name="WalletSmall" />
                      <span className="text-sm font-mono">
                        {`${formatSol(!unstakeAccount ? 0 : stakeAccount?.amountStaked ?? 0)} SOL staked`}
                      </span>
                    </div>
                  )}
                </div>
                <div className="gap-x-4 relative bg-background rounded-xl border border-border pr-3 py-1.5 pl-1.5 flex items-center justify-between">
                  <div className="flex-shrink-0 flex font-mono items-center text-[#9945ff] gap-x-1.5 px-2 py-1.5 bg-background-card/50 border border-[#AD6AFF]/20 shadow-[inset_0px_0px_9px_rgba(154,70,255,0.2)] rounded-md text-xl">
                    <Image
                      src="/icons/sol.svg"
                      alt="Solana Icon"
                      width={24}
                      height={24}
                    />
                    <span className="leading-[100%]">SOL</span>
                  </div>
                  {deactivationStatus.withdrawing ? (
                    <input
                      className="disabled:opacity-40 focus:outline-none bg-transparent w-full text-2xl placeholder:text-mute font-mono leading-[100%] text-right"
                      placeholder={formatSol(stakeAccount?.amountStaked ?? 0)}
                      disabled={!isConnected || isLoading || !unstakeAccount || deactivationStatus.deactivating}
                      value={formatSol(stakeAccount?.amountStaked ?? 0)}
                      readOnly
                    />
                  ) : (
                    <input
                      className="disabled:opacity-40 focus:outline-none bg-transparent w-full text-2xl placeholder:text-mute font-mono leading-[100%] text-right"
                      placeholder="0.00"
                      disabled={!isConnected || isLoading || !unstakeAccount || deactivationStatus.deactivating}
                      value={amount}
                      onChange={(e) => handleAmountChange(e.target.value)}
                    />
                  )}
                  <Button
                    size="xs"
                    label={t("ui.max")}
                    disabled={!isConnected || isLoading || !unstakeAccount || deactivationStatus.deactivating}
                    onClick={handleMaxClick}
                  />
                </div>
                <div className="h-[24px] w-full">
                  {numericAmount > 0 && (
                    <motion.div
                      className="w-full flex"
                      initial={{ opacity: 0 }}
                      animate={{
                        opacity: [0, 1, 0.2, 1, 0.4, 1, 0.6, 1, 0.8, 1],
                      }}
                      transition={{ duration: 0.5, ease: anticipate }}
                    >
                      <Badge
                        color="rgb(173,185,210)"
                        className="font-mono ml-auto"
                        value={`~${formatCurrency(numericAmount * solPrice)} USD`}
                      />
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-y-5 items-center justify-center">
              {transactionStatus.type && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={classNames(
                    "w-full p-3 rounded-lg text-sm font-mono text-center",
                    transactionStatus.type === 'success'
                      ? "bg-green-500/20 text-green-400 border border-green-500/30"
                      : "bg-red-500/20 text-red-400 border border-red-500/30"
                  )}
                >
                  {transactionStatus.message}
                </motion.div>
              )}
              {!isConnected && (
                <WalletMultiButton isLoading={isLoading} />
              )}
              {(!stakeAccount || deactivationStatus.active) && (
                <Button
                  icon={"ArrowLeft"}
                  className="w-full relative"
                  label="Undelegate Stake"
                  disabled={!canUnstakeAction}
                  isLoading={isProcessing}
                  onClick={handleDeactivate}
                />
              )}
              {deactivationStatus.deactivating && (
                <Button
                  className="w-full relative"
                  label="Withdraw in Next Epoch"
                  disabled={true}
                  isLoading={isProcessing}
                  onClick={undefined}
                />
              )}
              {deactivationStatus.withdrawing && (
                <Button
                  icon={"ArrowLeft"}
                  className="w-full relative"
                  label="Withdraw Stake"
                  disabled={!canUnstakeAction}
                  isLoading={isProcessing}
                  onClick={handleWithdraw}
                />
              )}
              <span className="font-medium text-xs mx-auto w-2/3 sm:w-1/2 text-center text-pretty leading-[140%]">
                <span className="text-secondary">{t("ui.disclaimer")}</span>
                <span className="text-brand-secondary"> {t("ui.terms")}</span>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
