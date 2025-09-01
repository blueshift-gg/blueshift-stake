import { createTRPCRouter, publicProcedure } from "../trpc";
import { Connection, GetProgramAccountsResponse, LAMPORTS_PER_SOL, PublicKey, StakeProgram } from "@solana/web3.js";
import { z } from "zod";
import { getMetaDecoder, getStakeStateAccountDecoder, getStakeDecoder } from "@solana-program/stake"

const connection = new Connection(process.env.NEXT_PUBLIC_RPC_ENDPOINT!, {
  commitment: "confirmed",
});

export const stakeRouter = createTRPCRouter({
  total: publicProcedure
    .input(z.void())
    .output(z.array(z.object({
      amount: z.number(),
    })))
    .query(async () => {

      const voteAccounts = await connection.getVoteAccounts();
      const currentAccounts = voteAccounts.current.filter((account) =>
        account.votePubkey
          .toString()
          .startsWith(process.env.NEXT_PUBLIC_VALIDATOR_VOTE_ACCOUNT!)
      )[0];

      return [{ amount: currentAccounts.activatedStake }];
    }),
  pools: publicProcedure
    .input(z.void())
    .output(z.array(z.object({
      address: z.string(),
      amountStaked: z.number(),
      stakingAuthority: z.string(),
      status: z.string()
    })))
    .query(async () => {
      const stakeAccounts: GetProgramAccountsResponse = await connection.getProgramAccounts(
        new PublicKey("Stake11111111111111111111111111111111111111"), {
          commitment: "confirmed",
          filters: [{
            memcmp: {
              offset: 124,
              bytes: process.env.NEXT_PUBLIC_VALIDATOR_VOTE_ACCOUNT!,
            }
          }]
        }
      )

      const metaDecoder = getMetaDecoder()
      const statusDecoder = getStakeStateAccountDecoder()
      const stakeDecoder = getStakeDecoder()

      const stakeAccountsInfo = stakeAccounts.map((account) => {
          return {
            address: account.pubkey.toString(),
            amountStaked:
              Number(
                stakeDecoder.decode(account.account.data, 124).delegation.stake
              ) / LAMPORTS_PER_SOL,
            stakingAuthority: metaDecoder.decode(account.account.data, 4)
              .authorized.staker,
            status: statusDecoder.decode(account.account.data).state.__kind,
          };
        });
      // console.log(stakeAccountsInfo);
      return stakeAccountsInfo;
    }),
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
          status: z.string(),
        })
      )
    )
    .query(async ({ input }) => {
      const stakeAccounts: GetProgramAccountsResponse =
        await connection.getProgramAccounts(
          new PublicKey("Stake11111111111111111111111111111111111111"),
          {
            commitment: "confirmed",
            filters: [
              {
                memcmp: {
                  offset: 124,
                  bytes: process.env.NEXT_PUBLIC_VALIDATOR_VOTE_ACCOUNT!,
                },
              },
              {
                memcmp: {
                  offset: 44,
                  bytes: input.stakingAuthority
                },
              },
            ],
          }
        );
      const statusDecoder = getStakeStateAccountDecoder();
      const stakeDecoder = getStakeDecoder();
      const metaDecoder = getMetaDecoder();

      const stakeAccountsInfo = stakeAccounts
        .map((account) => {
          return {
            address: account.pubkey.toString(),
            amountStaked:
              Number(
                stakeDecoder.decode(account.account.data, 124).delegation.stake
              ) / LAMPORTS_PER_SOL,
            stakingAuthority: metaDecoder.decode(account.account.data, 4)
              .authorized.staker,
            withdrawAuthority: metaDecoder.decode(account.account.data, 4)
              .authorized.withdrawer,
            status: statusDecoder.decode(account.account.data).state.__kind,
          };
        })
        .sort((poolA, poolB) => {
          if (poolA.amountStaked > poolB.amountStaked) {
            return 1;
          } else if (poolA.amountStaked < poolB.amountStaked) {
            return -1;
          } else {
            return 0;
          }
        })
        .reverse();

      // console.log(stakeAccountsInfo);
      return stakeAccountsInfo;
    }),
});
