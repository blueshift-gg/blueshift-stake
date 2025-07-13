"use client";
import Badge from "@/components/Badge/Badge";
import Icon from "@/components/Icon/Icon";
import { shortenString } from "@/utils/utils";
import classNames from "classnames";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";

export default function NetworkStats() {
  const t = useTranslations();
  return (
    <motion.div className="w-full border-y border-border">
      <div className="wrapper !px-0">
        <div className="grid grid-cols-2 xl:grid-cols-4 xl:gap-x-6 divide-x divide-border xl:divide-x-0 xl:divide-y-0 relative">
          <div className="absolute h-px w-full bg-border z-10 top-1/2 -translate-y-1/2 xl:hidden"></div>
          <StatCard title={t("ui.validator")}>
            <div className="absolute w-full xl:w-[calc(100%+24px)] h-[calc(100%+1px)] left-0 -top-[1px] overflow-hidden pointer-events-none">
              <div className="absolute w-[1350px] h-[500px] mix-blend-color-dodge top-1/3 -translate-y-3/5 left-1/2 -translate-x-1/2">
                <img
                  src="/graphics/validator-eclipse.webp"
                  className="max-w-none"
                ></img>
              </div>
              <div className="w-full h-full mix-blend-plus-lighter [mask-image:linear-gradient(270deg,rgba(217,217,217,0)_-0.18%,rgba(115,115,115,0.2)_99.82%)]">
                <img
                  src="/graphics/validator-bg.webp"
                  alt="Validator BG"
                  className="object-cover w-full h-full"
                />
              </div>
            </div>
            <a
              className="flex items-center gap-x-2.5 group/link"
              href={process.env.NEXT_PUBLIC_VALIDATOR_URL}
            >
              <img
                src="/icons/blueshift.svg"
                alt="Blueshift Icon"
                className="w-6 h-6 relative z-20"
              ></img>
              <div>
                {shortenString(
                  "shft7Fry1js37Hm9wq4dfwcZSp2DyKszeWMvEpjYCQ1",
                  8
                )}
              </div>
              <div className="group-hover/link:text-primary focus:outline-none h-4 w-4 text-tertiary/50 hover:text-primary transition">
                <Icon name="ExternalLink" />
              </div>
            </a>
          </StatCard>
          <StatCard title={t("ui.total_stake")}>
            <span>27,576.51</span>
            <Badge
              color="rgb(153, 69, 255)"
              value="SOL"
              icon="/icons/sol.svg"
            />
          </StatCard>
          <StatCard title={t("ui.next_slot")}>
            <span>21 slots</span>
            <Badge
              className="hidden sm:flex"
              color="rgb(173, 185, 210)"
              value="353,941,471"
            />
          </StatCard>
          <StatCard title={t("ui.apy")}>
            <span>6.1%</span>
            <Badge color="rgb(0, 230, 107)" value="0.1%" />
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
  children: React.ReactNode;
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
