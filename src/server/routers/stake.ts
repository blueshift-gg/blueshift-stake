import { createTRPCRouter, publicProcedure } from "../trpc";
import { Connection, PublicKey } from "@solana/web3.js";
import { z } from "zod";

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
      pubkey: z.string(),
      amount: z.number(),
    })))
    .query(async () => {
      const stakeAccounts = await connection.getProgramAccounts(
        new PublicKey("Stake11111111111111111111111111111111111111"), {
          commitment: "confirmed",
          filters: [{
            memcmp: {
              offset: 124,
              bytes: process.env.NEXT_PUBLIC_VALIDATOR_VOTE_ACCOUNT!,
            }
          }]
        }
      );

      const stakeAccountsInfo = stakeAccounts.map((account) => {
        return {
          pubkey: account.pubkey.toString(),
          amount: account.account.lamports
        }
      })

      return stakeAccountsInfo
    }),
});
