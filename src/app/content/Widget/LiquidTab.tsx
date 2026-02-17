"use client";

import { useTranslations } from "next-intl";
import { formatCurrency, formatSol } from "@/utils/format";
import { Icon, Button } from "@blueshift-gg/ui-components";
import WalletMultiButton from "@/components/Wallet/WalletMultiButton";
import { anticipate } from "motion";
import { motion } from "motion/react";
import { TransactionStatusNotice } from "./archived/TransactionStatusNotice";
import type { TransactionStatus } from "./types";
import classNames from "classnames";

const JSOL_BRAND_COLOR = "#FFD600";

type LiquidTabProps = {
  balance: number;
  amount: string;
  onAmountChange: (value: string) => void;
  onMaxClick: () => void;
  connected: boolean;
  isBalanceLoading: boolean;
  numericAmount: number;
  solPrice: number;
  transactionStatus: TransactionStatus;
  canStakeAction: boolean;
  isProcessing: boolean;
  onStake: () => void;
};

export function LiquidTab({
  balance,
  amount,
  onAmountChange,
  onMaxClick,
  connected,
  isBalanceLoading,
  numericAmount,
  solPrice,
  transactionStatus,
  canStakeAction,
  isProcessing,
  onStake,
}: LiquidTabProps) {
  const t = useTranslations();

  return (
    <div className="bg-card-solid w-full px-6 py-8 flex flex-col gap-y-16">
      <div className="flex flex-col gap-y-2">
      {/* You Deposit - SOL */}
      <div className="flex flex-col gap-y-1">
        <div className="w-full flex items-center justify-between px-1.5">
          <span className="font-medium text-[15px]">{t("ui.you_deposit")}</span>
          <div className="flex items-center gap-x-1.5 text-tertiary">
            <Icon name="WalletSmall" />
            <span className="text-sm font-mono">{`${formatSol(balance)} SOL`}</span>
          </div>
        </div>
        <div className="gap-x-4 relative bg-background border border-border pr-3 py-1.5 pl-1.5 flex items-center justify-between">
          <div className="shrink-0 flex font-mono items-center text-[#9945ff] gap-x-1.5 px-2 py-1.5 bg-background-card/50 border border-[#AD6AFF]/20 shadow-[inset_0px_0px_9px_rgba(154,70,255,0.2)] text-xl">
            <img src="/icons/sol.svg" alt="Solana" className="w-5 h-5" />
            <span className="leading-[100%]">SOL</span>
          </div>
          <input
            className="disabled:opacity-40 focus:outline-none bg-transparent w-full text-2xl placeholder:text-mute font-mono leading-[100%] text-right"
            placeholder="0.00"
            disabled={!connected || isBalanceLoading}
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
          />
          <Button
            size="xs"
            label={t("ui.max")}
            disabled={!connected || isBalanceLoading}
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
              <span className="text-shade-tertiary font-mono text-sm ml-auto px-2 mt-1">{formatCurrency(numericAmount * solPrice)} USD</span>
            </motion.div>
          )}
        </div>
      </div>

      {/* You Receive - JSOL */}
      <div className="flex flex-col gap-y-1">
        <div className="w-full flex items-center justify-between px-1.5">
          <span className="font-medium text-[15px]">{t("ui.you_receive")}</span>
        </div>
        <div className="gap-x-4 relative bg-background border border-border pr-3 py-1.5 pl-1.5 flex items-center justify-between">
          <div
            className="shrink-0 flex font-mono items-center gap-x-1.5 px-2 py-1.5 bg-background-card/50 border text-xl"
            style={{
              color: JSOL_BRAND_COLOR,
              borderColor: `${JSOL_BRAND_COLOR}33`,
              boxShadow: `inset 0px 0px 9px ${JSOL_BRAND_COLOR}33`,
              backgroundColor: `${JSOL_BRAND_COLOR}0D`,
            }}
          >
            <img src="/icons/jsol.svg" alt="jSOL" className="w-5 h-5" />
            <span className="leading-[100%]">jSOL</span>
          </div>
          <span className={classNames("text-shade-mute text-2xl font-mono leading-[100%] text-right", { "text-shade-primary": numericAmount > 0 })}>
            {numericAmount > 0 ? numericAmount.toFixed(4) : "0.00"}
          </span>
        </div>
      </div>
      </div>

      <div className="flex flex-col gap-y-5 items-center justify-center">
        <TransactionStatusNotice status={transactionStatus} />
        {!connected ? (
          <WalletMultiButton
            size="lg"
            className="w-full"
            disabled={isBalanceLoading}
          />
        ) : (
          <Button
            icon={{ name: "Target" }}
            className="w-full relative"
            label={t("ui.stake_jsol")}
            disabled={!canStakeAction}
            loading={isProcessing}
            onClick={onStake}
            size="lg"
          />
        )}
      </div>
    </div>
  );
}
