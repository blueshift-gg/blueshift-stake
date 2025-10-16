export type TransactionStatus = {
  type: "success" | "error" | null;
  message: string;
};

export type DeactivationStatus = {
  active: boolean;
  deactivating: boolean;
  withdrawing: boolean;
};

export type StakeTab = "stake" | "unstake" | "merge";
