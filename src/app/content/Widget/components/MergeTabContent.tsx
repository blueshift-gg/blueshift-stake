"use client";

import { Button } from "@blueshift-gg/ui-components";
import WalletMultiButton from "@/components/Wallet/WalletMultiButton";
import { useTranslations } from "next-intl";
import type { TransactionStatus } from "../types";
import { TransactionStatusNotice } from "./TransactionStatusNotice";

type StakeAccountSummary = {
  address: string;
  amountStaked: number;
  stakingAuthority: string;
  withdrawAuthority: string;
};

interface MergeTabContentProps {
  connected: boolean;
  stakeAccounts?: StakeAccountSummary[];
  mergeSource?: string;
  mergeDestination?: string;
  isProcessing: boolean;
  isBalanceLoading: boolean;
  canMergeAction: boolean;
  transactionStatus: TransactionStatus;
  onMerge: () => void;
  onMergeSourceChange: (value: string | undefined) => void;
  onMergeDestinationChange: (value: string | undefined) => void;
}

export function MergeTabContent({
  connected,
  stakeAccounts,
  mergeSource,
  mergeDestination,
  isProcessing,
  isBalanceLoading,
  canMergeAction,
  transactionStatus,
  onMerge,
  onMergeSourceChange,
  onMergeDestinationChange,
}: MergeTabContentProps) {
  const t = useTranslations();

  const handleSourceChange = (value: string) => {
    onMergeSourceChange(value !== "" ? value : undefined);
  };

  const handleDestinationChange = (value: string) => {
    onMergeDestinationChange(value !== "" ? value : undefined);
  };

  return (
    <div className="px-4 py-6 md:px-6 md:py-8 bg-background-card/50 shadow-[inset_0px_0px_12px_rgba(26,30,38,0.2)] flex flex-col gap-y-9">
      <div className="flex flex-col gap-y-4">
        <div className="flex flex-col gap-3">
          <div className="flex-1">
            <label
              className="block text-xs font-medium text-secondary mb-1"
              htmlFor="mergeSource"
            >
              {t("ui.mergeSource") || "Source Account"}
            </label>
            <select
              id="mergeSource"
              className="w-full px-3 py-2 border border-border bg-background-card/50 text-primary font-mono focus:outline-none"
              value={mergeSource ?? ""}
              onChange={(event) => handleSourceChange(event.target.value)}
              disabled={
                !connected ||
                isBalanceLoading ||
                isProcessing ||
                !stakeAccounts?.length
              }
            >
              <option value="">Select Source</option>
              {stakeAccounts
                ?.filter((account) => {
                  if (mergeDestination) {
                    return account.address !== mergeDestination;
                  }
                  return true;
                })
                .map((account) => (
                  <option key={account.address} value={account.address}>
                    {account.address}
                  </option>
                ))}
            </select>
          </div>
          <div className="flex-1">
            <label
              className="block text-xs font-medium text-secondary mb-1"
              htmlFor="mergeDestination"
            >
              {t("ui.mergeDestination") || "Destination Account"}
            </label>
            <select
              id="mergeDestination"
              className="w-full px-3 py-2 border border-border bg-background-card/50 text-primary font-mono focus:outline-none"
              value={mergeDestination ?? ""}
              onChange={(event) => handleDestinationChange(event.target.value)}
              disabled={
                !connected ||
                isBalanceLoading ||
                isProcessing ||
                !stakeAccounts?.length
              }
            >
              <option value="">Select Destination</option>
              {stakeAccounts
                ?.filter((account) => {
                  if (mergeSource) {
                    return account.address !== mergeSource;
                  }
                  return true;
                })
                .map((account) => (
                  <option key={account.address} value={account.address}>
                    {account.address}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-y-5 items-center justify-center">
        <TransactionStatusNotice status={transactionStatus} />
        {!connected ? (
          <WalletMultiButton className="w-full" isLoading={isBalanceLoading} />
        ) : (
          <Button
            className="w-full relative"
            size="lg"
            label={t("ui.merge") || "Merge"}
            disabled={!canMergeAction}
            loading={isProcessing}
            onClick={onMerge}
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
