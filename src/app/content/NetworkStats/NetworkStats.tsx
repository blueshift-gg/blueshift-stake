"use client";
import Badge from "@/components/Badge/Badge";
import Icon from "@/components/Icon/Icon";
import { shortenString } from "@/utils/utils";
import classNames from "classnames";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import { useStakingStore } from "@/stores/stakingStore";
import { ReactNode, useEffect } from "react";
import { formatSol } from "@/utils/solana";
import { VALIDATOR_VOTE_ACCOUNT } from "@/utils/solana";
import Image from "next/image";

export default function NetworkStats() {
  const t = useTranslations();
  const { networkStats, validatorStats, fetchValidatorStats } = useStakingStore();

  // Fetch network and validator stats on component mount
  useEffect(() => {
    fetchValidatorStats();
    // Update every 30 seconds
    const interval = setInterval(() => {
      fetchValidatorStats();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchValidatorStats]);

  const validatorVoteAccount = VALIDATOR_VOTE_ACCOUNT.toBase58();
  const validatorUrl = process.env.NEXT_PUBLIC_VALIDATOR_URL;

  // Calculate slots remaining until next leader slot
  const getNextLeaderDisplay = () => {
    if (!validatorStats.nextLeaderSlot) return "N/A";
    const currentSlot = networkStats.currentEpoch * 432000; // Approximate slots per epoch
    const slotsRemaining = validatorStats.nextLeaderSlot - currentSlot;
    return slotsRemaining > 0 ? `${slotsRemaining} slots` : "Soon";
  };

  return (
    <motion.div className="w-full border-y border-border">
      <div className="wrapper !px-0">
        <div className="grid grid-cols-2 xl:grid-cols-4 xl:gap-x-6 divide-x divide-border xl:divide-x-0 xl:divide-y-0 relative">
          <div className="absolute h-px w-full bg-border z-10 top-1/2 -translate-y-1/2 xl:hidden"></div>
          <StatCard title={t("ui.validator")}>
            <div className="absolute w-full xl:w-[calc(100%+24px)] h-[calc(100%+1px)] left-0 -top-[1px] overflow-hidden pointer-events-none">
              <div className="absolute w-[1350px] h-[500px] mix-blend-color-dodge top-1/3 -translate-y-3/5 left-1/2 -translate-x-1/2">
                <Image
                  src="/graphics/validator-eclipse.webp"
                  alt="Validator eclipse effect"
                  width={1350}
                  height={500}
                  className="max-w-none"
                />
              </div>
              <div className="w-full h-full mix-blend-plus-lighter [mask-image:linear-gradient(270deg,rgba(217,217,217,0)_-0.18%,rgba(115,115,115,0.2)_99.82%)]">
                <Image
                  src="/graphics/validator-bg.webp"
                  alt="Validator BG"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
            {validatorUrl ? (
              <a
                className="flex items-center gap-x-2.5 group/link"
                href={validatorUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image
                  src="/icons/blueshift.svg"
                  alt="Blueshift Icon"
                  width={24}
                  height={24}
                  className="relative z-20"
                />
                <div>{shortenString(validatorVoteAccount, 8)}</div>
                <div className="group-hover/link:text-primary focus:outline-none h-4 w-4 text-tertiary/50 hover:text-primary transition">
                  <Icon name="ExternalLink" />
                </div>
              </a>
            ) : (
              <div className="flex items-center gap-x-2.5">
                <Image
                  src="/icons/blueshift.svg"
                  alt="Blueshift Icon"
                  width={24}
                  height={24}
                  className="relative z-20"
                />
                <div>{shortenString(validatorVoteAccount, 8)}</div>
              </div>
            )}
          </StatCard>
          <StatCard title="Total Staked">
            <span>{formatSol(validatorStats.totalStake, 0)}</span>
            <Badge
              color="rgb(153, 69, 255)"
              value="SOL"
              icon="/icons/sol.svg"
            />
          </StatCard>
          <StatCard title="Next Leader Slot">
            <span>{getNextLeaderDisplay()}</span>
            <Badge
              className="hidden sm:flex"
              color="rgb(173, 185, 210)"
              value={`Slot ${validatorStats.nextLeaderSlot || "TBD"}`}
            />
          </StatCard>
          <StatCard title="APY">
            <span>6.1%</span>
            <Badge
              color="rgb(0, 230, 107)"
              value="0.1%"
            />
          </StatCard>
        </div>
      </div>
    </motion.div>
  );
}

const StatCard = ({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) => {
  return (
    <div className={classNames("group/stat relative", className)}>
      <div className="p-5 xl:p-6 flex flex-col gap-y-3">
        <div className="hidden xl:block group-last-of-type/stat:hidden absolute h-[calc(100%+16px)] -right-6 -top-[8px] w-px bg-border z-10"></div>
        <div className="relative z-20 font-medium text-tertiary">{title}</div>
        <div className="flex items-center gap-x-2.5 text-lg sm:text-2xl xl:text-[26px] leading-[100%] font-medium font-mono text-primary">
          {children}
        </div>
      </div>
    </div>
  );
};
