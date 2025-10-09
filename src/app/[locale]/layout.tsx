import { Funnel_Display } from "next/font/google";
import localFont from "next/font/local";
import "../globals.css";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import Header from "@/components/Header/Header";
import WalletProvider from "@/contexts/WalletProvider";
import Footer from "@/components/Footer/Footer";
import { TRPCProvider } from "@/components/Providers/TRPCProvider";

const FunnelDisplay = Funnel_Display({
  subsets: ["latin"],
  variable: "--font-funnel-display",
  display: "swap",
});

const MontechV2 = localFont({
  src: [
    {
      path: "../fonts/MontechV2-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../fonts/MontechV2-Medium.woff",
      weight: "500",
      style: "normal",
    },
  ],
  variable: "--font-montech",
  display: "swap",
});

interface RootLayoutProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({ params }: RootLayoutProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });

  return {
    metadataBase: new URL("https://stake.blueshift.gg"),
    title: t("title"),
    description: t("description"),
    keywords: t("keywords"),
    openGraph: {
      title: t("title"),
      type: "website",
      description: t("description"),
      url: `/${locale}`,
      siteName: t("title"),
      images: [
        {
          url: "https://stake.blueshift.gg/graphics/meta-image.png",
          width: 1200,
          height: 628,
        },
      ],
    },
  };
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
    <html lang={locale}>
      <NextIntlClientProvider>
        <WalletProvider>
          <TRPCProvider>
            <body
              className={`${FunnelDisplay.variable} ${MontechV2.variable} antialiased flex min-h-dvh flex-col`}
            >
              <Header />
              <main className="flex-1">
                {children}
              </main>
              <Footer />
            </body>
          </TRPCProvider>
        </WalletProvider>
      </NextIntlClientProvider>
    </html>
  );
}
