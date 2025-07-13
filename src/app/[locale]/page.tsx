export const runtime = "edge";
import NetworkStats from "@/app/content/NetworkStats/NetworkStats";
import TopPools from "../content/NetworkStats/TopPools";
import StakeWidget from "../content/Widget/StakeWidget";

export default function Home() {
  return (
    <div className="w-full relative flex flex-col gap-y-6 pb-24">
      <div className="wrapper relative z-10">
        <div className="absolute left-0 -top-[74px] w-px h-[calc(100dvh+74px)] bg-border"></div>
        <div className="absolute right-0 -top-[74px] w-px h-[calc(100dvh+74px)] bg-border"></div>
      </div>
      <div className="flex flex-col gap-y-16 2xl:gap-y-24">
        <div className="flex flex-col gap-y-4">
          <NetworkStats />
          <TopPools />
        </div>
        <StakeWidget />
      </div>
    </div>
  );
}
