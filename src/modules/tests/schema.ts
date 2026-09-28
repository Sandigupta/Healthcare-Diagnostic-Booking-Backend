import { z } from 'zod';

export const createTestSchema = z.object({
  name: z.string().trim().min(1).max(255),
  description: z.string().trim().max(2000).optional(),
});

export const testIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type CreateTestInput = z.infer<typeof createTestSchema>;
