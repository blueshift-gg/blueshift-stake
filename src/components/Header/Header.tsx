"use client";

import { Link } from "@/i18n/navigation";
import WalletMultiButton from "@/components/Wallet/WalletMultiButton";

import Logo from "@/components/Logo/Logo";

import LogoGlyph from "@/components/Logo/LogoGlyph";

export default function HeaderContent() {

  return (
    <div className="wrapper !px-0">
      <div className="flex w-full items-center justify-between max-w-app mx-auto py-4 px-4 md:px-6">
        <div className="flex gap-x-12 items-center">
          <Link href="/" className="md:hidden flex">
            <LogoGlyph height={18} />
          </Link>
          <Link href="/" className="hidden md:flex">
            <Logo height={18} width={130} />
          </Link>
        <div className="items-center gap-x-8 hidden md:flex">
          <Link target="_blank" href="https://learn.blueshift.gg" className="font-mono text-sm text-shade-tertiary hover:text-shade-primary transition">Learn</Link>
          <Link target="_blank" href="https://blueshift.gg/labs" className="font-mono text-sm text-shade-tertiary hover:text-shade-primary transition">Labs</Link>
          <Link target="_blank" href="https://blueshift.gg/research" className="font-mono text-sm text-shade-tertiary hover:text-shade-primary transition">Research</Link>
        </div>
        </div>

        <div className="flex gap-x-2 md:gap-x-3 items-center">
          {/* Wallet Multi Button */}
          <div className="relative">
            <WalletMultiButton />
          </div>
        </div>
      </div>
    </div>
  );
}
