import NetworkStats from "@/app/content/NetworkStats/NetworkStats";
import AppreciationBanner from "@/components/AppreciationBanner";
import Widgets from "@/components/Widgets";

export default function Home() {
  return (
    <div className="w-full relative flex flex-col gap-y-2">
      <div className="flex flex-col gap-y-16 2xl:gap-y-24 border-b border-border">
        <div className="flex flex-col">
          <NetworkStats />
          <div className="relative h-4 wrapper">
            <div className="absolute left-0 top-0 h-full w-px bg-border hidden xl:block"></div>
            <div className="absolute right-0 top-0 h-full w-px bg-border hidden xl:block"></div>
          </div>
          <div className="relative z-20">
            <AppreciationBanner />
          </div>
          <div className="relative h-4 wrapper">
            <div className="absolute left-0 top-0 h-full w-px bg-border hidden xl:block"></div>
            <div className="absolute right-0 top-0 h-full w-px bg-border hidden xl:block"></div>
          </div>
          <Widgets />
        </div>
      </div>
    </div>
  );
}
