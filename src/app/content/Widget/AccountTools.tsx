"use client";

import { useTranslations } from "next-intl";
import { useWallet } from "@solana/wallet-adapter-react";
import { TOP_VALIDATORS } from "@/utils/validators";
import AccountCard from "./AccountCard";
import Modal from "@/components/Modal";
import { Badge, Button, Input, nova } from "@blueshift-gg/ui-components";
import { motion } from "motion/react";
import { useState } from "react";

// Fake stake account data for UI examples (uses validators from validators.ts)
function useFakeStakeAccounts() {
  const helius = TOP_VALIDATORS[0];
  const jupiter = TOP_VALIDATORS[1];
  const blueshift = TOP_VALIDATORS[22]; // Blueshift
  return [
    {
      validator: {
        name: helius.name,
        icon: helius.iconUrl,
        color: helius.brandColor,
      },
      accounts: [
        { status: "active", amount: "125.50 SOL" },
        { status: "active", amount: "50.25 SOL" },
      ],
      totalStaked: "175.75 SOL",
    },
    {
      validator: {
        name: jupiter.name,
        icon: jupiter.iconUrl,
        color: jupiter.brandColor,
      },
      accounts: [{ status: "active", amount: "1,000.00 SOL" }],
      totalStaked: "1,000.00 SOL",
    },
    {
      validator: {
        name: blueshift.name,
        icon: blueshift.iconUrl,
        color: blueshift.brandColor,
      },
      accounts: [
        { status: "active", amount: "42.10 SOL" },
        { status: "inactive", amount: "10.00 SOL" },
      ],
      totalStaked: "52.10 SOL",
    },
  ];
}

export default function AccountTools() {
  const t = useTranslations();
  const { connected } = useWallet();
  const stakeAccounts = useFakeStakeAccounts();

  const [isMigrateModalOpen, setIsMigrateModalOpen] = useState(false);
  const [migrateAmount, setMigrateAmount] = useState(0);

  const handleMigrateAmountChange = (value: string) => {
    setMigrateAmount(Number(value));
  };

  return (
    <div className="col-span-1 xl:col-span-4 px-4 py-6 xl:px-6 xl:py-7 h-full relative">
      <Modal isOpen={isMigrateModalOpen} onClose={() => setIsMigrateModalOpen(false)} position={{ bottom: 24, right: 24 }} closeOnClickOutside={false} width={400} cardClassName="p-0!">
        <div className="flex flex-col gap-y-8 w-full items-center">
          <div className="mt-3 w-full flex items-center justify-center border-y border-border-light bg-card-foreground py-3 px-6">
            <span className="font-mono text-[15px] text-shade-primary leading-none">Account Migration</span>
          </div>
          <div className="flex flex-col gap-y-6 px-3">
            <div className="flex items-center justify-center">
              <div className="w-[56px] h-[48px]" style={{ color: stakeAccounts[0].validator.color !== "" ? stakeAccounts[0].validator.color : "rgb(255,255,255)" }}>
                <Badge crosshair={{ variant: "bordered" }} icon={<img src={`/icons/validators/${stakeAccounts[0].validator.icon}`} alt={stakeAccounts[0].validator.name} className="w-7" />} className="px-2.5! text-current!" />
              </div>
              <div className="flex relative w-20 h-px" style={{ color: stakeAccounts[0].validator.color !== "" ? stakeAccounts[0].validator.color : "rgb(255,255,255)" }}>
                <div className="absolute left-0 w-full h-full bg-border-light"></div>
                <motion.div className="absolute left-0 h-full bg-current" initial={{ width: 0, opacity: 0 }} animate={{ width: "100%", opacity: [1, 1, 1, 1, 0] }} transition={{ duration: 1.5, ease: nova, repeat: Infinity, repeatType: "loop", repeatDelay: 1 }}></motion.div>
              </div>
              <div className="w-[56px] h-[48px]" style={{ color: stakeAccounts[0].validator.color !== "" ? stakeAccounts[1].validator.color : "rgb(255,255,255)" }}>
                <Badge crosshair={{ variant: "bordered" }} icon={<img src={`/icons/validators/${stakeAccounts[1].validator.icon}`} alt={stakeAccounts[1].validator.name} className="w-7" />} className="px-2.5! text-current!" />
              </div>
            </div>
            <p className="font-medium text-sm max-w-[300px] text-balance text-center mx-auto leading-[160%] text-shade-tertiary">Choose the amount you would like to
              migrate to Blueshift</p>
          </div>

          <div className="px-3 w-full">
            <Input type="value" placeholder="0.00" value={migrateAmount.toString()} inputClassName="text-left!" onChange={handleMigrateAmountChange}>
              <div className="flex items-center gap-x-1">
                <Button size="sm" label="1/2" crosshairProps={{ size: 0 }} variant="secondary" />
                <Button size="sm" label="FULL" crosshairProps={{ size: 0 }} variant="secondary" />
                <Button size="sm" label="CUSTOM" crosshairProps={{ size: 0 }} variant="secondary" />
              </div>
            </Input>
          </div>

          <div className="w-full flex items-center justify-center border-t border-border bg-background/50 p-3 gap-x-2.5">
            <Button variant="secondary" size="md" label="Cancel" className="w-full" onClick={() => setIsMigrateModalOpen(false)} />
            <Button size="md" label="Confirm" className="w-full" />
          </div>
        </div>
      </Modal>

      <div className="absolute left-0 top-0 h-[calc(100%+96px)] w-px bg-border"></div>
      {!connected && (
        <div className="relative bg-card-foreground/10 w-full py-12 flex items-center justify-center flex-col gap-y-4">
          <div className="dashed-border"></div>
          <img src="/icons/not-connected.svg" alt="Not Connected" className="w-14 h-14" />
          <div className="flex flex-col gap-y-1.5 max-w-[250px] text-center mx-auto">
            <span className="font-mono text-[15px] text-shade-primary leading-[160%]">
              {t("ui.not_connected")}
            </span>
            <p className="text-sm leading-[160%] text-shade-tertiary font-medium">
              {t("ui.not_connected_hint")}
            </p>
          </div>
        </div>
      )}

      {connected && !stakeAccounts && (
        <div className="relative bg-card-foreground/10 w-full py-12 flex items-center justify-center flex-col gap-y-4">
          <div className="dashed-border"></div>
          <img src="/icons/no-accounts.svg" alt="No Stake Accounts" className="w-14 h-14" />
          <div className="flex flex-col gap-y-1.5 max-w-[250px] text-center mx-auto">
            <span className="font-mono text-[15px] text-shade-primary leading-[160%]">
              {t("ui.no_stake_accounts")}
            </span>
            <p className="text-sm leading-[160%] text-shade-tertiary font-medium">
              {t("ui.no_stake_accounts_hint")}
            </p>
          </div>
        </div>
      )}

      {connected && stakeAccounts.length > 0 && (
        <div className="flex flex-col gap-y-4 max-h-[600px] overflow-y-scroll -mt-6 pt-6 mask-[linear-gradient(to_bottom,transparent_0%,black_5%,black_95%,transparent)] pr-4 -mr-4 pb-6 -mb-6">
          {stakeAccounts.map((group, i) => (
            <AccountCard
              key={i}
              validator={group.validator}
              accounts={group.accounts}
              totalStaked={group.totalStaked}
              onMigrate={() => setIsMigrateModalOpen(true)}
            />
          ))}
        </div>
      )}
    </div>
  );
}