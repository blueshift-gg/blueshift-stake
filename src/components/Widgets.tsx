import AccountTools from "@/app/content/Widget/AccountTools";
import StakeWidget from "@/app/content/Widget/StakeWidget";
import { useTranslations } from "next-intl";

export default function Widgets() {
  const t = useTranslations("ui");
  return (
    <div className="flex flex-col relative border-t border-border w-full wrapper">
      <div className="absolute left-0 top-0 h-full w-px bg-border hidden xl:block"></div>
      <div className="absolute right-0 top-0 h-full w-px bg-border hidden xl:block"></div>
      <div className="hidden xl:grid xl:grid-cols-9 w-full bg-card-solid border-b border-border">
        <div className="col-span-5 w-full px-5 xl:px-6 py-3">
          <span className="font-mono text-sm text-shade-tertiary">{t("stake_manage")}</span>
        </div>
        <div className="col-span-4 w-full px-5 xl:px-6 py-3 border-l border-border">
          <span className="font-mono text-sm text-shade-tertiary">{t("account_tools")}</span>
        </div>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-9 w-full">
        <div className="col-span-1 w-full px-5 xl:px-6 py-3 bg-card-solid border-b border-border xl:hidden">
          <span className="font-mono text-sm text-shade-tertiary">{t("stake_manage")}</span>
        </div>
        <StakeWidget />
        <div className="col-span-1 w-full px-5 xl:px-6 py-3 bg-card-solid border-y border-border xl:hidden">
          <span className="font-mono text-sm text-shade-tertiary">{t("account_tools")}</span>
        </div>
        <AccountTools/>
      </div>
    </div>
  );
}