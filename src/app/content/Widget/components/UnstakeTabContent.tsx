'use client';

import Badge from "@/components/Badge/Badge";
import Button from "@/components/Button/Button";
import Icon from "@/components/Icon/Icon";
import WalletMultiButton from "@/components/Wallet/WalletMultiButton";
import { formatCurrency, formatSol } from "@/utils/format";
import Image from "next/image";
import { anticipate, motion } from "motion/react";
import { useTranslations } from "next-intl";
import type { TransactionStatus } from "../types";
import { TransactionStatusNotice } from "./TransactionStatusNotice";

interface StakeAccountSummary {
  totalBalance: number;
  delegatedStake: number;
  withdrawableAmount: number;
  activeStake: number;
  inactiveStake: number;
  status: string;
  rentExemptReserve: number;
}

interface UnstakeTabContentProps {
  connected: boolean;
  stakeAccounts?: Array<{ address: string }>;
  selectedStakeAccount?: string;
  stakeAccountSummary?: StakeAccountSummary;
  activationStatus: string;
  amount: string;
  numericAmount: number;
  solPrice: number;
  isBalanceLoading: boolean;
  isProcessing: boolean;
  canDeactivateAction: boolean;
  canWithdrawAction: boolean;
  transactionStatus: TransactionStatus;
  onStakeAccountChange: (value: string | undefined) => void;
  onAmountChange: (value: string) => void;
  onMaxClick: () => void;
  onDeactivate: () => void;
  onWithdraw: () => void;
}

export function UnstakeTabContent({
  connected,
  stakeAccounts,
  selectedStakeAccount,
  stakeAccountSummary,
  activationStatus,
  amount,
  numericAmount,
  solPrice,
  isBalanceLoading,
  isProcessing,
  canDeactivateAction,
  canWithdrawAction,
  transactionStatus,
  onStakeAccountChange,
  onAmountChange,
  onMaxClick,
  onDeactivate,
  onWithdraw,
}: UnstakeTabContentProps) {
  const t = useTranslations();

  const handleStakeAccountChange = (value: string) => {
    onStakeAccountChange(value !== "" ? value : undefined);
  };

  const delegatedStake = stakeAccountSummary?.delegatedStake ?? 0;
  const withdrawableNow = stakeAccountSummary?.withdrawableAmount ?? 0;
  const inactiveStake = stakeAccountSummary?.inactiveStake ?? 0;
  const rentReserve = stakeAccountSummary?.rentExemptReserve ?? 0;
  const status = stakeAccountSummary?.status ?? "unknown";
  const derivedActiveStake = Math.max(
    stakeAccountSummary ? stakeAccountSummary.delegatedStake - inactiveStake : 0,
    0
  );
  const activeStake = stakeAccountSummary?.activeStake ?? derivedActiveStake;
  const showCoolingDownNotice = status === "deactivating" && withdrawableNow === 0;

  const renderStat = (label: string, value: string, highlight = false) => (
    <div
      className={`flex items-center justify-between rounded-md border px-3 py-2 bg-background-card/60 ${
        highlight ? "border-brand-primary/60" : "border-border/60"
      }`}
    >
      <span className="text-xs uppercase tracking-wide text-tertiary">{label}</span>
      <span className={`font-mono text-sm ${highlight ? "text-brand-secondary" : "text-primary"}`}>
        {value}
      </span>
    </div>
  );

  const renderStakeStatusStats = () => {
    if (status === "activating") {
      return (
        <>
          {activeStake > 0 ? renderStat("Active Stake", `${formatSol(activeStake)} SOL`) : null}
          {inactiveStake > 0 ? renderStat("Activating Stake", `${formatSol(inactiveStake)} SOL`) : null}
        </>
      );
    }

    if (status === "deactivating") {
      return (
        <>
          {inactiveStake > 0 ? renderStat("Inactive Stake", `${formatSol(inactiveStake)} SOL`) : null}
          {activeStake > 0 ? renderStat("Deactivating Stake", `${formatSol(activeStake)} SOL`) : null}
        </>
      );
    }

    if (status === "inactive") {
      return inactiveStake > 0 ? renderStat("Inactive stake", `${formatSol(inactiveStake)} SOL`) : null;
    }

    return activeStake > 0 ? renderStat("Active stake", `${formatSol(activeStake)} SOL`) : null;
  };

  return (
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
            {t("ui.stakeAccountLabel") || "Stake Account"}
          </label>
          <select
            id="unstakeSource"
            className="w-full px-3 py-2 rounded-lg border border-border bg-background-card/50 text-primary font-mono focus:outline-none"
            value={selectedStakeAccount ?? ""}
            onChange={(event) => handleStakeAccountChange(event.target.value)}
          >
            <option value="">Select Account</option>
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
              <div className="flex items-center gap-x-1.5 text-tertiary">
                <Icon name="WalletSmall" />
                <span className="text-sm font-mono">
                  {`${formatSol(selectedStakeAccount ? delegatedStake : 0)} SOL delegated`}
                </span>
              </div>
          </div>
          <div className="gap-x-4 relative bg-background rounded-xl border border-border pr-3 py-1.5 pl-1.5 flex items-center justify-between">
            <div className="flex-shrink-0 flex font-mono items-center text-[#9945ff] gap-x-1.5 px-2 py-1.5 bg-background-card/50 border border-[#AD6AFF]/20 shadow-[inset_0px_0px_9px_rgba(154,70,255,0.2)] rounded-md text-xl">
              <Image src="/icons/sol.svg" alt="Solana Icon" width={24} height={24} />
              <span className="leading-[100%]">SOL</span>
            </div>
              <input
                className="disabled:opacity-40 focus:outline-none bg-transparent w-full text-2xl placeholder:text-mute font-mono leading-[100%] text-right"
                placeholder="0.00"
                disabled={!connected || isBalanceLoading || !selectedStakeAccount || activationStatus === "deactivating" || activationStatus === "inactive"}
                value={amount}
                onChange={(event) => onAmountChange(event.target.value)}
              />
            <Button
              size="xs"
              label={t("ui.max")}
              disabled={!connected || isBalanceLoading || !selectedStakeAccount || activationStatus === "deactivating" || activationStatus === "inactive"}
              onClick={onMaxClick}
            />
          </div>
          <div className="h-[24px] w-full">
            {numericAmount > 0 && solPrice > 0 && (
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
        {selectedStakeAccount && stakeAccountSummary && (
          <div className="grid gap-2 rounded-xl border border-border/60 bg-background-card/40 px-3 py-3">
            {renderStat("Delegated stake", `${formatSol(delegatedStake)} SOL`)}
            {/* {renderStat("Ready to withdraw", `${formatSol(withdrawableNow)} SOL`, withdrawableNow > 0)} */}
            {renderStakeStatusStats()}
            {renderStat("Rent reserve", `${formatSol(rentReserve)} SOL`)}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-y-5 items-center justify-center">
        <TransactionStatusNotice status={transactionStatus} />
        {!connected && <WalletMultiButton isLoading={isBalanceLoading} />}
        {connected && selectedStakeAccount && (
          <div className="flex w-full flex-col gap-y-3">
            {(status === "active" || status === "activating") && (
              <Button
                icon="ArrowLeft"
                className="w-full relative"
                label="Undelegate Stake"
                disabled={!canDeactivateAction}
                isLoading={isProcessing}
                onClick={onDeactivate}
              />
            )}
            {withdrawableNow > 0 && (
              <Button
                icon="ArrowLeft"
                className="w-full relative"
                label={`Withdraw ${formatSol(withdrawableNow)} SOL`}
                disabled={!canWithdrawAction}
                isLoading={isProcessing}
                onClick={onWithdraw}
              />
            )}
            {withdrawableNow === 0 && showCoolingDownNotice && (
              <Button
                className="w-full relative"
                label="Stake cooling down"
                disabled
                isLoading={isProcessing}
              />
            )}
          </div>
        )}
        <span className="font-medium text-xs mx-auto w-2/3 sm:w-1/2 text-center text-pretty leading-[140%]">
          <span className="text-secondary">{t("ui.disclaimer")}</span>
          <span className="text-brand-secondary"> {t("ui.terms")}</span>
        </span>
      </div>
    </div>
  );
}
