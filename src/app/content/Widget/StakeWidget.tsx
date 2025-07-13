"use client";
import CrosshairCorners from "@/components/Crosshair/CrosshairCorners";
import classNames from "classnames";
import { anticipate, motion } from "motion/react";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Button from "@/components/Button/Button";
import Icon from "@/components/Icon/Icon";
import Badge from "@/components/Badge/Badge";

export default function StakeWidget() {
  const [selectedTab, setSelectedTab] = useState<"stake" | "unstake">("stake");
  const [amount, setAmount] = useState<string>("");
  const t = useTranslations();

  const solPrice = 165.44;

  // Fake Loader for now
  const [isLoading, setIsLoading] = useState<boolean>(true);
  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false);
    }, 3000);
  }, []);

  return (
    <div className="wrapper flex items-center justify-center w-full">
      <div className="w-[550px] rounded-2xl flex flex-col overflow-hidden border border-border">
        <div className="rounded-t-[15px] flex items-center">
          <button
            onClick={() => setSelectedTab("stake")}
            className={classNames(
              "cursor-pointer hover:bg-background-card/50 transition px-6 py-3 relative font-mono text-tertiary",
              selectedTab === "stake" && "!text-brand-primary"
            )}
          >
            {selectedTab === "stake" && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.15, 0, 0.1, 0, 0.06] }}
                  transition={{ duration: 0.5, ease: anticipate }}
                  className="absolute inset-0 bg-brand-primary"
                />
                <CrosshairCorners
                  size={6}
                  strokeWidth={1.5}
                  className="text-brand-primary"
                  corners={["bottom-right"]}
                />
              </>
            )}
            <span>{t("ui.stake")}</span>
          </button>
          <button
            onClick={() => setSelectedTab("unstake")}
            className={classNames(
              "cursor-pointer hover:bg-background-card/50 transition px-6 py-3 relative font-mono text-tertiary",
              selectedTab === "unstake" && "!text-brand-primary"
            )}
          >
            {selectedTab === "unstake" && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.15, 0, 0.1, 0, 0.06] }}
                  transition={{ duration: 0.5, ease: anticipate }}
                  className="absolute inset-0 bg-brand-primary"
                />
                <CrosshairCorners
                  size={6}
                  strokeWidth={1.5}
                  className="text-brand-primary"
                  corners={["bottom-right"]}
                />
              </>
            )}
            <span>{t("ui.unstake")}</span>
          </button>
        </div>
        <div className="px-4 py-6 md:px-6 md:py-8 bg-background-card/50 shadow-[inset_0px_0px_12px_rgba(26,30,38,0.2)] flex flex-col gap-y-9">
          <div className="flex flex-col gap-y-5">
            <div className="rounded-xl p-1 border border-border w-full gap-x-1 flex items-center">
              <button className="w-full py-1.5 bg-background-card-foreground rounded-lg">
                <span className="text-sm font-mono leading-[100%] text-primary">
                  {t("ui.native")}
                </span>
              </button>
              <button className="w-full py-1.5 rounded-lg">
                <span className="text-sm font-mono leading-[100%] text-mute">
                  {t("ui.liquid")}
                </span>
              </button>
            </div>
            <div className="flex flex-col gap-y-1">
              <div className="w-full flex items-center justify-between px-1.5">
                <span className="font-medium">{t("ui.amount")}</span>
                <div className="flex items-center gap-x-1.5 text-tertiary">
                  <Icon name="WalletSmall" />
                  <span className="text-sm font-mono">24.3 SOL</span>
                </div>
              </div>
              <div className="gap-x-4 relative bg-background rounded-xl border border-border pr-3 py-1.5 pl-1.5 flex items-center justify-between">
                <div className="flex-shrink-0 flex font-mono items-center text-[#9945ff] gap-x-1.5 px-2 py-1.5 bg-background-card/50 border border-[#AD6AFF]/20 shadow-[inset_0px_0px_9px_rgba(154,70,255,0.2)] rounded-md text-xl">
                  <img
                    src="/icons/sol.svg"
                    alt="Solana Icon"
                    className="w-6 h-6"
                  ></img>
                  <span className="leading-[100%]">SOL</span>
                </div>
                <input
                  className="disabled:opacity-40 focus:outline-none bg-transparent w-full text-2xl placeholder:text-mute font-mono leading-[100%] text-right"
                  placeholder="0.00"
                  disabled={isLoading}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                ></input>
                <Button
                  size="xs"
                  label={t("ui.max")}
                  disabled={isLoading}
                ></Button>
              </div>
              <div className="h-[24px] w-full">
                {amount && (parseFloat(amount) || 0) > 0 && (
                  <motion.div
                    className="w-full flex"
                    initial={{ opacity: 0 }}
                    animate={{
                      opacity: [0, 1, 0.2, 1, 0.4, 1, 0.6, 1, 0.8, 1],
                    }}
                    transition={{ duration: 0.5, ease: anticipate }}
                  >
                    <Badge
                      color="rgb(173,185,210)"
                      className="font-mono ml-auto"
                      value={`~$${((parseFloat(amount) || 0) * solPrice).toFixed(2)} USD`}
                    ></Badge>
                  </motion.div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-y-5 items-center justify-center">
            <Button
              icon="Wallet"
              className="w-full relative"
              label="Connect Wallet"
              disabled={isLoading}
              isLoading={isLoading}
            />
            <span className="font-medium text-xs mx-auto w-2/3 sm:w-1/2 text-center text-pretty leading-[140%]">
              <span className="text-secondary">{t("ui.disclaimer")}</span>
              <span className="text-brand-secondary"> {t("ui.terms")}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
