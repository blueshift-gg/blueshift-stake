import { createTRPCRouter } from "../trpc";
import { stakeRouter } from "./stake";

export const appRouter = createTRPCRouter({
  stake: stakeRouter,
});

export type AppRouter = typeof appRouter;
