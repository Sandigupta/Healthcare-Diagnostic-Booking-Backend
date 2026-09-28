import { z } from 'zod';

export const createPaymentSchema = z.object({
  bookingId: z.number().int().positive(),
  /** Test-only override; ignored in production unless NODE_ENV=test */
  forceOutcome: z.enum(['SUCCESS', 'FAILED']).optional(),
});

export const webhookSchema = z.object({
  eventId: z.string().trim().min(1).max(100),
  paymentId: z.string().trim().min(1).max(100),
  bookingId: z.number().int().positive(),
  status: z.enum(['SUCCESS', 'FAILED']),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type WebhookInput = z.infer<typeof webhookSchema>;
