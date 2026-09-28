import { z } from 'zod';

export const createBookingSchema = z.object({
  testId: z.number().int().positive(),
  centreId: z.number().int().positive(),
  appointmentDateTime: z.string().datetime(),
});

export const bookingIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
