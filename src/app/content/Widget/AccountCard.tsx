import { Badge, Button, Divider } from "@blueshift-gg/ui-components";
import { Fragment } from "react";

interface AccountCardProps {
    validator: {
        name: string;
        icon: string;
        color: string;
    },
    accounts: {
        status: string;
        amount: string;
    }[],
    totalStaked: string;
    onMigrate: () => void;
}

export default function AccountCard({ validator, accounts, totalStaked, onMigrate }: AccountCardProps) {
    return (
        <div className="bg-card-solid border border-border flex flex-col gap-y-6 pt-6 px-3 pb-3">
            <div className="flex flex-col gap-y-5 px-2">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-x-3" style={{ color: validator.color !== "" ? validator.color : "rgb(255,255,255)" }}>
                        <Badge crosshair={{variant: "bordered"}} icon={<img src={`/icons/validators/${validator.icon}`} alt={validator.name} className="w-7" />} className="px-2.5!" />
                        <span className="text-xl font-mono text-shade-primary">{validator.name}</span>
                    </div>
                    <span className="text-xl font-mono text-shade-primary">{totalStaked}</span>
                </div>
                <div className="flex items-center gap-x-1.5">
                    <Button size="md" label="Move all" onClick={onMigrate} />
                    <Button size="md" variant="secondary" label="Unstake all" />
                </div>
            </div>
            <div className="bg-background border border-border p-3 flex flex-col gap-y-2">
                {accounts.map((acc, i) => (
                    <Fragment key={i}>
                        <div className="flex items-center justify-between px-1.5 py-1.5">
                            <div className="flex items-center gap-x-3">
                                <span className="text-shade-tertiary font-medium font-mono text-xs">{acc.status}</span>
                                <span className="font-mono text-shade-primary text-base">{acc.amount}</span>
                            </div>
                            <div className="flex items-center gap-x-1.5">
                                <Button size="sm" label="Move" onClick={onMigrate} />
                                <Button size="sm" label="Unstake" variant="secondary" />
                            </div>
                        </div>
                        {i < accounts.length - 1 && <Divider />}
                    </Fragment>
                ))}
            </div>
        </div>
    );
}