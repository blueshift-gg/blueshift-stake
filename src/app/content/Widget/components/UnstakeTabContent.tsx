'use client';

import Badge from "@/components/Badge/Badge";
import Button from "@/components/Button/Button";
import Icon from "@/components/Icon/Icon";
import WalletMultiButton from "@/components/Wallet/WalletMultiButton";
import { formatCurrency, formatSol } from "@/utils/format";
import Image from "next/image";
import { anticipate, motion } from "motion/react";
import { useTranslations } from "next-intl";
import type { DeactivationStatus, TransactionStatus } from "../types";
import { TransactionStatusNotice } from "./TransactionStatusNotice";

interface UnstakeTabContentProps {
  connected: boolean;
  stakeAccounts?: Array<{ address: string }>;
  selectedStakeAccount?: string;
  selectedStakeAmount: number;
  deactivationStatus: DeactivationStatus;
  amount: string;
  numericAmount: number;
  solPrice: number;
  isBalanceLoading: boolean;
  isProcessing: boolean;
  canUnstakeAction: boolean;
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
  selectedStakeAmount,
  deactivationStatus,
  amount,
  numericAmount,
  solPrice,
  isBalanceLoading,
  isProcessing,
  canUnstakeAction,
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
            {deactivationStatus.withdrawing ? null : (
              <div className="flex items-center gap-x-1.5 text-tertiary">
                <Icon name="WalletSmall" />
                <span className="text-sm font-mono">
                  {`${formatSol(selectedStakeAccount ? selectedStakeAmount : 0)} SOL staked`}
                </span>
              </div>
            )}
          </div>
          <div className="gap-x-4 relative bg-background rounded-xl border border-border pr-3 py-1.5 pl-1.5 flex items-center justify-between">
            <div className="flex-shrink-0 flex font-mono items-center text-[#9945ff] gap-x-1.5 px-2 py-1.5 bg-background-card/50 border border-[#AD6AFF]/20 shadow-[inset_0px_0px_9px_rgba(154,70,255,0.2)] rounded-md text-xl">
              <Image src="/icons/sol.svg" alt="Solana Icon" width={24} height={24} />
              <span className="leading-[100%]">SOL</span>
            </div>
            {deactivationStatus.withdrawing ? (
              <input
                className="disabled:opacity-40 focus:outline-none bg-transparent w-full text-2xl placeholder:text-mute font-mono leading-[100%] text-right"
                placeholder={formatSol(selectedStakeAmount)}
                disabled={!connected || isBalanceLoading || !selectedStakeAccount || deactivationStatus.deactivating}
                value={formatSol(selectedStakeAmount)}
                readOnly
              />
            ) : (
              <input
                className="disabled:opacity-40 focus:outline-none bg-transparent w-full text-2xl placeholder:text-mute font-mono leading-[100%] text-right"
                placeholder="0.00"
                disabled={!connected || isBalanceLoading || !selectedStakeAccount || deactivationStatus.deactivating}
                value={amount}
                onChange={(event) => onAmountChange(event.target.value)}
              />
            )}
            <Button
              size="xs"
              label={t("ui.max")}
              disabled={!connected || isBalanceLoading || !selectedStakeAccount || deactivationStatus.deactivating}
              onClick={onMaxClick}
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
  <TransactionStatusNotice status={transactionStatus} />
        {!connected && <WalletMultiButton isLoading={isBalanceLoading} />}
        {(!selectedStakeAccount || deactivationStatus.active) && (
          <Button
            icon="ArrowLeft"
            className="w-full relative"
            label="Undelegate Stake"
            disabled={!canUnstakeAction}
            isLoading={isProcessing}
            onClick={onDeactivate}
          />
        )}
        {deactivationStatus.deactivating && (
          <Button
            className="w-full relative"
            label="Withdraw in Next Epoch"
            disabled
            isLoading={isProcessing}
          />
        )}
        {deactivationStatus.withdrawing && (
          <Button
            icon="ArrowLeft"
            className="w-full relative"
            label="Withdraw Stake"
            disabled={!canUnstakeAction}
            isLoading={isProcessing}
            onClick={onWithdraw}
          />
        )}
        <span className="font-medium text-xs mx-auto w-2/3 sm:w-1/2 text-center text-pretty leading-[140%]">
          <span className="text-secondary">{t("ui.disclaimer")}</span>
          <span className="text-brand-secondary"> {t("ui.terms")}</span>
        </span>
      </div>
    </div>
  );
}
