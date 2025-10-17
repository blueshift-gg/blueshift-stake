export type TransactionStatus = {
  type: "success" | "error" | null;
  message: string;
  link?: {
    href: string;
    label?: string;
  };
};

export type DeactivationStatus = {
  active: boolean;
  deactivating: boolean;
  withdrawing: boolean;
};

export type StakeTab = "stake" | "unstake" | "merge";
