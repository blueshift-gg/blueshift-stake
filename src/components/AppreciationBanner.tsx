import { useTranslations } from "next-intl";

export default function AppreciationBanner() {
  const t = useTranslations("ui");
  return (
    <div className="w-screen left-0 top-0 border-y border-brand-primary/15 bg-brand-primary/8 backdrop-blur">
     <div className="wrapper w-full">
        <p className="text-brand-primary text-sm leading-[150%] lg:leading-none px-5 xl:px-6 py-4 font-medium">{t("thanks_for_staking")}</p>
     </div>
    </div>
  );
}