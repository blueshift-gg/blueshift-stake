"use client";

import { Button, Dropdown } from "@blueshift-gg/ui-components";
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

  const handleSourceChange = (value: string | string[] | undefined) => {
    onMergeSourceChange(Array.isArray(value) ? value[0] : value);
  };

  const handleDestinationChange = (value: string | string[] | undefined) => {
    onMergeDestinationChange(Array.isArray(value) ? value[0] : value);
  };

  const sourceItems =
    stakeAccounts
      ?.filter((account) => {
        if (mergeDestination) {
          return account.address !== mergeDestination;
        }
        return true;
      })
      .map((account) => ({
        label: account.address,
        value: account.address,
      })) || [];

  const destinationItems =
    stakeAccounts
      ?.filter((account) => {
        if (mergeSource) {
          return account.address !== mergeSource;
        }
        return true;
      })
      .map((account) => ({
        label: account.address,
        value: account.address,
      })) || [];

  const isDisabled =
    !connected || isBalanceLoading || isProcessing || !stakeAccounts?.length;

  return (
    <div className="px-4 py-6 md:px-6 md:py-8 bg-background-card/50 shadow-[inset_0px_0px_12px_rgba(26,30,38,0.2)] flex flex-col gap-y-9">
      <div className="flex flex-col gap-y-4">
        <div className="flex flex-col gap-y-5">
          <div className="flex-1 flex flex-col gap-y-1.5">
            <label
              className="block font-medium text-secondary text-[15px]"
              htmlFor="mergeSource"
            >
              {t("ui.mergeSource") || "Source Account"}
            </label>
            <Dropdown
              items={sourceItems}
              selectedItem={mergeSource}
              handleChange={handleSourceChange}
              label={t("ui.selectSource") || "Select Source"}
              disabled={isDisabled}
              buttonClassName="font-mono"
              size="md"
              menuClassName="w-full"
            />
          </div>
          <div className="flex-1 flex flex-col gap-y-1.5">
            <label
              className="block font-medium text-secondary text-[15px]"
              htmlFor="mergeDestination"
            >
              {t("ui.mergeDestination") || "Destination Account"}
            </label>
            <Dropdown
              items={destinationItems}
              selectedItem={mergeDestination}
              handleChange={handleDestinationChange}
              label={t("ui.selectDestination") || "Select Destination"}
              disabled={isDisabled}
              buttonClassName="font-mono"
              size="md"
              menuClassName="w-full"
            />
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
