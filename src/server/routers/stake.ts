import { createTRPCRouter, publicProcedure } from "../trpc";
import { Connection, GetProgramAccountsResponse, PublicKey, StakeProgram } from "@solana/web3.js";
import { z } from "zod";
import { getMetaDecoder, getStakeStateAccountDecoder } from "@solana-program/stake"

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

      const stakeAccountsInfo = stakeAccounts.map((account) => {
        return {
          address: account.pubkey.toString(),
          amountStaked: account.account.lamports,
          stakingAuthority: metaDecoder.decode(account.account.data, 4).authorized.staker,
          status: statusDecoder.decode(account.account.data).state.__kind
        };
      }).sort((poolA, poolB) => poolA.amountStaked - poolB.amountStaked)

      return stakeAccountsInfo
    }),
});
