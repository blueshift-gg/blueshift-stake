"use client";

import { useTranslations } from "next-intl";

import { rgbToRgba, shortenString } from "@/utils/utils";
import CrosshairCorners from "@/components/Crosshair/CrosshairCorners";
import Icon from "@/components/Icon/Icon";
import DecryptedText from "@/components/HeadingReveal/DecryptText";
import { useState } from "react";
import { anticipate, motion } from "motion/react";

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

const PoolCarousel = () => {
  const [hoveredPool, setHoveredPool] = useState<string | null>(null);
  // Need a way to map icons and colours up when API is hooked up
  const pools = [
    {
      name: "Solana Foundation",
      icon: "/icons/solana-foundation.svg",
      amountStaked: 24575.22,
      color: "rgb(153, 69, 255)",
      address: "mpa4abUkjQoAvPzREkh5Mo75hZhPFQ2FSH6w7dWKuQ5",
    },
    {
      name: "AeroSOL",
      icon: "/icons/aerosol.svg",
      amountStaked: 14575.22,
      color: "rgb(136, 153, 255)",
      address: "AKJt3m2xJ6ANda9adBGqb5BMrheKJSwxyCfYkLuZNmjn",
    },
    {
      name: "Jito",
      icon: "/icons/jito.svg",
      amountStaked: 408.22,
      color: "rgb(255, 255, 255)",
      address: "6iQKfEyhr3bZMotVkW6beNZz5CPAkiwvgV2CTje9pVSS",
    },
    {
      name: "BlazeStake",
      icon: "/icons/blazestake.svg",
      amountStaked: 105.27,
      color: "rgb(0, 255, 163)",
      address: "6WecYymEARvjG5ZyqkrVQ6YkhPfujNzWpSPwNKXHCbV2",
    },
  ];

  const duplicatedPools = [...pools, ...pools];

  return (
    <div className="col-span-1 xl:col-span-6 [mask-image:linear-gradient(to_right,transparent_0%,black_10%,black_90%,transparent)]">
      <div className="flex items-center gap-x-2 w-full animate-infinite-scroll">
        {duplicatedPools.map((pool, index) => (
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
            onMouseEnter={() => setHoveredPool(pool.address)}
            onMouseLeave={() => setHoveredPool(null)}
            key={`${pool.name}-${index}`}
            href={`https://solscan.io/account/${pool.address}`}
            target="_blank"
            className="cursor-pointer relative group/pool w-[400px] bg-background hover:bg-background-card/50 border border-border pr-4 py-2 pl-2 flex items-start justify-between flex-shrink-0"
          >
            <CrosshairCorners
              className="!opacity-0 group-hover/pool:!opacity-100 transition-opacity duration-300"
              size={6}
              strokeWidth={1.5}
              corners={["bottom-right"]}
            />
            <div className="flex items-center gap-x-2.5">
              <div
                className="p-2 relative flex items-center justify-center"
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
                <img src={pool.icon} alt={pool.name} className="w-8" />
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-primary">{pool.name}</span>
                <span className="font-mono text-sm text-tertiary flex items-center gap-x-1.5">
                  <DecryptedText
                    isHovering={hoveredPool === pool.address}
                    text={shortenString(pool.address, 10)}
                  />
                  <Icon name="ExternalLink" />
                </span>
              </div>
            </div>
            <span className="font-mono text-primary text-lg">
              {pool.amountStaked} SOL
            </span>
          </motion.a>
        ))}
      </div>
    </div>
  );
};