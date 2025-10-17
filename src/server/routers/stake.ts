import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { serverStakingService } from "@/server/services/stakingService";

export const stakeRouter = createTRPCRouter({
  balance: publicProcedure
    .input(z.object({ address: z.string() }))
    .output(z.object({ balance: z.number() }))
    .query(async ({ input }) => {
      const balance = await serverStakingService.getWalletBalance(input.address);
      return { balance };
    }),
  total: publicProcedure
    .input(z.void())
    .output(z.array(z.object({
      amount: z.number(),
    })))
    .query(async () => serverStakingService.getValidatorStakeTotals()),
  pools: publicProcedure
    .input(z.void())
    .output(z.array(z.object({
      address: z.string(),
      amountStaked: z.number(),
      stakingAuthority: z.string(),
    })))
    .query(async () => serverStakingService.getStakePools()),
  poolsbyAuthority: publicProcedure
    .input(z.object({
      stakingAuthority: z.string()
    }))
    .output(
      z.array(
        z.object({
          address: z.string(),
          amountStaked: z.number(),
          stakingAuthority: z.string(),
          withdrawAuthority: z.string(),
        })
      )
    )
    .query(async ({ input }) =>
      serverStakingService.getStakePoolsByAuthority(input.stakingAuthority)
    ),
  pool: publicProcedure
    .input(z.object({
      address: z.string()
    }))
    .output(z.object({
      address: z.string(),
      amountStaked: z.number(),
      delegatedStake: z.number(),
      withdrawableAmount: z.number(),
      activeStake: z.number(),
      inactiveStake: z.number(),
      status: z.string(),
      rentExemptReserve: z.number(),
      stakingAuthority: z.string(),
      withdrawAuthority: z.string(),
      deactivationEpoch: z.string(),
    }))
    .query(async ({ input }) => serverStakingService.getStakeAccountSummary(input.address)),
  currentEpoch: publicProcedure
    .input(z.void())
    .output(z.number())
    .query(async () => serverStakingService.getCurrentEpoch()),
  solPrice: publicProcedure
    .input(z.void())
    .output(z.object({ price: z.number().nonnegative() }))
    .query(async () => ({ price: await serverStakingService.getSolPrice() })),
  prepareStakeTransaction: publicProcedure
    .input(
      z.object({
        walletAddress: z.string().min(32),
        amount: z.number().positive(),
      })
    )
    .mutation(async ({ input }) => {
      return serverStakingService.createStakeTransaction(input);
    }),
  prepareDeactivateStakeTransaction: publicProcedure
    .input(
      z.object({
        walletAddress: z.string().min(32),
        stakeAccountAddress: z.string().min(32),
        withdrawAmount: z.number().positive(),
      })
    )
    .mutation(async ({ input }) => {
      return serverStakingService.deactivateStakeTransaction(input);
    }),
  prepareWithdrawStakeTransaction: publicProcedure
    .input(
      z.object({
        walletAddress: z.string().min(32),
        stakeAccountAddress: z.string().min(32),
      })
    )
    .mutation(async ({ input }) => {
      return serverStakingService.withdrawStakeTransaction(input);
    }),
  prepareMergeStakeTransaction: publicProcedure
    .input(
      z.object({
        walletAddress: z.string().min(32),
        sourceStakeAddress: z.string().min(32),
        destinationStakeAddress: z.string().min(32),
      })
    )
    .mutation(async ({ input }) => {
      return serverStakingService.mergeStakeTransaction(input);
    }),
  submitSignedTransaction: publicProcedure
    .input(z.object({ signedTransaction: z.string().min(1) }))
    .mutation(async ({ input }) => {
      return serverStakingService.submitSignedTransaction(input.signedTransaction);
    }),
});
