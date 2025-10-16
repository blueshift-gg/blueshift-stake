"use client";
import Badge from "@/components/Badge/Badge";
import Icon from "@/components/Icon/Icon";
import { shortenString } from "@/utils/utils";
import { formatNumber, formatPercent, formatSol } from "@/utils/format";
import classNames from "classnames";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import { useValidatorStore } from "@/stores/validatorStore";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { VALIDATOR_VOTE_ACCOUNT } from "@/utils/solana";
import Image from "next/image";

export default function NetworkStats() {
  const t = useTranslations();
  const {
    stats: validatorStats,
    status: validatorStatus,
    fetchStats: fetchValidatorStats,
  } = useValidatorStore();

  const SLOT_INTERVAL_MS = 400;
  const MAX_SLOT_PROJECTION_DELTA = 64; // Limit how far ahead we project while waiting for the next RPC update.
  const REFRESH_TRIGGER_DELAY_MS = 1_500;
  const REFRESH_RETRY_DELAY_MS = 2_000;
  const VALIDATOR_STATS_REFRESH_INTERVAL_MS = 30_000;

  // Track the last authoritative slot/time so we can smoothly project forward between RPC refreshes.
  const projectionBaselineRef = useRef<{ slot: number; timestamp: number }>({
    slot: 0,
    timestamp: 0,
  });
  const [projectedSlotEstimate, setProjectedSlotEstimate] = useState(0);

  // Fetch network and validator stats on component mount
  useEffect(() => {
    fetchValidatorStats();
    const interval = setInterval(() => {
      fetchValidatorStats();
    }, VALIDATOR_STATS_REFRESH_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [fetchValidatorStats]);

  useEffect(() => {
    const latestNetworkSlot = validatorStats.currentSlot;

    if (!latestNetworkSlot || latestNetworkSlot <= 0) {
      return;
    }

    projectionBaselineRef.current = {
      slot: latestNetworkSlot,
      timestamp: Date.now(),
    };
    setProjectedSlotEstimate(latestNetworkSlot);
  }, [validatorStats.currentSlot]);

  const currentNetworkSlot = validatorStats.currentSlot ?? 0;

  useEffect(() => {
    const interval = setInterval(() => {
      const baseline = projectionBaselineRef.current;

      if (!baseline.timestamp || baseline.slot <= 0) {
        return;
      }

      const elapsed = Date.now() - baseline.timestamp;
      if (elapsed < SLOT_INTERVAL_MS) {
        return;
      }

      const delta = Math.floor(elapsed / SLOT_INTERVAL_MS);
      if (delta <= 0) {
        return;
      }

      setProjectedSlotEstimate((prev) => {
        // Clamp the projection so we never leap ahead more than the allowed buffer.
        const clampedProjection = Math.min(
          baseline.slot + delta,
          baseline.slot + MAX_SLOT_PROJECTION_DELTA
        );

        if (clampedProjection <= prev) {
          return prev;
        }

        // Advance the baseline in lockstep with the projection so future deltas stay accurate.
        projectionBaselineRef.current = {
          slot: clampedProjection,
          timestamp:
            baseline.timestamp +
            (clampedProjection - baseline.slot) * SLOT_INTERVAL_MS,
        };

        return clampedProjection;
      });
    }, SLOT_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  const validatorVoteAccount = VALIDATOR_VOTE_ACCOUNT.toBase58();
  const validatorUrl = process.env.NEXT_PUBLIC_VALIDATOR_URL;

  const effectiveSlot = Math.max(projectedSlotEstimate, currentNetworkSlot);

  const upcomingLeaderSlots = validatorStats.upcomingLeaderSlots;

  const nextScheduledSlot = useMemo(() => {
    const schedule = upcomingLeaderSlots ?? [];

    if (schedule.length === 0) {
      return null;
    }

    const upcomingFutureSlot = schedule.find(
      (slot) => slot > effectiveSlot
    );

    return (
      upcomingFutureSlot ?? schedule[schedule.length - 1] ?? null
    );
  }, [upcomingLeaderSlots, effectiveSlot]);

  const slotsUntilNextLeader = useMemo(() => {
    if (nextScheduledSlot === null) {
      return null;
    }

    return Math.max(nextScheduledSlot - effectiveSlot, 0);
  }, [nextScheduledSlot, effectiveSlot]);

  const nextLeaderCountdownLabel = useMemo(() => {
    if (slotsUntilNextLeader === null) {
      return "TBD";
    }

    if (!Number.isFinite(slotsUntilNextLeader)) {
      return "N/A";
    }

    return `${formatNumber(slotsUntilNextLeader)} slots`;
  }, [slotsUntilNextLeader]);

  const hasReachedScheduledSlot =
    nextScheduledSlot !== null && nextScheduledSlot <= effectiveSlot;

  const refreshAttemptRef = useRef<{ slot: number; time: number } | null>(null);

  useEffect(() => {
    if (!nextScheduledSlot || !hasReachedScheduledSlot) {
      refreshAttemptRef.current = null;
      return;
    }

    const now = Date.now();
    const lastAttempt = refreshAttemptRef.current;

    if (
      lastAttempt &&
      lastAttempt.slot === nextScheduledSlot &&
      now - lastAttempt.time < REFRESH_RETRY_DELAY_MS
    ) {
      return;
    }

    refreshAttemptRef.current = { slot: nextScheduledSlot, time: now };

    const timeout = setTimeout(() => {
      fetchValidatorStats();
    }, REFRESH_TRIGGER_DELAY_MS);

    return () => clearTimeout(timeout);
  }, [
    nextScheduledSlot,
    hasReachedScheduledSlot,
    fetchValidatorStats,
    REFRESH_RETRY_DELAY_MS,
    REFRESH_TRIGGER_DELAY_MS,
  ]);

  const isInitialValidatorLoad =
    validatorStatus === "idle" || validatorStatus === "loading";
  const isValidatorRefreshing = validatorStatus === "refreshing";
  const isValidatorError = validatorStatus === "error";
  const shouldShowNextLeaderLoading =
    !isValidatorError &&
    (isInitialValidatorLoad || (hasReachedScheduledSlot && isValidatorRefreshing));

  return (
    <motion.div className="w-full border-y border-border">
      <div className="wrapper !px-0">
        <div className="grid grid-cols-2 xl:grid-cols-4 xl:gap-x-6 divide-x divide-border xl:divide-x-0 xl:divide-y-0 relative">
          <div className="absolute h-px w-full bg-border z-10 top-1/2 -translate-y-1/2 xl:hidden"></div>
          <StatCard title={t("ui.validator")} useMonospace={false}>
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
            <span>
              {isInitialValidatorLoad ? (
                <span className="animate-pulse text-tertiary">Loading…</span>
              ) : isValidatorError ? (
                <span className="text-tertiary">N/A</span>
              ) : (
                formatSol(validatorStats.totalStake, 0)
              )}
            </span>
            {!isInitialValidatorLoad && !isValidatorError && (
              <Badge
                color="rgb(153, 69, 255)"
                value="SOL"
                icon="/icons/sol.svg"
              />
            )}
          </StatCard>
          <StatCard title="Next Leader Slot">
            {shouldShowNextLeaderLoading ? (
              <span className="animate-pulse text-tertiary">Loading…</span>
            ) : isValidatorError ? (
              <span className="text-tertiary">N/A</span>
            ) : (
              <div className="flex w-full items-center gap-x-3 gap-y-2">
                <span className="whitespace-nowrap leading-none">
                  {nextLeaderCountdownLabel}
                </span>
                <Badge
                  className="hidden sm:inline-flex ml-auto flex-shrink-0"
                  color="rgb(173, 185, 210)"
                  value={
                    nextScheduledSlot === null
                      ? "TBD"
                      : formatNumber(nextScheduledSlot)
                  }
                />
              </div>
            )}
          </StatCard>
          <StatCard title="APY">
            <span>
              {isInitialValidatorLoad ? (
                <span className="animate-pulse text-tertiary">Loading…</span>
              ) : isValidatorError ? (
                <span className="text-tertiary">N/A</span>
              ) : (
                formatPercent(validatorStats.apy)
              )}
            </span>
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
  useMonospace = true,
}: {
  title: string;
  children: ReactNode;
  className?: string;
  useMonospace?: boolean;
}) => {
  return (
    <div className={classNames("group/stat relative", className)}>
      <div className="p-5 xl:p-6 flex flex-col gap-y-3">
        <div className="hidden xl:block group-last-of-type/stat:hidden absolute h-[calc(100%+16px)] -right-6 -top-[8px] w-px bg-border z-10"></div>
        <div className="relative z-20 font-medium text-tertiary">{title}</div>
        <div
          className={classNames(
            "flex items-center gap-x-2.5 text-lg sm:text-2xl xl:text-[26px] leading-[100%] font-medium text-primary",
            useMonospace && "font-mono"
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
};
