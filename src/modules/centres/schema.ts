import { z } from 'zod';

export const createCentreSchema = z.object({
  name: z.string().trim().min(1).max(255),
  location: z.string().trim().min(1).max(500),
});

export const centreIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const attachTestSchema = z.object({
  testId: z.number().int().positive(),
  price: z.number().positive().finite(),
});

export type CreateCentreInput = z.infer<typeof createCentreSchema>;
export type AttachTestInput = z.infer<typeof attachTestSchema>;
