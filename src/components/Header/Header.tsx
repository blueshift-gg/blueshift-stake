"use client";

import { useTranslations, useLocale } from "next-intl";
import { useRouter, usePathname, Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import WalletMultiButton from "@/components/Wallet/WalletMultiButton";

import Logo from "@/components/Logo/Logo";
import { Dropdown } from "@blueshift-gg/ui-components";
import LogoGlyph from "@/components/Logo/LogoGlyph";

export default function HeaderContent() {
  const pathname = usePathname();
  const t = useTranslations();
  const currentLocale = useLocale();
  const { locales } = routing;
  const router = useRouter();

  const handleLanguageChange = (newLocale: string | string[] | undefined) => {
    const locale = Array.isArray(newLocale) ? newLocale[0] : newLocale;
    if (locale) {
      router.replace(pathname, { locale });
    }
  };

  const languageItems = locales.map((locale) => ({
    label: t(`locales_native_name.${locale}`),
    value: locale,
  }));

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
          <Dropdown
            items={languageItems}
            selectedItem={currentLocale}
            handleChange={handleLanguageChange}
            label=""
            menuIcon={{ name: "Globe" }}
            buttonClassName="!w-[42px] !py-3 flex !justify-center"
            menuClassName="right-0"
            animationOrigin="top-right"
            size="sm"
            showSelectedItem={false}
            showClear={false}
          />

          {/* Wallet Multi Button */}
          <div className="relative">
            <WalletMultiButton />
          </div>
        </div>
      </div>
    </div>
  );
}
