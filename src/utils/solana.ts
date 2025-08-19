import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

// Constants
export const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_RPC_ENDPOINT!;
export const VALIDATOR_VOTE_ACCOUNT = new PublicKey(process.env.NEXT_PUBLIC_VALIDATOR_VOTE_ACCOUNT!);

// Create connection instance
export const connection = new Connection(SOLANA_RPC_ENDPOINT, {
  commitment: 'confirmed',
  httpAgent: false
});

// Utility functions
export const lamportsToSol = (lamports: number): number => {
  return lamports / LAMPORTS_PER_SOL;
};

export const solToLamports = (sol: number): number => {
  return Math.floor(sol * LAMPORTS_PER_SOL);
};

export const formatSol = (sol: number, decimals: number = 4): string => {
  return sol.toFixed(decimals);
};

export const formatLamports = (lamports: number, decimals: number = 4): string => {
  return formatSol(lamportsToSol(lamports), decimals);
};

// Validate SOL amount input
export const isValidSolAmount = (amount: string): boolean => {
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0 && num <= 1000000; // Max reasonable amount
};

// Get minimum stake amount (0.001 SOL for rent exemption + stake minimum)
export const getMinimumStakeAmount = (): number => {
  return 0.001; // SOL
};
