import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { validatorService } from '@/server/services/validatorService';

const validatorStatsSchema = z.object({
  totalStake: z.number(),
  apy: z.number(),
  currentSlot: z.number(),
  upcomingLeaderSlots: z.array(z.number()),
});

export const validatorRouter = createTRPCRouter({
  stats: publicProcedure
    .input(z.void())
    .output(validatorStatsSchema)
    .query(async () => {
      return validatorService.getOurValidatorInfo();
    }),
});
