import classNames from "classnames";
import CrosshairCorners from "../Crosshair/CrosshairCorners";
import { rgbToRgba } from "@/utils/utils";

export default function Badge({
  color,
  icon,
  value,
  className,
}: {
  color: string;
  icon?: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      className={classNames(
        "w-max relative px-1.5 py-1 gap-x-1 border backdrop-blur bg-background-card/50 flex items-center",
        className
      )}
      style={{
        boxShadow: `inset 0px 0px 6px ${rgbToRgba(color, 0.2)}`,
        border: `1px solid ${rgbToRgba(color, 0.15)}`,
        color: color,
      }}
    >
      <CrosshairCorners
        size={4}
        strokeWidth={1}
        corners={["top-left", "bottom-right"]}
      />
      {icon && (
        <img src={icon} alt="Badge icon" className="object-contain w-4 h-4" />
      )}
      <span className="text-current text-sm leading-[100%]">{value}</span>
    </div>
  );
}
