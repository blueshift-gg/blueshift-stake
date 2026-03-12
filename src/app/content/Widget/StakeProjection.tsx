import { anticipate, CrosshairCorners, Dropdown } from "@blueshift-gg/ui-components";
import { useMemo, useState } from "react";
import dayjs from "dayjs";
import { trpc } from "@/utils/trpc";
import { formatCurrency, formatPercent } from "@/utils/format";
import WalletMultiButton from "@/components/Wallet/WalletMultiButton";
import { motion } from "motion/react";

const DURATION_OPTIONS = [
    { label: "6 months", value: "6_months", months: 6 },
    { label: "12 months", value: "12_months", months: 12 },
    { label: "3 years", value: "3_years", months: 36 },
    { label: "5 years", value: "5_years", months: 60 },
] as const;

const BAR_COUNT = 12;

function getBarLabel(barIndex: number, totalMonths: number): string {
    const monthsAtBar = Math.round((totalMonths / BAR_COUNT) * (barIndex + 1));
    if (monthsAtBar < 12) {
        return `${monthsAtBar}mo`;
    }
    const years = monthsAtBar / 12;
    if (Number.isInteger(years)) {
        return `${years}yr`;
    }
    return `${years.toFixed(1)}yr`;
}

export default function StakeProjection() {
    const [amount, setAmount] = useState("10000");
    const [duration, setDuration] = useState<string>("12_months");
    const [hoveredBar, setHoveredBar] = useState<number | null>(null);

    const { data: validatorStatsData } = trpc.validator.stats.useQuery(undefined, {
        refetchOnWindowFocus: false,
    });

    const apy = validatorStatsData?.apy ?? 0;

    const selectedDuration = useMemo(() =>
        DURATION_OPTIONS.find(opt => opt.value === duration) ?? DURATION_OPTIONS[2],
        [duration]
    );

    const projection = useMemo(() => {
        const principal = parseFloat(amount) || 0;
        if (principal <= 0) return { endDate: "", estimatedReward: 0 };

        const months = selectedDuration.months;
        const endDate = dayjs().add(months, 'month').format('MMM D, YYYY');

        const years = months / 12;
        const apyDecimal = apy / 100;
        const estimatedReward = principal * apyDecimal * years;

        return { endDate, estimatedReward };
    }, [amount, selectedDuration, apy]);

    const displayedReward = useMemo(() => {
        const principal = parseFloat(amount) || 0;
        if (principal <= 0) return 0;

        if (hoveredBar === null) return projection.estimatedReward;

        const monthsAtBar = (selectedDuration.months / BAR_COUNT) * (hoveredBar + 1);
        const years = monthsAtBar / 12;
        const apyDecimal = apy / 100;
        return principal * apyDecimal * years;
    }, [hoveredBar, projection.estimatedReward, selectedDuration.months, amount, apy]);

    const barHeights = useMemo(() => {
        return Array.from({ length: BAR_COUNT }, (_, i) => {
            const progress = (i + 1) / BAR_COUNT;
            return progress * 100;
        });
    }, []);

    return (
        <div className="bg-card-solid border border-border py-6 flex flex-col gap-y-6">
            <div className="relative px-8 py-3 bg-background/50">
                <CrosshairCorners variant="bordered" animationDelay={0} size={6} />
                <div className="flex flex-col xs:flex-row justify-center items-center gap-x-3 gap-2 text-shade-primary font-medium">
                    <span>I want to stake</span>
                    <div className="flex items-center gap-x-3">
                        <div className="overflow-hidden max-w-[125px] px-2 py-1.5 flex items-center gap-x-2 bg-background relative gradient-border text-brand-primary before:bg-accent-1/25 shadow-[inset_0px_0px_8px_rgba(0,255,255,0.25)]">
                            <span className="text-lg font-mono">$</span>
                            <input className="w-full bg-transparent text-lg font-mono outline-none placeholder:text-brand-primary/50" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
                        </div>
                        <span>for</span>
                        <Dropdown
                            items={DURATION_OPTIONS.map(opt => ({
                                label: opt.label,
                                value: opt.value
                            }))}
                            selectedItem={duration}
                            handleChange={(value) => {
                                if (typeof value === 'string') {
                                    setDuration(value);
                                }
                            }}
                            label="Select a duration"
                            showClear={false}
                            buttonClassName="min-w-[125px]!"
                        />
                    </div>
                </div>
            </div>

            <div className="px-4 flex flex-col gap-y-1.5">
                <div className="p-1 flex flex-col gap-y-1 bg-background">
                    <div className="relative">
                        <div className="px-4.5 xs:px-5 py-4.5 xs:py-6 flex flex-col gap-y-1.5">
                            <span className="text-sm font-mono text-tertiary leading-[150%]">Your Earnings</span>
                            <span className="text-xl font-mono text-shade-primary leading-[120%]">{formatCurrency(displayedReward)}</span>
                        </div>
                        <div
                            className="absolute right-0 bottom-0 h-[calc(100%-16px)] w-full max-w-1/2 flex items-end gap-x-px"
                            onMouseLeave={() => setHoveredBar(null)}
                        >
                            {barHeights.map((height, i) => (
                                <div
                                    key={i}
                                    className="relative flex-1 flex flex-col-reverse items-center h-full"
                                    onMouseEnter={() => setHoveredBar(i)}
                                >
                                    <motion.div
                                        className="relative w-full bg-brand-primary/25 border-t border-t-brand-primary shadow-[inset_0px_4px_4px_rgba(0,255,255,0.12)] cursor-pointer transition-opacity duration-150"
                                        style={{
                                            opacity: hoveredBar === null ? 1 : hoveredBar === i ? 1 : 0.4,
                                        }}
                                        initial={{ height: 0 }}
                                        animate={{ height: `${height}%` }}
                                        transition={{
                                            duration: 0.3,
                                            delay: i * 0.04,
                                            ease: anticipate,
                                        }}
                                    >
                                        {hoveredBar === i && (
                                            <motion.span
                                                className="absolute -top-5 -translate-x-full text-[10px] font-mono text-brand-tertiary whitespace-nowrap"
                                                initial={{ opacity: 0, y: 4 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.15 }}
                                            >
                                                {getBarLabel(i, selectedDuration.months)}
                                            </motion.span>
                                        )}
                                    </motion.div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-x-1">
                        <div className="bg-card-foreground p-4.5 xs:p-5 flex flex-col gap-y-1.5">
                            <span className="text-sm font-mono text-tertiary leading-[150%]">New Solana Devs</span>
                            <span className="text-xl font-mono text-shade-primary leading-[120%]">~{(displayedReward / 50).toFixed(0)}</span>
                        </div>
                        <div className="bg-card-foreground p-4.5 xs:p-5 flex flex-col gap-y-1.5">
                            <span className="text-sm font-mono text-tertiary leading-[150%]">Hours of Content</span>
                            <span className="text-xl font-mono text-shade-primary leading-[120%]">~{(displayedReward / 100).toFixed(0)}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between py-2 px-1.5">
                    <span className="text-xs leading-[150%] text-mute font-mono">Estimated Projection</span>
                    <span className="text-xs leading-[150%] text-tertiary font-mono">{formatPercent(apy)} APY</span>
                </div>
            </div>

            <div className="w-full px-4">
                <WalletMultiButton
                    size="lg"
                    className="w-full"
                />
            </div>
        </div>
    );
}