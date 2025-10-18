import { createTRPCRouter } from "../trpc";
import { stakeRouter } from "./stake";
import { validatorRouter } from "./validator";

export const appRouter = createTRPCRouter({
  stake: stakeRouter,
  validator: validatorRouter,
});

export type AppRouter = typeof appRouter;
