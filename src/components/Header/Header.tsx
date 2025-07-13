"use client";

import classNames from "classnames";
import { AnimatePresence, anticipate, motion } from "motion/react";
import { useState, useRef, RefObject } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useOnClickOutside } from "usehooks-ts";
import { useRouter, usePathname, Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import WalletMultiButton from "@/components/Wallet/WalletMultiButton";

import Logo from "@/components/Logo/Logo";
import { useAuth } from "@/hooks/useAuth";
import Button from "@/components/Button/Button";
import LogoGlyph from "@/components/Logo/LogoGlyph";

export default function HeaderContent() {
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const pathname = usePathname();
  const t = useTranslations();
  const currentLocale = useLocale();
  const { locales } = routing;
  const router = useRouter();
  const languageDropdownRef = useRef<HTMLDivElement>(null);

  // Wallet and Auth Hook Logic
  const auth = useAuth();

  const handleLanguageChange = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
    setIsLanguageDropdownOpen(false);
  };

  useOnClickOutside(languageDropdownRef as RefObject<HTMLElement>, () =>
    setIsLanguageDropdownOpen(false)
  );

  return (
    <div className="wrapper !px-0">
      <div className="flex w-full items-center justify-between max-w-app mx-auto py-4 px-4 md:px-6">
        <div className="flex gap-x-16 items-center">
          <Link href="/" className="md:hidden flex">
            <LogoGlyph height={18} />
          </Link>
          <Link href="/" className="hidden md:flex">
            <Logo height={18} width={130} />
          </Link>
        </div>

        <div className="flex gap-x-2 md:gap-x-3 items-center">
          {/* Language Switcher */}
          <div className="relative" ref={languageDropdownRef}>
            <Button
              variant="tertiary"
              icon="Globe"
              className="!w-[42px] flex"
              onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
            />
            <AnimatePresence>
              {isLanguageDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.4, ease: anticipate }}
                  className="border border-border z-50 rounded-xl flex w-max flex-col gap-y-1 absolute top-[calc(100%+6px)] right-0 p-1 bg-background-card"
                >
                  {locales.map((locale) => (
                    <button
                      key={locale}
                      onClick={() => handleLanguageChange(locale)}
                      className={classNames(
                        "flex items-center relative gap-x-4 py-3 px-4 rounded-lg transition hover:bg-background-card-foreground",
                        locale === currentLocale &&
                          "bg-background-card-foreground"
                      )}
                    >
                      <span
                        className={classNames(
                          "text-sm font-medium leading-none",
                          locale === currentLocale
                            ? "text-primary"
                            : "text-secondary"
                        )}
                      >
                        {t(`locales_native_name.${locale}`)}
                      </span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Wallet Multi Button and Error Display */}
          <div className="relative">
            <WalletMultiButton
              status={auth.status}
              address={auth.publicKey?.toBase58()}
              onSignIn={auth.login}
              onSignOut={auth.logout}
              // disabled={walletButtonIsDisabled}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
