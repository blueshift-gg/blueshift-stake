'use client';

import classNames from "classnames";
import { anticipate, motion } from "motion/react";
import type { TransactionStatus } from "../types";

interface TransactionStatusNoticeProps {
  status: TransactionStatus;
}

export function TransactionStatusNotice({ status }: TransactionStatusNoticeProps) {
  if (!status.type) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: anticipate }}
      className={classNames(
        "w-full p-3 rounded-lg text-sm font-mono text-center",
        status.type === "success"
          ? "bg-green-500/20 text-green-400 border border-green-500/30"
          : "bg-red-500/20 text-red-400 border border-red-500/30"
      )}
    >
      <span className="inline-flex flex-col gap-y-1">
        <span>{status.message}</span>
        {status.link?.href ? (
          <a
            href={status.link.href}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-4"
          >
            {status.link.label ?? "View transaction"}
          </a>
        ) : null}
      </span>
    </motion.div>
  );
}
