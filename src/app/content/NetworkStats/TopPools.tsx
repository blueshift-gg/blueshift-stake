"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

import { rgbToRgba, shortenString } from "@/utils/utils";
import CrosshairCorners from "@/components/Crosshair/CrosshairCorners";
import Icon from "@/components/Icon/Icon";
import DecryptedText from "@/components/HeadingReveal/DecryptText";
import { useState } from "react";
import { anticipate, motion } from "motion/react";
import { trpc } from "@/utils/trpc";

export default function TopPools() {
  const t = useTranslations();
  return (
    <div className="wrapper overflow-hidden pb-4 border-b border-b-border">
      <div className="grid grid-cols-1 xl:grid-cols-7 xl:pl-6 gap-x-8 items-center gap-y-4 relative">
        <div className="font-medium text-primary">{t("ui.top_pools")}</div>
        <PoolCarousel />
      </div>
    </div>
  );
}

type PoolType = {
  stakingAuthority: string | null;
  amountStaked: number;
  name?: string;
  icon?: string | null;
  color: string;
}


const PoolCarousel = () => {
  const [hoveredPool, setHoveredPool] = useState<string | null>(null);

  const { data: allPools } = trpc.stake.pools.useQuery();

  // Need a way to map icons and colours up when API is hooked up
  const knownPools: PoolType[] = [
    {
      name: "Solana Foundation",
      icon: "/icons/solana-foundation.svg",
      amountStaked: 0,
      color: "rgb(153, 69, 255)",
      stakingAuthority: "mpa4abUkjQoAvPzREkh5Mo75hZhPFQ2FSH6w7dWKuQ5",
    },
    {
      name: "AeroSOL",
      icon: "/icons/aerosol.svg",
      amountStaked: 0,
      color: "rgb(136, 153, 255)",
      stakingAuthority: "AKJt3m2xJ6ANda9adBGqb5BMrheKJSwxyCfYkLuZNmjn",
    },
    {
      name: "Jito",
      icon: "/icons/jito.svg",
      amountStaked: 0,
      color: "rgb(255, 255, 255)",
      stakingAuthority: "6iQKfEyhr3bZMotVkW6beNZz5CPAkiwvgV2CTje9pVSS",
    },
    {
      name: "BlazeStake",
      icon: "/icons/blazestake.svg",
      amountStaked: 0,
      color: "rgb(0, 255, 163)",
      stakingAuthority: "6WecYymEARvjG5ZyqkrVQ6YkhPfujNzWpSPwNKXHCbV2",
    },
    {
      name: "JPool",
      icon: "/icons/jpool.svg",
      amountStaked: 0,
      color: "rgb(0, 255, 163)",
      stakingAuthority: "CtMyWsrUtAwXWiGr9WjHT5fC3p3fgV8cyGpLTo2LJzG1",
    },
    {
      name: "The Vault",
      icon: "/icons/thevault.svg",
      amountStaked: 0,
      color: "rgb(0, 255, 163)",
      stakingAuthority: "Fu9BYC6tWBo1KMKaP3CFoKfRhqv9akmy3DuYwnCyWiyC",
    },
    {
      name: "Double Zero",
      icon: "/icons/doublezero.svg",
      amountStaked: 0,
      color: "rgb(0, 255, 163)",
      stakingAuthority: "3fV1sdGeXaNEZj6EPDTpub82pYxcRXwt2oie6jkSzeWi"
    },
    {
      name: "Others",
      icon: null,
      amountStaked: 0,
      color: "rgb(255, 255, 255)",
      stakingAuthority: null
    }
  ];

  const allPoolsStakingAuthorities = allPools?.map((pool) => pool.stakingAuthority) ?? []
  const knownPoolStakingAuthorities = knownPools.map((pool) => pool.stakingAuthority)

  let updatedPools: PoolType[];

  updatedPools = knownPools.map((pool) => {
    if (pool.stakingAuthority && allPoolsStakingAuthorities.includes(pool.stakingAuthority)) {
      return  {
        ...pool,
        amountStaked: pool.amountStaked + (allPools?.filter((newPool) => newPool.stakingAuthority === pool.stakingAuthority)[0].amountStaked ?? 0),
      }
    } else {
      return {
        ...pool
      }
    }
  })

  const othersPool = updatedPools.find((pool) => pool.name === "Others");

  allPools?.forEach((pool) => {
    if (!knownPoolStakingAuthorities.includes(pool.stakingAuthority) && othersPool) {
      othersPool.amountStaked += pool.amountStaked;
    }
  });

  updatedPools = [
    ...updatedPools
      .filter((pool) => pool.name !== "Others")
      .sort((a, b) => b.amountStaked - a.amountStaked),
    ...updatedPools.filter((pool) => pool.name === "Others"),
  ];

  const duplicatedPools = [...updatedPools, ...updatedPools]

  return (
    <div className="col-span-1 xl:col-span-6 [mask-image:linear-gradient(to_right,transparent_0%,black_10%,black_90%,transparent)]">
      <div className="flex items-stretch gap-x-2 w-full animate-infinite-scroll">
        {duplicatedPools.map((pool, index) => {
          if (pool.amountStaked <= 10) return null;

          const hasStakingAuthority = Boolean(pool.stakingAuthority);
          const pointerClass = hasStakingAuthority ? "cursor-pointer" : "cursor-default";
          const iconOpacityClass = pool.icon ? "opacity-100" : "opacity-0";
          const cardHref = hasStakingAuthority
            ? `https://solscan.io/account/${pool.stakingAuthority}`
            : undefined;
          const handleMouseEnter = hasStakingAuthority
            ? () => setHoveredPool(pool.stakingAuthority)
            : undefined;
          const handleMouseLeave = hasStakingAuthority ? () => setHoveredPool(null) : undefined;

          return (
            <motion.a
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{
                opacity: [0, 1, 0.2, 1, 0.4, 1, 0.6, 1, 0.8, 1],
              }}
              transition={{
                duration: 1.5,
                delay: index * 0.15,
                ease: anticipate,
              }}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              key={`${pool.name}-${index}`}
              href={cardHref}
              target={hasStakingAuthority ? "_blank" : undefined}
              rel={hasStakingAuthority ? "noreferrer" : undefined}
              className={`relative group/pool w-[400px] bg-background hover:bg-background-card/50 border border-border p-3 flex items-start justify-between gap-x-3 flex-shrink-0 ${pointerClass}`}
            >
              <CrosshairCorners
                className="!opacity-0 group-hover/pool:!opacity-100 transition-opacity duration-300"
                size={6}
                strokeWidth={1.5}
                corners={["bottom-right"]}
              />
              <div className="flex items-center gap-x-2.5">
                <div
                  className={`relative flex items-center justify-center w-12 h-12 shrink-0 transition-opacity duration-200 ${iconOpacityClass}`}
                  style={{
                    border: `1px solid ${rgbToRgba(pool.color, 0.15)}`,
                    boxShadow: `inset 0px 0px 6px ${rgbToRgba(pool.color, 0.2)}`,
                    background: `linear-gradient(180deg, rgba(17, 20, 26, 0.5), rgba(17, 20, 26, 0.5)), ${rgbToRgba(pool.color, 0.04)}`,
                    color: pool.color,
                  }}
                >
                  <CrosshairCorners
                    className="text-current"
                    size={4}
                    strokeWidth={1}
                  />
                  { pool.icon ? (
                    <Image
                      src={pool.icon}
                      alt={pool.name ?? "Pool icon"}
                      width={32}
                      height={32}
                      className="object-contain"
                    />
                  ) : null }
                </div>
                <div className="flex flex-col gap-y-1">
                  <span className="font-medium text-primary">{pool.name}</span>
                  <span className="font-mono text-sm text-tertiary flex items-center gap-x-1.5 h-6">
                    { pool.stakingAuthority ? (
                      <>
                        <DecryptedText
                          isHovering={hoveredPool === pool.stakingAuthority}
                          text={shortenString(pool.stakingAuthority, 10)}
                        />
                        <Icon name="ExternalLink" />
                      </>
                    ) : null }
                  </span>
                </div>
              </div>
              <span className="font-mono text-primary text-lg self-center">
              { new Intl.NumberFormat("en-US", {
                maximumFractionDigits: 2
              }).format(pool.amountStaked) } SOL
            </span>
          </motion.a>
          );
        })}
      </div>
    </div>
  );
};