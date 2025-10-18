export type TransactionStatus = {
  type: "success" | "error" | null;
  message: string;
  link?: {
    href: string;
    label?: string;
  };
};

export type StakeTab = "stake" | "unstake" | "merge";
