"use client";

import classNames from "classnames";
import { motion } from "motion/react";

export default function CrosshairCorners({
  size = 10,
  spacingX = 0,
  baseDelay = 0,
  spacingY = 0,
  spacingTop = 0,
  spacingBottom = 0,
  className = "",
  moveDistance = 5,
  strokeWidth = 2,
  style,
  corners = ["top-left", "top-right", "bottom-left", "bottom-right"],
}: {
  size?: number;
  spacingX?: number;
  spacingY?: number;
  spacingTop?: number;
  spacingBottom?: number;
  baseDelay?: number;
  style?: React.CSSProperties;
  corners?: ("top-left" | "top-right" | "bottom-left" | "bottom-right")[];
  className?: string;
  moveDistance?: number;
  strokeWidth?: number;
}) {
  return (
    <motion.div
      className={classNames(
        "absolute w-full h-full inset-0 will-change-opacity",
        className
      )}
      initial={{ opacity: 0, scale: 0.99 }}
      animate={{
        opacity: [0, 1, 0.2, 1, 0.4, 1, 0.6, 1, 0.8, 1],
        scale: [0.99, 1, 0.99, 1, 1, 1],
      }}
      transition={{
        duration: 2.15,
        ease: "anticipate",
        delay: baseDelay,
      }}
      style={
        {
          ...style,
          "--size": size + "px",
          "--spacing-x": spacingX + "px",
          "--spacing-y": spacingY + "px",
          "--spacing-top": spacingTop + "px",
          "--spacing-bottom": spacingBottom + "px",
          "--move": moveDistance + "px",
          "--stroke-width": strokeWidth + "px",
        } as any
      }
    >
      {/* Top Left */}
      <div
        className={classNames(
          "absolute left-0 top-0 before:content-[''] before:absolute before:h-[var(--size)] before:w-[var(--stroke-width)] before:bg-current after:content-[''] after:absolute after:h-[var(--stroke-width)] after:w-[var(--size)] after:bg-current transition-transform duration-300 group-hover/testimonial:translate-x-[calc(var(--move)*-1)] group-hover/testimonial:translate-y-[calc(var(--move)*-1)]",
          !corners.includes("top-left") && "hidden"
        )}
        style={{
          left: `calc(var(--spacing-x) * -1)`,
          top: `calc(var(--spacing-top) * -1)`,
        }}
      ></div>

      {/* Top Right */}
      <div
        className={classNames(
          "absolute right-0 top-0 before:content-[''] before:absolute before:h-[var(--size)] before:w-[var(--stroke-width)] before:bg-current before:right-0 after:content-[''] after:absolute after:h-[var(--stroke-width)] after:w-[var(--size)] after:bg-current after:right-0 transition-transform duration-300 group-hover/testimonial:translate-x-[var(--move)] group-hover/testimonial:translate-y-[calc(var(--move)*-1)]",
          !corners.includes("top-right") && "hidden"
        )}
        style={{
          right: `calc(var(--spacing-x) * -1)`,
          top: `calc(var(--spacing-top) * -1)`,
        }}
      ></div>

      {/* Bottom Left */}
      <div
        className={classNames(
          "absolute left-0 bottom-0 before:content-[''] before:absolute before:h-[var(--size)] before:w-[var(--stroke-width)] before:bg-current before:bottom-0 after:content-[''] after:absolute after:h-[var(--stroke-width)] after:w-[var(--size)] after:bg-current after:bottom-0 transition-transform duration-300 group-hover/testimonial:translate-x-[calc(var(--move)*-1)] group-hover/testimonial:translate-y-[var(--move)]",
          !corners.includes("bottom-left") && "hidden"
        )}
        style={{
          left: `calc(var(--spacing-x) * -1)`,
          bottom: `calc(var(--spacing-bottom) * -1)`,
        }}
      ></div>

      {/* Bottom Right */}
      <div
        className={classNames(
          "absolute right-0 bottom-0 before:content-[''] before:absolute before:h-[var(--size)] before:w-[var(--stroke-width)] before:bg-current before:right-0 before:bottom-0 after:content-[''] after:absolute after:h-[var(--stroke-width)] after:w-[var(--size)] after:bg-current after:right-0 after:bottom-0 transition-transform duration-300 group-hover/testimonial:translate-x-[var(--move)] group-hover/testimonial:translate-y-[var(--move)]",
          !corners.includes("bottom-right") && "hidden"
        )}
        style={{
          right: `calc(var(--spacing-x) * -1)`,
          bottom: `calc(var(--spacing-bottom) * -1)`,
        }}
      ></div>
    </motion.div>
  );
}
