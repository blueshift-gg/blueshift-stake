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

interface StakeTabContentProps {
  connected: boolean;
  balance: number;
  amount: string;
  numericAmount: number;
  solPrice: number;
  isBalanceLoading: boolean;
  isProcessing: boolean;
  transactionStatus: TransactionStatus;
  onAmountChange: (value: string) => void;
  onMaxClick: () => void;
  onStake: () => void;
  canStakeAction: boolean;
}

export function StakeTabContent({
  connected,
  balance,
  amount,
  numericAmount,
  solPrice,
  isBalanceLoading,
  isProcessing,
  transactionStatus,
  onAmountChange,
  onMaxClick,
  onStake,
  canStakeAction,
}: StakeTabContentProps) {
  const t = useTranslations();

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
              <Image src="/icons/sol.svg" alt="Solana Icon" width={24} height={24} />
              <span className="leading-[100%]">SOL</span>
            </div>
            <input
              className="disabled:opacity-40 focus:outline-none bg-transparent w-full text-2xl placeholder:text-mute font-mono leading-[100%] text-right"
              placeholder="0.00"
              disabled={!connected || isBalanceLoading}
              value={amount}
              onChange={(e) => onAmountChange(e.target.value)}
            />
            <Button size="xs" label={t("ui.max")} disabled={!connected || isBalanceLoading} onClick={onMaxClick} />
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
      </div>
      <div className="flex flex-col gap-y-5 items-center justify-center">
        <TransactionStatusNotice status={transactionStatus} />
        {!connected ? (
          <WalletMultiButton isLoading={isBalanceLoading} />
        ) : (
          <Button
            icon="Target"
            className="w-full relative"
            label="Stake SOL"
            disabled={!canStakeAction}
            isLoading={isProcessing}
            onClick={onStake}
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
