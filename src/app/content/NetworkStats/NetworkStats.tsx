"use client";
import { Icon, Badge } from "@blueshift-gg/ui-components";
import { shortenString } from "@/utils/utils";
import { formatNumber, formatPercent, formatSol } from "@/utils/format";
import classNames from "classnames";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import { trpc } from "@/utils/trpc";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { VALIDATOR_VOTE_ACCOUNT } from "@/utils/solana";

const SLOT_INTERVAL_MS = 400;
const MAX_SLOT_PROJECTION_DELTA = 64;
const REFRESH_TRIGGER_DELAY_MS = 1_500;
const REFRESH_RETRY_DELAY_MS = 2_000;
const VALIDATOR_STATS_REFRESH_INTERVAL_MS = 30_000;

export default function NetworkStats() {
  const t = useTranslations();
  const {
    data: validatorStatsData,
    status: validatorStatus,
    fetchStatus: validatorFetchStatus,
    refetch: refetchValidatorStats,
  } = trpc.validator.stats.useQuery(undefined, {
    refetchInterval: VALIDATOR_STATS_REFRESH_INTERVAL_MS,
    refetchOnWindowFocus: false,
  });

  const validatorStats = validatorStatsData ?? {
    totalStake: 0,
    apy: 0,
    currentSlot: 0,
    upcomingLeaderSlots: [],
  };

  // Constants hoisted outside component for reuse.

  // Track the last authoritative slot/time so we can smoothly project forward between RPC refreshes.
  const projectionBaselineRef = useRef<{ slot: number; timestamp: number }>({
    slot: 0,
    timestamp: 0,
  });
  const [projectedSlotEstimate, setProjectedSlotEstimate] = useState(0);

  // The React Query hook handles initial fetch and background refresh.

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

    const upcomingFutureSlot = schedule.find((slot) => slot > effectiveSlot);

    return upcomingFutureSlot ?? schedule[schedule.length - 1] ?? null;
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
      void refetchValidatorStats();
    }, REFRESH_TRIGGER_DELAY_MS);

    return () => clearTimeout(timeout);
  }, [nextScheduledSlot, hasReachedScheduledSlot, refetchValidatorStats]);

  const isInitialValidatorLoad = validatorStatus === "pending";
  const isValidatorError = validatorStatus === "error";
  const isValidatorRefreshing =
    validatorFetchStatus === "fetching" && !isInitialValidatorLoad;
  const shouldShowNextLeaderLoading =
    !isValidatorError &&
    (isInitialValidatorLoad ||
      (hasReachedScheduledSlot && isValidatorRefreshing));

  return (
    <motion.div className="w-full border-y border-border">
      <div className="wrapper !px-0">
        <div className="grid grid-cols-2 xl:grid-cols-9 xl:divide-x xl:divide-border relative xl:border-x xl:border-x-border relative">
          <div className="left-1/2 -translate-x-1/2 absolute h-full w-px bg-border z-10 top-1/2 -translate-y-1/2 xl:hidden"></div>
          <div className="absolute h-px w-full bg-border z-10 top-1/2 -translate-y-1/2 xl:hidden"></div>
          <StatCard title={t("ui.validator")} useMonospace={false} className="col-span-1 xl:col-span-3">
            {validatorUrl ? (
              <a
                className="flex items-center gap-x-2.5 group/link"
                href={validatorUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src="/icons/blueshift.svg"
                  alt="Blueshift Icon"
                  className="relative z-20 w-6 h-6"
                />
                <div>{shortenString(validatorVoteAccount, 8)}</div>
                <div className="group-hover/link:text-primary focus:outline-none h-4 w-4 text-tertiary/50 hover:text-primary transition">
                  <Icon name="External" />
                </div>
              </a>
            ) : (
              <div className="flex items-center gap-x-2.5">
                <div>{shortenString(validatorVoteAccount, 12)}</div>
              </div>
            )}
          </StatCard>
          <StatCard title="Total Staked" className="col-span-1 xl:col-span-2">
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
                label="SOL"
                icon={
                  <img
                    src="/icons/sol.svg"
                    alt="SOL Icon"
                    className="w-4 h-4"
                  />
                }
                className="flex-shrink-0 text-[rgb(153,69,255)]"
              />
            )}
          </StatCard>
          <StatCard title="Next Leader Slot" className="col-span-1 xl:col-span-2">
            {shouldShowNextLeaderLoading ? (
              <span className="animate-pulse text-tertiary">Loading…</span>
            ) : isValidatorError ? (
              <span className="text-tertiary">N/A</span>
            ) : (
              <div className="flex w-full items-center gap-x-3 gap-y-2">
                <span className="whitespace-nowrap leading-none">
                  {nextLeaderCountdownLabel}
                </span>
              </div>
            )}
          </StatCard>
          <StatCard title="APY" className="col-span-1 xl:col-span-2">
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
      <div className="p-5 xl:p-6 flex flex-col gap-y-4 border-border">
        <div className="relative z-20 font-medium text-tertiary leading-none">{title}</div>
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
